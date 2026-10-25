# Baby crab opening and mobile Story cleanup — 2026-10-24

- Replaced only the opening with the user's exact seven-scene investigation → discovery → bond → confrontation → first-battle flow. Versioned runtime content as locked-dialogue-2.0-baby-crab; kept all regional/encounter/ending content unchanged.
- Added original animated baby-crab staging, compact landing, wrapping/width fixes, touch-sized Next/Skip, replay and guarded automatic first battle. Preserved account watch flags and all progress; no migration.
- Typecheck, lint, 83 unit tests, nine API checks and build passed. Full Chromium/WebKit run passed 114/114; final delayed-watch race guard passed both targeted reruns. Three phone sizes, landscape/reduced-motion regression and gameplay flows covered. Deployment and physical-device acceptance remain pending.
- [Changed files and verification](story/BABY_CRAB_STATUS.md).

# Locked story and password recovery — 2026-10-24

- Corrected stable password-reset destination, public recovery callback/form, early recovery-event handling and root fallback. Verified the production domain and default confirmation email template; added eight exact live redirect entries. Cross-browser recovery passed with SDK/network fixtures; real email/device acceptance and deployment remain pending.
- Replaced previous narrative with the supplied byte-identical JSON. Added reusable shot/caption/clock/actor/camera components, all eight opening shots, five regional arrivals/outros, six ending shots and exact 25-encounter data. Preserved legacy save aliases and battle rules. Full per-shot sound design remains incomplete; current audio is an original opt-in synth motif.
- Applied additive cinematic constraint migration; live rollback test verifies old/new flags and duplicate-watch idempotency. No test account remains or inventory/progress deletion occurred.
- Typecheck, lint, 83 unit tests, nine plain-Node API checks and production build passed. Full browser run: 104 passes / 8 outdated arrival-fixture failures; corrected region-entry fixtures and all eight reruns passed. No combat/save assertions removed. All 112 cases have a passing result across those runs, including preserved camera/GPS/gameplay/PWA flows.
- Details and changed paths: [Story Mode](STORY_MODE.md), [authentication](AUTH_RELEASE.md). Earlier narrative/status entries below are historical.

# The Blacktide Conspiracy (2026-10-24)

- Replaced the magical Shattered Tide story with Blacktide Industries, CEO Caspian Vale and the deliberate dumping/cleanup-contract scheme. The earlier Shellshore entry below is historical and superseded.
- All five regions now contain four trainers and a boss (25 playable encounters). Added original regional SVG scenery, corporate trainer styling, evidence case files, cleaner maps after boss wins, new opening, regional briefings, boss/restoration scenes and final public exposure.
- Kept Shellshore stage IDs, best stars, XP and cinematic flags. The new opening uses its own versioned ID. Applied additive migration 20261025013308_blacktide_conspiracy.sql; the live transaction/rollback test verifies all 25 rewards, legacy replays, prerequisites, ownership and forgery rejection. No fixture accounts remain; existing story row counts are unchanged.
- Typecheck, lint, 79 unit tests, nine plain-Node API checks and production build passed. All 104 Chromium/WebKit tests passed, including the unchanged scan-to-cleanup flow, all Shellshore stages, each later boss, evidence/restoration, finale, legacy saves, gates, retries, phone layouts, reduced motion and production PWA checks. Original screenshots inspected; no external/Figma artwork used.
- Frontend/API changes still require Vercel redeployment and signed-in hosted acceptance. Physical phone testing remains unverified. See [canonical story and verification](STORY_MODE.md).

# Story Mode: Shellshore (2026-10-24)

- Added the permanent Story Mode menu tile; Profile/Settings remains on the avatar HUD. Added original animated opening, five-region overview, authored Shellshore beach path, five distinct NPC battles, boss intro/completion, best stars, first Tide Shard and a story-portrait Sunburst cosmetic.
- Reused combat rules, timing, actual owned gear/moves and account battle XP. Added authenticated `/api/story`, shared trusted-player snapshot loader and signed, transactional Supabase story RPCs. First-clear XP is 40/40/40/40/80, repeats/defeats/exits zero; no cleanup XP or scan gear grants. Applied migration and passed live rollback ownership/idempotency tests.
- 78 unit tests, typecheck, lint, nine plain-Node checks and production build passed. All 86 existing browser regressions passed in the full run; both campaign playthroughs passed. Fixed the new retry-layout issue and ambiguous navigation selector; final targeted Story run passed 6/6 across Chromium/WebKit.
- Regions 2–5 and final endings are explicitly incomplete. Online account connection is required for Story; no offline campaign sync. Database is prepared, but new frontend/API hosted acceptance and physical-device tests remain pending. See [full scope, files and test details](STORY_MODE.md).

# Coastal RPG polish — 2026-10-24

- ShoreDex: five-column phone grid, search/ownership tabs, staged category/rarity/slot chips in a focus-managed bottom sheet; Apply/Reset, Escape and backdrop dismissal.
- Eight existing species promoted to canonical Legendary with eight original finished SVGs, unique descriptions, gold frames and reveal sparkles. Catalog remains 200 entries: 48 finished, 152 explicitly draft. Applied additive Supabase migration `20261025002132_legendary_catalog.sql`; database readback confirms 118 Common / 57 Uncommon / 17 Rare / 8 Legendary. Existing discoveries and cleanup claims were preserved.
- Workshop: original pixel slot icons, equipped artwork, compact owned-gear grid and stat previews; less repeated copy and expandable move details. Existing slot ownership, special reconciliation and battle unlock rules preserved.
- Arena: original CPU trainer Coral behind Pebble, trainer reactions/outcomes, Pinch/claw lunge, guard/shield, traveling splash, weapon/gear effects and impact flashes. Separate authoritative and presentation snapshots replay resolved turns at 800 ms windup, 800 ms impact and 800 ms transition. HP/status/cooldowns update at impact; input stays locked through resolution; backgrounding/unmount clears timers. Server API, deterministic resolver, reward rules and storage schema unchanged.
- Verification: final `npm run lint`, `npm run build` (includes frontend/NodeNext typechecks and five plain-Node API rejection checks), `npm test` (70 passed), and `npx playwright test` (86 passed, Chromium/WebKit, 3.2 minutes). Browser coverage includes full scan/save/equip/battle/reload/optional-cleanup flow, Legendary persistence/zero cleanup XP, damage-at-impact, blocked repeated input, background/resume, account flows, GPS failure states, production offline loading and PWA cache/update exclusions. Screenshots inspected at 375×812, 390×844, 430×932 and landscape; smaller 375×667 also tested. Initial regressions in focus return and equipment accessible names were fixed; stale copy selectors and browser CSS serialization assertions were updated before the final clean pass.
- Limits: browser camera/GPS/Gemini/account flows use fixtures. No physical-phone testing, live Gemini scan or frontend deployment was performed for this change. Catalog metadata is applied in Supabase; frontend code/assets await deployment. Existing large-chunk build warning remains. See [implementation and changed files](RPG_POLISH.md).

# Interactive characters and battle preparation — 2026-10-24

- Added keyboard-accessible 48px overworld character tap targets. The explorer celebrates with a short jump; the crab hops and snaps its jaws. Reactions run inside GPS markers, leaving MapLibre transforms intact. Equipped SVG layers move together. Repeated taps restart the reaction; pointer cancellation/drag suppression and reduced-motion feedback are supported. No new animation library.
- Replaced the text-heavy practice intro with original beach artwork, two equipped crab previews, actual crab levels/stats, VS badge, three selected move cards, compact rewards, and expandable tips. Start Battle retains the existing snapshot and resolver. Offline account practice is labeled as granting no XP.
- Change Attacks opens Workshop's existing Moves editor directly. Change Gear opens equipment. Both offer Return to Matchup; saved main/special choices and equipment reconcile through the existing storage/Supabase paths. No database or combat-rule changes.
- Changed files: src/world/CharacterReaction.tsx, src/world/GeographicMap.tsx, src/components/Crab.tsx, src/battle/BattleScreens.tsx, src/battle/battle.css, src/pages/Battle.tsx, src/pages/Workshop.tsx, src/tropical.css, tests/e2e/preparation.spec.ts, tests/e2e/moves.spec.ts.
- Typecheck, lint, 67 unit tests, API plain-Node smoke checks, and production build passed. Full Chromium/WebKit run: 76/78 passed; failures were old move-text assertions and a reload before a selection save completed. Updated tests wait for the persisted selection and assert the individual move cards. Final targeted run: 8/8 passed for Change Attacks → select → reload → matchup → battle, gear removal/special validation, offline practice, independent repeated character taps/reduced motion, and phone layouts. Existing full scan → save → equip → battle → reload → cleanup passed in both engines.
- Inspected phone screenshots at 375×812, 390×844 and 430×932; action bounds and horizontal-overflow assertions passed. Existing landscape/GPS/recenter/PWA checks passed. No new Figma file was referenced: original code artwork and the written brief guided implementation. These UI changes have not been deployed or physically tested on a phone.

# Production authentication activation — 2026-10-24

Saved and reloaded the production Supabase Site URL and six confirmation/recovery redirect entries. Installed matching private signing material in Supabase and Vercel Production, verified equality, and removed the temporary local copy. Published commit 33b72c2; Vercel reports Ready. Live Scan redirects to Login, signup is accessible, and both APIs return no-store 401 responses for unauthenticated calls. Real email confirmation, password recovery delivery, Gemini scanning and physical-device acceptance remain unverified.

# Authentication repair — 2026-10-24

- Reproduced the production account blocker: missing public Supabase build configuration hid the old Profile form. Added dedicated signup/login/reset/confirmation/recovery routes, safe scan-return navigation, error handling, persistent SDK sessions, and account links/logout.
- Added VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to Vercel Production; a rebuild is still required. Existing Gemini credential untouched.
- Applied existing schema and seed to the connected Supabase project. Verified 200 catalog rows and RLS on 12 public tables. Rollback RLS/replay/ownership tests passed with zero remaining fixture users. Renamed local migrations to match remote ledger versions and updated the seed generator.
- Typecheck, lint, 67 unit tests, plain-Node loading of both APIs with 5 rejection checks, and production build passed. Full browser run: 70/72 passed, with only two newly added recovery fixtures failing. Corrected fixture navigation/selector/request-shape assumptions; final auth run: 12/12 passed. Thus all 62 pre-existing regression checks and all 12 new auth checks have passed, including mocked scan → save → equip → battle → reload → cleanup in both engines. Phone auth screenshots cover 375/390/430 widths.
- Live signup/email/password recovery, Gemini scan, cross-device persistence and physical-phone acceptance are NOT verified. Supabase dashboard requires user login; signing-secret provisioning awaits browser action-time approval. Source has not been published or redeployed. Weekly leaderboard and 160 draft sprites remain incomplete. See AUTH_RELEASE.md for precise release steps.

# Revision history and key decisions

## Predefined ShoreDex and account integration — October 24, 2026

- Added 200 stable catalog entries, original code-generated pixel SVGs (40 finished starter variants, 160 explicit drafts), deterministic recognition matching, a dense 4–5 column gallery, filtered locked/unlocked entries, quantities/history, equipment details and sprite reveals. New discoveries no longer use pixelated photographs. Existing local discoveries and equipment remain intact and separate from account inventory.
- Inspected the existing connected Supabase project and found an empty public schema/migration history. Prepared versioned schema and reproducible catalog/gear/move seed. Added email/password account UI, owner-scoped cloud snapshots, signed authenticated discovery awards, transactional cleanup and server-resolved practice. Cloud activation is incomplete: automatic approval review rejected applying persistent schema/RLS changes; explicit approval is pending. No live tables, signing secret or Vercel environment was configured by this task.
- Prepared rollback-only RLS/replay/ownership SQL tests at supabase/tests/rls.sql. They have NOT run: the cloud schema is unapplied, and no local PostgreSQL/Docker runtime is available. Live signup, email confirmation, cross-device saves, actual database rewards and hosted Gemini remain unverified.
- Passed typecheck, lint, 67 unit/API/configuration tests and production build. Both compiled API entries load in plain Node without a TypeScript loader; five analyze rejection checks pass. The existing large-chunk build warning remains.
- Browser verification: full Chromium/WebKit run passed 59/60 checks; the remaining PWA test queried caches during its intentional reload. Added an explicit navigation wait, then all four PWA checks passed. After the final cleanup-ID/offline fix, all four targeted checks passed (full scan → catalog save → equip → CPU battle → reload → optional cleanup and offline account practice in both engines). Duplicate species keep completion at 1/200 while quantity becomes 2; both engine tests passed. Gallery layout and keyboard checks passed at 375, 390 and 430px; inspected the 390px screenshot. Existing GPS, camera-denial, consent, late-response, legacy battle, landscape, reduced-motion and cache-exclusion regressions passed.
- No deployment or physical-device test was performed. See SHOREDEX_CLOUD.md for exact setup, trust boundaries and remaining limitations.


## Automatic scanner and brighter tropical theme — October 24, 2026

- Removed crop sliders and the separate Gemini/discovery-kit panel. One-time consent moves before camera entry; after that, capture automatically identifies and frames the object. Review/save stays explicit, and crop adjustment is an optional touch/keyboard control. Profile revocation, retry/retake, safety blocking and existing saves remain intact.
- Increased turquoise gradient coverage, added orange actions and angled orange/purple accents, and restyled menus and world controls around the supplied tropical reference. Original artwork and readable cream panels remain.
- Fixed a WebKit first-frame race: capture is offered after loaded video data, rather than immediately after acquiring the stream.
- Verified typecheck, lint, all 43 unit/API/configuration tests, five plain-Node API checks, production build and all 46 Chromium/WebKit browser tests. New tests cover the absent sliders/analysis button and keyboard crop adjustment, with updated automatic capture/consent regressions. Mobile scanner screenshot inspected at 390px. Physical iPhone camera testing and hosted Gemini remain unverified; no Vercel deployment was performed.

## Tropical pixel world and AI-only scanning — October 24, 2026

- Replaced the stock Liberty basemap/recoloring with an authored MapLibre style over live OpenFreeMap vector data: original pixel grass/water/path/roof textures, geographic building footprints, road hierarchy, bridges and rail. Terrain uses a one-third-resolution backing canvas; UI, sparse street labels and original avatar/crab sprites stay sharp. The crab has a visible side offset and movement-only animation. Added honest map loading/timeout/error states.
- Applied turquoise, mint, orange, cream and purple branding across world controls, menus, feature screens and manifest/HTML theme colors. The supplied image guided colors only; its mascot, lettering and logo were not copied.
- Removed manual category/subtype/safety controls and manual fallback. A validated safe Gemini response for the current capture plus review is required to save. Consent revocation, navigation and retake invalidate/abort late responses. Crop changes require renewed review. Offline/service/schema failures offer retry/retake without saving. Existing inventories, loadouts, cosmetic rarity and cleanup transactions are unchanged.
- Traced prior GPS browser failures to stale Vite optimized dependency chunks (`504 Outdated Optimize Dep`), not a successful location fix being discarded. Browser tests now own port 5175 with a separate Vite dependency cache. Added a deterministic vector-tile fixture, official MapLibre style validation, palette contrast checks and AI error/race regressions. Fixed source-error masking on map load and used MapLibre 6's missing-image resolver for generated patterns.
- Verified: typecheck, lint, 43 unit/API/configuration tests, five plain-Node API smoke assertions, production build and all 44 browser checks (22 each Chromium/WebKit). The full capture → AI review → save without cleanup → equip → CPU battle → reload → optional cleanup flow passed in both browsers. Layout checks include 375/390/430px, landscape, keyboard/reduced motion and PWA offline/update/cache exclusions.
- Inspected mobile map/menu visuals and loaded live OpenFreeMap tiles in production preview using a synthetic TAMU coordinate (30.6177, -96.3365), with no page errors. This is not physical-device location validation. Hosted Gemini, deployment acceptance and physical iPhone camera/GPS/performance remain unverified. The existing lazy MapLibre chunk-size warning remains.


## API runtime import repair — October 24, 2026

- Reproduced `ERR_MODULE_NOT_FOUND` by loading emitted API JavaScript in plain Node. `/api/analyze` already used `.js` specifiers, but its shared recognition module retained `./gear.ts` and `./pixel.ts`. Changed those transitive runtime imports to `.js`; no source files were renamed or runtime errors suppressed. `api/analyze.ts` is the only current API route.
- Added a separate NodeNext server typecheck and a temporary emitted-JavaScript runtime smoke check to the production build. The smoke runner imports all compiled API entries with TypeScript stripping disabled and checks five rejection/manual-fallback responses without Gemini credentials. The frontend's Bundler/noEmit checks and Vitest transforms previously missed this deployment failure.
- Verified typecheck, lint, all 40 unit/API tests, five runtime smoke assertions, and production build. Existing MapLibre chunk-size warning remains. Chromium/WebKit suite: 28 passed, 10 failed at GPS-dependent assertions with location unavailable (including the complete gameplay test before its battle/cleanup stages). Those browser failures remain unresolved; this run does not establish complete end-to-end acceptance.
- Vercel CLI and generated function artifacts were unavailable locally. No deployment was performed. Redeploy, inspect the actual function bundle, verify a cold start and malformed requests, and test a consented live Gemini scan before declaring hosted acceptance.

## Mobile overworld redesign — October 24, 2026

- Replaced launch marketing/navigation chrome with persistent full-viewport Willow Cove: original Canvas terrain, human avatar, equipped crab, collision, virtual joystick/keyboard movement, trail following, pan and recenter.
- Added a native-dialog crab menu and internally scrolling game overlays with back-to-world navigation. Profile appearance persists through an additive IndexedDB v2 migration; level derives from existing cleanup XP with no stat effects.
- Added production manifest/icons and an app-shell-only service worker. No API or uploaded-image caching, GPS collection, real-world litter markers or simulated online claims.
- Chromium/WebKit verification exposed a genuine WebKit Blob-storage failure. New pixel art is stored as PNG bytes; existing Blob records stay readable. Fixed menu focus restoration after outside dismissal.
- Design remains original code-native art based on the written brief. No specific Figma file was supplied or claimed as inspected.
- Final verification: typecheck, lint, production build, 27 unit/API tests and 22 browser checks (11 each in Chromium and WebKit) passed. Browser checks include offline reload/CPU practice, 375/390/430px and landscape layouts, movement cancellation, companion following, menu focus, profile persistence, visible equipped gear and the complete original gameplay flow. Physical-phone camera and installation checks remain pending.


## Playable core implementation — October 24, 2026

- Implemented the React/Vite/TypeScript/Tailwind shell, all six core routes, original SVG pixel crab/gear art and responsive written-spec design. No Figma source was connected or invented.
- Added bounded local image normalization, consented Gemini recognition, manual safety/category review, adjustable object crop, pixel card rendering, transactional IndexedDB discoveries/cleanup claims and owned-item equipment.
- Implemented and tested the exact deterministic CPU battle rules, including two-own-turn Tidal Slam cooldown. Rankings remain explicitly unavailable; online PvP is omitted.
- Gemini 2.5 Flash appeared in model listings but generation returned 404 for this account. Switched the default to the provider-recommended `gemini-3.8-flash`. A synthetic bottle drawing then returned HTTP 200 with a validated plastic-bottle category and bounds through the local API.
- Vercel CLI required login; added `npm run dev:api`, an explicit local adapter invoking the same serverless handler. No deployment or account setup was performed. Removed unneeded Vercel CLI packages; npm audit reported zero vulnerabilities.
- Minimum glass policy: only plastic bottles map to Bottle Blade. No glass discoveries unlock rewards. Polygon segmentation and optional photo-textured gear are not implemented; UI accurately describes cropping and authored gear.
- Final verification: `npm run typecheck`, `npm run lint`, all **20 unit/API tests**, all **6 Playwright browser scenarios**, and `npm run build` passed. No Gemini secret was found in the client bundle; dependency audit reported zero vulnerabilities. Screenshots were inspected at 390px and 1280px. Physical phone testing and hosted routing remain unverified.


## v4 — October 24, 2026 — alignment with other Howdy Hack conversation

- Chose **React + Vite + TypeScript + Tailwind + React Router**, matching the other conversation’s recommended implementation path. Server-only Gemini requests now use Vercel `api/` functions; Vite local dev limitations and public `VITE_` env rules are stated explicitly.
- Separated **safe discovery** (card, pixel artwork, gear saved immediately, zero cleanup XP) from **optional self-reported cleanup** (once per card, +10 XP and +5 for first confirmed category). This resolves the other chat’s warning that photographing litter does not prove it was picked up.
- Retained real weekly self-reported cleanup XP leaderboard, opt-in public profiles, and no fake scores, plus core original red crab, five equipment slots, and genuine CPU practice battles. Online PvP remains a validated stretch goal.
- Added GitHub/Vercel/Supabase/Gemini/Figma handoff setup order and `CROSS_CHAT_ALIGNMENT.md` to explain differences; no external accounts, designs or code were actually created.
- The v3 details below are historical; v4 rules take precedence when they differ.

## v3 — October 24, 2026 — Figma + Battle Bots

Added:
- Figma-first design-system and Codex MCP handoff guide (`FIGMA_UI_WORKFLOW.md`). No Figma canvas/file is included or claimed.
- Connected second game loop: every eligible saved trash card can supply standardized **wearable gear for the red crab**.
- `GEAR_CATALOG.md`: five equipment slots, intuitive per-item mappings (bag helmet, magazine body armor, bottle weapon, can shield, bottle-cap boots), fixed stats, subtype precedence and hazard safeguards.
- `BATTLE_SYSTEM.md`: actual short **turn-based Practice vs CPU**, authoritative damage/Guard/Tidal Slam rules, fair stats independent of rarity, and optional secure real-player invite PvP.
- Workshop + practice battle routes and Figma frame names, data models, acceptance tests, stage prompts and revised demo.

Changed:
- Core pitch is now **Scan → Collect → Equip → Battle**, not just a ShoreDex with leaderboards.
- Original nine cleanup category keys retained for easy compatibility; magazine is a paper/cardboard subtype and safe bottle example a constrained `other_litter` subtype.
- XP still +10 safe cleanup and +5 new category; cosmetic rarity still 60/27/10/3. Battle wins are separate from cleanup XP.
- Existing real weekly leaderboard remains an integration target; **online 1v1** is a separately documented stretch feature and never simulated as humans.
- MVP priority shifts to completing a true cleanup→gear→CPU experience before risky online PvP work.

## v2 — original scanned-litter vision

Retained: Gemini-first recognition/localization, object-centered crop/mask instead of whole photo, safety confirmation, rarity-tiered ShoreDex, IndexedDB persistence, real opt-in weekly cleanup-XP leaderboard with honest fallback, and privacy/security guardrails.

## Decisions to revisit when implementation begins

1. Whether an actual Figma file/frame will be connected before Codex builds screens (none supplied yet).
2. Whether available Gemini model reliably returns masks; manual crop is always required.
3. Whether the tournament/demo needs real PvP; current recommendation is CPU MVP + real PvP stretch.
4. Whether **intact bottle** gear should be limited to a virtual illustrative sprite; MVP safest path is plastic bottle `bottle_blade` and no glass encouragement.
5. Need real server-backed inventory ownership before online PvP loadouts can be trusted. Local-only inventory must not be accepted as authenticated PvP power.

## Historical package status (before implementation)

These files are product and technical **specifications only**. No Figma file, codebase, assets, Supabase schema, real Gemini endpoint, tests, hosted demo or PvP were created by this planning ZIP.

## 2026-10-24 — Native camera and real GPS transition

Implemented Capacitor 8 iOS/Android projects (`com.pixelogy.dev`), camera-first scanning, foreground GPS lifecycle, geographic MapLibre/OpenFreeMap rendering, retained original avatar/equipment, revocable remembered Gemini consent and native HTTPS backend configuration. No production joystick or fictional map remains reachable. IndexedDB v3 preserves saves and adds privacy preferences. Updated setup, architecture, task and store-readiness documentation. Original icon/splash placeholders added to both native asset structures.

Verification completed:

- Baseline: 27 tests and TypeScript passed before changes.
- Final: TypeScript, ESLint, **38 unit/API tests**, production build and Capacitor sync passed.
- **34 Playwright checks passed** (17 Chromium + 17 WebKit). Includes capture → safe save without disposal → equip → CPU battle → reload → optional cleanup; remembered consent/revocation; denied camera/GPS; accuracy errors; map failures; stream shutdown; phone/desktop/landscape layout; keyboard/reduced motion; production offline shell and API-cache exclusion.
- Live production OpenFreeMap rendering inspected at a synthetic test coordinate: geographic paths/buildings visible, attribution present, no page errors or map-error state. This is not a physical GPS test.
- Native permission XML/plist validated; no background location modes; existing Gemini secret absent from production assets. npm audit reported zero vulnerabilities after pinning CLI 8.4.3 (avoids the vulnerable transitive xcode/uuid dependency in newer CLI versions).
- Fixed issues found during verification: map sizing, explicit Vite MapLibre worker URL, WebKit fixture API injection and consent transaction/UI ordering.

Native build attempts: `xcodebuild` could not run because only CommandLineTools is installed; Android `./gradlew assembleDebug` could not run because no Java runtime is installed. Android SDK is also absent. Projects were generated/synchronized, not compiled, signed or run on phones. Camera launch, native permissions, Android process restoration and GPS behavior need physical-device acceptance.

No deployed native API URL was supplied; native Gemini remains manual until configured. Supabase/cloud accounts, rankings and PvP remain unavailable. No deployment or store submission was performed. MapLibre is lazy-loaded; its roughly 1.06 MB uncompressed map chunk still triggers Vite's size warning. Third-party map availability and phone rendering performance require ongoing device validation.

## 2026-10-24 — PWA-first release

Made the web PWA the primary release path while preserving optional native projects and all local gameplay/saves. Aligned manifest/HTML theme colors and branding; added original dedicated maskable and Apple touch icons. Added an accessible Safari Share → Add to Home Screen → Open as Web App → Add guide in Profile, standalone detection and offline/storage/permission explanations.

Static caches are now versioned by content, including generated HTML, icons and manifest. Worker generation explicitly runs after HTML emission; missing shell output fails the build. Only explicit static assets are precached; API/private/query-bearing responses and third-party map traffic are excluded. Updates wait for user action, offer Later, and support explicit reload after activation in another tab. Cache cleanup retains assets needed by old tabs and does not delete pending newer caches.

Vercel config now excludes static PWA assets/API routes from SPA rewrites and specifies manifest MIME type, service-worker revalidation, immutable hashed assets and nosniff headers. PWA deployment instructions are in PWA_SETUP.md. No website was deployed; remote edge/header behavior is not claimed verified.

Verified: TypeScript, ESLint, 40 unit/API/configuration tests, production build, and 38 browser tests (19 Chromium + 19 WebKit). After the final multi-tab update improvement, all six targeted PWA/offline checks passed again. Coverage includes service-worker update waiting and explicit reload, second-tab reload, offline deep-link restart, API/private cache exclusions, install assets/guide, camera permission errors, full capture-to-cleanup flow and existing responsive/layout checks. Installation guide visually checked at 390px with no horizontal overflow. Existing MapLibre chunk-size warning remains; map code is lazy-loaded.

Not verified: actual iPhone Add to Home Screen installation, physical camera/GPS, or deployed Vercel HTTPS/API behavior. No deployment URL was supplied. Apple membership, native SDKs and native signing are not prerequisites for this PWA release.


## 2026-10-24 — Separate matchup preview and beach battle arena

- Kept Practice vs CPU as the intro with current loadout, stats and Start Battle. Match creation now happens on Start; gear, stats and trainer appearance are snapshotted.
- Added original pixel beach SVG, trainer plus equipped crab, opposing CPU, top HP bars, real action messages, expandable log and fixed phone controls. Results offer replay, matchup and workshop navigation.
- Preserved the pure battle resolver, deterministic CPU, Guard/cooldown rules and zero cleanup XP. No data migration or API changes. CPU timers pause in background and are canceled on exit/replay/unmount.
- New presentation: `src/battle/BattleScreens.tsx` and `src/battle/battle.css`; session controller: `src/pages/Battle.tsx`; stylesheet import: `src/main.tsx`. Updated gameplay, world, offline and PWA tests; added dedicated battle browser coverage.
- Verified typecheck, lint, 43 unit/API/config tests, five plain-Node API smoke assertions and production build. Final uninterrupted browser run: **52 passed** in Chromium/WebKit, including complete AI discovery → gear → CPU battle → reload → optional cleanup, background pause, exit/replay, exact guarded HP and equipped sprite.
- Inspected rendered phone/landscape screenshots; viewport tests cover 375×667, 390×844, 430×932 and 844×390 with reduced motion and 44px controls. Focus transitions are asserted.
- An intermediate WebKit flow was interrupted by a dev-server reload while documentation was being edited; the final suite ran with files unchanged and passed. Non-failing Vite module-import messages still appear during some navigation tests. Production build retains the pre-existing large MapLibre chunk warning.
- Vercel deployment and physical-phone acceptance were not performed. No external artwork or new Figma design was used.


## 2026-10-24 — Three-slot attacks and separate crab progression

- Added a pure central move registry and eligibility module (`src/lib/moves.ts`). Main attacks unlock at crab levels 1/3/5/8/12; Defend is permanent; five specials require equipped owned gear at any level. Basic Splash is the explicit no-special fallback. Unlocks never replace a selected main attack.
- Expanded the deterministic resolver to rules version 2 with per-move own-turn cooldowns, counterattacks, full-action defense, multi-hit damage, temporary ATK reduction and Speed scaling. The CPU snapshots eligible moves and learns stronger main attacks at the player's level. Preserved gear stats, speed-first turns and beach/trainer/crab presentation.
- Added Workshop Moves cards and dynamic three-action arena buttons, real effect messages and registry-selected animations. Main/special selections persist; removing source gear reconciles the special in the equipment transaction.
- Added local crab battle progression: 40 XP win / 15 loss / 0 exit, 100 XP per level. Explorer/cleanup XP stays independent. IndexedDB v4 adds progression and unique match-reward stores without replacing existing saves. Completed result saving is atomic/idempotent; storage failures offer retry before replay. No Supabase tables or cloud progression existed to reuse; none were fabricated.
- Verified 57 unit/API/config tests, typecheck, lint, five Node API smoke assertions and production build. Final complete browser run: **56 passed** in Chromium/WebKit, including reward retry/level unlocking, selected actions, removal/persistence, full discovery-to-cleanup regression, background CPU pause and production offline/PWA upgrade behavior. Inspected arena phone/landscape and Workshop screenshots.
- Initial balance values are documented in ATTACK_SYSTEM.md; long-term balance tuning, deployment and physical-device acceptance remain open. Production build retains the existing MapLibre chunk-size warning.


## 2026-10-24 — Priority release audit

Fixed canonical confirmation callbacks, shared persistent email cooldown, capture lock/lifecycle races, camera-first consent flow and optional account-cache failure handling. Corrected the opening observation label to CAPTION without changing its words. Live Supabase redirect allowlist extended to all allowed production return pages; SMTP is still disabled. No migrations or player-data deletion. Full browser regression 120/120 passed, plus live rollback RLS/campaign SQL checks and production HTTPS/API rejection checks. See `docs/audit/RELEASE_AUDIT.md` for final checks, file list, configuration and blockers. New code remains local until deployment.


## 2026-10-25 — Independent Player/Crab progression and foreground walking

Implemented separate Player XP (cosmetics) and Crab XP (existing battle_xp; attacks), with unchanged cleanup statistics. Both levels use 1 + floor(XP / 100). Each cumulative 100 eligible GPS metres awards +8 Player XP and +5 Crab XP together, capped at 10 km per UTC receipt day. Added conservative raw-GPS filtering, durable account-scoped distance outbox, authenticated idempotent server receipts and shared server-time limits. Precise coordinates remain in memory. Existing explorer levels are seeded once from old cleanup totals; future cleanups affect neither level.

Added six original cosmetics beyond the default: Lagoon/Sunshine shirts (2), Coastal bun (3), Wave shirt (5), Sunset shades (8), Explorer vest (10). Added independent HUD/Profile progress, locked customization with server enforcement, avatar layers and queued Player/Crab celebrations. Attack thresholds and selected attacks, permanent Defend, gear specials and battle rules are preserved. Fixed Profile draft refresh so walking sync cannot discard unsaved customization.

Applied additive Supabase migrations `20261025120000_dual_progression.sql` and `20261025120100_bind_walking_account.sql` to project `rsdgbxpqpdewqpmeuwvp`. No existing player rows were deleted. Local IndexedDB upgrades to v5 without resetting prior stores.

Verification completed:
- TypeScript frontend and NodeNext server checks, ESLint, 95 unit tests, nine plain-Node API assertions and production build passed. Existing large-chunk warning remains.
- Full Chromium/WebKit run: 121 passed, three failed (two obsolete cleanup-HUD assertions and one asynchronous consent-helper race). Corrected those tests without changing scanner behavior; reran all scanner/game, polish and move tests: **46/46 passed**, including all three prior failures. All 124 browser cases have passing results across the full run and focused rerun; this is not a claim of a second clean full-suite run.
- Both engines passed new walking/dual-level/reload/cosmetic tests. Reviewed phone screenshots at 375×812, 390×844 and 430×932. Existing landscape, keyboard, reduced-motion, GPS lifecycle, full campaign, PWA update and offline regressions passed in the full run.
- Live rollback SQL tests `walking.sql`, `rls.sql` and `conspiracy.sql` passed, including duplicate receipts, server-time/speed/cap rejection, account binding, RLS, cosmetic locks, cleanup independence and story reward independence. Test fixture transactions roll back.

Frontend is not deployed. Physical iPhone/Android walking, stationary drift, low-signal/foreground transitions and spoof-resistance remain unverified; browser fixtures cannot establish these. Server bounds do not prove genuine walking or perfectly detect slow vehicles/cross-device duplicate measurement. Pending offline segments remain on their original device and need online syncing time. See `PROGRESSION.md` for formulas, file inventory, migration and privacy details.

## 2026-10-25 — Optional accounts and U.S. cleanup map

Implemented guest camera/Gemini discovery, canonical local inventory/equipment, local Story Mode and foreground walking with separate Player/Crab XP. Added optional Save Your Progress, verified/idempotent guest snapshot import, safe conflict rules, legacy-art preservation and failed-transfer recovery. IndexedDB v6 is additive. Exact story dialogue, battle calculations, auth/recovery and existing gameplay remain intact.

ShoreDex retains its default grid and adds an optional interactive 50-state map with Alaska/Hawaii insets, searchable state controls, real cleanup statistics and offline support. Only optional safe-disposal reports color states. State lookup runs on-device from a fresh fix; uncertain borders require confirmation and denied/poor/outside-U.S. fixes remain unassigned. Coordinates are discarded. Reviewed 375×812, 390×844 and 430×932 screenshots; added an opaque cream footer for readable privacy/attribution text over the tropical background.

Verification:
- TypeScript frontend/NodeNext, ESLint, **103 unit tests**, **nine plain-Node API assertions**, production build and diff whitespace checks passed. Production still warns about large chunks; bundled geometry adds to the main bundle.
- Complete Chromium/WebKit suite: **130/130 passed**. After final hardening and map polish, focused guest/offline checks passed **8/8**, then the final camera→discovery→two-state cleanup→equipment→CPU/reload and production-offline rerun passed **4/4** across both engines. Some existing non-failing Vite module-load messages occur during browser teardown/navigation.
- All repository migrations applied successfully to isolated PGlite PostgreSQL with pgcrypto; four rollback SQL fixtures (`rls`, `conspiracy`, `walking`, `guest`) passed. Checks include quota forgery and caps, source/account isolation, import retry and overlap, legacy gear, malformed legacy records, cleanup provenance/state immutability and existing reward rules. Local database results are not hosted acceptance.

Three staged guest/quota/map migrations are prepared but **not applied live**. Automatic approval review rejected the combined live migration because it changes privileged functions, grants/RLS, cleanup rewards and guest imports. No bypass or live database change was performed for this feature. Migrations require review/approval before deployment. Hosted anonymous Gemini, real email delivery, cross-device imports/map sync and physical-phone camera/GPS remain unverified. See `GUEST_AND_US_MAP.md` for changed files, merge limits and rollout order.

## 2026-10-25 — Cloud scanning diagnosis and actionable errors

Reproduced the deployed guest-scan 503 and confirmed the missing `reserve_guest_scan` Supabase RPC is the pre-Gemini blocker. Vercel's identification route loads, production Gemini/signing/Supabase variable names exist, and the live catalog has 200 entries. No secrets were revealed. Live quota migration was rejected by automatic approval review; no database, environment or deployment change was made.

Added stage-specific safe error codes/request IDs, quota/signing/provider diagnostics and friendly client timeout/non-JSON handling. Guest saves remain local and idempotent; existing account import logic is preserved. Added an original sample bottle image and deterministic integration coverage through the actual catalog matcher, receipt signer and IndexedDB save with mocked external provider/database boundaries. No failed identification awards a collectible.

Passed typecheck/NodeNext, lint, 117 unit/integration tests, nine plain-Node API assertions, 40 Chromium/WebKit scanner/guest cases, four local PostgreSQL rollback fixtures and production build. See `docs/SCAN_REPAIR.md` for full trace, exact missing migration, configured variables, backup prerequisites and pending hosted/device checks. Production is not repaired until the missing live migration is approved/applied.
