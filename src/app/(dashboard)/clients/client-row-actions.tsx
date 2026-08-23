"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { softDeleteClient } from "./actions";

// Rows in a table sit close together, so deleting from one is a click away from
// deleting the name above it. The menu keeps the destructive item behind a
// second click, and the dialog behind a third.
export function ClientRowActions({
  clientId,
  fullName,
}: {
  clientId: string;
  fullName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={`Действия за ${fullName}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/clients/${clientId}/edit`} />}>
            <Pencil className="size-4" />
            Редактирай
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-4" />
            Изтрий
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirming} onOpenChange={setConfirming}>
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
                    // The action redirects on success, and that surfaces here
                    // as a thrown error too — only a real failure is shown.
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
    </>
  );
}
