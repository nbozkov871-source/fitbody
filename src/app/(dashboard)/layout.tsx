import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name ?? user.email ?? "Треньор";

  // Built once and handed to both the desktop rail and the mobile drawer, so
  // the two can never disagree about what is in the menu.
  const sidebar = (
    <>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 px-3 font-semibold"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Dumbbell className="size-4" />
        </span>
        FitBody
      </Link>

      <DashboardNav />

      <div className="mt-auto border-t pt-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="size-8">
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            <LogOut className="size-4" />
            Изход
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Only surface on narrow screens; the rail already covers the rest. */}
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur md:hidden">
          <MobileNav>{sidebar}</MobileNav>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 font-semibold"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="size-3.5" />
            </span>
            FitBody
          </Link>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
