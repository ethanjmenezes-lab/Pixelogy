# Predefined ShoreDex and account saves

The new discovery path is camera → remembered explicit Gemini consent → authenticated recognition → deterministic catalog candidates → review → transactional account award → original sprite reveal. Identity ambiguity can offer at most three server-approved species; unknown and unsafe results award nothing. Original photos, coordinates and trails are not stored. A SHA-256 photo fingerprint is retained for replay protection.

## Catalog and artwork

There are 200 stable canonical species across 20 families. Definitions live in src/catalog/catalog.json. Gear references resolve to the existing gear catalog and special-move registry; rarity is predefined and cosmetic. The generator creates original 32×32 pixel SVGs. Forty initial family variants are marked finished; 160 are explicitly draft illustrations, sharing family silhouettes and awaiting species-specific refinement. This is not a claim of 200 polished unique silhouettes.

Run:
- npm run catalog:build — regenerate reproducible catalog metadata and SVGs.
- npm run catalog:seed — regenerate the SQL seed from catalog, gear and moves.

The primary gallery groups owned discovery instances by catalog ID; duplicates increase quantity without increasing completion. Legacy photo discoveries remain in the original IndexedDB store and appear separately while signed out. Signing in switches to the account inventory; signing out restores the local collection. Legacy discoveries are not automatically uploaded as verified scans.

## Supabase setup and current status

The existing connected project was inspected and reused: rsdgbxpqpdewqpmeuwvp. Its public schema and migration history were empty before this work. No duplicate project was created.

**2026-10-24 authentication repair:** Both existing migrations are now applied to the connected project. The catalog contains 200 rows and all 12 public tables have RLS enabled. The rollback security test passed and left no test users behind. Production receipt signing and hosted acceptance remain pending. See AUTH_RELEASE.md for current status.

1. Already applied: supabase/migrations/20261024233214_shoredex.sql and 20261024233221_catalog_seed.sql. Filenames match the remote migration ledger. Do not reapply the schema to this project.
2. Generate a cryptographically random secret (at least 32 bytes). Set SCAN_SIGNING_SECRET on the server and the same value in the private.server_secrets row named tickets using a trusted administrator. Never put this value in VITE_ variables, public tables, Git, logs or browser code. Rotate both copies together.
3. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the frontend build. Server functions use these same public values or the optional SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY overrides. A service-role key is not required: functions verify the bearer token via getUser and call owner-scoped RPCs.
4. Configure GEMINI_API_KEY and optional GEMINI_MODEL server-side. Keep VITE_API_BASE_URL empty for same-origin browser API requests.
5. Enable Supabase email/password authentication, configure the deployed site URL and allowed redirect URLs, and verify the confirmation-email flow. The application does not silently create anonymous cloud identities.
6. Run supabase/tests/rls.sql as database owner after migrations. It uses transaction-only users, tests replay/ownership/privileges, and rolls back. This SQL test passed against the connected project on 2026-10-24.
7. Redeploy Vercel and test real account signup/login, consented Gemini scan, duplicate quantity, gear, battle XP, and the same account on a second device.

Vercel Production now has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. A new build is required to use them. No hosted Gemini or cross-device acceptance is claimed.

## Trust boundaries

All exposed tables enable RLS. Public catalog, gear and move metadata are readable but not writable by players. Account tables are owner-readable; direct client writes are revoked. Narrow SECURITY DEFINER functions lock per user and validate ownership/slot/move eligibility. Private signing material is not exposed through the public API.

The analyze function validates user identity before Gemini, records a rate-limited scan, parses structured output and deterministically chooses catalog IDs. It issues an HMAC receipt containing authenticated user, scan ID, candidate IDs and ten-minute expiry. award_discovery verifies the exact receipt, checks the catalog, and consumes the scan once in one transaction. Identical normalized photos cannot award twice. Failed retries count toward the 20-per-hour scan limit. This is basic per-account abuse protection, not proof that a real object is unique or a complete anti-abuse system.

Account practice uses /api/battle and the existing pure engine. Stats and selected moves come from owned server inventory; requests include an expected version, and signed results are committed under a transaction lock. Stale requests return the stored state; completed rewards apply once. Wins grant 40 battle XP, losses 15. Cleanup remains separate, optional and explicitly self-reported: 10 XP plus 5 for the first cleanup in an original gear category. Public rankings and PvP remain unavailable.

## Offline, privacy and release limitations

The service worker caches only the explicit public app shell and 200 catalog SVGs; API/auth/profile/photo responses and map tiles are excluded. Account snapshots are intentionally stored in a separate per-user IndexedDB cache, never a network cache. Offline account practice grants no battle XP; account mutations and new discoveries require connectivity. Signed-out legacy gameplay stays local. Browser storage is not an encrypted vault: signing out hides the account cache but does not remove its bytes; clear site data on a shared device.

Dedicated account creation, sign-in, confirmation, and password recovery UI are implemented. Account deletion, synchronization conflicts beyond server transaction rules, public rankings and PvP remain future work. Physical-phone camera/GPS, hosted auth redirects, email delivery, live Gemini and cross-device acceptance remain deployment checks.

## Local verification

Typecheck, lint, 67 unit/API/configuration tests and production build passed. Both API modules load as compiled JavaScript in plain Node. Deterministic matches cover all 200 canonical names plus aliases such as plastic bag; malformed, unknown and hazardous results are rejected.

The 60-check Chromium/WebKit suite passed 59 checks before an update-test navigation race was fixed; all four PWA checks then passed. Four final targeted checks passed for the complete discovery/gear/battle/cleanup path and offline account practice in both engines. Browser cloud tests intercept Supabase and Gemini responses; they do not prove live RLS or database persistence. See REVISION_NOTES.md for the full check history. No database test or hosted acceptance has been represented as passing.
