import {
  catalog,
  equip,
  slots,
  type Collectible,
  type Equipment,
} from "./gear.js";
export type MoveId =
  | "pinch"
  | "shell_slam"
  | "double_pinch"
  | "tidal_strike"
  | "crushing_claw"
  | "guard"
  | "tidal_slam"
  | "bottle_slash"
  | "can_counter"
  | "bag_snare"
  | "paper_barrage"
  | "cap_dash";
export type MoveDefinition = {
  id: MoveId;
  name: string;
  slot: "main" | "defend" | "special";
  description: string;
  power: number;
  hits: number;
  cooldown: number;
  level?: number;
  gear?: string;
  speedScale: number;
  effect?: "guard" | "counter" | "weaken";
  effectValue: number;
  effectTurns: number;
  animation:
    | "attack-lunge"
    | "guard-pulse"
    | "snare-pulse"
    | "dash-lunge"
    | "multi-lunge";
};
const move = (
  id: MoveId,
  name: string,
  slot: MoveDefinition["slot"],
  power: number,
  description: string,
  options: Partial<MoveDefinition> = {},
): MoveDefinition => ({
  id,
  name,
  slot,
  power,
  description,
  hits: 1,
  cooldown: 0,
  speedScale: 0,
  effectValue: 0,
  effectTurns: 0,
  animation: "attack-lunge",
  ...options,
});
export const moves: Record<MoveId, MoveDefinition> = {
  pinch: move(
    "pinch",
    "Pinch Attack",
    "main",
    7,
    "A trusty single claw strike.",
    { level: 1 },
  ),
  shell_slam: move(
    "shell_slam",
    "Shell Slam",
    "main",
    9,
    "Strike with the strength of your shell.",
    { level: 3 },
  ),
  double_pinch: move(
    "double_pinch",
    "Double Pinch",
    "main",
    3,
    "Two quick hits; defense applies to each hit.",
    { level: 5, hits: 2, animation: "multi-lunge" },
  ),
  tidal_strike: move(
    "tidal_strike",
    "Tidal Strike",
    "main",
    12,
    "A powerful wave-driven claw strike.",
    { level: 8 },
  ),
  crushing_claw: move(
    "crushing_claw",
    "Crushing Claw",
    "main",
    15,
    "Your strongest trained claw attack.",
    { level: 12 },
  ),
  guard: move(
    "guard",
    "Defend",
    "defend",
    0,
    "Halve the next incoming attack, then consume the shield.",
    { effect: "guard", animation: "guard-pulse" },
  ),
  tidal_slam: move(
    "tidal_slam",
    "Basic Splash",
    "special",
    12,
    "Basic default when equipped gear grants no special.",
    { cooldown: 2 },
  ),
  bottle_slash: move(
    "bottle_slash",
    "Bottle Slash",
    "special",
    16,
    "Slash once with your Bottle Blade.",
    { gear: "bottle_blade", cooldown: 2 },
  ),
  can_counter: move(
    "can_counter",
    "Can Counter",
    "special",
    0,
    "Halve the next attack and return 6 damage if you survive it. Replaces Defend.",
    {
      gear: "can_shield",
      cooldown: 2,
      effect: "counter",
      effectValue: 6,
      animation: "guard-pulse",
    },
  ),
  bag_snare: move(
    "bag_snare",
    "Bag Snare",
    "special",
    4,
    "Hit once and reduce enemy ATK by 3 for their next 2 turns. Does not stack.",
    {
      gear: "bag_helm",
      cooldown: 3,
      effect: "weaken",
      effectValue: 3,
      effectTurns: 2,
      animation: "snare-pulse",
    },
  ),
  paper_barrage: move(
    "paper_barrage",
    "Paper Barrage",
    "special",
    4,
    "Three hits; defense applies to each. Defend halves the whole barrage.",
    { gear: "magazine_mail", cooldown: 2, hits: 3, animation: "multi-lunge" },
  ),
  cap_dash: move(
    "cap_dash",
    "Cap Dash",
    "special",
    10,
    "One hit with your Speed added to its power.",
    { gear: "cap_boots", cooldown: 2, speedScale: 1, animation: "dash-lunge" },
  ),
};
export const mainMoves = Object.values(moves).filter((m) => m.slot === "main");
export type MoveLoadout = readonly [MoveId, "guard", MoveId];
export type BattleProgression = {
  version: 1;
  xp: number;
  unlockedMain: MoveId[];
  main: MoveId;
  special: MoveId;
};
export const initialProgression = (): BattleProgression => ({
  version: 1,
  xp: 0,
  unlockedMain: ["pinch"],
  main: "pinch",
  special: "tidal_slam",
});
export const crabLevel = (xp: number) =>
  1 + Math.floor(Math.max(0, Number.isFinite(xp) ? xp : 0) / 100);
export const mainAtLevel = (level: number) =>
  mainMoves.filter((m) => m.level! <= level).map((m) => m.id);
export function specialMoves(blueprints: readonly string[]): MoveId[] {
  const specials = Object.values(moves)
    .filter(
      (m) => m.slot === "special" && m.gear && blueprints.includes(m.gear),
    )
    .map((m) => m.id);
  return specials.length ? specials : ["tidal_slam"];
}
// Validates ownership, slot compatibility and duplicate assignments before eligibility.
export function ownedBlueprints(loadout: Equipment, items: Collectible[]) {
  let checked: Equipment = {};
  return slots.flatMap((slot) => {
    const id = loadout[slot];
    if (!id) return [];
    checked = equip(checked, items, slot, id);
    return [items.find((i) => i.id === id)!.gearBlueprintId!];
  });
}
export function normalizeProgression(
  raw: Partial<BattleProgression> | undefined,
  blueprints: readonly string[],
): BattleProgression {
  const xp = Number.isSafeInteger(raw?.xp) && raw!.xp! >= 0 ? raw!.xp! : 0;
  const unlockedMain = mainAtLevel(crabLevel(xp));
  const available = specialMoves(blueprints);
  return {
    version: 1,
    xp,
    unlockedMain,
    main: raw?.main && unlockedMain.includes(raw.main) ? raw.main : "pinch",
    special:
      raw?.special && available.includes(raw.special)
        ? raw.special
        : available[0],
  };
}
export function validateMoves(
  level: number,
  blueprints: readonly string[],
  selected: MoveLoadout,
): void {
  if (
    selected.length !== 3 ||
    selected[1] !== "guard" ||
    !mainAtLevel(level).includes(selected[0]) ||
    !specialMoves(blueprints).includes(selected[2])
  )
    throw new Error("This move loadout is not eligible.");
}
export function moveRequirement(m: MoveDefinition) {
  return m.level
    ? `Crab level ${m.level}`
    : m.gear
      ? `Equip ${catalog[m.gear].label} · any crab level`
      : m.slot === "defend"
        ? "Permanent · cannot be replaced"
        : "Basic default · no eligible special gear equipped";
}
export function moveValues(m: MoveDefinition) {
  return m.effect === "guard"
    ? "50% damage reduction · next attack"
    : m.effect === "counter"
      ? `50% reduction · ${m.effectValue} counter damage`
      : `Power ${m.power}${m.hits > 1 ? ` × ${m.hits} hits` : ""}${m.speedScale ? " + Speed" : ""}${m.effect === "weaken" ? ` · −${m.effectValue} ATK / ${m.effectTurns} enemy turns` : ""}`;
}
