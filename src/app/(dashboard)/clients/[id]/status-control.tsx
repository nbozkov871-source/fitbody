"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormSelect } from "@/components/form-select";
import { STATUS_LABELS, type ClientStatus } from "@/lib/types";
import { setClientStatus } from "../actions";

// Pausing a client is a one-word decision, so it does not deserve a trip
// through the whole edit form. The same field also sits in that form for
// whoever is already there correcting other details.
export function StatusControl({
  clientId,
  status,
}: {
  clientId: string;
  status: ClientStatus;
}) {
  const [value, setValue] = useState<ClientStatus>(status);
  const [pending, startTransition] = useTransition();

  return (
    <div className="w-44" aria-busy={pending}>
      <FormSelect
        id="client-status"
        name="status"
        options={STATUS_LABELS}
        defaultValue={value}
        onValueChange={(next) => {
          const previous = value;
          setValue(next as ClientStatus);
          startTransition(async () => {
            try {
              await setClientStatus(clientId, next as ClientStatus);
            } catch (error) {
              // Put the field back where it was, so what it shows keeps
              // matching what the database actually holds.
              setValue(previous);
              toast.error(
                error instanceof Error ? error.message : "Статусът не се запази.",
              );
              return;
            }
            toast.success(`Статус: ${STATUS_LABELS[next as ClientStatus]}`);
          });
        }}
      />
    </div>
  );
}
