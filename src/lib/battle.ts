import { BASE_STATS, type Stats } from "./gear";
export type BattleAction = "pinch" | "guard" | "tidal_slam";
export type FighterState = {
  userId: string;
  nickname: string;
  startingStats: Stats;
  currentHp: number;
  guarding: boolean;
  tidalCooldownRemaining: number;
  snapshotGearIds: string[];
  turnsTaken: number;
};
export type BattleState = {
  id: string;
  mode: "practice";
  status: "active" | "completed" | "forfeited";
  rulesVersion: 1;
  version: number;
  currentActorId: string | null;
  fighters: [FighterState, FighterState];
  winnerId: string | null;
  log: {
    actorId: string;
    action: BattleAction;
    damage: number;
    turn: number;
  }[];
};
export function createBattle(stats: Stats, ids: string[] = []): BattleState {
  const fighter = (
    userId: string,
    nickname: string,
    startingStats: Stats,
    snapshotGearIds: string[],
  ): FighterState => ({
    userId,
    nickname,
    startingStats: { ...startingStats },
    currentHp: startingStats.hp,
    guarding: false,
    tidalCooldownRemaining: 0,
    snapshotGearIds: [...snapshotGearIds],
    turnsTaken: 0,
  });
  const cpuStats = { ...BASE_STATS, def: 6 };
  return {
    id: crypto.randomUUID(),
    mode: "practice",
    status: "active",
    rulesVersion: 1,
    version: 0,
    currentActorId: stats.spd >= cpuStats.spd ? "player" : "cpu",
    fighters: [
      fighter("player", "Your crab", stats, ids),
      fighter("cpu", "Pebble · CPU", cpuStats, ["training-can-shield"]),
    ],
    winnerId: null,
    log: [],
  };
}
export function damageFor(
  attacker: Stats,
  defender: Stats,
  action: Exclude<BattleAction, "guard">,
  guarding = false,
) {
  const raw = Math.max(
    1,
    Math.floor((action === "pinch" ? 7 : 12) + attacker.atk - defender.def / 2),
  );
  return guarding ? Math.max(1, Math.ceil(raw / 2)) : raw;
}
export function resolveTurn(
  state: BattleState,
  actorId: string,
  action: BattleAction,
): BattleState {
  if (state.status !== "active" || state.currentActorId !== actorId)
    throw new Error("It is not your turn.");
  if (!["pinch", "guard", "tidal_slam"].includes(action))
    throw new Error("Unknown action.");
  const next = structuredClone(state);
  const actor = next.fighters.find((f) => f.userId === actorId)!;
  const target = next.fighters.find((f) => f.userId !== actorId)!;
  if (action === "tidal_slam" && actor.tidalCooldownRemaining > 0)
    throw new Error("Tidal Slam is cooling down.");
  let damage = 0;
  if (action === "guard") actor.guarding = true;
  else {
    damage = damageFor(
      actor.startingStats,
      target.startingStats,
      action,
      target.guarding,
    );
    target.currentHp = Math.max(0, target.currentHp - damage);
    target.guarding = false;
  }
  actor.tidalCooldownRemaining =
    action === "tidal_slam" ? 2 : Math.max(0, actor.tidalCooldownRemaining - 1);
  actor.turnsTaken++;
  next.version++;
  next.log.push({ actorId, action, damage, turn: next.version });
  if (target.currentHp === 0) {
    next.status = "completed";
    next.winnerId = actorId;
    next.currentActorId = null;
  } else next.currentActorId = target.userId;
  return next;
}
export function cpuAction(state: BattleState): BattleAction {
  const [player, cpu] = state.fighters;
  if (
    cpu.tidalCooldownRemaining === 0 &&
    damageFor(
      cpu.startingStats,
      player.startingStats,
      "tidal_slam",
      player.guarding,
    ) >= player.currentHp
  )
    return "tidal_slam";
  if (cpu.currentHp <= 15 && cpu.turnsTaken % 3 === 1 && !cpu.guarding)
    return "guard";
  return "pinch";
}
