# Release audit — 2026-10-24

## Prioritized findings (initial inspection)

- P0 broken: signup confirmation uses preview origin; signup/reset requests lack persistent email cooldown. Recovery callback exists and must remain independent of gameplay loading.
- P0 infrastructure blocker: live auth logs contain over_email_send_rate_limit for signup and recovery. Dashboard says custom SMTP is not configured. Default email service is not production delivery. No test inbox supplied yet.
- P1 broken: camera toBlob callback has no synchronous capture lock or stale/unmount guard. Consent-read failure has no visible recovery. Online account loading depends on optional offline-cache writes succeeding.
- P2 incomplete: legacy local collectibles cannot be trusted as signed cloud rewards; preserve them and document revalidation path. Cross-device live acceptance needs a dedicated account.
- P3 audit existing combat phases, eligibility, rewards and RLS instead of rebuilding them.
- P4 opening/mobile fixes already implemented; retain exact user text and test.
- P5 incomplete: public leaderboard remains unavailable; 152 catalog sprites remain marked draft, 48 finished, 8 Legendary. Do not label draft art complete.
- P6 release verification: production HTTPS/routes/headers, SDK tests, live rollback SQL, full browser regressions; distinguish fixture and real-service evidence.

No player data deletion or schema migration is planned for these reliability fixes. Focus on the critical auth/scanning journey before feature expansion while SMTP/device acceptance remains blocked.

## Phase 1 verification

Fixed stable signup callbacks and persistent shared signup/reset/resend cooldown. Typecheck, lint, 84 unit tests and 20 Chromium/WebKit auth tests passed. Added six exact production callback URLs in the live dashboard (20 total); custom SMTP remains disabled. Recovery code and security settings retained. See SMTP_SETUP.md for actual infrastructure evidence and required owner setup. Auth tests use the real SDK with intercepted responses.
