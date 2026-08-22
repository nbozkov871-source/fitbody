import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildPlaceholderPlan,
  calculateTargets,
  type PlanInput,
} from "./nutrition.ts";
import type { Goal } from "./types.ts";

const BASE: PlanInput = {
  sex: "male",
  age: 30,
  height_cm: 180,
  weight_kg: 80,
  activity: "moderate",
  goal: "maintain",
  meals_per_day: 4,
};

const GOALS: Goal[] = ["lose_fat", "gain_muscle", "maintain", "recomposition"];

function shares(input: PlanInput) {
  const t = calculateTargets(input);
  return {
    ...t,
    proteinShare: (t.protein_g * 4) / t.calories,
    carbShare: (t.carbs_g * 4) / t.calories,
    fatShare: (t.fat_g * 9) / t.calories,
    proteinPerKg: t.protein_g / input.weight_kg,
  };
}

test("fat never drops below a quarter of the day", () => {
  // Without a floor, fat set per kilo shrinks as a share while calories climb,
  // and carbohydrate swallows the difference.
  for (const goal of GOALS) {
    for (const activity of ["sedentary", "very_active"] as const) {
      const s = shares({ ...BASE, goal, activity });
      assert.ok(
        s.fatShare >= 0.24,
        `${goal}/${activity}: мазнини ${(s.fatShare * 100).toFixed(0)}%`,
      );
    }
  }
});

test("carbohydrate never takes over the whole plan", () => {
  for (const goal of GOALS) {
    for (const activity of ["sedentary", "very_active"] as const) {
      const s = shares({ ...BASE, goal, activity });
      assert.ok(
        s.carbShare <= 0.65,
        `${goal}/${activity}: въглехидрати ${(s.carbShare * 100).toFixed(0)}%`,
      );
    }
  }
});

test("protein stays inside the range the goal calls for", () => {
  const expected: Record<Goal, [number, number]> = {
    lose_fat: [2.0, 2.4],
    gain_muscle: [1.8, 2.2],
    maintain: [1.4, 1.8],
    recomposition: [1.8, 2.2],
  };

  for (const goal of GOALS) {
    const [low, high] = expected[goal];
    const s = shares({ ...BASE, goal });
    assert.ok(
      s.proteinPerKg >= low && s.proteinPerKg <= high,
      `${goal}: ${s.proteinPerKg.toFixed(2)} г/кг извън ${low}–${high}`,
    );
  }
});

test("macros account for the calories they were derived from", () => {
  for (const goal of GOALS) {
    const t = calculateTargets({ ...BASE, goal });
    const fromMacros = t.protein_g * 4 + t.carbs_g * 4 + t.fat_g * 9;
    // Rounding each macro to a whole gram leaves a few calories either way.
    assert.ok(
      Math.abs(fromMacros - t.calories) <= 12,
      `${goal}: ${fromMacros} срещу ${t.calories}`,
    );
  }
});

test("losing eats less than maintaining, gaining eats more", () => {
  const lose = calculateTargets({ ...BASE, goal: "lose_fat" }).calories;
  const keep = calculateTargets({ ...BASE, goal: "maintain" }).calories;
  const gain = calculateTargets({ ...BASE, goal: "gain_muscle" }).calories;

  assert.ok(lose < keep, `${lose} трябва да е под ${keep}`);
  assert.ok(gain > keep, `${gain} трябва да е над ${keep}`);
});

test("the meals add up to the day", () => {
  for (const meals_per_day of [2, 3, 4, 5]) {
    const input = { ...BASE, meals_per_day };
    const targets = calculateTargets(input);
    const plan = buildPlaceholderPlan(input, targets);

    assert.equal(plan.meals.length, meals_per_day);
    for (const key of ["calories", "protein_g", "carbs_g", "fat_g"] as const) {
      const summed = plan.meals.reduce((total, meal) => total + meal[key], 0);
      assert.equal(summed, targets[key], `${meals_per_day} хранения, ${key}`);
    }
  }
});

test("no two meals are identical, the way an even split would make them", () => {
  const input = { ...BASE, meals_per_day: 4 };
  const plan = buildPlaceholderPlan(input, calculateTargets(input));
  const calories = plan.meals.map((m) => m.calories);
  assert.ok(new Set(calories).size > 1, `всички хранения са ${calories[0]} kcal`);
});
