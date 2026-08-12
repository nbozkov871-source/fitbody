// Reading env vars through here turns a missing or half-filled .env.local into a
// readable error instead of a cryptic "Invalid URL" deep inside the Supabase client.

const SETUP_HINT =
  "Създайте проект в supabase.com, отворете Settings → API Keys и попълнете .env.local. Виж README.md.";

function isPlaceholder(value: string) {
  return value.includes("placeholder") || value.includes("your-");
}

function readUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    throw new Error(`Липсва NEXT_PUBLIC_SUPABASE_URL в .env.local. ${SETUP_HINT}`);
  }
  if (isPlaceholder(value)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL още съдържа примерна стойност. ${SETUP_HINT}`,
    );
  }

  return value;
}

// Supabase is retiring the legacy `anon` key in favour of `sb_publishable_…`.
// New projects get the latter; keep reading the old name so existing setups work.
function readKey() {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw new Error(
      `Липсва NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY в .env.local. ${SETUP_HINT}`,
    );
  }
  if (isPlaceholder(value)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY още съдържа примерна стойност. ${SETUP_HINT}`,
    );
  }

  return value;
}

export function supabaseEnv() {
  return { url: readUrl(), anonKey: readKey() };
}
