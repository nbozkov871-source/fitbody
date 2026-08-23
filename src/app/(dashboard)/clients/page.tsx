import Link from "next/link";
import { Plus, Undo2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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
import {
  GOAL_LABELS,
  STATUS_LABELS,
  type Client,
  type Goal,
} from "@/lib/types";
import { restoreClient } from "./actions";
import { ClientRowActions } from "./client-row-actions";

// Archived clients are the ones a trainer has finished with, and the bin holds
// the ones they deleted. Neither belongs in the list they open every morning,
// but both have to stay reachable — hence three views over one table.
const VIEWS = {
  active: "Активни",
  archived: "Архивирани",
  trash: "Кошче",
} as const;

type View = keyof typeof VIEWS;

const EMPTY_MESSAGE: Record<View, string> = {
  active: "Още нямате добавени клиенти.",
  archived: "Няма архивирани клиенти.",
  trash: "Кошчето е празно.",
};

export default async function ClientsPage({
  searchParams,
}: PageProps<"/clients">) {
  const { view: requested } = await searchParams;
  const view: View =
    typeof requested === "string" && requested in VIEWS
      ? (requested as View)
      : "active";

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id, full_name, email, goal, status, created_at")
    .order("created_at", { ascending: false });

  if (view === "trash") {
    query = query.not("deleted_at", "is", null);
  } else if (view === "archived") {
    query = query.is("deleted_at", null).eq("status", "archived");
  } else {
    query = query.is("deleted_at", null).neq("status", "archived");
  }

  const { data: clients } = await query;

  return (
    <>
      <PageHeader
        title="Клиенти"
        description="Всички клиенти, с които работите"
        action={
          <Button render={<Link href="/clients/new" />}>
            <Plus className="size-4" />
            Нов клиент
          </Button>
        }
      />

      <div className="grid gap-4 p-6">
        <div className="flex gap-2">
          {(Object.keys(VIEWS) as View[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={key === view ? "default" : "ghost"}
              render={
                <Link
                  href={key === "active" ? "/clients" : `/clients?view=${key}`}
                />
              }
            >
              {VIEWS[key]}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            {clients?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Име</TableHead>
                    <TableHead>Имейл</TableHead>
                    <TableHead>Цел</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-px" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {/* A deleted client's pages are closed until it comes
                            back, so its name is not a link. */}
                        {view === "trash" ? (
                          client.full_name
                        ) : (
                          <Link
                            href={`/clients/${client.id}`}
                            className="hover:underline"
                          >
                            {client.full_name}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.email ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.goal ? GOAL_LABELS[client.goal as Goal] : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.status === "active" ? "default" : "secondary"
                          }
                        >
                          {STATUS_LABELS[client.status as Client["status"]]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {view === "trash" ? (
                          <form action={restoreClient.bind(null, client.id)}>
                            <Button type="submit" size="sm" variant="outline">
                              <Undo2 className="size-4" />
                              Върни
                            </Button>
                          </form>
                        ) : (
                          <ClientRowActions
                            clientId={client.id}
                            fullName={client.full_name}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  {EMPTY_MESSAGE[view]}
                </p>
                {view === "active" ? (
                  <Button className="mt-4" render={<Link href="/clients/new" />}>
                    <Plus className="size-4" />
                    Добави клиент
                  </Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
