import Link from "next/link";
import { Plus } from "lucide-react";
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

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, full_name, email, goal, status, created_at")
    .order("created_at", { ascending: false });

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

      <div className="p-6">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/clients/${client.id}`}
                          className="hover:underline"
                        >
                          {client.full_name}
                        </Link>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-muted-foreground">
                  Още нямате добавени клиенти.
                </p>
                <Button className="mt-4" render={<Link href="/clients/new" />}>
                  <Plus className="size-4" />
                  Добави клиент
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
