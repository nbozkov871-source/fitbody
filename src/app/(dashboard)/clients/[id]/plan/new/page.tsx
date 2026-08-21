import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormSelect } from "@/components/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generatePlan } from "./actions";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
  type Client,
} from "@/lib/types";

function age(birthDate: string | null) {
  if (!birthDate) return "";
  const diff = Date.now() - new Date(birthDate).getTime();
  return String(Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

export default async function NewPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single<Client>();

  if (!client) notFound();

  const { data: latestMetric } = await supabase
    .from("client_metrics")
    .select("weight_kg")
    .eq("client_id", id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const generateForClient = generatePlan.bind(null, id);

  return (
    <>
      <PageHeader
        title="Генериране на хранителен план"
        description={`Клиент: ${client.full_name}`}
      />

      <div className="max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Данни за плана</CardTitle>
            <CardDescription>
              Стойностите са предварително попълнени от профила на клиента.
              Коригирайте ги при нужда.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={generateForClient} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="title">Заглавие на плана *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={`План — ${new Date().toLocaleDateString("bg-BG")}`}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="sex">Пол *</Label>
                  <FormSelect
                    id="sex"
                    name="sex"
                    options={SEX_LABELS}
                    defaultValue={client.sex ?? undefined}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="age">Възраст *</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    required
                    min="14"
                    max="100"
                    defaultValue={age(client.birth_date)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="height_cm">Височина (см) *</Label>
                  <Input
                    id="height_cm"
                    name="height_cm"
                    type="number"
                    step="0.5"
                    required
                    defaultValue={client.height_cm ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="weight_kg">Тегло (кг) *</Label>
                  <Input
                    id="weight_kg"
                    name="weight_kg"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={latestMetric?.weight_kg ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meals_per_day">Хранения на ден *</Label>
                  <Input
                    id="meals_per_day"
                    name="meals_per_day"
                    type="number"
                    required
                    min="2"
                    max="5"
                    defaultValue="4"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="goal">Цел *</Label>
                  <FormSelect
                    id="goal"
                    name="goal"
                    options={GOAL_LABELS}
                    defaultValue={client.goal ?? undefined}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="activity">Ниво на активност *</Label>
                  <FormSelect
                    id="activity"
                    name="activity"
                    options={ACTIVITY_LABELS}
                    defaultValue={client.activity ?? undefined}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="preferences">
                  Предпочитания и ограничения
                </Label>
                <Textarea
                  id="preferences"
                  name="preferences"
                  rows={3}
                  defaultValue={client.notes ?? ""}
                  placeholder="Алергии, вегетарианство, нехаресвани храни…"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">
                  <Sparkles className="size-4" />
                  Генерирай план
                </Button>
                <Button variant="ghost" render={<Link href={`/clients/${id}`} />}>
                  Отказ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
