import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="size-4" />
          </span>
          FitBody
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-6 pt-0">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
