"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(authErrorMessage(error));
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  // Supabase answers the same whether or not the address has an account, and so
  // does this screen. Saying "no such account" would let anyone test which
  // addresses are registered here.
  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Проверете пощата си</CardTitle>
          <CardDescription>
            Ако има акаунт с {email}, изпратихме писмо с връзка за нова парола.
            Връзката е валидна за кратко.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Не пристига ли? Проверете папката със спам. Ако сте се
            регистрирали с Google, парола няма — влезте с бутона за Google.
          </p>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button variant="outline" className="w-full" render={<Link href="/login" />}>
            Обратно към вход
          </Button>
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setSent(false)}
          >
            Друг имейл
          </button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Забравена парола</CardTitle>
        <CardDescription>
          Въведете имейла си и ще ви изпратим връзка за нова парола.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Имейл</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@example.com"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Изпращане…" : "Изпрати връзка"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Сетихте се?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Вход
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
