import { createBattle, resolveTurn, type BattleState } from "../lib/battle";
export type CombatPhase = "ready" | "windup" | "impact" | "transition";
export const PHASE_MS = { windup: 800, impact: 800, transition: 800 };
// Replay only authoritative actions through the unchanged deterministic resolver.
// This is a display snapshot, never submitted as an account save or reward.
export function openingFrame(state: BattleState): BattleState {
  const p = state.fighters[0];
  const initial = createBattle(p.startingStats, p.snapshotGearIds, {
    level: p.level,
    blueprints: p.snapshotBlueprints,
    moves: p.moves,
  });
  return { ...initial, id: state.id };
}
export function nextFrame(display: BattleState, authoritative: BattleState) {
  const entry = authoritative.log.find((e) => e.turn === display.version + 1);
  return entry ? resolveTurn(display, entry.actorId, entry.action) : null;
}
