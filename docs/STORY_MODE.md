# The Shattered Tide — Shellshore release

The first chapter is implemented: **Shellshore Beach, five playable stages**. Open Story Mode from the sixth crab-menu tile. Profile/account/privacy/settings remain accessible through the top-left avatar with its gear indicator. Story’s fictional island is separate from the unchanged real-GPS overworld.

## Playable content

1. Message in a Bottle — Pip and Button.
2. The Shell Toll — Nori and Winkle.
3. Pier Pressure — Skipper and Clatter.
4. Sandcastle Stand — Tansy and Dune.
5. Captain of the Dunes — Captain Sandy and Bulwark; requires the other four wins.

Each NPC has an original avatar composition, dialogue and stats. Sandy and Skipper use counters, Nori periodically defends; all use the existing deterministic battle resolver. Tests demonstrate that every stage can be won with a level-one crab and no collected gear. The player’s account equipment, level and selected moves are loaded on the server and frozen at Start. Enemy equipment is NPC-only and never added to inventory.

The opening lasts 30 seconds (five six-second scenes): sunset village and lighthouse, airship/lightning/shard theft/shockwave, approaching crab with a story-only bottle-cap helmet, rival challenge, and zoom-out island reveal. Original SVG/CSS artwork provides camera pan, crab approach, beacon, airship, moving shards and ocean animation. Shared cutscenes also cover Shellshore entry, Sandy’s introduction and chapter completion. Skip/Next/replay are available. Hidden documents pause scene timers; system/profile reduced motion removes animation. Boss completion recovers the first shard and displays a Shellshore Sunburst **story portrait cosmetic**, without changing gear or stats.

Rustport’s route unlocks after Sandy, but **Regions 2–5 are not playable**. Their four labels are future-chapter markers, not simulated battles. Wrench, Vex, Mara, Blacktide, the later revelations, Champion title and branching final endings remain incomplete. The reusable stage/cutscene architecture is in place for those chapters. No complete 25-stage campaign is claimed.

## Progress and security

Migration `20261025005841_story_shellshore.sql` is applied to the connected Supabase project. It adds:

- `story_matches`: authoritative battle snapshots, versions and awarded XP.
- `story_progress`: unique owner/stage clears and best stars.
- `story_cinematics`: watched/skipped cinematic IDs.

All three tables have owner-only SELECT policies. Authenticated clients have no direct write privilege. `/api/story` authenticates the caller, loads the actual owned equipment and move selections, checks stage gates, resolves legal actions, and signs a bounded receipt using the existing server-only signing secret. `apply_story` verifies purpose/user/expiry/signature, locks the player, checks expected match version, rechecks the boss gate and atomically saves progress/XP. Start and turn retries are idempotent. Starts are capped at 30/hour. No winner, XP, gear stats or stars supplied by the browser are trusted.

Regular first clears grant 40 battle XP each; Sandy grants 80, totaling 240. Defeat, exit and repeat clears grant zero. Replays can improve the best star rating. Existing `player_progression.battle_xp` drives the existing crab level/main-move unlocks; there is no story-specific level. Cleanup claims/XP, discoveries and scan-exclusive equipment are untouched. Shard count, unlocked route and Sunburst ownership derive from the boss clear, avoiding duplicate claims.

Stars: win = one; at least 50% HP = two; at least 75% HP within six own turns (eight for Sandy) = three. Wins alone unlock the boss.

Story battles require sign-in and connectivity. There is **no local campaign fallback or offline story reward synchronization**. Existing offline inventory/equipment/practice continue working. Errors provide retry; failed Start retries retain the request UUID. Leaving or reloading ends the displayed in-memory match; completed progress survives. Unfinished server match records do not award XP. Guest opening previews are not persisted.

## Development and deployment

`npm run dev:api` serves the frontend plus analyze, practice and story handlers. It requires the existing Supabase URL/publishable key and matching server-only `SCAN_SIGNING_SECRET`. Bare `npm run dev` is frontend-only. `npm run build` includes NodeNext compilation and plain-Node loading of all three emitted API handlers. Vercel’s existing `/api/` exclusion and same-origin requests cover the new route. Service-worker caching remains limited to static assets; private story API/Supabase responses are not cached.

The database migration is live. **The new frontend and `/api/story` have not been deployed or exercised on Vercel.** Redeploy, then test a real signed-in first clear, replay, cross-device progress and cinematic preferences. No physical-phone camera/GPS/Story acceptance is claimed.

## Verification

- Typecheck, lint, 78 unit tests, nine plain-Node rejection checks and production build passed. The existing large-bundle warning remains.
- Full Chromium/WebKit run: 88/92 passed, including all 86 existing regressions and both five-stage campaign playthroughs. The four remaining failures identified an ambiguous test selector and an actual retry layout shift. After fixing both, all six Story tests passed in the targeted run.
- Story browser coverage: intro skip/replay, all five victories, CPU-first battle, boss gate, 240 total XP, no cleanup rewards, repeat win with no extra XP, persisted reload, workshop return, failed-request retry, rapid Start taps, quitting, reduced-motion focus and 375×812 / 390×844 / 430×932 / landscape layouts. Screenshots inspected for the map and arena. Browser service responses are deterministic fixtures, not hosted integration evidence.
- Existing complete capture → safe AI save → equip → CPU battle → reload → cleanup passed in both browsers, as did GPS lifecycle, camera/consent failure handling, account flows, production offline reload and PWA update/cache exclusions.
- Live Supabase rollback test (`supabase/tests/story.sql`) passed: locked-boss rejection, first-clear/replay idempotency, best-star retention, no cleanup reward, forbidden direct writes, forged receipt rejection and cross-account isolation. Zero fixture accounts remained after rollback. The test uses transaction-only users and a transaction-only signing key; production credentials are not exposed or changed.

## Main changed files

Campaign, map/cutscenes and screen/controller: `src/story/campaign.ts`, `Cutscene.tsx`, `Story.tsx`, `story.css`. Server: `api/story.ts`, `server/playerBattle.ts`, and the practice handler’s extraction of its shared trusted-player loader. Combat: `src/lib/battle.ts`, `src/battle/presentation.ts`, `src/battle/BattleScreens.tsx`. Navigation: `src/App.tsx`, `src/world/GameMenu.tsx`, `OverworldScreen.tsx`, `src/pages/Workshop.tsx`, `src/cloud/authNavigation.ts`. Tooling: `vite.config.ts`, `scripts/check-api-runtime.mjs`. Persistence: the story migration and rollback test. Tests: `tests/story.test.ts`, `tests/cloud-story.test.ts`, `tests/e2e/story.spec.ts`, and updated world navigation tests.
