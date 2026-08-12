import Link from "next/link";
import { Dumbbell, Users, Sparkles, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Клиентите на едно място",
    body: "Профили, цели, история на измерванията и бележки — без разпилени таблици и чатове.",
  },
  {
    icon: Sparkles,
    title: "Хранителни планове с AI",
    body: "Попълвате данните на клиента, а планът се генерира по вашите формули и подход.",
  },
  {
    icon: LineChart,
    title: "Видим прогрес",
    body: "Проследявайте тегло, обиколки и телесни мазнини във времето и доказвайте резултата.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between p-6">
        <span className="inline-flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="size-4" />
          </span>
          FitBody
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Вход
          </Button>
          <Button render={<Link href="/register" />}>Започни безплатно</Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <p className="mb-4 text-sm font-medium text-primary">
            CRM за фитнес треньори
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Управлявайте клиентите си и създавайте хранителни планове за минути
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-pretty">
            FitBody събира профилите, целите и прогреса на вашите клиенти на
            едно място — и генерира персонализирани хранителни планове с помощта
            на изкуствен интелект.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" render={<Link href="/register" />}>
              Създай акаунт
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />}>
              Вече имам акаунт
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardContent className="pt-6">
                <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h2 className="font-medium">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t p-6 text-center text-sm text-muted-foreground">
        FitBody — CRM и хранителни планове за фитнес треньори
      </footer>
    </div>
  );
}
