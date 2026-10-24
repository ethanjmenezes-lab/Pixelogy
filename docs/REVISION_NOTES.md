# Revision history and key decisions

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
