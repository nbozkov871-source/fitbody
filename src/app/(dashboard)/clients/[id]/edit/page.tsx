import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "../../client-form";
import { updateClientRecord } from "../../actions";
import type { Client } from "@/lib/types";

export default async function EditClientPage({
  params,
}: PageProps<"/clients/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!data) notFound();

  const client = data as Client;
  const save = updateClientRecord.bind(null, id);

  return (
    <ClientForm
      title={`Редакция — ${client.full_name}`}
      description="Променете данните и запазете."
      action={save}
      submitLabel="Запази промените"
      cancelHref={`/clients/${id}`}
      client={client}
    />
  );
}
