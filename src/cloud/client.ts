import { createClient, type Session } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloud =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
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
