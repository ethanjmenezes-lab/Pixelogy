import { script, savedRegionIds, saveIdFor, type Dialogue } from "./script.js";
import { cpuAction, type BattleState } from "../lib/battle.js";
import type { Stats } from "../lib/gear.js";
import type { MoveLoadout } from "../lib/moves.js";
import { defaultProfile, type Profile } from "../world/profile.js";
export const STORY_TITLE = "The Blacktide Conspiracy";
export type Stage = {
  id: string;
  contentId: string;
  introLines: Dialogue[];
  defeatLines: Dialogue[];
  region: number;
  name: string;
  trainer: Profile;
  role: string;
  crab: string;
  level: number;
  stats: Stats;
  gear: string[];
  moves: MoveLoadout;
  intro: string;
  defeat: string;
  xp: number;
  boss: boolean;
  strategy: "bold" | "guard" | "counter" | "special";
  threeStarTurns: number;
};
export const regionDefinitions = script.regions.map((r, i) => ({
  id: savedRegionIds[i],
  contentId: r.id,
  name: r.name,
  boss: r.boss,
  evidence: r.evidence,
}));
export const regions = regionDefinitions.map((r) => r.name);
export const stages: Stage[] = script.encounters.map((entry, index) => {
  const r = Math.floor(index / 5),
    i = index % 5;
  const special =
    r === 2
      ? "cap_dash"
      : r === 3
        ? "bag_snare"
        : r === 4
          ? i === 4
            ? "paper_barrage"
            : "bottle_slash"
          : i === 2 || i === 4
            ? "can_counter"
            : "tidal_slam";
  const specialGear: Record<string, string[]> = {
    cap_dash: ["cap_boots"],
    bag_snare: ["bag_helm"],
    paper_barrage: ["magazine_mail", "cup_crown"],
    bottle_slash: ["bottle_blade"],
    can_counter: ["can_shield"],
    tidal_slam: [],
  };

  return {
    id: saveIdFor(r, i + 1),
    contentId: entry.id,
    introLines: entry.intro_exact,
    defeatLines: entry.defeat_exact,
    region: r,
    name: entry.stage_name,
    role: entry.trainer_role,
    trainer: {
      ...defaultProfile,
      nickname: entry.trainer,
      skin: index % 4,
      hair: Math.floor(index / 4) % 4,
      clothing: r % 4,
      hairStyle: i % 2 ? "long" : "short",
      hat: i === 4 || i === 0 ? "cap" : "none",
    },
    crab: entry.trainer,
    level: r === 2 ? 5 : r > 0 ? 3 : i === 4 ? 3 : i < 2 ? 1 : 2,
    stats:
      r === 0
        ? [
            { hp: 26, atk: 3, def: 2, spd: 3 },
            { hp: 30, atk: 4, def: 3, spd: 4 },
            { hp: 32, atk: 4, def: 4, spd: 5 },
            { hp: 34, atk: 5, def: 3, spd: 4 },
            { hp: 42, atk: 5, def: 7, spd: 2 },
          ][i]
        : {
            hp: r === 2 && i === 4 ? 38 : 30 + i * 2 + (i === 4 ? 4 : 0),
            atk: r === 2 ? 2 : 3,
            def: i === 4 ? (r === 1 ? 8 : 5) : 3,
            spd: r === 2 ? 5 : r === 1 ? 2 : 4,
          },
    gear: r === 0 && i === 1 ? ["cup_crown"] : specialGear[special],
    moves: [
      r === 2 ? "double_pinch" : r > 0 ? "shell_slam" : "pinch",
      "guard",
      special,
    ] as MoveLoadout,
    intro: entry.intro_exact[0].text,
    defeat: entry.defeat_exact[0].text,
    xp: i === 4 ? 80 : 40,
    boss: i === 4,
    strategy:
      special === "can_counter"
        ? "counter"
        : r >= 2
          ? "special"
          : i === 1
            ? "guard"
            : "bold",
    threeStarTurns: i === 4 ? 8 : 6,
  };
});
export type StoryProgress = { stage_id: string; best_stars: number };
export function regionStages(region: number) {
  return stages.filter((s) => s.region === region);
}
export function restored(region: number, progress: StoryProgress[]) {
  return progress.some(
    (p) => p.stage_id === `${regionDefinitions[region].id}-5`,
  );
}
export function regionUnlocked(region: number, progress: StoryProgress[]) {
  return region === 0 || restored(region - 1, progress);
}
export function unlocked(stage: Stage, progress: StoryProgress[]) {
  return (
    regionUnlocked(stage.region, progress) &&
    (!stage.boss ||
      regionStages(stage.region)
        .filter((s) => !s.boss)
        .every((s) => progress.some((p) => p.stage_id === s.id)))
  );
}
export const evidenceFound = (progress: StoryProgress[]) =>
  regionDefinitions.filter((_, i) => restored(i, progress));
export function stageById(id: string) {
  return stages.find((s) => s.id === id || s.contentId === id);
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
  if (stage.strategy === "special" && !f.cooldowns[f.moves[2]])
    return f.moves[2];
  return cpuAction(battle);
}
