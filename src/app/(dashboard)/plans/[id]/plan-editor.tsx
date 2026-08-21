"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Meal, NutritionPlan, PlanContent } from "@/lib/types";

type Props = {
  plan: NutritionPlan;
  action: (formData: FormData) => void | Promise<void>;
};

const EMPTY_MEAL: Meal = {
  name: "",
  time: "",
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  items: [],
};

const MACROS = [
  { key: "protein_g", label: "Протеин" },
  { key: "carbs_g", label: "Въглехидрати" },
  { key: "fat_g", label: "Мазнини" },
] as const;

export function PlanEditor({ plan, action }: Props) {
  const content: PlanContent = plan.plan ?? {
    summary: "",
    meals: [],
    guidelines: [],
  };

  const [meals, setMeals] = useState<Meal[]>(content.meals);
  const [summary, setSummary] = useState(content.summary);
  const [guidelines, setGuidelines] = useState(content.guidelines.join("\n"));
  const [targets, setTargets] = useState({
    target_calories: plan.target_calories ?? 0,
    protein_g: plan.protein_g ?? 0,
    carbs_g: plan.carbs_g ?? 0,
    fat_g: plan.fat_g ?? 0,
  });

  // Editing one meal gives no sense of the day drifting out of balance, so the
  // running total sits next to the target it is meant to hit.
  const totals = useMemo(
    () =>
      meals.reduce(
        (sum, meal) => ({
          calories: sum.calories + (Number(meal.calories) || 0),
          protein_g: sum.protein_g + (Number(meal.protein_g) || 0),
          carbs_g: sum.carbs_g + (Number(meal.carbs_g) || 0),
          fat_g: sum.fat_g + (Number(meal.fat_g) || 0),
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      ),
    [meals],
  );

  function patchMeal(index: number, patch: Partial<Meal>) {
    setMeals((current) =>
      current.map((meal, i) => (i === index ? { ...meal, ...patch } : meal)),
    );
  }

  const payload: PlanContent = {
    summary,
    meals,
    guidelines: guidelines
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  };

  const diff = totals.calories - targets.target_calories;

  return (
    <form action={action} className="grid gap-4 p-6">
      {/* Meals are a variable-length list, so they travel as one JSON field
          rather than indexed inputs that have to be stitched back together. */}
      <input type="hidden" name="plan" value={JSON.stringify(payload)} />

      <Card>
        <CardHeader>
          <CardTitle>Основни данни</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Заглавие *</Label>
            <Input id="title" name="title" required defaultValue={plan.title} />
          </div>

          <div className="grid gap-5 sm:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="target_calories">Калории (kcal)</Label>
              <Input
                id="target_calories"
                name="target_calories"
                type="number"
                min="0"
                value={targets.target_calories}
                onChange={(e) =>
                  setTargets({
                    ...targets,
                    target_calories: Number(e.target.value),
                  })
                }
              />
            </div>
            {MACROS.map(({ key, label }) => (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key}>{label} (г)</Label>
                <Input
                  id={key}
                  name={key}
                  type="number"
                  min="0"
                  value={targets[key]}
                  onChange={(e) =>
                    setTargets({ ...targets, [key]: Number(e.target.value) })
                  }
                />
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">Обобщение</Label>
            <Input
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Хранения</CardTitle>
          <p className="text-sm tabular-nums" aria-live="polite">
            <span className="text-muted-foreground">Сбор: </span>
            <span className={diff === 0 ? "text-primary" : "text-destructive"}>
              {totals.calories} kcal
            </span>
            {diff !== 0 && (
              <span className="text-muted-foreground">
                {" "}
                ({diff > 0 ? "+" : ""}
                {diff} спрямо целта)
              </span>
            )}
          </p>
        </CardHeader>
        <CardContent className="grid gap-5">
          {meals.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Няма хранения. Добавете първото.
            </p>
          )}

          {meals.map((meal, index) => (
            <div
              key={index}
              className="grid gap-4 border-t pt-5 first:border-t-0 first:pt-0"
            >
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <div className="grid gap-2">
                  <Label htmlFor={`name-${index}`}>Хранене</Label>
                  <Input
                    id={`name-${index}`}
                    value={meal.name}
                    onChange={(e) => patchMeal(index, { name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`time-${index}`}>Час</Label>
                  <Input
                    id={`time-${index}`}
                    type="time"
                    value={meal.time}
                    onChange={(e) => patchMeal(index, { time: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`kcal-${index}`}>Калории</Label>
                  <Input
                    id={`kcal-${index}`}
                    type="number"
                    min="0"
                    value={meal.calories}
                    onChange={(e) =>
                      patchMeal(index, { calories: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Премахни ${meal.name || "храненето"}`}
                    onClick={() =>
                      setMeals((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {MACROS.map(({ key, label }) => (
                  <div key={key} className="grid gap-2">
                    <Label htmlFor={`${key}-${index}`}>{label} (г)</Label>
                    <Input
                      id={`${key}-${index}`}
                      type="number"
                      min="0"
                      value={meal[key]}
                      onChange={(e) =>
                        patchMeal(index, { [key]: Number(e.target.value) })
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`items-${index}`}>Храни</Label>
                <Input
                  id={`items-${index}`}
                  value={meal.items.join(", ")}
                  placeholder="Разделяйте с запетая"
                  onChange={(e) =>
                    patchMeal(index, {
                      items: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>
            </div>
          ))}

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setMeals((current) => [...current, { ...EMPTY_MEAL }])
              }
            >
              <Plus className="size-4" />
              Добави хранене
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Указания</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="guidelines">Едно указание на ред</Label>
            <Textarea
              id="guidelines"
              rows={5}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit">Запази промените</Button>
        <Button variant="ghost" render={<Link href={`/plans/${plan.id}`} />}>
          Отказ
        </Button>
      </div>
    </form>
  );
}
