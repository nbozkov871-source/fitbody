// Reading env vars through here turns a missing or half-filled .env.local into a
// readable error instead of a cryptic "Invalid URL" deep inside the Supabase client.

const SETUP_HINT =
  "Създайте проект в supabase.com, отворете Settings → API Keys и попълнете .env.local. Виж README.md.";

// A byte order mark or stray whitespace survives a copy-paste and a shell pipe
// unseen, then lands in the Authorization header, where the browser rejects the
// whole request: "String contains non ISO-8859-1 code point". Strip it here so a
// value that merely looks right also behaves right.
function clean(value: string) {
  return value.replace(/^\uFEFF/, "").trim();
}

function isPlaceholder(value: string) {
  return value.includes("placeholder") || value.includes("your-");
}

function read(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Липсва ${name} в .env.local. ${SETUP_HINT}`);
  }

  const cleaned = clean(value);

  if (!cleaned) {
    throw new Error(`${name} е празна след почистване. ${SETUP_HINT}`);
  }
  if (isPlaceholder(cleaned)) {
    throw new Error(`${name} още съдържа примерна стойност. ${SETUP_HINT}`);
  }

  return cleaned;
}

// Supabase is retiring the legacy `anon` key in favour of `sb_publishable_…`.
// New projects get the latter; keep reading the old name so existing setups work.
export function supabaseEnv() {
  return {
    url: read("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: read(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  };
}
