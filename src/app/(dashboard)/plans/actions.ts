"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Meal, PlanContent } from "@/lib/types";

export async function setPlanStatus(planId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("nutrition_plans")
    .update({ status })
    .eq("id", planId);

  if (error) throw new Error(error.message);

  revalidatePath(`/plans/${planId}`);
}

function number(value: FormDataEntryValue | null) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

// The editor posts the meals as JSON, so the shape is rebuilt field by field
// here rather than trusted. A malformed row would otherwise be written straight
// into the plan column and break the page that renders it.
function parsePlan(raw: FormDataEntryValue | null): PlanContent {
  let parsed: unknown;

  try {
    parsed = JSON.parse(String(raw ?? ""));
  } catch {
    throw new Error("Планът не можа да се прочете. Опреснете страницата.");
  }

  const source = parsed as Partial<PlanContent>;
  const meals = Array.isArray(source.meals) ? source.meals : [];

  return {
    summary: String(source.summary ?? "").trim(),
    meals: meals.map((meal: Partial<Meal>) => ({
      name: String(meal.name ?? "").trim(),
      time: String(meal.time ?? "").trim(),
      calories: Math.max(0, Math.round(Number(meal.calories) || 0)),
      protein_g: Math.max(0, Math.round(Number(meal.protein_g) || 0)),
      carbs_g: Math.max(0, Math.round(Number(meal.carbs_g) || 0)),
      fat_g: Math.max(0, Math.round(Number(meal.fat_g) || 0)),
      items: Array.isArray(meal.items)
        ? meal.items.map((item) => String(item).trim()).filter(Boolean)
        : [],
    })),
    guidelines: Array.isArray(source.guidelines)
      ? source.guidelines.map((line) => String(line).trim()).filter(Boolean)
      : [],
  };
}

export async function updatePlan(planId: string, formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Планът трябва да има заглавие.");

  const { error } = await supabase
    .from("nutrition_plans")
    .update({
      title,
      target_calories: number(formData.get("target_calories")),
      protein_g: number(formData.get("protein_g")),
      carbs_g: number(formData.get("carbs_g")),
      fat_g: number(formData.get("fat_g")),
      plan: parsePlan(formData.get("plan")),
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  redirect(`/plans/${planId}`);
}
