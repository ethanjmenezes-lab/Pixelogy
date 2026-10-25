import { resolveTurn, type BattleState } from "../lib/battle";
export type CombatPhase = "ready" | "windup" | "impact" | "transition";
export const PHASE_MS = { windup: 800, impact: 800, transition: 800 };
// Replay only authoritative actions through the unchanged deterministic resolver.
// This is a display snapshot, never submitted as an account save or reward.
export function openingFrame(state: BattleState): BattleState {
  const fighters = state.fighters.map((f) => ({
    ...f,
    currentHp: f.startingStats.hp,
    guarding: false,
    counterDamage: 0,
    attackReduction: 0,
    weakenedTurns: 0,
    cooldowns: {},
    turnsTaken: 0,
  })) as BattleState["fighters"];
  return {
    ...state,
    fighters,
    status: "active",
    winnerId: null,
    version: 0,
    log: [],
    currentActorId:
      fighters[0].startingStats.spd >= fighters[1].startingStats.spd
        ? "player"
        : "cpu",
  };
}
export function nextFrame(display: BattleState, authoritative: BattleState) {
  const entry = authoritative.log.find((e) => e.turn === display.version + 1);
  return entry ? resolveTurn(display, entry.actorId, entry.action) : null;
}
