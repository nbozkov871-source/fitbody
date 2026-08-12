"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  buildPlaceholderPlan,
  calculateTargets,
  type PlanInput,
} from "@/lib/nutrition";
import type { ActivityLevel, Goal, Sex } from "@/lib/types";

export async function generatePlan(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const input: PlanInput = {
    sex: String(formData.get("sex")) as Sex,
    age: Number(formData.get("age")),
    height_cm: Number(formData.get("height_cm")),
    weight_kg: Number(formData.get("weight_kg")),
    activity: String(formData.get("activity")) as ActivityLevel,
    goal: String(formData.get("goal")) as Goal,
    meals_per_day: Number(formData.get("meals_per_day")),
    preferences: String(formData.get("preferences") ?? "").trim() || undefined,
  };

  const targets = calculateTargets(input);
  const plan = buildPlaceholderPlan(input, targets);

  const { data, error } = await supabase
    .from("nutrition_plans")
    .insert({
      client_id: clientId,
      trainer_id: user.id,
      title: String(formData.get("title")).trim(),
      status: "draft",
      target_calories: targets.calories,
      protein_g: targets.protein_g,
      carbs_g: targets.carbs_g,
      fat_g: targets.fat_g,
      input_snapshot: { ...input, ...targets },
      plan,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${clientId}`);
  redirect(`/plans/${data.id}`);
}

export async function setPlanStatus(planId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("nutrition_plans")
    .update({ status })
    .eq("id", planId);

  if (error) throw new Error(error.message);

  revalidatePath(`/plans/${planId}`);
}
