"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { purgeClient } from "./actions";

/**
 * Deleting to the bin is one click because it can be undone. This one cannot,
 * and it takes every measurement and plan with it — so it asks for the name to
 * be typed out. Whoever is about to lose a year of someone's history should
 * have to read whose history it is.
 */
export function PurgeClient({
  clientId,
  fullName,
  history,
}: {
  clientId: string;
  fullName: string;
  history: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const matches = typed.trim() === fullName.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant="ghost" className="text-destructive">
            <Trash2 className="size-4" />
            Изтрий завинаги
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Да изтрия ли {fullName} завинаги?</DialogTitle>
          <DialogDescription>
            {history} Това не може да се върне — нито от кошчето, нито
            отникъде другаде.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor={`confirm-${clientId}`}>
            Напишете „{fullName}“, за да потвърдите
          </Label>
          <Input
            id={`confirm-${clientId}`}
            value={typed}
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Отказ</Button>} />
          <Button
            variant="destructive"
            disabled={!matches || pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await purgeClient(clientId);
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Изтриването не мина.",
                  );
                  return;
                }
                setOpen(false);
                toast.success(`${fullName} е изтрит окончателно.`);
              })
            }
          >
            {pending ? "Изтриване…" : "Изтрий завинаги"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
