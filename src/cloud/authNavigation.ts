const destinations = new Set([
  "/",
  "/scan",
  "/collection",
  "/workshop",
  "/battle/practice",
  "/profile",
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
