import type { Session } from "@supabase/supabase-js";
const key = "pixelogy-recovery-v1";
let fallback: { user: string; expires: number } | null = null;
// UI continuation only, not authorization. Supabase validates password updates.
export function rememberRecovery(session: Session) {
  fallback = { user: session.user.id, expires: Date.now() + 3600000 };
  try {
    sessionStorage.setItem(key, JSON.stringify(fallback));
  } catch {
    /* memory-only */
  }
}
export function clearRecovery() {
  fallback = null;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* unavailable storage */
  }
}
export function hasRecovery(session: Session | null) {
  let record = fallback;
  try {
    record = JSON.parse(sessionStorage.getItem(key) ?? "null") ?? record;
  } catch {
    /* memory-only */
  }
  return (
    !!session && record?.user === session.user.id && record.expires > Date.now()
  );
}
export const recoveryLanding =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
export const recoveryError =
  typeof window !== "undefined" &&
  [window.location.hash.slice(1), window.location.search].some((value) => {
    const p = new URLSearchParams(value);
    return p.has("error") || p.has("error_code") || p.has("error_description");
  });
