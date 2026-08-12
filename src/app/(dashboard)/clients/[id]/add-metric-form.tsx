"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMetric } from "../actions";

const fields = [
  { name: "weight_kg", label: "Тегло (кг)", step: "0.1" },
  { name: "body_fat_pct", label: "Телесни мазнини (%)", step: "0.1" },
  { name: "waist_cm", label: "Талия (см)", step: "0.5" },
  { name: "chest_cm", label: "Гърди (см)", step: "0.5" },
  { name: "hips_cm", label: "Ханш (см)", step: "0.5" },
];

export function AddMetricForm({ clientId }: { clientId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await addMetric(clientId, formData);
        formRef.current?.reset();
        toast.success("Измерването е записано.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Записът не бе успешен.",
        );
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="measured_at">Дата</Label>
        <Input
          id="measured_at"
          name="measured_at"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>

      {fields.map(({ name, label, step }) => (
        <div key={name} className="grid gap-2">
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} type="number" step={step} min="0" />
        </div>
      ))}

      <Button type="submit" disabled={pending}>
        {pending ? "Записване…" : "Запази"}
      </Button>
    </form>
  );
}
