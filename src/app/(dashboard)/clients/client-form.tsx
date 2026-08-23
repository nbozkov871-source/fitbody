import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormSelect } from "@/components/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ACTIVITY_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
  STATUS_LABELS,
} from "@/lib/types";
import type { Client } from "@/lib/types";

type Props = {
  title: string;
  description: string;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  cancelHref: string;
  client?: Client;
};

// Creating and editing show the same fields, so they share one form. Splitting
// them into two copies is how the edit screen quietly falls behind whenever a
// field is added.
export function ClientForm({
  title,
  description,
  action,
  submitLabel,
  cancelHref,
  client,
}: Props) {
  return (
    <>
      <PageHeader title={title} description={description} />

      <div className="max-w-2xl p-6">
        <Card>
          <CardContent className="pt-6">
            <form action={action} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Име и фамилия *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  defaultValue={client?.full_name ?? ""}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Имейл</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={client?.email ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={client?.phone ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="sex">Пол</Label>
                  <FormSelect
                    id="sex"
                    name="sex"
                    options={SEX_LABELS}
                    defaultValue={client?.sex ?? undefined}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="birth_date">Дата на раждане</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    defaultValue={client?.birth_date ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="height_cm">Височина (см)</Label>
                  <Input
                    id="height_cm"
                    name="height_cm"
                    type="number"
                    step="0.5"
                    min="100"
                    max="250"
                    defaultValue={client?.height_cm ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="goal">Цел</Label>
                  <FormSelect
                    id="goal"
                    name="goal"
                    options={GOAL_LABELS}
                    defaultValue={client?.goal ?? undefined}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="activity">Ниво на активност</Label>
                  <FormSelect
                    id="activity"
                    name="activity"
                    options={ACTIVITY_LABELS}
                    defaultValue={client?.activity ?? undefined}
                  />
                </div>
              </div>

              {/* A client is active the moment they are created, so the field
                  only earns its place once there is something to change. */}
              {client ? (
                <div className="grid gap-2 sm:max-w-xs">
                  <Label htmlFor="status">Статус</Label>
                  <FormSelect
                    id="status"
                    name="status"
                    options={STATUS_LABELS}
                    defaultValue={client.status}
                  />
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="notes">Бележки</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Хранителни алергии, травми, предпочитания…"
                  defaultValue={client?.notes ?? ""}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">{submitLabel}</Button>
                <Button variant="ghost" render={<Link href={cancelHref} />}>
                  Отказ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
