export type UserRole = "trainer" | "client";
export type ClientStatus = "active" | "paused" | "archived";
export type PlanStatus = "draft" | "active" | "archived";
export type Goal = "lose_fat" | "gain_muscle" | "maintain" | "recomposition";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Sex = "male" | "female";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  trainer_id: string;
  profile_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  sex: Sex | null;
  birth_date: string | null;
  height_cm: number | null;
  goal: Goal | null;
  activity: ActivityLevel | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientMetric = {
  id: string;
  client_id: string;
  measured_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
  created_at: string;
};

export type Meal = {
  name: string;
  time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: string[];
};

export type PlanContent = {
  summary: string;
  meals: Meal[];
  guidelines: string[];
};

export type NutritionPlan = {
  id: string;
  client_id: string;
  trainer_id: string;
  title: string;
  status: PlanStatus;
  target_calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  input_snapshot: Record<string, unknown> | null;
  plan: PlanContent | null;
  created_at: string;
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose_fat: "Отслабване",
  gain_muscle: "Покачване на мускулна маса",
  maintain: "Поддържане",
  recomposition: "Рекомпозиция",
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Заседнал (без тренировки)",
  light: "Лека (1–2 тренировки/седмица)",
  moderate: "Умерена (3–4 тренировки/седмица)",
  active: "Висока (5–6 тренировки/седмица)",
  very_active: "Много висока (ежедневно / атлет)",
};

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Активен",
  paused: "На пауза",
  archived: "Архивиран",
};

export const SEX_LABELS: Record<Sex, string> = {
  male: "Мъж",
  female: "Жена",
};

export type MeasurementSession = {
  id: string;
  client_id: string;
  measured_by: string | null;
  measured_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SkinfoldMeasurement = {
  id: string;
  session_id: string;
  site: string;
  value_mm: number;
};

export type CircumferenceMeasurement = {
  id: string;
  session_id: string;
  site: string;
  value_cm: number;
};

/** A session with everything taken at it, as the pages consume it. */
export type SessionWithSkinfolds = MeasurementSession & {
  skinfold_measurements: SkinfoldMeasurement[];
  circumference_measurements?: CircumferenceMeasurement[];
};
