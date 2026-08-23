"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, type ClientStatus } from "@/lib/types";

function optional(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : Number(trimmed);
}

// The status arrives as a plain string from a form, so it is checked against
// the values the database enum accepts rather than trusted. Anything else — an
// absent field on a form that does not carry one — leaves the stored status
// alone rather than quietly reactivating someone who was paused.
function readStatus(value: FormDataEntryValue | null): ClientStatus | undefined {
  const raw = String(value ?? "");
  return raw in STATUS_LABELS ? (raw as ClientStatus) : undefined;
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("clients")
    .insert({
      trainer_id: user.id,
      full_name: String(formData.get("full_name")).trim(),
      email: optional(formData.get("email")),
      phone: optional(formData.get("phone")),
      sex: optional(formData.get("sex")),
      birth_date: optional(formData.get("birth_date")),
      height_cm: optionalNumber(formData.get("height_cm")),
      goal: optional(formData.get("goal")),
      activity: optional(formData.get("activity")),
      notes: optional(formData.get("notes")),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

// Same field set as creating a client, so a trainer can correct anything they
// typed in a hurry. Row level security scopes the update to their own clients,
// so the id coming from the form cannot reach someone else's record.
export async function updateClientRecord(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("clients")
    .update({
      full_name: String(formData.get("full_name")).trim(),
      email: optional(formData.get("email")),
      phone: optional(formData.get("phone")),
      sex: optional(formData.get("sex")),
      birth_date: optional(formData.get("birth_date")),
      height_cm: optionalNumber(formData.get("height_cm")),
      goal: optional(formData.get("goal")),
      activity: optional(formData.get("activity")),
      status: readStatus(formData.get("status")),
      notes: optional(formData.get("notes")),
    })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  redirect(`/clients/${clientId}`);
}

export async function addMetric(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("client_metrics").insert({
    client_id: clientId,
    measured_at: optional(formData.get("measured_at")) ?? undefined,
    weight_kg: optionalNumber(formData.get("weight_kg")),
    body_fat_pct: optionalNumber(formData.get("body_fat_pct")),
    waist_cm: optionalNumber(formData.get("waist_cm")),
    chest_cm: optionalNumber(formData.get("chest_cm")),
    hips_cm: optionalNumber(formData.get("hips_cm")),
    arm_cm: optionalNumber(formData.get("arm_cm")),
    thigh_cm: optionalNumber(formData.get("thigh_cm")),
    notes: optional(formData.get("notes")),
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
}

/**
 * Flips a client between active, paused and archived without walking through
 * the whole edit form — the switch on the client's page calls this directly.
 */
export async function setClientStatus(clientId: string, status: ClientStatus) {
  const supabase = await createClient();

  if (!(status in STATUS_LABELS)) {
    throw new Error("Непознат статус.");
  }

  const { error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}

/**
 * Deleting a client marks the row rather than removing it. Everything the
 * trainer recorded — caliper sessions, tape readings, plans — hangs off this
 * row with `on delete cascade`, so a real delete would quietly take months of
 * history with it and leave nothing to apologise with. The client drops out of
 * every list and waits in the bin instead.
 */
export async function softDeleteClient(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
  redirect("/clients?view=trash");
}

/** Undoes the above, with the client's history untouched. */
export async function restoreClient(clientId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: null })
    .eq("id", clientId);

  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");
}
