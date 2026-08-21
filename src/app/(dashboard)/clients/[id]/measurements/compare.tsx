"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSelect } from "@/components/form-select";
import { Label } from "@/components/ui/label";
import {
  MEASUREMENT_SITES,
  formatMm,
  sumSkinfolds,
  type SkinfoldValues,
} from "@/lib/measurements";

export type ComparableSession = {
  id: string;
  measured_at: string;
  values: SkinfoldValues;
};

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Presented as a plain signed number. Whether a fall is progress depends on
  // the client's goal, so the interface reports the change and leaves the
  // reading of it to the trainer.
  const sign = value > 0 ? "+" : "";
  return (
    <span className="tabular-nums">
      {sign}
      {formatMm(value)} mm
    </span>
  );
}

export function CompareSessions({
  sessions,
}: {
  sessions: ComparableSession[];
}) {
  const options = Object.fromEntries(
    sessions.map((s) => [s.id, s.measured_at]),
  );

  const [fromId, setFromId] = useState(sessions[sessions.length - 1]?.id);
  const [toId, setToId] = useState(sessions[0]?.id);

  const from = sessions.find((s) => s.id === fromId);
  const to = sessions.find((s) => s.id === toId);

  if (!from || !to) return null;

  const fromTotal = sumSkinfolds(from.values);
  const toTotal = sumSkinfolds(to.values);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сравнение</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="compare-from">Начално</Label>
            <FormSelect
              id="compare-from"
              name="compare-from"
              options={options}
              defaultValue={fromId}
              onValueChange={setFromId}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="compare-to">Крайно</Label>
            <FormSelect
              id="compare-to"
              name="compare-to"
              options={options}
              defaultValue={toId}
              onValueChange={setToId}
            />
          </div>
        </div>

        <dl className="text-sm">
          {MEASUREMENT_SITES.map((site) => {
            const a = from.values[site.id];
            const b = to.values[site.id];
            const both = a !== undefined && b !== undefined;

            return (
              <div
                key={site.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-t py-2.5 first:border-t-0"
              >
                <dt className="text-muted-foreground">{site.name}</dt>
                <dd className="flex items-center gap-2 tabular-nums">
                  <span>{a === undefined ? "—" : `${formatMm(a)}`}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span>{b === undefined ? "—" : `${formatMm(b)}`} mm</span>
                  <span className="w-24 text-right">
                    <Delta value={both ? b - a : null} />
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>

        <div className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-4">
          <p className="font-medium">Σ Skinfold</p>
          <p className="flex items-center gap-2 tabular-nums">
            <span>{formatMm(fromTotal)}</span>
            <ArrowRight className="size-3 text-muted-foreground" />
            <span>{formatMm(toTotal)} mm</span>
            <span className="w-24 text-right font-medium">
              <Delta value={toTotal - fromTotal} />
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
