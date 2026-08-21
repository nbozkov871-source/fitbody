"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteSession } from "./actions";

export function DeleteSession({
  clientId,
  sessionId,
  measuredAt,
}: {
  clientId: string;
  sessionId: string;
  measuredAt: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Trash2 className="size-4" />
            Изтрий
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Да изтрия ли измерването?</DialogTitle>
          <DialogDescription>
            Измерването от {measuredAt} и всички негови стойности се премахват.
            Това не може да се върне.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Отказ</Button>} />
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await deleteSession(clientId, sessionId);
                } catch (error) {
                  // A redirect inside the action also lands here, so only a real
                  // failure should surface as one.
                  if (error instanceof Error && !error.message.includes("NEXT_REDIRECT")) {
                    toast.error(error.message);
                    return;
                  }
                }
                toast.success("Измерването е изтрито.");
              })
            }
          >
            {pending ? "Изтриване…" : "Изтрий"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
