import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_MM,
  MEASUREMENT_SITES,
  MIN_MM,
  sumSkinfolds,
  validateSkinfolds,
  calculateBodyFat,
} from "./measurements.ts";

function raw(values: Record<string, string>) {
  const all: Record<string, string> = {};
  for (const site of MEASUREMENT_SITES) all[site.id] = values[site.id] ?? "";
  return all;
}

test("accepts readings inside caliper range", () => {
  const result = validateSkinfolds(raw({ triceps: "12", biceps: "8.5" }));
  assert.equal(result.ok, true);
  assert.deepEqual(result.ok && result.values, { triceps: 12, biceps: 8.5 });
});

test("blank sites are skipped, not zeroed", () => {
  const result = validateSkinfolds(raw({ triceps: "12" }));
  assert.equal(result.ok, true);
  // A site nobody measured must not read as a measurement of zero.
  assert.equal(result.ok && "biceps" in result.values, false);
});

test("rejects text, so NaN cannot reach the database", () => {
  const result = validateSkinfolds(raw({ triceps: "abc" }));
  assert.equal(result.ok, false);
  assert.match(result.ok === false ? result.errors.triceps : "", /число/);
});

test("rejects negative and out-of-range readings", () => {
  for (const value of ["-5", "0", String(MAX_MM + 1)]) {
    const result = validateSkinfolds(raw({ triceps: value }));
    assert.equal(result.ok, false, `expected ${value} to be refused`);
  }
});

test("accepts the exact bounds", () => {
  for (const value of [MIN_MM, MAX_MM]) {
    const result = validateSkinfolds(raw({ triceps: String(value) }));
    assert.equal(result.ok, true, `expected ${value} to be accepted`);
  }
});

test("reads a decimal comma, as a Bulgarian keyboard produces it", () => {
  const result = validateSkinfolds(raw({ triceps: "12,5" }));
  assert.equal(result.ok, true);
  assert.equal(result.ok && result.values.triceps, 12.5);
});

test("rounds to one decimal, matching the column", () => {
  const result = validateSkinfolds(raw({ triceps: "12.34" }));
  assert.equal(result.ok && result.values.triceps, 12.3);
});

test("sums only the sites that were measured", () => {
  assert.equal(sumSkinfolds({ triceps: 12, biceps: 8, thigh: 18 }), 38);
  assert.equal(sumSkinfolds({}), 0);
});

test("the worked example from the brief totals 98 mm", () => {
  const result = validateSkinfolds(
    raw({
      triceps: "12",
      biceps: "8",
      subscapular: "14",
      suprailiac: "16",
      abdominal: "20",
      thigh: "18",
      chest: "10",
    }),
  );
  assert.equal(result.ok, true);
  assert.equal(sumSkinfolds(result.ok ? result.values : {}), 98);
});

test("body fat reports nothing while no methodology is registered", () => {
  // Guards the deliberate gap: the app must not invent a percentage.
  const outcome = calculateBodyFat({
    measurements: { triceps: 12, biceps: 8 },
    age: 30,
    sex: "male",
    weightKg: 80,
  });
  assert.equal(outcome, null);
});

test("every site is uniquely identified", () => {
  const ids = MEASUREMENT_SITES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});
