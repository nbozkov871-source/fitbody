import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// `next` arrives in the URL and feeds a redirect, so resolve it against this
// origin and keep it only if it stays here. Letting the URL parser decide beats
// hand-checking prefixes, which misses the ways a separator can be written.
function safeNext(value: string | null, origin: string) {
  if (!value) return "/dashboard";

  try {
    const target = new URL(value, origin);
    if (target.origin !== origin) return "/dashboard";
    return `${target.pathname}${target.search}`;
  } catch {
    return "/dashboard";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), origin);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
