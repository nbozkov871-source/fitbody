export type MeasurementSite = {
  id: string;
  name: string;
  unit: "mm";
  /** Where on the body, so a trainer new to a site knows where to pinch. */
  hint: string;
};

// The single source of truth for caliper sites. Adding one here makes it appear
// in the form, the detail view and the comparison without touching any of them;
// the database stores the id as text for the same reason.
export const MEASUREMENT_SITES: MeasurementSite[] = [
  { id: "triceps", name: "Трицепс", unit: "mm", hint: "Вертикално, среда на задната част на ръката" },
  { id: "biceps", name: "Бицепс", unit: "mm", hint: "Вертикално, среда на предната част на ръката" },
  { id: "subscapular", name: "Подлопаткова", unit: "mm", hint: "Диагонално, под долния ъгъл на лопатката" },
  { id: "suprailiac", name: "Надхълбочна", unit: "mm", hint: "Диагонално, над хълбочната кост" },
  { id: "abdominal", name: "Коремна", unit: "mm", hint: "Вертикално, на 2 см встрани от пъпа" },
  { id: "thigh", name: "Бедро", unit: "mm", hint: "Вертикално, среда на предната част на бедрото" },
  { id: "chest", name: "Гърди", unit: "mm", hint: "Диагонално, между гърдата и подмишницата" },
];

export const SITE_BY_ID = new Map(MEASUREMENT_SITES.map((s) => [s.id, s]));

/** A caliper reads roughly 1-80 mm. The database enforces the same bounds. */
export const MIN_MM = 1;
export const MAX_MM = 100;

export type SkinfoldValues = Record<string, number>;

export type ValidationResult =
  | { ok: true; values: SkinfoldValues }
  | { ok: false; errors: Record<string, string> };

/**
 * Turns raw form input into numbers, refusing anything that is not a finite
 * value inside caliper range. Blank is allowed — a methodology need not use
 * every site — but a filled field has to be a real reading.
 */
export function validateSkinfolds(raw: Record<string, string>): ValidationResult {
  const values: SkinfoldValues = {};
  const errors: Record<string, string> = {};

  for (const site of MEASUREMENT_SITES) {
    const entry = (raw[site.id] ?? "").trim();
    if (entry === "") continue;

    const parsed = Number(entry.replace(",", "."));

    if (!Number.isFinite(parsed)) {
      errors[site.id] = "Въведете число.";
    } else if (parsed < MIN_MM) {
      errors[site.id] = `Не по-малко от ${MIN_MM} mm.`;
    } else if (parsed > MAX_MM) {
      errors[site.id] = `Не повече от ${MAX_MM} mm.`;
    } else {
      values[site.id] = Math.round(parsed * 10) / 10;
    }
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, values };
}

/**
 * The sum of the readings taken. This is a total in millimetres — deliberately
 * not a body fat percentage, which needs a methodology and the client's age,
 * sex and weight.
 */
export function sumSkinfolds(values: SkinfoldValues): number {
  return Object.values(values).reduce((total, mm) => total + mm, 0);
}

export function formatMm(value: number): string {
  return value.toLocaleString("bg-BG", { maximumFractionDigits: 1 });
}

// --- Body fat -------------------------------------------------------------

export type BodyFatInput = {
  measurements: SkinfoldValues;
  age: number | null;
  sex: "male" | "female" | null;
  weightKg: number | null;
};

export type BodyFatMethod = {
  id: string;
  name: string;
  /** Sites this equation requires; a missing one means it cannot be applied. */
  requires: string[];
  calculate: (input: BodyFatInput) => number | null;
};

/**
 * Empty on purpose. Published equations (Jackson-Pollock and the like) each
 * demand a specific set of sites and their own constants, and guessing at one
 * would produce a number that looks authoritative and is not. Register a method
 * here and the UI picks it up; until then the app reports the sum only.
 */
export const BODY_FAT_METHODS: BodyFatMethod[] = [];

export function calculateBodyFat(
  input: BodyFatInput,
  methodId?: string,
): { method: BodyFatMethod; percent: number } | null {
  const method = methodId
    ? BODY_FAT_METHODS.find((m) => m.id === methodId)
    : BODY_FAT_METHODS[0];

  if (!method) return null;
  if (method.requires.some((site) => input.measurements[site] === undefined)) {
    return null;
  }

  const percent = method.calculate(input);
  return percent === null ? null : { method, percent };
}

// --- Circumferences ---------------------------------------------------------

export type CircumferenceSite = {
  id: string;
  name: string;
  unit: "cm";
  /** Grouped so the form can pair left and right rather than listing fifteen boxes. */
  group: "torso" | "arms" | "legs";
  /** Null where the site is single, otherwise which side this one is. */
  side: "left" | "right" | null;
  hint: string;
};

/** A tape reads roughly this range across every site on a body. */
export const MIN_CM = 10;
export const MAX_CM = 250;

export const CIRCUMFERENCE_SITES: CircumferenceSite[] = [
  { id: "neck", name: "Врат", unit: "cm", group: "torso", side: null, hint: "Под адамовата ябълка" },
  { id: "shoulders", name: "Рамене", unit: "cm", group: "torso", side: null, hint: "През най-широката част" },
  { id: "chest", name: "Гърди", unit: "cm", group: "torso", side: null, hint: "На нивото на зърната, при спокойно дишане" },
  { id: "waist", name: "Талия", unit: "cm", group: "torso", side: null, hint: "В най-тясната част, обикновено над пъпа" },
  { id: "hips", name: "Ханш", unit: "cm", group: "torso", side: null, hint: "През най-широката част на седалището" },

  { id: "arm_left", name: "Ръка", unit: "cm", group: "arms", side: "left", hint: "Бицепс в отпуснато състояние" },
  { id: "arm_right", name: "Ръка", unit: "cm", group: "arms", side: "right", hint: "Бицепс в отпуснато състояние" },
  { id: "forearm_left", name: "Предмишница", unit: "cm", group: "arms", side: "left", hint: "В най-широката част" },
  { id: "forearm_right", name: "Предмишница", unit: "cm", group: "arms", side: "right", hint: "В най-широката част" },
  { id: "wrist_left", name: "Китка", unit: "cm", group: "arms", side: "left", hint: "Точно над костта" },
  { id: "wrist_right", name: "Китка", unit: "cm", group: "arms", side: "right", hint: "Точно над костта" },

  { id: "thigh_left", name: "Бедро", unit: "cm", group: "legs", side: "left", hint: "Под седалищната гънка" },
  { id: "thigh_right", name: "Бедро", unit: "cm", group: "legs", side: "right", hint: "Под седалищната гънка" },
  { id: "calf_left", name: "Прасец", unit: "cm", group: "legs", side: "left", hint: "В най-широката част" },
  { id: "calf_right", name: "Прасец", unit: "cm", group: "legs", side: "right", hint: "В най-широката част" },
  { id: "ankle_left", name: "Глезен", unit: "cm", group: "legs", side: "left", hint: "Над костта" },
  { id: "ankle_right", name: "Глезен", unit: "cm", group: "legs", side: "right", hint: "Над костта" },
];

export const CIRCUMFERENCE_BY_ID = new Map(
  CIRCUMFERENCE_SITES.map((s) => [s.id, s]),
);

export const CIRCUMFERENCE_GROUPS = [
  { id: "torso" as const, label: "Торс" },
  { id: "arms" as const, label: "Ръце" },
  { id: "legs" as const, label: "Крака" },
];

export type CircumferenceValues = Record<string, number>;

export type CircumferenceValidation =
  | { ok: true; values: CircumferenceValues }
  | { ok: false; errors: Record<string, string> };

/**
 * Same contract as the skinfold check: blank is allowed, because no trainer
 * measures all fifteen every time, but a filled box has to be a real reading.
 */
export function validateCircumferences(
  raw: Record<string, string>,
): CircumferenceValidation {
  const values: CircumferenceValues = {};
  const errors: Record<string, string> = {};

  for (const site of CIRCUMFERENCE_SITES) {
    const entry = (raw[site.id] ?? "").trim();
    if (entry === "") continue;

    const parsed = Number(entry.replace(",", "."));

    if (!Number.isFinite(parsed)) {
      errors[site.id] = "Въведете число.";
    } else if (parsed < MIN_CM) {
      errors[site.id] = `Не по-малко от ${MIN_CM} см.`;
    } else if (parsed > MAX_CM) {
      errors[site.id] = `Не повече от ${MAX_CM} см.`;
    } else {
      values[site.id] = Math.round(parsed * 10) / 10;
    }
  }

  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, values };
}

export function formatCm(value: number): string {
  return value.toLocaleString("bg-BG", { maximumFractionDigits: 1 });
}
