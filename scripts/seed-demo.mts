/**
 * Demo data for showing FitBody to a prospect.
 *
 *   npm run seed:demo
 *
 * Safe to run repeatedly: the two demo clients have fixed ids, so a run deletes
 * exactly those two rows and rebuilds them. Everything hanging off a client —
 * metrics, caliper sessions, plans — goes with it through the cascades already
 * in the schema, and no row outside those two ids is ever touched.
 *
 * Needs SUPABASE_SECRET_KEY in .env.local. Row level security scopes writes to
 * the signed-in trainer, and a script has no session, so it writes with the
 * service role instead. That key bypasses every policy: keep it local, never
 * commit it, and never put it in a NEXT_PUBLIC_ variable.
 */

import { createClient } from "@supabase/supabase-js";
import {
  buildPlaceholderPlan,
  calculateTargets,
  type PlanInput,
} from "../src/lib/nutrition.ts";
import { MEASUREMENT_SITES } from "../src/lib/measurements.ts";

// Fixed ids are what make the script idempotent. They are deliberately
// recognisable, so anyone looking at the database can tell demo rows apart.
const DEMO_CLIENT_IDS = {
  loseFat: "dedcafe0-0000-4000-8000-000000000001",
  gainMuscle: "dedcafe0-0000-4000-8000-000000000002",
} as const;

const WEEKS = 12;

type Profile = {
  id: string;
  clientId: string;
  full_name: string;
  email: string;
  phone: string;
  sex: "male" | "female";
  birth_date: string;
  height_cm: number;
  goal: "lose_fat" | "gain_muscle";
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  notes: string;
  start: {
    weight: number;
    waist: number;
    bodyFat: number;
    chest: number;
    hips: number;
    arm: number;
    thigh: number;
  };
  /** Average change per week. Real progress wanders around this, never matches it. */
  weekly: {
    weight: number;
    waist: number;
    bodyFat: number;
    chest: number;
    hips: number;
    arm: number;
    thigh: number;
  };
  skinfoldStart: Record<string, number>;
  skinfoldWeekly: number;
  mealsPerDay: number;
};

const PEOPLE: Profile[] = [
  {
    id: "loseFat",
    clientId: DEMO_CLIENT_IDS.loseFat,
    full_name: "Мария Петрова",
    email: "demo.maria@fitbody.local",
    phone: "+359 88 000 0001",
    sex: "female",
    birth_date: "1991-04-18",
    height_cm: 168,
    goal: "lose_fat",
    activity: "moderate",
    notes: "Демо клиент. Тренира 3 пъти седмично, седяща работа. Без алергии.",
    start: { weight: 78.4, waist: 92, bodyFat: 31.5, chest: 98, hips: 106, arm: 30, thigh: 61 },
    weekly: { weight: -0.7, waist: -1.0, bodyFat: -0.6, chest: -0.45, hips: -0.7, arm: -0.12, thigh: -0.4 },
    skinfoldStart: {
      triceps: 22, biceps: 12, subscapular: 20, suprailiac: 24,
      abdominal: 28, thigh: 30, chest: 14,
    },
    skinfoldWeekly: -0.55,
    mealsPerDay: 4,
  },
  {
    id: "gainMuscle",
    clientId: DEMO_CLIENT_IDS.gainMuscle,
    full_name: "Георги Стоянов",
    email: "demo.georgi@fitbody.local",
    phone: "+359 88 000 0002",
    sex: "male",
    birth_date: "1997-09-05",
    height_cm: 181,
    goal: "gain_muscle",
    activity: "active",
    notes: "Демо клиент. Тренира 4 пъти седмично, силова програма. Не яде риба.",
    start: { weight: 72.1, waist: 79, bodyFat: 14.2, chest: 96, hips: 94, arm: 32, thigh: 55 },
    // Gaining is slower than losing, and some of it is not muscle.
    weekly: { weight: 0.32, waist: 0.1, bodyFat: 0.08, chest: 0.35, hips: 0.1, arm: 0.18, thigh: 0.25 },
    skinfoldStart: {
      triceps: 9, biceps: 5, subscapular: 11, suprailiac: 10,
      abdominal: 14, thigh: 12, chest: 7,
    },
    skinfoldWeekly: 0.12,
    mealsPerDay: 5,
  },
];

/**
 * A fixed-seed generator, so every run produces the same wobble. A demo that
 * looks different each time invites questions about whether the data is real.
 */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * Walks a value across the weeks. Progress is not a straight line: the drift is
 * the average, each week lands somewhere around it, and roughly one week in six
 * moves the wrong way — which is what a real weigh-in history looks like.
 */
function series(
  start: number,
  weeklyDrift: number,
  weeks: number,
  random: () => number,
  decimals = 1,
) {
  const out: number[] = [];
  let value = start;

  for (let week = 0; week < weeks; week++) {
    if (week > 0) {
      // Noise stays well under the drift, or it cancels the trend out and the
      // twelve weeks end up showing almost no progress at all.
      const noise = (random() - 0.5) * Math.abs(weeklyDrift) * 1.1;
      const stalls = random() < 0.12;
      value += stalls ? noise : weeklyDrift + noise;
    }
    const factor = 10 ** decimals;
    out.push(Math.round(value * factor) / factor);
  }

  return out;
}

function weeklyDates(weeks: number) {
  const dates: string[] = [];
  const today = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function ageOn(birthDate: string, on: string) {
  const birth = new Date(birthDate);
  const at = new Date(on);
  let age = at.getFullYear() - birth.getFullYear();
  const monthDiff = at.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate())) age--;
  return age;
}

function env(name: string) {
  const value = (process.env[name] ?? "").replace(/^﻿/, "").trim();
  if (!value) {
    console.error(`\nЛипсва ${name} в .env.local.\n`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SECRET_KEY");
  const trainerEmail = env("DEMO_TRAINER_EMAIL");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: trainer, error: trainerError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("email", trainerEmail)
    .maybeSingle();

  if (trainerError) throw new Error(trainerError.message);
  if (!trainer) {
    console.error(
      `\nНяма профил с имейл ${trainerEmail}. Влезте веднъж в приложението с този акаунт и опитайте пак.\n`,
    );
    process.exit(1);
  }

  console.log(`Треньор: ${trainer.full_name ?? trainer.email} (${trainer.id})`);

  // Delete first, by exact id. Metrics, caliper sessions and plans follow
  // through the cascades, so nothing is left orphaned behind them.
  const ids = Object.values(DEMO_CLIENT_IDS);
  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .in("id", ids);

  if (deleteError) throw new Error(deleteError.message);
  console.log(`Изчистени предишни демо клиенти: ${ids.length}`);

  const dates = weeklyDates(WEEKS);

  for (const person of PEOPLE) {
    const random = makeRandom(person.id === "loseFat" ? 20260821 : 19970905);

    const { error: clientError } = await supabase.from("clients").insert({
      id: person.clientId,
      trainer_id: trainer.id,
      full_name: person.full_name,
      email: person.email,
      phone: person.phone,
      sex: person.sex,
      birth_date: person.birth_date,
      height_cm: person.height_cm,
      goal: person.goal,
      activity: person.activity,
      status: "active",
      notes: person.notes,
    });

    if (clientError) throw new Error(clientError.message);

    const weight = series(person.start.weight, person.weekly.weight, WEEKS, random);
    const waist = series(person.start.waist, person.weekly.waist, WEEKS, random);
    const bodyFat = series(person.start.bodyFat, person.weekly.bodyFat, WEEKS, random);
    const chest = series(person.start.chest, person.weekly.chest, WEEKS, random);
    const hips = series(person.start.hips, person.weekly.hips, WEEKS, random);
    const arm = series(person.start.arm, person.weekly.arm, WEEKS, random);
    const thigh = series(person.start.thigh, person.weekly.thigh, WEEKS, random);

    const { error: metricsError } = await supabase.from("client_metrics").insert(
      dates.map((measured_at, i) => ({
        client_id: person.clientId,
        measured_at,
        weight_kg: weight[i],
        body_fat_pct: bodyFat[i],
        waist_cm: waist[i],
        chest_cm: chest[i],
        hips_cm: hips[i],
        arm_cm: arm[i],
        thigh_cm: thigh[i],
        notes: i === 0 ? "Начално измерване." : null,
      })),
    );

    if (metricsError) throw new Error(metricsError.message);

    // Caliper history on the same dates, so the measurements page and the
    // metrics history tell one story rather than two.
    const skinfoldSeries = new Map<string, number[]>();
    for (const site of MEASUREMENT_SITES) {
      const start = person.skinfoldStart[site.id];
      if (start === undefined) continue;
      // Sites with more fat on them move more, so the drift scales with size.
      const drift = person.skinfoldWeekly * (start / 15);
      skinfoldSeries.set(site.id, series(start, drift, WEEKS, random));
    }

    for (const [i, measured_at] of dates.entries()) {
      const { data: session, error: sessionError } = await supabase
        .from("measurement_sessions")
        .insert({
          client_id: person.clientId,
          measured_by: trainer.id,
          measured_at,
          notes: i === 0 ? "Начално измерване с калипер." : null,
        })
        .select("id")
        .single();

      if (sessionError) throw new Error(sessionError.message);

      const rows = [...skinfoldSeries.entries()].map(([site, values]) => ({
        session_id: session.id,
        site,
        // The column refuses anything outside caliper range, so the wobble is
        // clamped rather than allowed to fail the insert.
        value_mm: Math.min(100, Math.max(1, values[i])),
      }));

      const { error: rowsError } = await supabase
        .from("skinfold_measurements")
        .insert(rows);

      if (rowsError) throw new Error(rowsError.message);
    }

    // The plan comes from the app's own formulas, applied to the latest
    // measurement — the same call the Generate plan screen makes.
    const latest = WEEKS - 1;
    const input: PlanInput = {
      sex: person.sex,
      age: ageOn(person.birth_date, dates[latest]),
      height_cm: person.height_cm,
      weight_kg: weight[latest],
      activity: person.activity,
      goal: person.goal,
      meals_per_day: person.mealsPerDay,
      preferences: person.notes,
    };

    const targets = calculateTargets(input);
    const plan = buildPlaceholderPlan(input, targets);

    const { error: planError } = await supabase.from("nutrition_plans").insert({
      client_id: person.clientId,
      trainer_id: trainer.id,
      title: `Режим за ${person.full_name.split(" ")[0]} — ${dates[latest]}`,
      status: "active",
      target_calories: targets.calories,
      protein_g: targets.protein_g,
      carbs_g: targets.carbs_g,
      fat_g: targets.fat_g,
      input_snapshot: { ...input, ...targets },
      plan,
    });

    if (planError) throw new Error(planError.message);

    const change = weight[latest] - weight[0];
    const sign = change > 0 ? "+" : "";
    console.log(
      `  ${person.full_name}: ${WEEKS} измервания, ` +
        `${weight[0]} → ${weight[latest]} кг (${sign}${change.toFixed(1)}), ` +
        `режим ${targets.calories} kcal`,
    );
  }

  console.log("\nГотово.");
}

main().catch((error) => {
  console.error("\nСкриптът се провали:", error.message);
  process.exit(1);
});
