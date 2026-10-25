import { cpuAction, type BattleState } from "../lib/battle.js";
import type { Stats } from "../lib/gear.js";
import type { MoveLoadout } from "../lib/moves.js";
import { defaultProfile, type Profile } from "../world/profile.js";
export type Stage = {
  id: string;
  name: string;
  trainer: Profile;
  crab: string;
  level: number;
  stats: Stats;
  gear: string[];
  moves: MoveLoadout;
  intro: string;
  defeat: string;
  xp: number;
  boss: boolean;
  strategy: "bold" | "guard" | "counter";
  threeStarTurns: number;
};
const trainers = ["Pip", "Nori", "Skipper", "Tansy", "Captain Sandy"];
const names = [
  "Message in a Bottle",
  "The Shell Toll",
  "Pier Pressure",
  "Sandcastle Stand",
  "Captain of the Dunes",
];
const crabs = ["Button", "Winkle", "Clatter", "Dune", "Bulwark"];
const gear = [
  [],
  ["cup_crown"],
  ["can_shield"],
  [],
  ["can_shield", "cup_crown"],
];
export const stages: Stage[] = trainers.map((nickname, i) => ({
  id: `shellshore-${i + 1}`,
  name: names[i],
  trainer: {
    ...defaultProfile,
    nickname,
    skin: i % 4,
    hair: (i + 1) % 4,
    clothing: i % 4,
    hairStyle: i % 2 ? "long" : "short",
    hat: i === 4 ? "cap" : "none",
  },
  crab: crabs[i],
  level: i === 4 ? 3 : i < 2 ? 1 : 2,
  stats: [
    { hp: 26, atk: 3, def: 2, spd: 3 },
    { hp: 30, atk: 4, def: 3, spd: 4 },
    { hp: 32, atk: 4, def: 4, spd: 5 },
    { hp: 34, atk: 5, def: 3, spd: 4 },
    { hp: 42, atk: 5, def: 7, spd: 2 },
  ][i],
  gear: gear[i],
  moves: ["pinch", "guard", i === 2 || i === 4 ? "can_counter" : "tidal_slam"],
  intro: [
    "Official Blacktide business! This bottle says… wait, that’s a lunch order.",
    "One shell to cross. Two shells if your crab looks brave.",
    "Nobody crosses my pier. Except the gulls. We have an arrangement.",
    "This sandcastle is crew property. Please ignore the bucket on top.",
    "Four rookies? Hmph. Let’s see you crack the captain’s armor!",
  ][i],
  defeat: [
    "Maybe delivering messages is more my speed.",
    "Keep your shells. That little crab has earned a free crossing.",
    "Fine. The pier is yours. The gulls will hear about this.",
    "I’m keeping the bucket. But you can face the captain.",
    "That glow in your crab’s shell… Blacktide was afraid of something like you.",
  ][i],
  xp: i === 4 ? 80 : 40,
  boss: i === 4,
  strategy: i === 4 || i === 2 ? "counter" : i === 1 ? "guard" : "bold",
  threeStarTurns: i === 4 ? 8 : 6,
}));
export const regions = [
  "Shellshore Beach",
  "Rustport Harbor",
  "Neon Boardwalk",
  "Whispering Mangroves",
  "Blacktide Fortress",
];
export type StoryProgress = { stage_id: string; best_stars: number };
export function unlocked(stage: Stage, progress: StoryProgress[]) {
  return (
    !stage.boss ||
    stages
      .filter((s) => !s.boss)
      .every((s) => progress.some((p) => p.stage_id === s.id))
  );
}
export function stageById(id: string) {
  return stages.find((s) => s.id === id);
}
export function storyBattle(base: BattleState, stage: Stage): BattleState {
  const enemy = {
    ...base.fighters[1],
    nickname: `${stage.crab} · CPU`,
    startingStats: { ...stage.stats },
    currentHp: stage.stats.hp,
    moves: [...stage.moves] as MoveLoadout,
    level: stage.level,
    snapshotBlueprints: [...stage.gear],
    snapshotGearIds: [],
  };
  return {
    ...base,
    mode: "story",
    storyStageId: stage.id,
    fighters: [base.fighters[0], enemy],
    currentActorId:
      base.fighters[0].startingStats.spd >= enemy.startingStats.spd
        ? "player"
        : "cpu",
  };
}
export function storyStars(battle: BattleState, stage: Stage) {
  if (battle.status !== "completed" || battle.winnerId !== "player") return 0;
  const f = battle.fighters[0],
    ratio = f.currentHp / f.startingStats.hp;
  return ratio >= 0.75 && f.turnsTaken <= stage.threeStarTurns
    ? 3
    : ratio >= 0.5
      ? 2
      : 1;
}
export function storyCpu(battle: BattleState, stage: Stage) {
  const f = battle.fighters[1];
  if (
    stage.strategy === "counter" &&
    f.turnsTaken % 3 === 0 &&
    !f.cooldowns.can_counter
  )
    return "can_counter";
  if (stage.strategy === "guard" && f.turnsTaken % 3 === 1) return "guard";
  return cpuAction(battle);
}
