"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  CIRCUMFERENCE_SITES,
  MEASUREMENT_SITES,
  validateCircumferences,
  validateSkinfolds,
} from "@/lib/measurements";

/**
 * Confirms the signed-in trainer owns this client before anything is written.
 * Row level security would refuse the write anyway; this runs first so the
 * caller gets a clear refusal instead of a silent no-op, and so a client id
 * arriving from a form can never address someone else's record.
 */
async function requireOwnedClient(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("trainer_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!client) {
    throw new Error("Нямате достъп до този клиент.");
  }

  return { supabase, user };
}

function readSkinfolds(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const site of MEASUREMENT_SITES) {
    raw[site.id] = String(formData.get(`site_${site.id}`) ?? "");
  }

  const result = validateSkinfolds(raw);
  if (!result.ok) {
    const first = Object.entries(result.errors)[0];
    const site = MEASUREMENT_SITES.find((s) => s.id === first[0]);
    throw new Error(`${site?.name ?? first[0]}: ${first[1]}`);
  }

  return result.values;
}

function readCircumferences(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const site of CIRCUMFERENCE_SITES) {
    raw[site.id] = String(formData.get(`circ_${site.id}`) ?? "");
  }

  const result = validateCircumferences(raw);
  if (!result.ok) {
    const first = Object.entries(result.errors)[0];
    const site = CIRCUMFERENCE_SITES.find((s) => s.id === first[0]);
    const label = site
      ? `${site.name}${site.side === "left" ? " (ляво)" : site.side === "right" ? " (дясно)" : ""}`
      : first[0];
    throw new Error(`${label}: ${first[1]}`);
  }

  return result.values;
}

function readDate(formData: FormData) {
  const value = String(formData.get("measured_at") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Изберете валидна дата.");
  }
  return value;
}

type Client = Awaited<ReturnType<typeof createClient>>;

/** Writes both kinds of reading; returns a message if either insert refused. */
async function writeReadings(
  supabase: Client,
  sessionId: string,
  skinfolds: Record<string, number>,
  circumferences: Record<string, number>,
): Promise<string | null> {
  const skinfoldRows = Object.entries(skinfolds).map(([site, value_mm]) => ({
    session_id: sessionId,
    site,
    value_mm,
  }));

  if (skinfoldRows.length > 0) {
    const { error } = await supabase
      .from("skinfold_measurements")
      .insert(skinfoldRows);
    if (error) return error.message;
  }

  const circumferenceRows = Object.entries(circumferences).map(
    ([site, value_cm]) => ({ session_id: sessionId, site, value_cm }),
  );

  if (circumferenceRows.length > 0) {
    const { error } = await supabase
      .from("circumference_measurements")
      .insert(circumferenceRows);
    if (error) return error.message;
  }

  return null;
}

export async function createSession(clientId: string, formData: FormData) {
  const { supabase, user } = await requireOwnedClient(clientId);

  const values = readSkinfolds(formData);
  const circumferences = readCircumferences(formData);

  // Either kind on its own is a real visit: a trainer may take only the tape one
  // week and only the caliper the next.
  if (Object.keys(values).length + Object.keys(circumferences).length === 0) {
    throw new Error("Въведете поне едно измерване.");
  }

  const { data: session, error } = await supabase
    .from("measurement_sessions")
    .insert({
      client_id: clientId,
      measured_by: user.id,
      measured_at: readDate(formData),
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const rowsError = await writeReadings(supabase, session.id, values, circumferences);

  // The session would otherwise survive with no readings, which reads as a
  // measurement that was taken and found nothing.
  if (rowsError) {
    await supabase.from("measurement_sessions").delete().eq("id", session.id);
    throw new Error(rowsError);
  }

  revalidatePath(`/clients/${clientId}/measurements`);
  revalidatePath("/dashboard");
  redirect(`/clients/${clientId}/measurements`);
}

export async function updateSession(
  clientId: string,
  sessionId: string,
  formData: FormData,
) {
  const { supabase } = await requireOwnedClient(clientId);

  const values = readSkinfolds(formData);
  const circumferences = readCircumferences(formData);

  if (Object.keys(values).length + Object.keys(circumferences).length === 0) {
    throw new Error("Въведете поне едно измерване.");
  }

  const { error } = await supabase
    .from("measurement_sessions")
    .update({
      measured_at: readDate(formData),
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", sessionId)
    .eq("client_id", clientId);

  if (error) throw new Error(error.message);

  // Replacing the readings rather than patching them, so a site the trainer
  // cleared this time does not linger from the previous save.
  for (const table of ["skinfold_measurements", "circumference_measurements"]) {
    const { error: clearError } = await supabase
      .from(table)
      .delete()
      .eq("session_id", sessionId);
    if (clearError) throw new Error(clearError.message);
  }

  const rowsError = await writeReadings(supabase, sessionId, values, circumferences);
  if (rowsError) throw new Error(rowsError);

  revalidatePath(`/clients/${clientId}/measurements`);
  revalidatePath(`/clients/${clientId}/measurements/${sessionId}`);
  revalidatePath("/dashboard");
  redirect(`/clients/${clientId}/measurements/${sessionId}`);
}

export async function deleteSession(clientId: string, sessionId: string) {
  const { supabase } = await requireOwnedClient(clientId);

  // The readings go with it through the cascade on session_id.
  const { error } = await supabase
    .from("measurement_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("client_id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}/measurements`);
  revalidatePath("/dashboard");
  redirect(`/clients/${clientId}/measurements`);
}
