"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function optional(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : Number(trimmed);
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
