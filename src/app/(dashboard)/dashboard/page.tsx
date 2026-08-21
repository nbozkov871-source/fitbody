import Link from "next/link";
import { Users, UserCheck, Utensils, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { formatMm } from "@/lib/measurements";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GOAL_LABELS, type Goal } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: totalClients }, { count: activeClients }, { count: plans }] =
    await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("nutrition_plans")
        .select("*", { count: "exact", head: true }),
    ]);

  // The two most recent sessions across this trainer's clients, so the card can
  // show the latest total and how it moved.
  const { data: latestSessions } = await supabase
    .from("measurement_sessions")
    .select("id, client_id, measured_at, skinfold_measurements(value_mm), clients(full_name)")
    .order("measured_at", { ascending: false })
    .limit(2);

  const { data: recentClients } = await supabase
    .from("clients")
    .select("id, full_name, goal, status, created_at")
    .eq("trainer_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Общо клиенти", value: totalClients ?? 0, icon: Users },
    { label: "Активни клиенти", value: activeClients ?? 0, icon: UserCheck },
    { label: "Хранителни планове", value: plans ?? 0, icon: Utensils },
  ];

  const sessionTotals = (latestSessions ?? []).map((row) => ({
    id: row.id as string,
    clientId: row.client_id as string,
    // The embed comes back as an array even for a single parent row.
    clientName:
      ([row.clients].flat()[0] as { full_name: string } | undefined)
        ?.full_name ?? "Клиент",
    date: row.measured_at as string,
    total: (row.skinfold_measurements ?? []).reduce(
      (sum: number, r: { value_mm: number }) => sum + Number(r.value_mm),
      0,
    ),
  }));

  const latestMeasurement = sessionTotals[0]
    ? {
        ...sessionTotals[0],
        change: sessionTotals[1]
          ? sessionTotals[0].total - sessionTotals[1].total
          : null,
      }
    : null;

  return (
    <>
      <PageHeader
        title="Табло"
        description="Обобщение на вашата практика"
        action={
          <Button render={<Link href="/clients/new" />}>
            <Plus className="size-4" />
            Нов клиент
          </Button>
        }
      />

      {latestMeasurement && (
        <div className="px-6 pt-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardDescription>Последно измерване</CardDescription>
                <CardTitle className="mt-1 text-3xl tabular-nums">
                  {formatMm(latestMeasurement.total)}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    mm
                  </span>
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    href={`/clients/${latestMeasurement.clientId}/measurements`}
                  />
                }
              >
                Виж всички измервания
              </Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {latestMeasurement.clientName} · {latestMeasurement.date}
              {latestMeasurement.change !== null && (
                <>
                  {" · спрямо предходното: "}
                  <span className="tabular-nums">
                    {latestMeasurement.change > 0 ? "+" : ""}
                    {formatMm(latestMeasurement.change)} mm
                  </span>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 p-6 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Последно добавени клиенти</CardTitle>
          </CardHeader>
          <CardContent>
            {recentClients?.length ? (
              <ul className="divide-y">
                {recentClients.map((client) => (
                  <li key={client.id}>
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center justify-between gap-4 py-3 hover:opacity-80"
                    >
                      <span className="font-medium">{client.full_name}</span>
                      <span className="flex items-center gap-2">
                        {client.goal && (
                          <span className="text-sm text-muted-foreground">
                            {GOAL_LABELS[client.goal as Goal]}
                          </span>
                        )}
                        <Badge
                          variant={
                            client.status === "active" ? "default" : "secondary"
                          }
                        >
                          {client.status === "active" ? "Активен" : "Неактивен"}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Още нямате добавени клиенти.
                </p>
                <Button className="mt-4" render={<Link href="/clients/new" />}>
                  <Plus className="size-4" />
                  Добави първия си клиент
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
