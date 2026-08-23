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
  gain_muscle: { proteinPerKg: 2.0, fatPerKg: 1.0 },
  maintain: { proteinPerKg: 1.6, fatPerKg: 1.0 },
  recomposition: { proteinPerKg: 2.0, fatPerKg: 0.9 },
};

/** Fat below roughly a quarter of the day is hard to eat well and hard to keep to. */
const MIN_FAT_SHARE = 0.25;

/** No plan drops under these, whatever the arithmetic above them says. */
const MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

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

/**
 * The weight the macros are set against.
 *
 * Grams per kilogram of total body weight over-prescribes for a client carrying
 * a lot of fat: fat tissue does not need feeding in proportion. At 100 kg and
 * 160 cm the protein alone came to 220 g, which with the fat floor left six
 * grams of carbohydrate in the day — a near-ketogenic plan produced by
 * accident, for the most ordinary client this app has.
 *
 * So above a BMI of 25 the macros are set against the weight that BMI would
 * put the client at. Only for losing and recomposition: a heavy client working
 * to gain is likelier to be carrying muscle, and capping them would starve the
 * protein they are training for.
 */
function referenceWeight(input: PlanInput): number {
  if (input.goal !== "lose_fat" && input.goal !== "recomposition") {
    return input.weight_kg;
  }

  const metres = input.height_cm / 100;
  if (metres <= 0) return input.weight_kg;

  const atBmi25 = 25 * metres * metres;
  return Math.min(input.weight_kg, atBmi25);
}

export function calculateTargets(input: PlanInput): PlanTargets {
  const base =
    10 * input.weight_kg +
    6.25 * input.height_cm -
    5 * input.age +
    (input.sex === "male" ? 5 : -161);

  const bmr = Math.round(base);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[input.activity]);
  const target = Math.round(tdee * GOAL_CALORIE_FACTOR[input.goal]);

  // A deficit taken off a small maintenance lands under what the body burns at
  // rest, and no plan should ask that. The floor is whichever is higher: resting
  // need, or the accepted minimum for the sex.
  const calories = Math.max(target, bmr, MIN_CALORIES[input.sex]);

  const { proteinPerKg, fatPerKg } = GOAL_MACRO_SPLIT[input.goal];
  const reference = referenceWeight(input);

  const protein_g = Math.round(reference * proteinPerKg);

  // Fat set per kilo alone falls below a workable share once calories climb,
  // and carbohydrate — which takes whatever is left — absorbs the difference.
  const fatFloor = (calories * MIN_FAT_SHARE) / 9;
  const fat_g = Math.round(Math.max(reference * fatPerKg, fatFloor));

  const carbs_g = Math.max(
    0,
    Math.round((calories - protein_g * 4 - fat_g * 9) / 4),
  );

  return { bmr, tdee, calories, protein_g, fat_g, carbs_g };
}

// Shares per slot rather than an equal split: a trainer's day is not four
// identical plates. Each row sums to 1 so the day still lands on target.
const MEAL_SLOTS = [
  {
    name: "Закуска",
    time: "08:00",
    items: [
      "Овесени ядки с прясно мляко и банан",
      "Омлет от 3 яйца с пълнозърнест хляб",
      "Извара с мед и орехи",
    ],
  },
  {
    name: "Обяд",
    time: "13:00",
    items: [
      "Пилешко филе с ориз и зелена салата",
      "Телешко с печени картофи и зеленчуци",
      "Риба с киноа и броколи",
    ],
  },
  {
    name: "Следобедна закуска",
    time: "16:30",
    items: [
      "Гръцко кисело мляко с плод",
      "Протеинов шейк и шепа бадеми",
      "Пълнозърнест сандвич с пуешко",
    ],
  },
  {
    name: "Вечеря",
    time: "19:30",
    items: [
      "Сьомга на фурна със зеленчуци",
      "Пуешко със салата и авокадо",
      "Омлет със спанак и сирене",
    ],
  },
  {
    name: "Късна закуска",
    time: "21:30",
    items: ["Извара", "Кефир", "Казеинов шейк"],
  },
];

const SHARES: Record<number, number[]> = {
  2: [0.45, 0.55],
  3: [0.3, 0.4, 0.3],
  4: [0.25, 0.35, 0.15, 0.25],
  5: [0.22, 0.32, 0.13, 0.23, 0.1],
};

// Rounding each meal on its own leaves the day a few grams short or long, which
// looks like sloppy arithmetic to a trainer checking the totals. The last meal
// absorbs whatever the rounding left over.
function split(total: number, shares: number[]) {
  const parts = shares.map((share) => Math.round(total * share));
  const drift = total - parts.reduce((sum, part) => sum + part, 0);
  parts[parts.length - 1] += drift;
  return parts;
}

// PLACEHOLDER meal builder — swap for the AI call once the prompt/formulas land.
// The foods are conversation starters for the trainer, not prescriptions.
export function buildPlaceholderPlan(
  input: PlanInput,
  targets: PlanTargets,
): PlanContent {
  const count = Math.min(Math.max(input.meals_per_day, 2), MEAL_SLOTS.length);
  const shares = SHARES[count];

  const calories = split(targets.calories, shares);
  const protein = split(targets.protein_g, shares);
  const carbs = split(targets.carbs_g, shares);
  const fat = split(targets.fat_g, shares);

  const meals = MEAL_SLOTS.slice(0, count).map((slot, i) => ({
    name: slot.name,
    time: slot.time,
    calories: calories[i],
    protein_g: protein[i],
    carbs_g: carbs[i],
    fat_g: fat[i],
    items: slot.items,
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
