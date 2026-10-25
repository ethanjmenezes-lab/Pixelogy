// Only allowlisted diagnostics cross the API/log boundary. Never log photos,
// authorization headers, raw provider errors, or database error details.
export class ScanError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function quotaError(
  error: { code?: string; message: string },
  guest = true,
) {
  if (error.message.includes("Wait 30 seconds"))
    return new ScanError(
      "SCAN_RETRY_TOO_SOON",
      429,
      "This photo is already being identified. Wait 30 seconds before retrying.",
    );
  if (error.message.includes("This photo was already collected"))
    return new ScanError(
      "SCAN_ALREADY_COLLECTED",
      409,
      "This photo was already collected. Take a new photo to identify another item.",
    );
  if (
    error.message.includes("allowance") ||
    error.message.includes("Scan limit reached")
  )
    return new ScanError(
      "SCAN_QUOTA_REACHED",
      429,
      guest
        ? "Today's scan allowance has been reached. Please try again tomorrow."
        : "Your hourly scan allowance has been reached. Please retry later.",
    );
  if (error.code === "PGRST202" || error.code === "42883")
    return new ScanError(
      guest ? "GUEST_QUOTA_NOT_DEPLOYED" : "ACCOUNT_SCAN_NOT_DEPLOYED",
      503,
      guest
        ? "Guest scanning is temporarily unavailable because its server setup is incomplete. No photo was sent for analysis. Please try again after the service is updated; signing in is not required."
        : "Account scanning is temporarily unavailable because its server setup is incomplete. Please try again after the service is updated.",
    );
  if (error.message.includes("Invalid quota ticket"))
    return new ScanError(
      "SCAN_SIGNING_MISMATCH",
      503,
      "The scan service could not verify its request. Please try again after the service configuration is corrected.",
    );
  return new ScanError(
    "SCAN_STORAGE_UNAVAILABLE",
    503,
    "The scan allowance service could not be reached. Please retry shortly. Your saved collection is unchanged.",
  );
}
export function providerError(error: unknown) {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 0;
  if (status === 429)
    return new ScanError(
      "GEMINI_QUOTA_REACHED",
      429,
      "Photo identification is at its service limit. Please retry later; no collectible was awarded.",
    );
  if (status === 401 || status === 403)
    return new ScanError(
      "GEMINI_ACCESS_DENIED",
      503,
      "The photo identification service rejected its server credentials. Please try again after the service configuration is corrected.",
    );
  if (status === 404)
    return new ScanError(
      "GEMINI_MODEL_UNAVAILABLE",
      503,
      "The configured identification model is unavailable. Please try again after the service is updated.",
    );
  if (
    status === 504 ||
    (error instanceof Error && /timeout|timed out|abort/i.test(error.message))
  )
    return new ScanError(
      "GEMINI_TIMEOUT",
      504,
      "Photo identification took too long. Retry this photo or retake it in good light.",
    );
  return new ScanError(
    "GEMINI_UNAVAILABLE",
    502,
    "Photo identification could not complete. Retry this photo or retake it. No collectible was awarded.",
  );
}
