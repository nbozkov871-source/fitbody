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
import { PurgeClient } from "./purge-client";

// Archived clients are the ones a trainer has finished with, and the bin holds
// the ones they deleted. Neither belongs in the list they open every morning,
// but both have to stay reachable — hence three views over one table.
const VIEWS = {
  active: "Активни",
  archived: "Архивирани",
  trash: "Кошче",
} as const;

type View = keyof typeof VIEWS;

const LIST_COLUMNS = "id, full_name, email, goal, status, created_at";

// The bin is the only view offering a permanent delete, so it is the only one
// that has to say what the cascade would take with it.
const TRASH_COLUMNS =
  "id, full_name, email, goal, status, created_at, client_metrics(count), measurement_sessions(count), nutrition_plans(count)";

type ClientRow = {
  id: string;
  full_name: string;
  email: string | null;
  goal: Goal | null;
  status: Client["status"];
  client_metrics?: { count: number }[];
  measurement_sessions?: { count: number }[];
  nutrition_plans?: { count: number }[];
};

const EMPTY_MESSAGE: Record<View, string> = {
  active: "Още нямате добавени клиенти.",
  archived: "Няма архивирани клиенти.",
  trash: "Кошчето е празно.",
};


// A PostgREST embed of `(count)` comes back as a one-row array, and as nothing
// at all on the views that do not ask for it.
function embeddedCount(relation?: { count: number }[]) {
  return Number(relation?.[0]?.count ?? 0);
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

// Bulgarian lists the last item with "и" rather than a comma.
function describeHistory(client: ClientRow) {
  const counted: [number, string, string][] = [
    [embeddedCount(client.client_metrics), "измерване", "измервания"],
    [
      embeddedCount(client.measurement_sessions),
      "сесия с калипер",
      "сесии с калипер",
    ],
    [embeddedCount(client.nutrition_plans), "план", "плана"],
  ];

  const parts = counted
    .filter(([count]) => count > 0)
    .map(([count, one, many]) => plural(count, one, many));

  if (parts.length === 0) {
    return "Клиентът няма записани измервания или планове.";
  }

  const listed =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} и ${parts[parts.length - 1]}`;

  return `С него се изтриват ${listed}.`;
}

export default async function ClientsPage({
  searchParams,
}: PageProps<"/clients">) {
  const { view: requested } = await searchParams;
  const view: View =
    typeof requested === "string" && requested in VIEWS
      ? (requested as View)
      : "active";

  const supabase = await createClient();

  // The two selects are kept apart rather than assembled: supabase-js reads the
  // select string at the type level, and only a literal one types the rows.
  let clients: ClientRow[] | null;
  if (view === "trash") {
    ({ data: clients } = await supabase
      .from("clients")
      .select(TRASH_COLUMNS)
      .not("deleted_at", "is", null)
      .order("created_at", { ascending: false })
      .returns<ClientRow[]>());
  } else {
    const listed = supabase
      .from("clients")
      .select(LIST_COLUMNS)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    ({ data: clients } = await (view === "archived"
      ? listed.eq("status", "archived")
      : listed.neq("status", "archived")
    ).returns<ClientRow[]>());
  }

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
                        {client.goal ? GOAL_LABELS[client.goal] : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.status === "active" ? "default" : "secondary"
                          }
                        >
                          {STATUS_LABELS[client.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {view === "trash" ? (
                          <div className="flex justify-end gap-2">
                            <form action={restoreClient.bind(null, client.id)}>
                              <Button type="submit" size="sm" variant="outline">
                                <Undo2 className="size-4" />
                                Върни
                              </Button>
                            </form>
                            <PurgeClient
                              clientId={client.id}
                              fullName={client.full_name}
                              history={describeHistory(client)}
                            />
                          </div>
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
