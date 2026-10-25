import { createClient } from "@supabase/supabase-js";
import { createHmac, createHash } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { receipt } from "./cloud.js";
export async function reserveGuestScan(
  headers: IncomingHttpHeaders,
  image: string,
) {
  const secret = process.env.SCAN_SIGNING_SECRET,
    url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    key =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!secret || !url || !key) throw new Error("CONFIG");
  // Vercel overwrites this header. Never trust a caller-supplied generic forwarded-for.
  const ip = process.env.VERCEL
    ? headers["x-vercel-forwarded-for"]
    : "local-development";
  if (typeof ip !== "string" || !ip) throw new Error("CONFIG");
  const bucket = createHmac("sha256", secret)
    .update(
      new Date().toISOString().slice(0, 10) + ":" + ip.split(",")[0].trim(),
    )
    .digest("hex");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc(
    "reserve_guest_scan",
    receipt({
      purpose: "guest-quota",
      bucket,
      imageHash: createHash("sha256").update(image).digest("hex"),
    }),
  );
  if (error)
    throw new Error(error.message.includes("allowance") ? "QUOTA" : "CONFIG");
  return { userId: "guest", scanId: data as string };
}
