# The Blacktide Conspiracy

This is Pixelogy’s canonical Story Mode, replacing the magical Shattered Tide narrative. Blacktide Industries, led by CEO Caspian Vale, deliberately dumps waste to create demand for its cleanup contracts. The player witnesses a nighttime operation; a red crab emerges from discarded packaging and defends them. Together they collect evidence and expose the scheme.

Story is a separate fictional adventure. The real-GPS overworld, scanner, predefined ShoreDex, equipment, three-slot combat, attack timing and cleanup loop remain unchanged. Story Mode occupies the sixth crab-menu tile; Profile/Settings is on the HUD avatar.

## Playable campaign

All five regions have four regular trainers and a boss, original themed scenery, dialogue and NPC appearances. Four distinct trainer wins unlock the regional boss; that boss unlocks the next region. Stars never gate progress.

| Region | Trainers | Boss | Evidence |
| --- | --- | --- | --- |
| Shellshore Beach | Pip, Nori, Skipper, Tansy | Foreman Sandy | Night-shift manifest |
| Rustport Harbor | Jett, Bex, Olin, Cora | Wrench | Falsified shipping contracts |
| Neon Boardwalk | Fenn, Lumi, Dax, Suri | Vex | Unedited internal recording |
| Whispering Mangroves | Reed, Ivo, Nell, Tobin | Director Rook | Dr. Mira’s research archive |
| Blacktide Headquarters | Aster, Quinn, Mace, Petra | CEO Caspian Vale | Tideledger access codes |

Dr. Mira is the scientist ally in the Mangroves. The Tideledger is Blacktide’s internal financial record, not a magical artifact. The final battle reveals Vale’s deliberate pollution-for-profit orders; the ending broadcasts the evidence, shuts down the dumping network and shows the restored island chain.

The 25 stages reuse the existing deterministic resolver. Enemies use defensive counters, harbor armor, fast boardwalk attacks, reserve snares and executive equipment specials. The player’s actual owned gear, selected moves and crab level are loaded on the server and frozen at Start. Enemy equipment is NPC-only and never enters inventory. Unit tests demonstrate that the full campaign can be won with earned main-attack unlocks and no collected gear; hazardous pickups are never required.

Each regional map and arena has original code-generated SVG scenery: beach cottages/palms, harbor cranes/containers, neon boardwalk/Ferris wheel, mangrove roots/research structures and offshore headquarters. Boss clears remove litter and add wildlife/flowers; the island overview and case files update from saved progress. This visual restoration is fictional and never claims real cleanup.

## Animated scenes

- Opening: five six-second scenes, from sunny beach advertisement through nighttime dumping, security confrontation, crab emergence and battle readiness. Original SVG/CSS animates the camera, truck, falling packaging, searchlight, waves and sprites.
- Each region: two-scene briefing, two-scene boss introduction and two-scene restoration. Boss introductions play before the first battle; restoration plays after a saved boss victory. Briefings and all unlocked scenes are available from the map’s cutscene controls.
- Finale: three scenes covering public evidence, shutdown and the restored coastline. It replaces the normal completion scene after Vale; the Headquarters restoration scene is also replayable.

The opening plays automatically on first signed-in entry. Skip, Next and replay are available. Scene timers pause when hidden; system/profile reduced motion disables decorative animation. Guest users can preview the opening, but guest preferences are not persisted. Keyboard focus moves to the cinematic heading. Portrait and landscape layouts preserve controls.

## Persistence and security

The original 20261025005841_story_shellshore.sql and additive 20261025013308_blacktide_conspiracy.sql migrations are applied to the connected Supabase project.

- story_matches stores authoritative battle snapshots and versions.
- story_progress stores unique owner/stage clears and best stars.
- story_cinematics stores watched/skipped preferences.

Existing shellshore-1 through shellshore-5 IDs, clears, stars, XP and old cinematic flags remain intact. Evidence and restoration derive from boss clears, so existing players receive the new narrative presentation without duplicate rewards. The revised opening uses conspiracy-opening; a legacy opening flag does not hide it. No inventory or cleanup migration occurs.

Tables retain owner-only SELECT policies and deny direct client writes. /api/story authenticates the caller, loads owned equipment and moves, enforces gates, resolves actions and signs bounded receipts. apply_story verifies purpose/user/expiry/signature, locks the player, checks match version, rechecks region/boss gates and atomically saves progress/XP. Start and turn retries are idempotent; starts are limited to 30/hour. Browser-provided winners, damage, XP and gear modifiers are not trusted.

First clears grant 40 battle XP per trainer and 80 per boss: 240 per region, 1,200 across the campaign. Defeat, exit and repeat clears grant zero. Replays can improve best stars. The existing battle XP controls crab level and main-attack unlocks; no separate story leveling system exists. Cleanup XP and claims remain separate. The existing Shellshore Sunburst portrait cosmetic remains available without granting gear or stats.

Stars: win = one; at least 50% HP = two; at least 75% HP within six own turns (eight for bosses) = three.

Story requires sign-in and connectivity. There is no offline campaign reward synchronization. Existing offline inventory/equipment/practice remain available. Failed requests offer retry; failed starts retain their request UUID. Leaving/reloading ends the displayed in-memory battle, while completed progress survives. Unfinished server matches award nothing.

## Running and deployment

Run npm run dev:api to serve the frontend plus analyze, practice and story handlers with the existing Supabase configuration and matching server-only SCAN_SIGNING_SECRET. Bare npm run dev serves only the frontend. npm run build includes NodeNext compilation and plain-Node loading of all three emitted API handlers. Service-worker caches remain static-only; private story/API/Supabase responses are excluded.

The database expansion is live. The changed frontend/API have **not been redeployed or tested on Vercel**. Redeploy, then test real signed-in first clears, replay rewards, next-region gates and cross-device saves. Physical-phone camera/GPS/Story acceptance remains unverified.

## Actual verification

- Typecheck, lint, **79 unit tests**, nine plain-Node API rejection checks and production build passed. The existing large-bundle warning remains.
- **104/104 Playwright tests passed** across Chromium and WebKit. Coverage includes all five Shellshore wins, each later regional boss, evidence/restoration, final exposure, versioned intro replay, legacy progress, region/boss deep links, retries, rapid Start taps, exit without rewards and persisted reload.
- Unit tests resolve all 25 encounters using earned main attacks without scan gear and reproduce every authoritative turn through the existing presentation system.
- The unchanged capture → safe AI save → equip → CPU battle → reload → optional cleanup regression passed in both browsers, alongside GPS lifecycle, camera/consent, authentication, production offline reload and PWA update/cache exclusions.
- Browser layout checks cover 375×812, 390×844, 430×932 and 844×390, reduced motion and keyboard focus. Screenshots inspected for the overview, all five regional arenas, nighttime dumping and landscape introduction. Browser services are deterministic fixtures, not live integration evidence.
- Live Supabase rollback test supabase/tests/conspiracy.sql passed: existing Shellshore clears and old cinematic flags survive; 25 unique clears total 1,200 XP; legacy replays and duplicate receipts award nothing extra; best stars remain; all gates, forbidden writes, forged receipts and cross-account isolation are enforced; no cleanup reward occurs. Post-test counts match the prior story state and zero fixture accounts remain. Transaction-only test users and signing changes were rolled back.

## Changed files

Presentation/content: src/story/campaign.ts, StoryArt.tsx, Cutscene.tsx, Story.tsx, story.css, src/battle/BattleScreens.tsx, src/App.tsx. API gate copy: api/story.ts. Persistence: supabase/migrations/20261025013308_blacktide_conspiracy.sql, supabase/tests/conspiracy.sql. Tests: tests/story.test.ts, tests/e2e/story.spec.ts. Canonical status: this document, README, project plan, implementation checklist, cross-chat alignment and revision notes.
