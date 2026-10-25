import { expect, it } from "vitest";
import { createBattle, resolveTurn } from "../src/lib/battle";
import { crabLevel, mainAtLevel } from "../src/lib/moves";
import { BASE_STATS } from "../src/lib/gear";
import { nextFrame, openingFrame } from "../src/battle/presentation";
import {
  stages,
  storyBattle,
  storyCpu,
  storyStars,
  unlocked,
  regionDefinitions,
  regionStages,
  regionUnlocked,
  restored,
  evidenceFound,
} from "../src/story/campaign";
it("locks the boss until four distinct wins, regardless of stars", () => {
  expect(unlocked(stages[4], [])).toBe(false);
  expect(
    unlocked(
      stages[4],
      Array(4).fill({ stage_id: stages[0].id, best_stars: 3 }),
    ),
  ).toBe(false);
  expect(
    unlocked(
      stages[4],
      stages.slice(0, 4).map((s) => ({ stage_id: s.id, best_stars: 1 })),
    ),
  ).toBe(true);
});
it("all 25 stages are winnable with earned main attacks and no scan gear and replay through presentation exactly", () => {
  let xp = 0;
  for (const stage of stages) {
    const level = crabLevel(xp),
      main = mainAtLevel(level).at(-1)!;
    const initial = storyBattle(
      createBattle(BASE_STATS, [], {
        level,
        blueprints: [],
        moves: [main, "guard", "tidal_slam"],
      }),
      stage,
    );
    let state = initial;
    for (let i = 0; state.status === "active" && i < 100; i++) {
      const move =
        state.currentActorId === "cpu"
          ? storyCpu(state, stage)
          : !state.fighters[0].cooldowns.tidal_slam
            ? "tidal_slam"
            : main;
      state = resolveTurn(state, state.currentActorId!, move);
    }
    xp += stage.xp;
    expect(state.winnerId, stage.name).toBe("player");
    expect(storyStars(state, stage)).toBeGreaterThanOrEqual(1);
    let display = openingFrame(state);
    expect(display).toEqual(initial);
    while (display.version < state.version)
      display = nextFrame(display, state)!;
    expect(display).toEqual(state);
  }
});
it("stars use inclusive HP/turn thresholds and defeat never awards stars", () => {
  const stage = stages[0],
    b = storyBattle(createBattle(BASE_STATS), stage);
  b.status = "completed";
  b.winnerId = "player";
  b.fighters[0].currentHp = 30;
  b.fighters[0].turnsTaken = 6;
  expect(storyStars(b, stage)).toBe(3);
  b.fighters[0].turnsTaken = 7;
  expect(storyStars(b, stage)).toBe(2);
  b.fighters[0].currentHp = 20;
  expect(storyStars(b, stage)).toBe(2);
  b.fighters[0].currentHp = 19;
  expect(storyStars(b, stage)).toBe(1);
  b.winnerId = "cpu";
  expect(storyStars(b, stage)).toBe(0);
});

it("preserves Shellshore IDs, converts clears to evidence, and gates every region and boss", () => {
  const progress = stages
    .slice(0, 5)
    .map((s) => ({ stage_id: s.id, best_stars: 2 }));
  expect(progress.map((p) => p.stage_id)).toEqual([
    "shellshore-1",
    "shellshore-2",
    "shellshore-3",
    "shellshore-4",
    "shellshore-5",
  ]);
  expect(evidenceFound(progress).map((r) => r.evidence)).toEqual([
    "Night-shift manifest",
  ]);
  expect(regionUnlocked(1, progress)).toBe(true);
  expect(regionUnlocked(2, progress)).toBe(false);
  expect(stages).toHaveLength(25);
  expect(new Set(stages.map((s) => s.id)).size).toBe(25);
  const cleared: typeof progress = [];
  for (let r = 0; r < 5; r++) {
    expect(regionStages(r)).toHaveLength(5);
    expect(unlocked(regionStages(r)[0], cleared)).toBe(true);
    expect(unlocked(regionStages(r)[4], cleared)).toBe(false);
    cleared.push(
      ...regionStages(r)
        .slice(0, 4)
        .map((s) => ({ stage_id: s.id, best_stars: 1 })),
    );
    expect(unlocked(regionStages(r)[4], cleared)).toBe(true);
    cleared.push({ stage_id: regionStages(r)[4].id, best_stars: 1 });
    expect(restored(r, cleared)).toBe(true);
  }
  expect(evidenceFound(cleared)).toHaveLength(regionDefinitions.length);
});
