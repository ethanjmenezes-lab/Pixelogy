> Guest extension: local walking and progression now work without an account. See [guest/map implementation](GUEST_AND_US_MAP.md); earlier guest-login requirements below are superseded.

# Independent Player and Crab progression

Current contract, 2026-10-25. This explicitly supersedes the former no-walking-rewards and cleanup-derived explorer level rules.

## Three measures, two levels

- Player level = `1 + floor(player_xp / 100)`. Player XP unlocks human cosmetics only.
- Crab level = `1 + floor(battle_xp / 100)`. The existing `battle_xp` column is reused as Crab XP, not duplicated. It unlocks Slot 1 attacks at levels 1/3/5/8/12: Pinch Attack, Shell Slam, Double Pinch, Tidal Strike, Crushing Claw. No automatic selection on unlock.
- Cleanup XP remains the sum of optional self-reported cleanup awards. It affects neither level going forward. Walking, discovery and fictional battles never add cleanup XP.
- Every cumulative 100 eligible metres: +8 Player XP and +5 Crab XP atomically. Fractional milestone progress is retained as integer millimetres. 10 km daily acceptance cap, based on server receipt day at 00:00 UTC.
- Practice rewards remain +40 win / +15 loss / +0 exit. Story first clears remain +40 trainer / +80 boss; repeated clears and story defeats retain their existing zero-reward behavior. Offline account practice gives no rewards. These add only Crab XP.
- Defend is permanent Slot 2. Slot 3 eligibility still comes from collected, currently equipped trash.

## Walking and privacy

`src/progression/config.json` is the central rules file. Its deployed server copy is in the non-client-writable `private.progression_rules` table. After changing rules, generate an additive SQL settings migration with `node scripts/progression-config.mjs` and review/apply it; changing a browser constant cannot change server awards. Changing either level formula also requires updating generated database columns.

Only raw foreground device fixes from `useDeviceLocation` reach the reward reducer. Display interpolation, dragging, recentering, animation and story movement never enter it. Samples and anchors stay in memory. Pausing location, opening another screen/menu, denial, bad accuracy, backgrounding and resume break continuity.

Walking requires accuracy ≤20 m, distance beyond both accuracy radii (at least 5 m), speed 0.3–2.7 m/s and a gap ≤30 seconds. Invalid/stale/future fixes, duplicate/out-of-order timestamps, jumps and high speed do not award distance. Sub-accuracy movement is unverified, not counted as distance. These conservative limits may undercount walks in poor conditions; physical tuning remains necessary.

Each accepted segment is written to an account-scoped IndexedDB outbox with a stable UUID, distance and elapsed duration; **no coordinates or trail**. Sync runs roughly every 10 seconds and survives route changes. Lost responses retry the same ID. Server RPCs require authentication and expected account identity, serialize each account, validate summary bounds, limit consumption to elapsed server time (at most a 120-second budget), rate-limit receipts, enforce the daily cap, and atomically update both XP balances and the ledger. Replaying an event cannot award twice. Account switching cannot credit an old outbox item to the new account.

Server validation bounds claims but cannot prove that a browser measured genuine walking. Sophisticated spoofing, slow vehicles and duplicated measurements across devices cannot be perfectly detected without stronger attestation. Do not describe this as server-verified travel or competition-grade anti-cheat. Offline queued summaries may need time online to drain under the server-time budget. Keep the app open to finish syncing; offline acceptance is not promised. Server-approved partial totals sync across devices; unsent segments stay on their originating device. Storage denial is reported and cannot preserve new unsaved distance. Guests can explore but must sign in for walking rewards.

## Cosmetics and UI

All pre-existing skin/hair colors, short/long hair, four shirt colors and cap remain free at level 1, preserving previous access. Seven catalog entries include the default Coral shirt plus six additions:

| Cosmetic | Player level |
| --- | --- |
| Lagoon shirt, Sunshine shirt | 2 |
| Coastal bun | 3 |
| Wave shirt | 5 |
| Sunset shades | 8 |
| Explorer vest | 10 |

Original SVG layers render choices in preview, overworld and trainer views. Appearance has no combat bonuses. Locked choices show required levels; the database enforces locks. Player XP is monotonic, so derived unlocks remain permanent. Profile holds independent XP bars, distance, cleanup statistics, customization and attack shortcuts. Both HUD level indicators open Profile details. Simultaneous level-ups use a single queued notice with separate celebrations and shortcuts; reduced-motion preferences apply.

## Persistence and migration

Applied migrations: `20261025120000_dual_progression.sql` and `20261025120100_bind_walking_account.sql`.

The first adds `player_xp`, `walking_mm` and generated Player/Crab level columns to existing progression, plus an owner-readable reward ledger and private validation settings/clock. The second binds reward submissions to their original authenticated account. Existing Battle XP, gear, moves, discoveries, cleanup and story rows are retained. Existing cleanup totals seed Player XP **once**, preserving the previous explorer level without changing cleanup balances or making future cleanup awards count twice.

IndexedDB upgrades additively to version 5 with a Player progression store. A legacy guest's cleanup total seeds Player XP once on first read. Previously available cosmetic choices stay available. Guest legacy XP is not imported into authoritative cloud rewards. No new Vercel environment variables or privileged browser credentials are required.

## Verification

See the dated revision entry for completed checks. Automated GPS/camera and Supabase response fixtures do not prove real walking. Live database rollback tests cover dual rewards, receipt replay, speed/server-time rejection, daily cap, direct-write denial, cross-account isolation and cosmetic/attack independence. Physical iPhone/Android walking, drift, foreground/resume and low-signal behavior remain release acceptance requirements. Frontend deployment is separate from database migration.

## Changed files in this delivery

- `AGENTS.md`
- `PROJECT_PLAN.md`
- `README.md`
- `docs/ATTACK_SYSTEM.md`
- `docs/GPS_AND_CAMERA.md`
- `docs/PROGRESSION.md`
- `docs/REVISION_NOTES.md`
- `docs/TECHNICAL_SPEC.md`
- `scripts/progression-config.mjs`
- `src/App.tsx`
- `src/battle/BattleScreens.tsx`
- `src/battle/WorkshopMoves.tsx`
- `src/cloud/game.ts`
- `src/components/GameContext.tsx`
- `src/lib/storage.ts`
- `src/mobile/useLocation.ts`
- `src/pages/Battle.tsx`
- `src/pages/Profile.tsx`
- `src/progression/LevelUps.tsx`
- `src/progression/ProgressionPanel.tsx`
- `src/progression/config.json`
- `src/progression/cosmetics.ts`
- `src/progression/model.ts`
- `src/progression/useWalking.ts`
- `src/progression/walkingStore.ts`
- `src/story/Story.tsx`
- `src/story/StoryPresentation.tsx`
- `src/tropical.css`
- `src/world/OverworldScreen.tsx`
- `src/world/PlayerAvatar.tsx`
- `src/world/profile.ts`
- `supabase/migrations/20261025120000_dual_progression.sql`
- `supabase/migrations/20261025120100_bind_walking_account.sql`
- `supabase/tests/conspiracy.sql`
- `supabase/tests/rls.sql`
- `supabase/tests/walking.sql`
- `tests/e2e/cloudFixture.ts`
- `tests/e2e/device.ts`
- `tests/e2e/game.spec.ts`
- `tests/e2e/moves.spec.ts`
- `tests/e2e/polish.spec.ts`
- `tests/e2e/progression.spec.ts`
- `tests/moves.test.ts`
- `tests/progression.test.ts`
- `tests/walking-storage.test.ts`
