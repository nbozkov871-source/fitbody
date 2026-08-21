"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * The drawer that carries the sidebar on narrow screens. It renders the same
 * children the desktop rail does, so there is one list of links rather than two
 * that drift apart.
 */
export function MobileNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Remembering which page the drawer was opened on makes "still open" a
  // derived fact: tapping a link changes the path, and the drawer is closed by
  // definition. Syncing that with an effect would run a render behind.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => setOpenedAt(next ? pathname : null)}
    >
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Отвори менюто">
            <Menu className="size-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-72 bg-sidebar p-4">
        <SheetTitle className="sr-only">Навигация</SheetTitle>
        <SheetDescription className="sr-only">
          Връзки към разделите на приложението и изход от акаунта.
        </SheetDescription>
        {/* Tapping the link for the page you are already on leaves the path
            unchanged, so closing on navigation alone would strand the drawer
            open. Any link inside closes it. */}
        <div
          className="contents"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) {
              setOpenedAt(null);
            }
          }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
