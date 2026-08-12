import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClientRecord } from "../actions";
import { ACTIVITY_LABELS, GOAL_LABELS, SEX_LABELS } from "@/lib/types";

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        title="Нов клиент"
        description="Попълнете основните данни — можете да ги допълните по-късно."
      />

      <div className="max-w-2xl p-6">
        <Card>
          <CardContent className="pt-6">
            <form action={createClientRecord} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Име и фамилия *</Label>
                <Input id="full_name" name="full_name" required />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Имейл</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="sex">Пол</Label>
                  <select
                    id="sex"
                    name="sex"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    defaultValue=""
                  >
                    <option value="">—</option>
                    {Object.entries(SEX_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="birth_date">Дата на раждане</Label>
                  <Input id="birth_date" name="birth_date" type="date" />
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
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="goal">Цел</Label>
                  <select
                    id="goal"
                    name="goal"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    defaultValue=""
                  >
                    <option value="">—</option>
                    {Object.entries(GOAL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="activity">Ниво на активност</Label>
                  <select
                    id="activity"
                    name="activity"
                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    defaultValue=""
                  >
                    <option value="">—</option>
                    {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Бележки</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Хранителни алергии, травми, предпочитания…"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">Запази клиента</Button>
                <Button variant="ghost" render={<Link href="/clients" />}>
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
