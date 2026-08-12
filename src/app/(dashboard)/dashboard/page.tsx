import Link from "next/link";
import { Users, UserCheck, Utensils, Plus } from "lucide-react";
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
