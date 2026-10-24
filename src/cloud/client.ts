import { createClient, type Session } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloudConfigurationError =
  !url || !key
    ? "The deployment is missing its public Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy."
    : "The deployment has invalid Supabase configuration. Check the project URL and publishable key.";
export const authCallbackError =
  typeof window === "undefined"
    ? ""
    : (new URLSearchParams(window.location.hash.slice(1)).get(
        "error_description",
      ) ??
      new URLSearchParams(window.location.search).get("error_description") ??
      "");
function initializeCloud() {
  try {
    if (!url || !key || new URL(url).protocol !== "https:") return null;
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    return null;
  }
}
export const cloud = initializeCloud();
export async function cloudSession(): Promise<Session | null> {
  if (!cloud) return null;
  const { data, error } = await cloud.auth.getSession();
  if (error) throw error;
  return data.session;
}
export async function rpc<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!cloud || !(await cloudSession()))
    throw new Error("Sign in to save discoveries across devices.");
  const { data, error } = await cloud.rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}
export async function authHeaders() {
  const session = await cloudSession();
  if (!session) throw new Error("Sign in before scanning.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}
