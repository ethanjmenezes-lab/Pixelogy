# Guest gameplay and U.S. cleanup map

Current implementation, 2026-10-25. Accounts are optional for basic gameplay. This supersedes previous mandatory-scan-login, online-only Story Mode and account-only walking instructions.

## Gameplay and saves

Guests use the real camera, consented Gemini endpoint, canonical ShoreDex, equipment, local deterministic CPU and Story battles, both XP systems and customization. IndexedDB version 6 adds a general guest ledger/story store while preserving existing inventories, artwork, cleanup, profile and moves. Practice remains 40/15/0 Crab XP; story first clears retain 40/80 and repeats zero. Walking uses the same raw-device filter and 100 m milestones (+8 Player/+5 Crab), with a local UTC daily cap. Local rewards are personal gameplay records, not proof against tampering. Clearing browser data can erase unbacked guest progress. No background GPS.

Profile's optional **Save Your Progress** links to existing login/signup, with no recurring signup interruption. Guest and account data are not blended in the guest UI on logout.

## Verified backup and conflict rules

On an authenticated load, a meaningful guest save is serialized with a persistent source UUID. The import transaction binds that source to one account, deduplicates discovery and cleanup IDs, tracks cumulative imported XP/distance, unions story clears and retains best stars. Already-account-cleared story first-clear XP is subtracted from incoming increments. Replay cannot award again. New accounts adopt guest appearance/equipment/moves; existing account selections win, while guest items/unlocks remain accessible.

The server returns SHA-256 of the exact snapshot; the client checks it before rotating the local guest save. A transaction compares the current save against the snapshot so concurrent play is not cleared. Failed upload or verification leaves the device save intact; the app's Retry action retries backup. A private account-scoped local recovery archive remains, and the server's owner-readable snapshot retains the original import. A fresh guest starts after verified transfer; account snapshots are never loaded as guest data.

Guest data is necessarily client-originated. The import is validated and bounded, not falsely represented as verified gameplay. Imported discoveries and cleanup claims carry `imported_guest`; later cleanup of an imported discovery inherits this provenance. A future competitive leaderboard must exclude these claims or separately validate them. The current leaderboard remains unavailable. Do not treat imported cosmetic/combat XP as multiplayer authority.

Legacy noncatalog discoveries are retained with original metadata/artwork and allowlisted gear definitions; they are not assigned invented catalog identities. They remain in the previous-discoveries section. Oversized saves (>3 MB) fail intact rather than silently dropping data; large legacy-art collections require a future chunked transfer path.

## Map and state association

ShoreDex still opens to its collection grid. **U.S. Map** opens `/collection/map`, with 50 interactive state boundaries, Alaska/Hawaii insets, keyboard controls, searchable 44px state buttons, progress and compact details. Color and totals are derived from deduplicated cleanup records, with no separate state-color table. Total Pickups includes unassigned cleanups; they color no state. Historical state-less records stay unassigned.

Boundaries come from [us-atlas](https://github.com/topojson/us-atlas), the ISC-licensed redistribution of Census cartographic data. The license is retained in `src/cleanup/LICENSE-US-ATLAS.txt`. `node scripts/build-us-map.mjs` generates local geometry and SVG paths. The map requires neither live tiles nor location permission just to view.

**I Picked It Up** is an optional safe-disposal self-report, distinct from discovery. It requests a fresh foreground fix only at confirmation, runs state-boundary lookup on-device and discards coordinates. Invalid/stale fixes or accuracy worse than 100 m save without a state. A conservative 2 km cartographic-boundary margin plus reported accuracy triggers confirmation among nearby states, with a Save without state option. Denial, timeout and locations outside the map do not block collection/cleanup. The lookup is cartographic, not survey precision; coastal and boundary cases need physical testing. Only the selected two-letter code persists. Existing cleanup receipts cannot be moved by retrying with another state.

## Anonymous Gemini protection

The endpoint retains JPEG size/schema validation, explicit consent, safety review, provider timeout, structured recognition, server-only credentials and no-store responses. Guests do not obtain Supabase auth sessions. A server-HMAC quota RPC uses a daily keyed hash of Vercel's trusted client-IP header; no raw IP or image is stored in that ledger. The [Vercel request-header contract](https://vercel.com/docs/headers/request-headers) is required in production; unrecognized hosting must be configured separately. Local development uses a shared development bucket.

Limits: 20 attempts per daily network bucket and 1,000 anonymous attempts globally per UTC day, atomically enforced in Postgres before Gemini. Repeated photos within a bucket/day get the same scan UUID so local saves deduplicate. Counters and hashes older than two days are pruned. Provider failure still consumes an attempt. Shared Wi-Fi shares its allowance; this is a cost bound, not perfect bot detection. Quota service failures fail closed. No manual safety override or fake identification fallback was added; failures offer retry/retake.

## Database deployment status — pending approval

Three staged migrations are prepared and tested locally, **not applied to Supabase**:

1. `20261025130000_guest_scan_quota.sql`: private quota/photo-hash ledger and HMAC-only anonymous reservation RPC.
2. `20261025130100_cleanup_states.sql`: nullable state codes, import provenance and idempotent cleanup-state RPC.
3. `20261025130200_guest_import.sql`: owner-private backup ledger, transactional import, preserved legacy discoveries and compatible gear/cleanup functions.

Automatic approval review rejected the original combined live migration because it changed privileged functions, grants/RLS, rewards and imports together. No workaround was used. Review these staged files before applying them to the live shared database. Deploy the backend/frontend only after migrations; otherwise anonymous quota, account backup and account cleanup-state RPCs will correctly fail rather than fake success. Existing server signing-secret configuration is reused; no client secrets or new service-role key are required.

## Verification

`node scripts/test-database.mjs` runs all repository migrations and rollback fixtures in isolated PGlite PostgreSQL with real pgcrypto and simulated Supabase auth roles. It does not modify the live project. Tests cover quota forgery/per-network/global bounds, import replay, account isolation, preserved selections, overlapping story XP, state immutability and prior reward/campaign contracts.

See the dated revision entry for final test counts. Automated camera/GPS fixtures do not verify a physical phone or hosted Gemini. Live migrations, deployed HTTPS behavior, real emailed signup/recovery, real guest/account cross-device acceptance and physical camera/GPS/boundary testing remain outstanding. The existing SMTP release blocker is unchanged.

## Changed-file inventory for this feature

- Guest persistence and import: `src/guest/local.ts`, `src/guest/story.ts`, `src/guest/backup.ts`, `src/lib/storage.ts`, `src/components/GameContext.tsx`, `src/cloud/AccountPanel.tsx`, `src/cloud/client.ts`, `src/cloud/game.ts`.
- Guest gameplay integration: `src/pages/Scan.tsx`, `src/story/Story.tsx`, `src/progression/useWalking.ts`, `src/progression/ProgressionPanel.tsx`, `src/world/OverworldScreen.tsx`. Existing prior progression work in this checkout is preserved.
- Map and cleanup UI: `src/cleanup/Map.tsx`, `CleanupButton.tsx`, `states.ts`, generated `states.json` and license; `src/pages/Collection.tsx`, `src/App.tsx`, `src/tropical.css`, `pwa.config.ts`.
- Backend and legacy compatibility: `api/analyze.ts`, `server/guest.ts`, `server/playerBattle.ts`, `src/lib/gear.ts`, `src/components/ItemCard.tsx`, the three staged migrations listed above.
- Build/test tooling: `scripts/build-us-map.mjs`, `scripts/test-database.mjs`, `package.json`, `package-lock.json`; `supabase/tests/guest.sql`; guest/import unit tests, API and IndexedDB upgrade tests, guest browser coverage and updated auth/cloud/game/polish/offline fixtures.
- Documentation: `README.md`, `AGENTS.md`, `PROJECT_PLAN.md`, `docs/PROGRESSION.md`, `docs/REVISION_NOTES.md`, this document.
