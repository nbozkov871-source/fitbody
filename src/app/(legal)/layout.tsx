import Link from "next/link";

/**
 * Plain wrapper for the policy pages. They sit outside the dashboard because a
 * visitor has to be able to read them before deciding to sign up, and Google's
 * consent screen links to them from outside the app entirely.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-black uppercase">
            FitBody
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Към сайта
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <article className="[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-xl [&_h2]:font-black [&_h2]:uppercase [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-medium [&_li]:mb-1.5 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </article>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-6 py-8 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Поверителност
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Условия за ползване
          </Link>
        </div>
      </footer>
    </div>
  );
}
