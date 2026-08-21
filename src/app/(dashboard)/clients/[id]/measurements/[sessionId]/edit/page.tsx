import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SessionForm } from "../../session-form";
import { updateSession } from "../../actions";
import { toValues } from "../../to-values";
import type { SessionWithSkinfolds } from "@/lib/types";

export default async function EditMeasurementPage({
  params,
}: PageProps<"/clients/[id]/measurements/[sessionId]/edit">) {
  const { id, sessionId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("measurement_sessions")
    .select("*, skinfold_measurements(*)")
    .eq("id", sessionId)
    .eq("client_id", id)
    .maybeSingle<SessionWithSkinfolds>();

  if (!data) notFound();

  // The reading before this one, so editing keeps the same reference point the
  // form offers when creating.
  const { data: earlier } = await supabase
    .from("measurement_sessions")
    .select("*, skinfold_measurements(*)")
    .eq("client_id", id)
    .lt("measured_at", data.measured_at)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle<SessionWithSkinfolds>();

  const save = updateSession.bind(null, id, sessionId);

  return (
    <>
      <PageHeader
        title="Редакция на измерването"
        description={`Записано на ${data.measured_at}`}
      />
      <SessionForm
        action={save}
        cancelHref={`/clients/${id}/measurements/${sessionId}`}
        submitLabel="Запази промените"
        defaults={{
          measured_at: data.measured_at,
          notes: data.notes ?? "",
          values: toValues(data),
        }}
        previous={earlier ? toValues(earlier) : undefined}
      />
    </>
  );
}
