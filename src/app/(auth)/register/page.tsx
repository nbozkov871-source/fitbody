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

// A fresh account has an empty dashboard, so the first useful screen is the one
// that puts a client in it.
const FIRST_STEP = "/clients/new";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "trainer" },
        // Send confirmed accounts to the same first step as the direct path.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${FIRST_STEP}`,
      },
    });

    if (error) {
      setError(authErrorMessage(error));
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNotice("Проверете имейла си, за да потвърдите регистрацията.");
      setLoading(false);
      return;
    }

    router.push(FIRST_STEP);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Създаване на акаунт</CardTitle>
        <CardDescription>
          Три полета, и сте готови да добавите първия си клиент.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Име и фамилия</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иван Иванов"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Имейл</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trainer@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Парола</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Минимум 8 символа.</p>
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {notice && <p className="text-sm text-primary">{notice}</p>}
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Създаване…" : "Създайте акаунт"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Вече имате акаунт?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Вход
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
