> Current scan policy (2026-10-25): new trash scans and discoveries require Supabase login. Guest GPS, CPU/Story battles, XP, Workshop and existing local inventory remain available. The anonymous quota migration is no longer needed for scanning. Failed guest import must preserve local data and must not block account loading. See `docs/AUTHENTICATED_SCANNING.md`. This supersedes previous guest-scanning instructions.

# Cloud scan failure — 2026-10-25

## Confirmed production cause

Production `https://pixelogy-three.vercel.app/api/analyze` loads successfully: GET returned HTTP 405 JSON (`Use POST.`), and an unauthenticated diagnostic POST reproduced HTTP 503 `Cloud discovery is not configured. No collectible was awarded.` on 2026-10-25. This is an application error, not a missing Vercel route or an ESM import failure. The Vercel dashboard showed Ready production deployment `43SnAjVGDyKp1sjG1iB6y4dPYC5c`, source `4008a8c`, with that alias.

Read-only checks against the connected Supabase project confirmed `public.reserve_guest_scan(text,text)` is absent. Guest analysis calls this quota RPC before contacting Gemini; every RPC failure previously became the same `CONFIG` error. Thus camera capture works but Gemini and catalog matching are never reached. Local guest saving is not blocked by discovery-table RLS: it uses IndexedDB and does not call `award_discovery`.

Vercel production variable listing confirmed these names are configured (secrets were not revealed):

- `GEMINI_API_KEY` — Secret, Production. The reproduced response also passed the runtime missing-key check. Presence does not establish that Google accepts the key or its billing/quota.
- `SCAN_SIGNING_SECRET` — Secret, Production.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` — Production; these are the supported server fallbacks for `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

Supabase contains 200 rows in `public.collectible_catalog` and a nonempty private `server_secrets` entry named `tickets`. Secret equality has not been verified; no values were extracted. `GEMINI_MODEL` is optional and currently defaults to `gemini-3.8-flash`, a documented model: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash. No model change was needed for the confirmed pre-Gemini failure.

## Complete workflow

1. Browser/native camera captures; `normalizePhoto` resizes and removes metadata. Explicit remembered consent remains required.
2. `Scan.tsx` POSTs JPEG/consent to same-origin `/api/analyze` in browser, with optional account bearer token.
3. Guest requests obtain a durable, HMAC-authorized quota reservation; signed-in requests use `begin_scan`. Quota checks remain mandatory, with no unlimited fallback.
4. Gemini receives the image; structured output is validated. The real bundled 200-item matcher returns existing catalog IDs only. Unsafe/unknown results cannot produce an award receipt.
5. After user review, guests use `saveGuestDiscovery` to write the canonical item and stable discovery ID transactionally in IndexedDB. Replaying a receipt does not duplicate it. Accounts use the signed `award_discovery` RPC.
6. On optional sign-in, existing `backupGuest` submits a stable snapshot to `import_guest`, verifies the server hash, and only then rotates local guest state. Failed import keeps the guest save intact. Cleanup remains a separate optional action.

## Code repair

- `server/scanErrors.ts`: allowlisted diagnostics for missing guest/account RPCs, missing configuration, signing mismatch, quota/storage errors, duplicate account photo, provider credentials/model/quota/timeouts.
- `server/guest.ts`: preserves Supabase errors long enough to classify them; validates the reservation ID; keeps server-only signing, trusted IP hashing and durable quota enforcement.
- `api/analyze.ts`: stage-specific error codes, request IDs, safe logs containing only request ID/stage/code. No raw provider/database errors, photos, credentials or headers are logged or returned.
- `src/pages/Scan.tsx`: useful non-JSON and timeout errors; existing retry/retake and no-award behavior preserved.
- `tests/scan-integration.test.ts`, `tests/fixtures/plastic-water-bottle.jpg`, fixture README and `tests/api.test.ts`: sample bottle through actual quota adapter, signing, catalog matching and local save; provider/DB boundaries are mocked explicitly. The image is an original synthetic bottle illustration, not physical-camera or live vision evidence.

## Exact release actions still required

### Immediate guest scanning repair in Supabase

Review/apply `supabase/migrations/20261025130000_guest_scan_quota.sql` to the existing project. This adds private quota/photo-hash tables and the HMAC-checked `reserve_guest_scan` RPC; it does not delete player data or remove abuse controls. It reuses the existing private `tickets` secret. No new secret value should be invented or rotated for this repair.

**This live migration was rejected by automatic approval review and remains unapplied.** Explicit approval is required because it creates private tables, a SECURITY DEFINER function and execution grants. It was tested locally with PostgreSQL/pgcrypto. Do not bypass approval with an unprotected API or alternative SQL execution.

### Guest-to-account backup

`import_guest` and the cleanup-state RPC are also absent live. For the already-implemented backup flow, review/apply these existing migrations in order after the quota migration:

1. `20261025130100_cleanup_states.sql`
2. `20261025130200_guest_import.sql`

These are not necessary to identify/save a guest bottle locally, but are required for importing guest progress and account state-associated cleanup. They remain pending approval. Do not clear guest saves to work around failed import.

### Vercel

No missing environment variable has been established. Keep the four configured production variables above. Browser requests remain same-origin; no `VITE_API_BASE_URL` is needed for the PWA. Never add the Gemini key or signing secret under a `VITE_` name. After the database repair, deploy this code revision to get the improved diagnostics. If changing any server environment variable, redeploy for it to take effect. No deployment or environment update was performed in this repair turn.

Then submit a consented real bottle photo and confirm a validated catalog match, review, local save and reload without login. A later `SCAN_SIGNING_MISMATCH` means the existing Vercel signing secret and Supabase `tickets` value need alignment through a secure administrator workflow. A `GEMINI_ACCESS_DENIED` or `GEMINI_QUOTA_REACHED` identifies a Google key/access or quota/billing problem. No evidence currently establishes either of those later failures.

## Verification

- TypeScript frontend + NodeNext, ESLint, 117 unit/integration tests, nine plain-Node API smoke assertions, production build and `git diff --check` passed.
- 40 Chromium/WebKit scanner + guest cases passed, including capture/consent, safe discovery, local persistence, equipment/battle, failed storage, offline/malformed responses, late-response races and cleanup independence.
- All repository migrations plus four rollback SQL fixtures passed in isolated PGlite with real pgcrypto. No live data was modified.
- Existing large-bundle build warnings and non-failing browser teardown module-load messages remain.
- Live Gemini acceptance, secret equality, cloud guest import, real phone camera/GPS and cross-device sync remain unverified. The production scan is still blocked until the approved quota migration is applied; passing local tests does not fix that live dependency.
