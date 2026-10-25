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

## Reliability changes and verification

- Auth: canonical-origin confirmation links, shared persistent 60-second email cooldown, friendly quota errors. Existing independent recovery route and implicit cross-device token handling preserved.
- Camera: live capture appears before Gemini consent. A held photo remains on-device until opt-in; consent then analyzes it automatically. Encoding locks synchronously, late callbacks are discarded, streams stop on exit/background, failed privacy-preference reads surface an error, and saves show progress.
- Account data: denied IndexedDB access or cache quota failure no longer discards a successful online Supabase response. Offline snapshots remain scoped to the signed-in account; no snapshot produces an explicit error, never fabricated inventory.
- No database migrations or player-data changes. Existing gear, three-slot attacks, combat pacing, story campaign, GPS, PWA and predefined artwork retained.

## Live service evidence

The canonical HTTPS deployment returned 200 for `/`, `/reset-password`, `/auth/callback` and `/scan`. Manifest returned `application/manifest+json` with `no-cache`; service worker returned JavaScript with `no-cache, no-store, must-revalidate`. `/api/analyze` GET returned 405. All three deployed APIs (`analyze`, `battle`, `story`) loaded and rejected malformed POSTs with 400. This verifies existing deployed handlers, not deployment of these new local changes.

The locally configured Gemini credential successfully listed models, including the default `gemini-3.8-flash`. No user photograph was submitted and this does not establish Vercel's credential/model configuration or successful recognition.

Both existing rollback SQL suites ran successfully against the configured Supabase project: receipt replay, cleanup idempotency, gear ownership/slot validation, direct progression denial, cross-user isolation, story locks, 25-stage progression and duplicate rewards. All 15 public tables have RLS enabled; zero fixture accounts remained afterward. No migration was applied. Security advisors flagged the intentionally exposed authenticated SECURITY DEFINER RPCs and disabled leaked-password protection. The former require their existing fixed search paths, ownership and signed-ticket checks; do not grant direct progression writes. Review enabling leaked-password protection subject to project-plan support.

## Remaining acceptance and incomplete work

1. Configure verified custom SMTP; current dashboard has SMTP disabled and live logs confirm signup/recovery email quota errors. See SMTP_SETUP.md. A client cooldown cannot fix the project mail quota.
2. Supply a dedicated test inbox/account, then verify actual confirmation and cross-device recovery. Browser password entry must be completed by the user.
3. Redeploy these commits, then test a real safe bottle through authenticated camera → Gemini → signed discovery → Supabase → gear/special → battle → logout/login. Mocked browser tests and model listing do not prove this live journey.
4. Perform real iPhone/Android installation, camera/GPS, background/resume and low-memory acceptance. Automated WebKit is not an iPhone.
5. Public weekly rankings remain honestly unavailable. No new leaderboard schema was introduced while auth/email acceptance remains blocked.
6. Legacy unsigned local saves remain intact but are not imported as trusted cloud rewards. Re-scan owned safe items after login for signed account discoveries; an automatic import/revalidation UI remains unfinished. Existing cloud account progress is server-backed.
7. Catalog has 200 stable entries, 48 finished sprites, 152 drafts and 8 Legendary entries. No draft artwork was relabeled complete. Five regions/25 encounters are implemented; this audit's SQL suite exercises all stage gates/rewards, while browser coverage is not a manual 25-stage playthrough.
8. Corrected the opening observation attribution from PLAYER to CAPTION as explicitly requested; all spoken words and campaign structure remain unchanged. Broader new cinematic/art expansion was deferred under the brief's priority rule.
9. Vite reports large JavaScript chunks; performance on low-end phones needs real-device measurement. No native build or store approval claimed.

## Changed files

Auth: `src/cloud/authNavigation.ts`, new `src/cloud/emailCooldown.ts`, `src/pages/Auth.tsx`, `tests/recovery.test.ts`, `tests/e2e/auth.spec.ts`.
Scanning: `src/mobile/CameraCapture.tsx`, `src/pages/Scan.tsx`, `tests/e2e/device.ts`, `tests/e2e/game.spec.ts`.
Persistence: `src/cloud/game.ts`, new `tests/account-cache.test.ts`.
Documentation: `README.md`, `AGENTS.md`, `docs/REVISION_NOTES.md`, `docs/audit/RELEASE_AUDIT.md`, `docs/audit/SMTP_SETUP.md`.

Configuration: six exact production callback destinations added to the existing Supabase allowlist (20 entries total); canonical Site URL preserved. No new environment variables. Keep `GEMINI_API_KEY` and `SCAN_SIGNING_SECRET` server-only; public Supabase URL/publishable key remain browser configuration. SMTP credentials belong only in the provider/Supabase dashboard.

## Automated and mobile results

- Typecheck, ESLint, unit tests, plain-Node imports of all three API entries (9 request rejection/fallback assertions), and production build passed.
- Full Playwright run: **120/120 passed**, Chromium and WebKit, 8.2 minutes. Covers auth/scan return, fresh-browser recovery, cooldown, camera consent and races, scan-save-equip-battle-cleanup, offline practice, gear/moves, battle phases, full Region 1, later bosses, exact scenes, GPS failures, map fixtures, PWA installation/update/cache exclusion.
- Viewports include 375×812, 390×844, 430×932 and landscape. Inspected saved screenshots of auth, arena, Workshop, filter sheet and opening/landscape. Keyboard and reduced-motion assertions passed. Hardware camera/GPS and actual iPhone installation remain untested.
- The first scanning run had seven failures from the renamed heading and the new simultaneous camera/consent controls. Updated those obsolete UI assumptions; the capture/consent/network assertions remain. The corrected scanning run passed 32/32, then two new first-capture-consent cases passed in the full run.
- Full suite ran before the final one-label caption correction; see final focused results below. Tests use intercepted auth/Gemini/account responses and synthetic camera/GPS. SQL checks use the live database with rollback fixtures.

Final caption verification: **88/88 unit tests**, lint, typecheck, production build and all **9 plain-Node API assertions passed**. Opening-shot browser rerun after the caption change: **2/2 passed**, one per engine. Snapshot review confirms only the requested speaker label and content hash changed. Additional changed files: `src/content/story-script.json`, `tests/story-content.test.ts`, `tests/__snapshots__/story-content.test.ts.snap`.

| Feature | Previous problem | Change / current status | Evidence | Remaining limitation |
| --- | --- | --- | --- | --- |
| Auth | Preview callbacks and repeat mail requests | Canonical callbacks, persistent cooldown, error copy; local checks pass | 20 auth browser cases; live allowlist/log review | SMTP and real email acceptance pending |
| Camera / scanning | Consent gated camera; encoding and late callback races | Immediate local camera, separate upload consent, capture guard, visible errors | Chromium/WebKit scan and first-capture tests | Real authenticated Gemini/camera acceptance pending |
| Persistence | Offline cache errors could hide valid online saves | Cache now optional for online reads; preserves account isolation | 3 focused unit cases; live SQL RLS/reward rollback tests | Legacy import and cross-device user acceptance pending |
| Gear / attacks / combat | Needed regression audit | Existing five slots, three moves and phased presentation preserved | Browser gameplay/moves/pacing and unit resolver tests pass | Physical performance untested |
| Story | First observation attributed to player | CAPTION label corrected; words unchanged | Full Region 1/later boss suite, exact-content snapshots, final 2 opening checks | No manual 25-stage/device playthrough |
| GPS / PWA | Needed lifecycle/offline audit | Existing implementation retained | Synthetic GPS, offline reload, cache exclusion/update, live headers pass | Actual iPhone/Android camera/GPS/install untested |
| Catalog / leaderboard | Draft art and unavailable rankings | Honest status preserved: 48/200 finished; 8 Legendary | Local counts, live catalog totals, browser filters | 152 draft sprites and weekly rankings unfinished |

Local focused commits: `029c86f` auth, `24d41cc` account cache, `45f584a` camera. Story attribution and final documentation are separate follow-up commits. Nothing was pushed or deployed during this audit.
