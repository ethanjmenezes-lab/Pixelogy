# Authenticated scanning — 2026-10-25

Current policy: new scans and discoveries require an existing Supabase account. GPS, CPU/Story battles, Workshop, ShoreDex viewing and permitted guest XP remain available without login. This supersedes guest scanning and the recommendation to apply its anonymous quota migration.

## Changes

- `/scan` waits for session hydration, then redirects guests to `/auth/login?next=%2Fscan`. Existing login/signup/recovery callbacks preserve the destination. An authenticated session mounts the existing immediate camera coordinator; account changes unmount it and abort/ignore pending capture/analysis.
- `/api/analyze` rejects missing bearer tokens and verifies supplied tokens through Supabase `auth.getUser`. No anonymous Gemini path or `reserve_guest_scan` call remains. Existing per-user `begin_scan` enforces 20 attempts/hour, a 30-second same-photo retry delay and rejection of previously collected photos. Client capture/analysis/save locks remain.
- Validated Gemini output uses the existing 200-item catalog matcher and an account-bound signed receipt. Review saves through `award_discovery`, refreshes cloud inventory and shows the existing discovery animation. No guest save fallback is used for new scans.
- Failed guest backup no longer prevents loading cloud inventory. Existing local data stays intact; Profile offers Retry guest backup. Transfers retain their stable IDs/hash verification and require the separately reviewed import migration; unsigned old local progress is not represented as server-verified gameplay.
- Added explicit same-photo retry messaging. Provider/configuration/timeout/safety errors remain fail-closed. Secrets remain server-side.

## Live checks and configuration

Vercel Production has `GEMINI_API_KEY`, `SCAN_SIGNING_SECRET`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Values were not exposed. The server supports `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY` overrides but does not require duplicate variables. Browser API requests stay same-origin; `VITE_API_BASE_URL` is unnecessary for the PWA. The existing default model is `gemini-3.8-flash`.

Live Supabase inspection confirmed `begin_scan` and `award_discovery` exist, are executable by authenticated users, and are not executable by anon. Discovery and inventory RLS are enabled. The live `authenticated_scan.sql` rollback test passed: a valid signed water-bottle receipt awards one discovery/inventory unit, replay is idempotent, account switching preserves ownership, another account cannot read/award it, and anon cannot scan/award. No real user/account/email or reward remains after rollback. This tests persistence using an in-database signature; it does not prove that Vercel's signing secret matches or that Google accepts the production key.

No new migration is required for ordinary authenticated scanning. Do not apply the anonymous quota migration to fix this flow. Existing guest backup still needs the previously prepared `20261025130100_cleanup_states.sql` and `20261025130200_guest_import.sql` reviewed/applied; prior automatic approval review blocked live schema/privileged-function changes. Neither is needed for a new account scan. Until approved, old saves remain local and backup errors do not block account scanning. No migration was applied during this change.

## Tests and limits

118 unit/integration tests pass, including the sample bottle through verified-auth adapter, real catalog matcher and signer; mocked external calls are explicit. TypeScript frontend/NodeNext, ESLint, nine plain-Node API checks and production build pass. All five local PostgreSQL rollback fixtures pass.

Browser run: 59 of 62 passed initially; two new bottle assertions used the wrong catalog capitalization and one WebKit viewport test had competing same-URL navigation. Corrected capitalization and navigate once before resizing. The complete auth/bottle rerun passed 22/22 in Chromium/WebKit; the other 40 scanner/guest tests passed in the initial run. This is passing coverage for all 62 cases, not a claim of a second full run. The bottle test exercises login → camera → identification → award → refresh → logout/login persistence, and verifies old guest data survives a missing import RPC. Guest CPU, Story and walking progression pass.

Real production Gemini identification with a signed-in person's photo, physical camera behavior, email delivery and cross-device login still need device/account acceptance. Key presence is not evidence of valid provider credentials or billing. Existing bundle-size warnings and non-failing Vite teardown messages remain.

## Files

`api/analyze.ts`, `server/scanErrors.ts`, `src/pages/Scan.tsx`, `src/cloud/client.ts`, `src/cloud/AccountPanel.tsx`, `src/components/GameContext.tsx`; API/integration/auth/guest/bottle browser fixtures; `supabase/tests/authenticated_scan.sql`; runtime and local-database check scripts; `.vercelignore`; current-policy documentation. No catalog, battle-engine, story dialogue or local-save schema change.

## Production deployment and final acceptance

Deployed from this working tree to `https://pixelogy-three.vercel.app` on 2026-10-25. Deployment `dpl_7LuqRNrJg8MEL8Jz7wi3ggNcDk9K` is READY (`https://pixelogy-rsqmwooay-ethan-9cf5.vercel.app`). No secrets or Supabase schema were changed. `.vercelignore` excludes local environment files and test artifacts from uploads. Vercel linking generated ignored project/OIDC metadata; no token was printed or committed.

Actual HTTPS checks passed: GET `/api/analyze` → 405, anonymous POST → 401 `SCAN_LOGIN_REQUIRED`, invalid bearer POST → 401 `SCAN_SESSION_EXPIRED`, all no-store. Real production Chromium and WebKit sessions navigated `/scan` → `/auth/login?next=%2Fscan`, displayed the existing login form and did not open the camera. No network mocks were used for those checks.

The additional 18 world/offline Chromium/WebKit cases passed. Together with the scanner/auth/guest runs described above, all 80 selected browser cases have passing results. Physical-device signed-in Gemini identification and real cross-device account acceptance remain unverified. No production credential value was retrieved to bypass login for testing.

Normal authenticated scanning needs no newly identified environment variable or migration. If a real signed-in scan returns `GEMINI_ACCESS_DENIED`, check the configured Google key/access; `GEMINI_QUOTA_REACHED` requires checking Google's quota/billing; an invalid server receipt at save requires checking equality of the existing Vercel `SCAN_SIGNING_SECRET` and private Supabase `tickets` value. None of those later failures was observed in a real signed-in production scan during this turn.

The deployed code is still uncommitted in the workspace. Include these changes in the next Git push so a later Git-triggered deployment does not restore the prior guest-scanning build.
