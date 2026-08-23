import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Ruler, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { LineChart } from "@/components/line-chart";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddMetricForm } from "./add-metric-form";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
  type ActivityLevel,
  type Client,
  type ClientMetric,
  type Goal,
  type Sex,
} from "@/lib/types";

function age(birthDate: string | null) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default async function ClientDetailPage({
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

  const [{ data: metrics }, { data: plans }, { data: waistRows }] =
    await Promise.all([
    supabase
      .from("client_metrics")
      .select("*")
      .eq("client_id", id)
      .order("measured_at", { ascending: false })
      .returns<ClientMetric[]>(),
    supabase
      .from("nutrition_plans")
      .select("id, title, status, target_calories, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    // Waist moved to the session-based table with the rest of the tape
    // readings; client_metrics keeps what a scale measures.
    supabase
      .from("measurement_sessions")
      .select("measured_at, circumference_measurements!inner(site, value_cm)")
      .eq("client_id", id)
      .eq("circumference_measurements.site", "waist")
      .order("measured_at", { ascending: true }),
  ]);

  const waistByDate = new Map<string, number>();
  for (const row of waistRows ?? []) {
    const reading = [row.circumference_measurements].flat()[0] as
      | { value_cm: number }
      | undefined;
    if (reading) waistByDate.set(row.measured_at as string, Number(reading.value_cm));
  }

  const latest = metrics?.[0];
  // The table reads newest first; a chart has to run the other way.
  const trend = [...(metrics ?? [])].reverse();
  const clientAge = age(client.birth_date);

  const details = [
    { label: "Имейл", value: client.email },
    { label: "Телефон", value: client.phone },
    { label: "Пол", value: client.sex ? SEX_LABELS[client.sex as Sex] : null },
    { label: "Възраст", value: clientAge ? `${clientAge} г.` : null },
    { label: "Височина", value: client.height_cm ? `${client.height_cm} см` : null },
    { label: "Цел", value: client.goal ? GOAL_LABELS[client.goal as Goal] : null },
    {
      label: "Активност",
      value: client.activity
        ? ACTIVITY_LABELS[client.activity as ActivityLevel]
        : null,
    },
    {
      label: "Текущо тегло",
      value: latest?.weight_kg ? `${latest.weight_kg} кг` : null,
    },
  ];

  return (
    <>
      <PageHeader
        title={client.full_name}
        description={
          client.goal ? GOAL_LABELS[client.goal as Goal] : "Без зададена цел"
        }
        action={
          <div className="flex items-center gap-3">
            <Badge variant={client.status === "active" ? "default" : "secondary"}>
              {STATUS_LABELS[client.status]}
            </Badge>
            <Button
              variant="outline"
              render={<Link href={`/clients/${client.id}/edit`} />}
            >
              <Pencil className="size-4" />
              Редактирай
            </Button>
            <Button
              variant="outline"
              render={<Link href={`/clients/${client.id}/measurements`} />}
            >
              <Ruler className="size-4" />
              Измервания
            </Button>
            <Button render={<Link href={`/clients/${client.id}/plan/new`} />}>
              <Sparkles className="size-4" />
              Генерирай план
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Профил</TabsTrigger>
            <TabsTrigger value="metrics">Измервания</TabsTrigger>
            <TabsTrigger value="plans">Планове</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Данни за клиента</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {details.map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="text-sm font-medium">{value ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Бележки</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {client.notes || "Няма добавени бележки."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6 grid gap-4 lg:grid-cols-3">
            {(trend.length >= 2 || waistByDate.size >= 2) && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Тегло и талия във времето</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart
                    series={[
                      {
                        label: "Тегло",
                        unit: "кг",
                        colour: "var(--primary)",
                        points: trend
                          .filter((m) => m.weight_kg !== null)
                          .map((m) => ({
                            date: m.measured_at,
                            value: Number(m.weight_kg),
                          })),
                      },
                      {
                        label: "Талия",
                        unit: "см",
                        colour: "var(--chart-2)",
                        points: [...waistByDate.entries()].map(
                          ([date, value]) => ({ date, value }),
                        ),
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            )}

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>История на измерванията</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {metrics?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Тегло</TableHead>
                        <TableHead>Мазнини %</TableHead>
                        <TableHead>Талия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.map((metric) => (
                        <TableRow key={metric.id}>
                          <TableCell>{metric.measured_at}</TableCell>
                          <TableCell>
                            {metric.weight_kg ? `${metric.weight_kg} кг` : "—"}
                          </TableCell>
                          <TableCell>
                            {metric.body_fat_pct
                              ? `${metric.body_fat_pct}%`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {waistByDate.has(metric.measured_at)
                              ? `${waistByDate.get(metric.measured_at)} см`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="p-6 text-sm text-muted-foreground">
                    Още няма записани измервания.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ново измерване</CardTitle>
                <CardDescription>Запишете текущите стойности.</CardDescription>
              </CardHeader>
              <CardContent>
                <AddMetricForm clientId={client.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Хранителни планове</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {plans?.length ? (
                  <ul className="divide-y">
                    {plans.map((plan) => (
                      <li key={plan.id}>
                        <Link
                          href={`/plans/${plan.id}`}
                          className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/50"
                        >
                          <span>
                            <span className="block font-medium">
                              {plan.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(plan.created_at).toLocaleDateString(
                                "bg-BG",
                              )}
                            </span>
                          </span>
                          <span className="flex items-center gap-3">
                            {plan.target_calories && (
                              <span className="text-sm tabular-nums text-muted-foreground">
                                {plan.target_calories} kcal
                              </span>
                            )}
                            <Badge
                              variant={
                                plan.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {plan.status === "active"
                                ? "Активен"
                                : plan.status === "draft"
                                  ? "Чернова"
                                  : "Архивиран"}
                            </Badge>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Още няма генерирани планове за този клиент.
                    </p>
                    <Button
                      className="mt-4"
                      render={<Link href={`/clients/${client.id}/plan/new`} />}
                    >
                      <Sparkles className="size-4" />
                      Генерирай първия план
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
