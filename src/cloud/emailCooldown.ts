// UI protection only; Supabase remains the authority on per-user/project limits.
const key = "pixelogy-auth-email-next-at";
let memory = 0;
export function emailWait(now = Date.now()) {
  let stored = 0;
  try {
    stored = Number(localStorage.getItem(key)) || 0;
  } catch {
    /* private storage */
  }
  return Math.max(0, Math.ceil((Math.max(memory, stored) - now) / 1000));
}
export function beginEmailWait(now = Date.now()) {
  memory = now + 60_000;
  try {
    localStorage.setItem(key, String(memory));
  } catch {
    /* in-memory fallback */
  }
}
export function authErrorMessage(error: unknown) {
  const e = error as { code?: string; status?: number; message?: string };
  if (
    e?.status === 429 ||
    /rate.limit|over_email_send_rate_limit/i.test(`${e?.code} ${e?.message}`)
  )
    return "Too many email requests. Please wait before trying again. If this continues, Pixelogy’s email service has reached its sending limit; repeated requests will not help. You can still log in with an existing confirmed account.";
  return (
    e?.message || "Authentication is temporarily unavailable. Please retry."
  );
}
