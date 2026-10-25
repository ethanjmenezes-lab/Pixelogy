> Baby-crab opening update (2026-10-24): the user-authorized seven-scene opening supersedes the old eight-shot opening. Compact landing, responsive captions, exact revised dialogue and first-battle transition are implemented. Full browser suite 114/114 passed; final delayed-watch tests 2/2 passed. See [current scope and verification](story/BABY_CRAB_STATUS.md). Earlier opening/version statements below are historical.

# Locked Blacktide Conspiracy implementation

The immutable source is `src/content/story-script.json` (`locked-dialogue-1.0`), copied byte-for-byte from the supplied root `STORY_SCRIPT.json`. The human-readable script is `docs/story/STORY_SCRIPT.md`. These supersede all prior Story Mode writing, character names and evidence descriptions. No generated dialogue or Gemini story writing is used.

## Scope

The reusable player implements 12 scenes / 41 shots: eight opening shots, all five regional arrivals and boss outros, and the six-shot ending. All 25 encounters derive their names, canonical content IDs, pre-battle and post-win dialogue directly from the JSON. One caption speaker is displayed at a time. Dialogue waits for Continue; no-dialogue shots advance at their specified duration. Reading or pausing can extend the nominal 34-second opening.

Opening actions are animated original Canvas/SVG/CSS artwork: sunrise surf/grass/sandcastle crab; corporate billboard and passing truck; moonlit truck convoy and lights turning off; crane/container dump and moving tarp; phone/searchlight/Roan confrontation; cap and emerging crab; armored security crab and claw readiness; seafoam/title/iris into the first node. Per-shot camera transforms pan, tilt or zoom. Region 1 adds Nia's tarp reveal, guarded warehouse path, Sandy's dropped clipboard, evidence/map reveal and volunteers starting cleanup. It remains visibly imperfect rather than magically restored.

Later regions add animated cranes and terminal records, boardwalk feeds/broadcasts, mangrove research cases and sampling, headquarters conveyors/board orders, and the community-restoration ending. These are original stylized geometric pixel scenes, not imported video or full character-rig animation. Post-intro companions render current equipment; the opening cap is a prop and never creates inventory.

| Region | Boss | Exact evidence |
| --- | --- | --- |
| Shellshore Beach | Foreman Sandy | SHIPPING MANIFEST |
| Rustport Harbor | Wrench | DOUBLE-BILLED INVOICES |
| Neon Boardwalk | Vex | UNEDITED RECORDING |
| Whispering Mangroves | Director Pike | ORIGINAL WATER TESTS |
| Blacktide Headquarters | CEO Caspian Vale | THE BOARD ORDER |

The existing deterministic three-slot engine, actual owned gear, trainer customization and authoritative account battle protocol are retained. Four trainers unlock each boss; boss victory unlocks the next region. Story maps are fictional and separate from GPS. Battle/restoration never verifies real-world cleanup.

## Architecture and persistence

- `script.ts`: typed content, scene lookup and legacy-save aliases.
- `StoryCutscenePlayer.tsx`: scene clock, one-speaker captions, Continue/Skip, pause/background handling, reduced motion and opt-in audio.
- `ShotStage.tsx`, `RegionalShots.ts`, `cinematic.css`: shot-specific action, actors and camera presentation.
- `StoryPresentation.tsx`: reusable region map, stage preview and progress UI.
- `Story.tsx`, `campaign.ts`, `BattleScreens.tsx`: exact content integrated with existing progression and battle UI.
- `ARTWORK_LICENSE.md`: original artwork provenance. Audio is a basic original synth motif; **the screenplay's full per-shot sound design is not implemented**. No voice acting or sampled audio is claimed.

The additive migration `20261025023127_locked_story_cinematics.sql` is applied to the connected Supabase project. It expands the cinematic-ID constraint only. All old flags, inventories, cleanup claims, stars, first-clear rewards and stable legacy stage IDs remain. Canonical IDs (for example `boardwalk.01`) map to existing save IDs (`neon-1`); both resolve. New `cinematic.*` flags permit watching the replacement story once without deleting legacy flags.

Existing authoritative API/RPC gates, ownership, match versions and receipt validation remain unchanged. First clears award 40 battle XP per trainer / 80 per boss (1,200 total); repeats/exits/defeats award zero. Cleanup XP is separate. Story requires an account and connectivity; local inventory/equipment/practice remain available offline.

## Actual verification

- Typecheck, ESLint, **83 unit tests**, nine plain-Node API rejection/load checks and production build passed. Existing large-bundle warning remains.
- Content integrity verifies byte equality with the supplied source, SHA-256 snapshot, all exact narrative strings, runtime equality, 5 regions, 25 unique encounters, 5 bosses, 8 opening shots and 6 ending shots.
- Full Chromium/WebKit run: **104 passed, 8 failed** because older boss tests bypassed the new region-arrival scenes, then expected the map on reload. Corrected those tests to visit/watch arrivals and retain every combat/save assertion; **all 8 passed on the targeted rerun**. Thus every one of the 112 cases has passed; this was not a single clean 112-test run.
- Coverage includes all five Shellshore wins; every later boss, evidence and unlock; all 41 shots' exact sequential captions/overlays; gear continuity; measurable animation; pause/background/resume; legacy flags, reload, no duplicate rewards, gates, retries and rapid taps. Unit balance checks resolve all 25 encounters.
- Existing scan → AI save → equip → CPU battle → reload → optional cleanup passed in both browsers, as did GPS, camera/consent, authentication, production offline and PWA cache/update checks.
- Phone layouts cover 375×812, 390×844, 430×932 and landscape, reduced motion and keyboard focus. Portrait and landscape screenshots were inspected. Browser service responses are deterministic fixtures.
- Live `supabase/tests/locked_cinematics.sql` rollback test passed: one legacy plus all 12 current flags coexist; duplicate watch is idempotent. Zero test accounts remain. No reward/storage schema was modified. Prior reward/RLS tests remain in `supabase/tests/conspiracy.sql`.

## Deployment limits

The new allowlist and cinematic constraint are live; frontend/API changes are not deployed. Vercel CLI is logged out. Real emailed recovery on another device, live signed-in campaign/API interaction after deployment, physical-phone camera/GPS and iPhone cinematic performance remain unverified. See `AUTH_RELEASE.md` for the recovery diagnosis and exact acceptance procedure.

Run `npm run dev:api` for local frontend plus analyze/practice/story APIs, or `npm run dev` for frontend only. Production uses `npm run build`; it includes NodeNext API compilation and plain-Node loading. Existing server-only secrets remain unchanged and out of the client bundle.
