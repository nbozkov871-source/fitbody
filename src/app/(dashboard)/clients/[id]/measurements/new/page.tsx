import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SessionForm } from "../session-form";
import { createSession } from "../actions";
import { toCircumferences, toValues } from "../to-values";
import type { SessionWithSkinfolds } from "@/lib/types";

export default async function NewMeasurementPage({
  params,
}: PageProps<"/clients/[id]/measurements/new">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", id)
    .maybeSingle();

  if (!client) notFound();

  // The last session's readings sit beside the inputs, so the trainer sees the
  // change as they type rather than after saving.
  const { data: last } = await supabase
    .from("measurement_sessions")
    .select("*, skinfold_measurements(*), circumference_measurements(*)")
    .eq("client_id", id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle<SessionWithSkinfolds>();

  const save = createSession.bind(null, id);

  return (
    <>
      <PageHeader
        title="Ново измерване"
        description={`Клиент: ${client.full_name}`}
      />
      <SessionForm
        action={save}
        cancelHref={`/clients/${id}/measurements`}
        submitLabel="Запази измерването"
        previous={last ? toValues(last) : undefined}
        previousCircumferences={last ? toCircumferences(last) : undefined}
      />
    </>
  );
}
