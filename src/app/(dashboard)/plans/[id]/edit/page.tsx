import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { PlanEditor } from "../plan-editor";
import { updatePlan } from "../../actions";
import type { NutritionPlan } from "@/lib/types";

export default async function EditPlanPage({
  params,
}: PageProps<"/plans/[id]/edit">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("nutrition_plans")
    .select("*, clients(id, full_name)")
    .eq("id", id)
    .single<NutritionPlan & { clients: { id: string; full_name: string } }>();

  if (!data) notFound();

  const save = updatePlan.bind(null, id);

  return (
    <>
      <PageHeader
        title="Редакция на плана"
        description={`Клиент: ${data.clients.full_name}`}
      />
      <PlanEditor plan={data} action={save} />
    </>
  );
}
