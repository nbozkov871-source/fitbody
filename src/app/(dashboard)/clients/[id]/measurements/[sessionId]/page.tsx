import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CIRCUMFERENCE_GROUPS,
  CIRCUMFERENCE_SITES,
  MEASUREMENT_SITES,
  formatCm,
  formatMm,
  sumSkinfolds,
  calculateBodyFat,
} from "@/lib/measurements";
import { toCircumferences, toValues } from "../to-values";
import { DeleteSession } from "../delete-session";
import type { Client, SessionWithSkinfolds } from "@/lib/types";

export default async function MeasurementDetailPage({
  params,
}: PageProps<"/clients/[id]/measurements/[sessionId]">) {
  const { id, sessionId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("measurement_sessions")
    .select("*, skinfold_measurements(*), circumference_measurements(*)")
    .eq("id", sessionId)
    .eq("client_id", id)
    .maybeSingle<SessionWithSkinfolds>();

  if (!data) notFound();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<Client>();

  const values = toValues(data);
  const circumferences = toCircumferences(data);
  const total = sumSkinfolds(values);

  // Returns null until a methodology is registered, so nothing invented shows up
  // next to the readings.
  const bodyFat = client
    ? calculateBodyFat({
        measurements: values,
        age: client.birth_date
          ? new Date().getFullYear() - new Date(client.birth_date).getFullYear()
          : null,
        sex: (client.sex as "male" | "female" | null) ?? null,
        weightKg: null,
      })
    : null;

  return (
    <>
      <PageHeader
        title={`Измерване от ${data.measured_at}`}
        description={client ? `Клиент: ${client.full_name}` : undefined}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              render={
                <Link
                  href={`/clients/${id}/measurements/${sessionId}/edit`}
                />
              }
            >
              <Pencil className="size-4" />
              Редактирай
            </Button>
            <DeleteSession
              clientId={id}
              sessionId={sessionId}
              measuredAt={data.measured_at}
            />
          </div>
        }
      />

      <div className="grid gap-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Σ Skinfold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">
                {formatMm(total)}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  mm
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Сума на {Object.keys(values).length} измерени точки. Това не е
                процент телесни мазнини.
              </p>
            </CardContent>
          </Card>

          {bodyFat && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Телесни мазнини · {bodyFat.method.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">
                  {bodyFat.percent.toFixed(1)}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    %
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Точки</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="text-sm">
              {MEASUREMENT_SITES.map((site) => (
                <div
                  key={site.id}
                  className="flex items-baseline justify-between gap-4 border-t py-2.5 first:border-t-0"
                >
                  <dt>
                    {site.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {site.hint}
                    </span>
                  </dt>
                  <dd className="tabular-nums whitespace-nowrap">
                    {values[site.id] === undefined ? (
                      <span className="text-muted-foreground">не е мерено</span>
                    ) : (
                      `${formatMm(values[site.id])} mm`
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {Object.keys(circumferences).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Обиколки</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {CIRCUMFERENCE_GROUPS.map((group) => {
                const rows = CIRCUMFERENCE_SITES.filter(
                  (s) => s.group === group.id && circumferences[s.id] !== undefined,
                );
                if (rows.length === 0) return null;

                return (
                  <div key={group.id}>
                    <p className="mb-2 text-xs tracking-widest text-muted-foreground uppercase">
                      {group.label}
                    </p>
                    <dl className="text-sm">
                      {rows.map((site) => (
                        <div
                          key={site.id}
                          className="flex items-baseline justify-between gap-4 border-t py-2.5 first:border-t-0"
                        >
                          <dt>
                            {site.name}
                            {site.side === "left" && " (ляво)"}
                            {site.side === "right" && " (дясно)"}
                          </dt>
                          <dd className="tabular-nums whitespace-nowrap">
                            {formatCm(circumferences[site.id])} см
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {data.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Бележка</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {data.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
