import type { ActivityLevel, Goal, PlanContent, Sex } from "./types";

// PLACEHOLDER — replace with the trainer's own formulas once provided.
// Currently: Mifflin-St Jeor BMR × activity multiplier, adjusted per goal.

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_CALORIE_FACTOR: Record<Goal, number> = {
  lose_fat: 0.8,
  gain_muscle: 1.15,
  maintain: 1,
  recomposition: 0.95,
};

const GOAL_MACRO_SPLIT: Record<
  Goal,
  { proteinPerKg: number; fatPerKg: number }
> = {
  lose_fat: { proteinPerKg: 2.2, fatPerKg: 0.8 },
  gain_muscle: { proteinPerKg: 1.8, fatPerKg: 1.0 },
  maintain: { proteinPerKg: 1.6, fatPerKg: 1.0 },
  recomposition: { proteinPerKg: 2.0, fatPerKg: 0.9 },
};

export type PlanInput = {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: ActivityLevel;
  goal: Goal;
  meals_per_day: number;
  preferences?: string;
};

export type PlanTargets = {
  bmr: number;
  tdee: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
};

export function calculateTargets(input: PlanInput): PlanTargets {
  const base =
    10 * input.weight_kg +
    6.25 * input.height_cm -
    5 * input.age +
    (input.sex === "male" ? 5 : -161);

  const bmr = Math.round(base);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activity]);
  const calories = Math.round(tdee * GOAL_CALORIE_FACTOR[input.goal]);

  const { proteinPerKg, fatPerKg } = GOAL_MACRO_SPLIT[input.goal];
  const protein_g = Math.round(input.weight_kg * proteinPerKg);
  const fat_g = Math.round(input.weight_kg * fatPerKg);
  const carbs_g = Math.max(
    0,
    Math.round((calories - protein_g * 4 - fat_g * 9) / 4),
  );

  return { bmr, tdee, calories, protein_g, fat_g, carbs_g };
}

const MEAL_NAMES = [
  { name: "Закуска", time: "08:00" },
  { name: "Обяд", time: "13:00" },
  { name: "Следобедна закуска", time: "16:30" },
  { name: "Вечеря", time: "19:30" },
  { name: "Късна закуска", time: "21:30" },
];

// PLACEHOLDER meal builder — swap for the AI call once the prompt/formulas land.
export function buildPlaceholderPlan(
  input: PlanInput,
  targets: PlanTargets,
): PlanContent {
  const count = Math.min(Math.max(input.meals_per_day, 2), MEAL_NAMES.length);
  const share = 1 / count;

  const meals = MEAL_NAMES.slice(0, count).map(({ name, time }) => ({
    name,
    time,
    calories: Math.round(targets.calories * share),
    protein_g: Math.round(targets.protein_g * share),
    carbs_g: Math.round(targets.carbs_g * share),
    fat_g: Math.round(targets.fat_g * share),
    items: ["Източник на протеин", "Въглехидратен източник", "Зеленчуци"],
  }));

  return {
    summary: `Дневна цел ${targets.calories} kcal, разпределена в ${count} хранения.`,
    meals,
    guidelines: [
      "Пийте 30–35 мл вода на килограм телесно тегло дневно.",
      "Претегляйте се веднъж седмично, сутрин, на гладно.",
      "Съобразете храните с предпочитанията и алергиите на клиента.",
    ],
  };
}
