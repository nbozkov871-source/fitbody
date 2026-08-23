"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const MIN_LENGTH = 8;

/**
 * Reached through the link in the recovery mail. By the time this renders the
 * callback has already exchanged the code for a session, so setting the password
 * is an ordinary update — anyone arriving without that session is sent to the
 * login screen by the route guard before they get here.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== password;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password !== confirmation) {
      setError("Двете полета не съвпадат.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(authErrorMessage(error));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Нова парола</CardTitle>
        <CardDescription>
          Изберете парола и ще влезете веднага.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Нова парола</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              autoFocus
              minLength={MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Минимум {MIN_LENGTH} символа.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmation">Повторете паролата</Label>
            <Input
              id="confirmation"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              aria-invalid={mismatch || undefined}
            />
            {mismatch && (
              <p className="text-xs text-destructive">
                Двете полета не съвпадат.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={loading || tooShort || mismatch || !password}
          >
            {loading ? "Запазване…" : "Запази паролата"}
          </Button>
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Обратно към вход
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
