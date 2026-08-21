import type { SkinfoldValues } from "@/lib/measurements";
import type { SessionWithSkinfolds } from "@/lib/types";

/** Flattens the joined rows into the site-keyed shape the helpers expect. */
export function toValues(session: SessionWithSkinfolds): SkinfoldValues {
  const values: SkinfoldValues = {};
  for (const row of session.skinfold_measurements ?? []) {
    values[row.site] = Number(row.value_mm);
  }
  return values;
}
