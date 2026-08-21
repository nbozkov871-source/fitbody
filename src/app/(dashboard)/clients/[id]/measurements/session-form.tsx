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
  MAX_MM,
  MEASUREMENT_SITES,
  MIN_MM,
  formatMm,
  type SkinfoldValues,
} from "@/lib/measurements";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  submitLabel: string;
  defaults?: {
    measured_at: string;
    notes: string;
    values: SkinfoldValues;
  };
  /** The readings from the session before this one, shown beside each input. */
  previous?: SkinfoldValues;
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
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const site of MEASUREMENT_SITES) {
      const value = defaults?.values[site.id];
      initial[site.id] = value === undefined ? "" : String(value);
    }
    return initial;
  });

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
