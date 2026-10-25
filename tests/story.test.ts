import { expect, it } from "vitest";
import { createBattle, resolveTurn } from "../src/lib/battle";
import { BASE_STATS } from "../src/lib/gear";
import { nextFrame, openingFrame } from "../src/battle/presentation";
import {
  stages,
  storyBattle,
  storyCpu,
  storyStars,
  unlocked,
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
it("all five stages are winnable at level one without scan gear and replay through presentation exactly", () => {
  for (const stage of stages) {
    const initial = storyBattle(createBattle(BASE_STATS), stage);
    let state = initial;
    for (let i = 0; state.status === "active" && i < 100; i++) {
      const move =
        state.currentActorId === "cpu"
          ? storyCpu(state, stage)
          : !state.fighters[0].cooldowns.tidal_slam
            ? "tidal_slam"
            : "pinch";
      state = resolveTurn(state, state.currentActorId!, move);
    }
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
