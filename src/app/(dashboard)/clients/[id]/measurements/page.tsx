import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Ruler } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMm, sumSkinfolds } from "@/lib/measurements";
import { SkinfoldChart } from "./skinfold-chart";
import { CompareSessions } from "./compare";
import { toValues } from "./to-values";
import type { SessionWithSkinfolds } from "@/lib/types";

export default async function MeasurementsPage({
  params,
}: PageProps<"/clients/[id]/measurements">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  const { data } = await supabase
    .from("measurement_sessions")
    .select("*, skinfold_measurements(*)")
    .eq("client_id", id)
    .order("measured_at", { ascending: false });

  const sessions = (data ?? []) as SessionWithSkinfolds[];

  const rows = sessions.map((session) => {
    const values = toValues(session);
    return { session, values, total: sumSkinfolds(values) };
  });

  // Oldest first for the chart; the table reads newest first.
  const chartPoints = [...rows]
    .reverse()
    .map(({ session, total }) => ({ date: session.measured_at, total }));

  return (
    <>
      <PageHeader
        title="Измервания с калипер"
        description={`Клиент: ${client.full_name}`}
        action={
          <Button
            render={<Link href={`/clients/${id}/measurements/new`} />}
          >
            <Plus className="size-4" />
            Ново измерване
          </Button>
        }
      />

      <div className="grid gap-4 p-6">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Ruler className="size-5 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium">Все още няма записани измервания.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Запишете първото и историята ще започне да се трупа сама.
                </p>
              </div>
              <Button
                render={<Link href={`/clients/${id}/measurements/new`} />}
              >
                <Plus className="size-4" />
                Добави първото измерване
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {chartPoints.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Σ Skinfold във времето</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkinfoldChart points={chartPoints} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>История</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* The table scrolls rather than squeezing on a narrow screen. */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Дата</TableHead>
                        <TableHead>Σ Skinfold</TableHead>
                        <TableHead>Промяна</TableHead>
                        <TableHead>Точки</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(({ session, values, total }, i) => {
                        // Rows run newest first, so the previous measurement is
                        // the next one down.
                        const older = rows[i + 1];
                        const change = older ? total - older.total : null;

                        return (
                          <TableRow key={session.id}>
                            <TableCell className="font-medium">
                              {session.measured_at}
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {formatMm(total)} mm
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {change === null
                                ? "—"
                                : `${change > 0 ? "+" : ""}${formatMm(change)} mm`}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {Object.keys(values).length}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                render={
                                  <Link
                                    href={`/clients/${id}/measurements/${session.id}`}
                                  />
                                }
                              >
                                Отвори
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {rows.length >= 2 && (
              <CompareSessions
                sessions={rows.map(({ session, values }) => ({
                  id: session.id,
                  measured_at: session.measured_at,
                  values,
                }))}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
