import type { AuthError } from "@supabase/supabase-js";

// Supabase answers in English. The rest of the app speaks Bulgarian, and an
// error is only useful if it says what went wrong and what to do next, so the
// known ones are rewritten here instead of being passed through raw.
const BY_CODE: Record<string, string> = {
  invalid_credentials: "Грешен имейл или парола.",
  email_not_confirmed:
    "Имейлът още не е потвърден. Проверете пощата си за писмото от FitBody.",
  over_email_send_rate_limit:
    "Изпратени са твърде много имейли за кратко време. Изчакайте около час и опитайте пак.",
  over_request_rate_limit:
    "Твърде много опити за кратко време. Изчакайте малко и опитайте пак.",
  user_already_exists: "Вече има акаунт с този имейл. Влезте вместо това.",
  email_exists: "Вече има акаунт с този имейл. Влезте вместо това.",
  weak_password: "Паролата е твърде проста. Използвайте поне 8 знака.",
  signup_disabled: "Регистрациите са спрени в момента.",
  validation_failed: "Проверете дали имейлът е изписан правилно.",
};

// Older releases send the text without a code, so match on the message too.
const BY_TEXT: [RegExp, string][] = [
  [/invalid login credentials/i, "Грешен имейл или парола."],
  [
    /email not confirmed/i,
    "Имейлът още не е потвърден. Проверете пощата си за писмото от FitBody.",
  ],
  [
    /email rate limit exceeded|rate limit/i,
    "Изпратени са твърде много имейли за кратко време. Изчакайте около час и опитайте пак.",
  ],
  [/already registered|already exists/i, "Вече има акаунт с този имейл. Влезте вместо това."],
  [/password should be at least/i, "Паролата е твърде къса. Използвайте поне 8 знака."],
  [/unable to validate email|invalid format|is invalid/i, "Проверете дали имейлът е изписан правилно."],
  [/failed to fetch|network/i, "Няма връзка със сървъра. Проверете интернет връзката си."],
];

export function authErrorMessage(error: AuthError | null): string | null {
  if (!error) return null;

  const code = error.code;
  if (code && BY_CODE[code]) return BY_CODE[code];

  for (const [pattern, text] of BY_TEXT) {
    if (pattern.test(error.message)) return text;
  }

  // Nothing matched: show the original rather than swallow it, so an unmapped
  // failure stays diagnosable instead of turning into a shrug.
  return error.message;
}
