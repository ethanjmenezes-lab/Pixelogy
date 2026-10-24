# Battle Bots — gameplay and system rules

## Player promise

A **red crab** wears *your own scanned, safely categorized litter discoveries as visible gear*. Battle mode plays as an original, small, accessible **turn-based creature battle**. The inspiration is broad: approachable strategy similar to popular collectible RPGs, not a copyrighted recreation.

**Modes:**
- **MVP** `Practice vs CPU`: offline-capable local battle with a clearly named CPU opponent. Actual resolver, turn order, gear buffs and win condition; no prerecorded/fake fight.
- **Stretch** `Challenge Friend`: **real** 1v1 vs a separate authenticated human using an invite code. Available only when actual backend state+auth is ready and tested. Hide behind an honest disabled/unavailable state otherwise.

## 1. Stats, equipment and fair power

- Red crab base: `hp=40`, `atk=6`, `def=4`, `spd=4`.
- Equipped stats = base + sum of at most 5 legal gear blueprints from [`GEAR_CATALOG.md`](GEAR_CATALOG.md). Suggested hard caps: HP 60, ATK 15, DEF 15, SPD 12; reject tampered client submissions.
- Rarity affects presentation **only**, not strength. No XP/trophies from a risky object.
- No levels, crit-roll randomness, elemental matchups or loot-box stat rolls in MVP. Builds differ by intuitive item functions.
- Practice CPU chooses one balanced authored loadout **labeled training gear**; do not claim those are a real player's trash cards.

## 2. Turn loop and actions (canonical v1)

A battle is a sequence of **individual alternating turns**. Faster crab acts first. Speed tie uses deterministic seed persisted at match creation (for local CPU use fixed consistent tie). A turn includes one action:

| Action | Effect | Availability |
|---|---|---|
| `pinch` | Attack enemy; move power 7 | Always |
| `guard` | No immediate damage; next enemy damaging hit to this crab is halved, then guard consumed | Always |
| `tidal_slam` | Attack enemy; move power 12 | On your first turn, then after **2 of your own turns** between uses; button shows cooldown |

**Damage formula (single source of truth):** `max(1, floor(movePower + attacker.atk - defender.def / 2))`; if target has Guard, apply `max(1, ceil(damage / 2))`, then consume Guard. HP cannot go below zero. This integer rule is not modified by rarity. Guard protects from the next damaging attack, never stacks; repeat Guard replaces previous guard.

**Cooldown clarity:** If the crab uses Tidal Slam on **its own turn 1**, the move is disabled on **its own turns 2 and 3**, and re-enabled on **its own turn 4**. Track `tidalCooldownRemaining` per actor: check legality **before** decrementing cooldown at the end of that actor's intervening turns; never decrement on the opponent's turn. Guard is legal while Tidal Slam cools down.

**End condition:** match ends instantly when HP reaches 0; winner is the standing crab. Draw if a future rule creates simultaneous KOs, not expected with alternating turns. No extra cleanup XP for wins. Optional separate **Battle Trophies** / win counter, never merged with weekly cleanup leaderboard.

## 3. Practice CPU

- Fixed rule-based opponent, not presented as an AI language model or a human.
- Decision policy: heal isn't supported; if Tidal Slam available and a clear win is possible, use it; otherwise guard periodically when weak, else pinch. Deterministic tests use fixed decisions or seeded random generator captured in battle state.
- UI displays turn banner, crab sprites/gear, HP bars, active action buttons, simple damage animation and text combat log.
- Persist last result if desired but a reload shouldn't invent completed fights. `Restart Practice` resets to legal fresh state.
- `Quit` marks match abandoned; no victory rewards. No forced online login.

## 4. Real PvP flow (**stretch, never fake**)

1. Player signs in using Supabase anonymous authentication, explicitly joins PvP profile; nickname is public, no email or personal photo required.
2. Host creates a server-side invite code with TTL and rate limits. Opponent uses code from a separate authenticated account/session. A user can't join their own match.
3. Before start, server validates that both users own each `collectibleId` and are eligible for its specific blueprint. Snapshot loadouts and fixed rules version/stats at match start (so gear changes mid-fight do not rewrite power).
4. Server creates match `waiting → active`, stores turn owner and an atomic `version` counter. Each action RPC checks authenticated user is one of two participants, is the active player, match is active, action legal / cooldown valid, and supplied expectedVersion matches.
5. Server locks current match state, resolves exactly one action, persists updated stats/guard/cooldown/log and increments version **transactionally**. Repeated request IDs must not apply duplicate moves.
6. Both clients poll or subscribe through Supabase Realtime. If disconnected, re-fetch authoritative match on reconnect; show `Waiting for opponent`, not AI response or fabricated actions.
7. Winner/forfeit/abandon stored as actual result. Support mutual visibility and allow a player to forfeit. Expired invites return errors. Consider inactivity deadline and server-forfeit policy only if genuinely implemented/documented.

**No peer-side authoritative damage. No secret cheat buttons. No opponent simulation labeled as a person.** PvP uses the same pure battle resolver on the server, with schema validation and atomic writes.

## 5. Battle data contract (shape, not implemented migrations)

```ts
type BattleAction = 'pinch' | 'guard' | 'tidal_slam';
type FighterState = {
  userId: string;
  nickname: string;
  startingStats: { hp: number; atk: number; def: number; spd: number };
  currentHp: number;
  guarding: boolean;
  tidalCooldownRemaining: number;
  snapshotGearIds: string[];
};
type BattleState = {
  id: string;
  mode: 'practice' | 'pvp';
  status: 'waiting' | 'active' | 'completed' | 'forfeited';
  rulesVersion: 1;
  version: number;
  currentActorId: string | null;
  fighters: [FighterState, FighterState];
  winnerId: string | null;
  log: Array<{ actorId: string; action: BattleAction; damage: number; turn: number }>;
};
```

A deterministic pure reducer, e.g. `resolveTurn(state, actorId, action)`, rejects illegal actions and returns new immutable state. Keep action authorization separate from resolver for reuse in browser practice and server PvP.

## 6. Acceptance tests

1. Stats from sample loadout match `GEAR_CATALOG.md`; cosmetic rarity has no stat impact.
2. Pinch damage formula and Guard halving give stable exact integers.
3. Tidal Slam blocks **the next two own turns**, never the opponent's turns.
4. Action cannot occur from wrong player, during waiting/completed phase, or after KO.
5. `currentHp` stays in `[0, startingHp]`; two identical `requestId` submissions yield one PvP turn.
6. Repeated Guard isn't stackable; no stat doubling from equipping the same collectible twice.
7. CPU battle can finish fully offline. It always says `CPU`, never looks like real PvP.
8. PvP only passes when **two genuinely separate accounts** can invite, join, take turns and see the same server-backed winner; owner changes/rematches handled safely.
9. If PvP is not working, route is hidden/disabled with honest copy and practice mode remains usable.
