import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
export async function authorized(headers: IncomingHttpHeaders) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !process.env.SCAN_SIGNING_SECRET)
    throw new Error("CONFIG");
  const token = headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("AUTH");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new Error("AUTH");
  return { client, userId: data.user.id };
}
export function receipt(data: Record<string, unknown>) {
  const secret = process.env.SCAN_SIGNING_SECRET;
  if (!secret) throw new Error("CONFIG");
  const payload = JSON.stringify({
    ...data,
    expires: Math.floor(Date.now() / 1000) + 600,
  });
  return {
    payload,
    signature: createHmac("sha256", secret).update(payload).digest("hex"),
  };
}
