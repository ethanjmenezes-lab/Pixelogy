const destinations = new Set([
  "/",
  "/scan",
  "/collection",
  "/workshop",
  "/battle/practice",
  "/profile",
  "/story",
  "/leaderboard",
]);
export function authDestination(value: string | null | undefined) {
  return value && destinations.has(value) ? value : "/scan";
}
export function authLink(mode: "login" | "signup" | "reset", next: string) {
  return `/auth/${mode}?next=${encodeURIComponent(authDestination(next))}`;
}
export function confirmationUrl(origin: string, next: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(authDestination(next))}`;
}

export const productionOrigin = "https://pixelogy-three.vercel.app";
export function recoveryUrl(origin: string) {
  const url = new URL(origin);
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  return (local ? url.origin : productionOrigin) + "/auth/confirm";
}
