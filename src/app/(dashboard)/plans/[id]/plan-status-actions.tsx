"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setPlanStatus } from "@/app/(dashboard)/clients/[id]/plan/new/actions";

export function PlanStatusActions({
  planId,
  status,
}: {
  planId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  function update(next: string, message: string) {
    startTransition(async () => {
      try {
        await setPlanStatus(planId, next);
        toast.success(message);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Промяната не бе успешна.",
        );
      }
    });
  }

  if (status === "active") {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => update("archived", "Планът е архивиран.")}
      >
        Архивирай
      </Button>
    );
  }

  return (
    <Button
      disabled={pending}
      onClick={() => update("active", "Планът е активиран.")}
    >
      Активирай плана
    </Button>
  );
}
