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
import { softDeleteClient } from "../actions";

export function DeleteClient({
  clientId,
  fullName,
}: {
  clientId: string;
  fullName: string;
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
          <DialogTitle>Да изтрия ли {fullName}?</DialogTitle>
          <DialogDescription>
            Клиентът излиза от списъка заедно с измерванията и плановете си, но
            отива в кошчето. Оттам можете да го върнете, ако сте сбъркали.
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
                  await softDeleteClient(clientId);
                } catch (error) {
                  // The action redirects on success, and that surfaces here as
                  // a thrown error too — only a real failure should be shown.
                  if (
                    error instanceof Error &&
                    !error.message.includes("NEXT_REDIRECT")
                  ) {
                    toast.error(error.message);
                    return;
                  }
                }
                toast.success(`${fullName} е в кошчето.`);
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
