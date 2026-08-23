"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CIRCUMFERENCE_GROUPS,
  CIRCUMFERENCE_SITES,
  MAX_CM,
  MAX_MM,
  MEASUREMENT_SITES,
  MIN_CM,
  MIN_MM,
  formatCm,
  formatMm,
  type CircumferenceValues,
  type SkinfoldValues,
} from "@/lib/measurements";
import { BodyFigure } from "./body-figure";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  defaults?: {
    measured_at: string;
    notes: string;
    values: SkinfoldValues;
    circumferences: CircumferenceValues;
  };
  /** The readings from the session before this one, shown beside each input. */
  previous?: SkinfoldValues;
  previousCircumferences?: CircumferenceValues;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Записване…" : label}
    </Button>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function SessionForm({
  action,
  cancelHref,
  submitLabel,
  defaults,
  previous,
  previousCircumferences,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const site of MEASUREMENT_SITES) {
      const value = defaults?.values[site.id];
      initial[site.id] = value === undefined ? "" : String(value);
    }
    return initial;
  });

  const [circumferences, setCircumferences] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const site of CIRCUMFERENCE_SITES) {
        const value = defaults?.circumferences[site.id];
        initial[site.id] = value === undefined ? "" : String(value);
      }
      return initial;
    },
  );

  const filled = new Set(
    CIRCUMFERENCE_SITES.filter((s) => {
      const n = Number(String(circumferences[s.id] ?? "").replace(",", "."));
      return Number.isFinite(n) && n > 0;
    }).map((s) => s.id),
  );

  const entered = MEASUREMENT_SITES.map((site) =>
    Number(String(values[site.id] ?? "").replace(",", ".")),
  ).filter((n) => Number.isFinite(n) && n > 0);

  const total = entered.reduce((sum, n) => sum + n, 0);

  return (
    <form action={action} className="grid gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Данни за измерването</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="measured_at">Дата *</Label>
            <Input
              id="measured_at"
              name="measured_at"
              type="date"
              required
              max={today()}
              defaultValue={defaults?.measured_at ?? today()}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Кожни гънки</CardTitle>
          <p className="text-sm tabular-nums" aria-live="polite">
            <span className="text-muted-foreground">Σ Skinfold: </span>
            <span className="font-medium text-primary">
              {formatMm(total)} mm
            </span>
            <span className="text-muted-foreground">
              {" "}
              ({entered.length} от {MEASUREMENT_SITES.length})
            </span>
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MEASUREMENT_SITES.map((site) => {
            const before = previous?.[site.id];
            return (
              <div key={site.id} className="grid gap-2">
                <Label htmlFor={site.id}>{site.name}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={site.id}
                    name={`site_${site.id}`}
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min={MIN_MM}
                    max={MAX_MM}
                    placeholder="—"
                    value={values[site.id]}
                    onChange={(e) =>
                      setValues({ ...values, [site.id]: e.target.value })
                    }
                  />
                  <span className="text-sm text-muted-foreground">mm</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {before === undefined
                    ? site.hint
                    : `Предишно: ${formatMm(before)} mm`}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Обиколки</CardTitle>
          <p className="text-sm text-muted-foreground tabular-nums">
            {filled.size} от {CIRCUMFERENCE_SITES.length}
          </p>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[auto_1fr]">
          <BodyFigure
            filled={filled}
            onPick={(site) => document.getElementById(`circ-${site}`)?.focus()}
          />

          <div className="grid gap-6">
            {CIRCUMFERENCE_GROUPS.map((group) => {
              const sites = CIRCUMFERENCE_SITES.filter(
                (s) => s.group === group.id,
              );
              return (
                <div key={group.id} className="grid gap-3">
                  <p className="text-xs tracking-widest text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sites.map((site) => {
                      const before = previousCircumferences?.[site.id];
                      const label =
                        site.side === "left"
                          ? `${site.name} (ляво)`
                          : site.side === "right"
                            ? `${site.name} (дясно)`
                            : site.name;

                      return (
                        <div key={site.id} className="grid gap-1.5">
                          <Label htmlFor={`circ-${site.id}`} className="text-sm">
                            {label}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`circ-${site.id}`}
                              name={`circ_${site.id}`}
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min={MIN_CM}
                              max={MAX_CM}
                              placeholder="—"
                              value={circumferences[site.id]}
                              onChange={(e) =>
                                setCircumferences({
                                  ...circumferences,
                                  [site.id]: e.target.value,
                                })
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              см
                            </span>
                          </div>
                          {before !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Предишно: {formatCm(before)} см
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бележка</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Условия на измерването, отклонения, наблюдения…"
            defaultValue={defaults?.notes ?? ""}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <SubmitButton label={submitLabel} />
        <Button variant="ghost" render={<Link href={cancelHref} />}>
          Отказ
        </Button>
      </div>
    </form>
  );
}
