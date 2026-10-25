import { BASE_STATS, type Stats } from "./gear.js";
import {
  moves,
  mainAtLevel,
  validateMoves,
  type MoveId,
  type MoveLoadout,
} from "./moves.js";
export type BattleAction = MoveId;
export type FighterState = {
  userId: string;
  nickname: string;
  startingStats: Stats;
  currentHp: number;
  guarding: boolean;
  counterDamage: number;
  attackReduction: number;
  weakenedTurns: number;
  cooldowns: Partial<Record<MoveId, number>>;
  moves: MoveLoadout;
  level: number;
  snapshotGearIds: string[];
  snapshotBlueprints: string[];
  turnsTaken: number;
};
export type BattleState = {
  id: string;
  mode: "practice" | "story";
  storyStageId?: string;
  status: "active" | "completed" | "forfeited";
  rulesVersion: 2;
  version: number;
  currentActorId: string | null;
  fighters: [FighterState, FighterState];
  winnerId: string | null;
  log: {
    actorId: string;
    action: MoveId;
    damage: number;
    hits: number;
    counterDamage: number;
    effect: string;
    turn: number;
  }[];
};
export function cpuSetup(level = 1) {
  const tier = Math.max(1, Math.min(12, Math.floor(level)));
  const main = mainAtLevel(tier).at(-1)!;
  return {
    level: tier,
    stats: { ...BASE_STATS, def: 6 },
    moves: [main, "guard", "can_counter"] as MoveLoadout,
  };
}
export function createBattle(
  stats: Stats,
  ids: string[] = [],
  options: { level: number; blueprints: string[]; moves: MoveLoadout } = {
    level: 1,
    blueprints: [],
    moves: ["pinch", "guard", "tidal_slam"],
  },
): BattleState {
  validateMoves(options.level, options.blueprints, options.moves);
  const fighter = (
    userId: string,
    nickname: string,
    startingStats: Stats,
    snapshotGearIds: string[],
    blueprints: string[],
    level: number,
    selected: MoveLoadout,
  ): FighterState => ({
    userId,
    nickname,
    startingStats: { ...startingStats },
    currentHp: startingStats.hp,
    guarding: false,
    counterDamage: 0,
    attackReduction: 0,
    weakenedTurns: 0,
    cooldowns: {},
    moves: [...selected],
    level,
    snapshotGearIds: [...snapshotGearIds],
    snapshotBlueprints: [...blueprints],
    turnsTaken: 0,
  });
  const cpu = cpuSetup(options.level);
  return {
    id: crypto.randomUUID(),
    mode: "practice",
    status: "active",
    rulesVersion: 2,
    version: 0,
    currentActorId: stats.spd >= cpu.stats.spd ? "player" : "cpu",
    fighters: [
      fighter(
        "player",
        "Your crab",
        stats,
        ids,
        options.blueprints,
        options.level,
        options.moves,
      ),
      fighter(
        "cpu",
        "Pebble · CPU",
        cpu.stats,
        ["training-can-shield"],
        ["can_shield"],
        cpu.level,
        cpu.moves,
      ),
    ],
    winnerId: null,
    log: [],
  };
}
export function damageFor(
  attacker: Stats,
  defender: Stats,
  action: BattleAction,
  guarding = false,
  attackReduction = 0,
) {
  const move = moves[action];
  if (!move) throw new Error("Unknown action.");
  if (!move.power) return 0;
  const raw =
    Math.max(
      1,
      Math.floor(
        move.power +
          Math.max(0, attacker.atk - attackReduction) +
          attacker.spd * move.speedScale -
          defender.def / 2,
      ),
    ) * move.hits;
  return guarding ? Math.max(1, Math.ceil(raw / 2)) : raw;
}
export function resolveTurn(
  state: BattleState,
  actorId: string,
  action: BattleAction,
): BattleState {
  if (state.status !== "active" || state.currentActorId !== actorId)
    throw new Error("It is not your turn.");
  const original = state.fighters.find((f) => f.userId === actorId);
  if (!original || !moves[action] || !original.moves.includes(action))
    throw new Error("This move is not equipped.");
  validateMoves(original.level, original.snapshotBlueprints, original.moves);
  if ((original.cooldowns[action] ?? 0) > 0)
    throw new Error("This move is cooling down.");
  const next = structuredClone(state);
  const actor = next.fighters.find((f) => f.userId === actorId)!;
  const target = next.fighters.find((f) => f.userId !== actorId)!;
  const move = moves[action];
  let damage = 0,
    counterDamage = 0,
    effect = "";
  if (move.effect === "guard" || move.effect === "counter") {
    actor.guarding = true;
    actor.counterDamage = move.effect === "counter" ? move.effectValue : 0;
    effect =
      move.effect === "counter"
        ? "counter ready · next attack halved"
        : "guard ready · next attack halved";
  } else {
    damage = damageFor(
      actor.startingStats,
      target.startingStats,
      action,
      target.guarding,
      actor.attackReduction,
    );
    target.currentHp = Math.max(0, target.currentHp - damage);
    if (target.currentHp > 0 && target.counterDamage > 0) {
      counterDamage = target.counterDamage;
      actor.currentHp = Math.max(0, actor.currentHp - counterDamage);
    }
    // Defend covers the complete multi-hit action. Counter is fixed reaction damage,
    // cannot itself trigger defense/counter recursion, and only fires if its owner survives.
    target.guarding = false;
    target.counterDamage = 0;
    if (move.effect === "weaken" && target.currentHp > 0) {
      target.attackReduction = move.effectValue;
      target.weakenedTurns = move.effectTurns;
      effect = `enemy ATK −${move.effectValue} for ${move.effectTurns} own turns`;
    }
  }
  for (const id of Object.keys(actor.cooldowns) as MoveId[])
    actor.cooldowns[id] = Math.max(0, actor.cooldowns[id]! - 1);
  actor.cooldowns[action] = move.cooldown;
  actor.weakenedTurns = Math.max(0, actor.weakenedTurns - 1);
  if (!actor.weakenedTurns) actor.attackReduction = 0;
  actor.turnsTaken++;
  next.version++;
  next.log.push({
    actorId,
    action,
    damage,
    hits: move.power ? move.hits : 0,
    counterDamage,
    effect,
    turn: next.version,
  });
  if (target.currentHp === 0 || actor.currentHp === 0) {
    next.status = "completed";
    next.winnerId = target.currentHp === 0 ? actor.userId : target.userId;
    next.currentActorId = null;
  } else next.currentActorId = target.userId;
  return next;
}
export function cpuAction(state: BattleState): BattleAction {
  const [player, cpu] = state.fighters;
  const attacks = cpu.moves.filter(
    (id) => moves[id].power > 0 && !(cpu.cooldowns[id] ?? 0),
  );
  const lethal = attacks.find(
    (id) =>
      damageFor(
        cpu.startingStats,
        player.startingStats,
        id,
        player.guarding,
        cpu.attackReduction,
      ) >= player.currentHp,
  );
  if (lethal) return lethal;
  if (cpu.currentHp <= 20 && cpu.turnsTaken % 3 === 1 && !cpu.guarding)
    return cpu.moves.includes("can_counter") &&
      !(cpu.cooldowns.can_counter ?? 0)
      ? "can_counter"
      : "guard";
  return cpu.moves[0];
}
export const battleXpAward = (state: BattleState) =>
  state.status === "completed" ? (state.winnerId === "player" ? 40 : 15) : 0;
