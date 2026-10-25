import { createClient } from "@supabase/supabase-js";
import { createHmac, createHash } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { ScanError, quotaError } from "./scanErrors.js";
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
  if (!secret || !url || !key)
    throw new ScanError(
      "SCAN_SERVER_ENV_MISSING",
      503,
      "Guest scanning is missing server configuration. Please try again after the service is updated; signing in is not required.",
    );
  // Vercel overwrites this header. Never trust a caller-supplied generic forwarded-for.
  const ip = process.env.VERCEL
    ? headers["x-vercel-forwarded-for"]
    : "local-development";
  if (typeof ip !== "string" || !ip)
    throw new ScanError(
      "SCAN_CLIENT_IP_MISSING",
      503,
      "The scan service could not establish its request limit. Please retry shortly.",
    );
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
  if (error) throw quotaError(error);
  if (typeof data !== "string" || !/^[0-9a-f-]{36}$/i.test(data))
    throw new ScanError(
      "SCAN_QUOTA_INVALID_RESPONSE",
      503,
      "The scan service returned an invalid reservation. Please retry shortly.",
    );
  return { userId: "guest", scanId: data as string };
}
