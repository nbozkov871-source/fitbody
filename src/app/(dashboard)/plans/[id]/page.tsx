import Link from "next/link";
import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlanStatusActions } from "./plan-status-actions";
import type { NutritionPlan } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Чернова",
  active: "Активен",
  archived: "Архивиран",
};

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("nutrition_plans")
    .select("*, clients(id, full_name)")
    .eq("id", id)
    .single<NutritionPlan & { clients: { id: string; full_name: string } }>();

  if (!plan) notFound();

  const macros = [
    { label: "Калории", value: plan.target_calories, unit: "kcal" },
    { label: "Протеин", value: plan.protein_g, unit: "г" },
    { label: "Въглехидрати", value: plan.carbs_g, unit: "г" },
    { label: "Мазнини", value: plan.fat_g, unit: "г" },
  ];

  return (
    <>
      <PageHeader
        title={plan.title}
        description={
          <>
            Клиент:{" "}
            <Link
              href={`/clients/${plan.clients.id}`}
              className="text-primary hover:underline"
            >
              {plan.clients.full_name}
            </Link>
          </>
        }
        action={
          <div className="flex items-center gap-3">
            <Badge variant={plan.status === "active" ? "default" : "secondary"}>
              {STATUS_LABELS[plan.status]}
            </Badge>
            <Button
              variant="outline"
              render={<Link href={`/plans/${plan.id}/edit`} />}
            >
              <Pencil className="size-4" />
              Редактирай
            </Button>
            <PlanStatusActions planId={plan.id} status={plan.status} />
          </div>
        }
      />

      <div className="grid gap-4 p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {macros.map(({ label, value, unit }) => (
            <Card key={label}>
              <CardHeader>
                <CardDescription>{label}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {value ?? "—"}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {unit}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {plan.plan && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Разпределение по хранения</CardTitle>
                <CardDescription>{plan.plan.summary}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Хранене</TableHead>
                      <TableHead>Час</TableHead>
                      <TableHead>Калории</TableHead>
                      <TableHead>П / В / М</TableHead>
                      <TableHead>Съдържание</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.plan.meals.map((meal) => (
                      <TableRow key={meal.name}>
                        <TableCell className="font-medium">
                          {meal.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {meal.time}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {meal.calories} kcal
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {meal.protein_g} / {meal.carbs_g} / {meal.fat_g} г
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {meal.items.join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Указания</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  {plan.plan.guidelines.map((guideline) => (
                    <li key={guideline} className="flex gap-2">
                      <span className="text-primary">•</span>
                      {guideline}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
