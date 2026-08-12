import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  draft: "Чернова",
  active: "Активен",
  archived: "Архивиран",
};

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("nutrition_plans")
    .select("id, title, status, target_calories, created_at, clients(full_name)")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Хранителни планове"
        description="Всички генерирани планове за вашите клиенти"
      />

      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {plans?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>План</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Калории</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Създаден</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/plans/${plan.id}`}
                          className="hover:underline"
                        >
                          {plan.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {/* @ts-expect-error Supabase types the join as an array */}
                        {plan.clients?.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {plan.target_calories
                          ? `${plan.target_calories} kcal`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            plan.status === "active" ? "default" : "secondary"
                          }
                        >
                          {STATUS_LABELS[plan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(plan.created_at).toLocaleDateString("bg-BG")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="p-16 text-center text-sm text-muted-foreground">
                Още няма генерирани планове.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
