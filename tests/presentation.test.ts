import { it, expect } from "vitest";
import { createBattle, resolveTurn, cpuAction } from "../src/lib/battle";
import { BASE_STATS } from "../src/lib/gear";
import { nextFrame, openingFrame } from "../src/battle/presentation";
it("replays combined cloud turns separately without showing future HP or cooldowns", () => {
  const initial = createBattle(BASE_STATS);
  const hit = resolveTurn(initial, "player", "tidal_slam");
  const final = resolveTurn(hit, "cpu", cpuAction(hit));
  const display = openingFrame(final);
  expect(display.fighters.map((f) => f.currentHp)).toEqual([40, 40]);
  expect(display.fighters[0].cooldowns).toEqual({});
  expect(nextFrame(display, final)).toEqual(hit);
  expect(nextFrame(hit, final)).toEqual(final);
  expect(nextFrame(final, final)).toBeNull();
});
it("reconstructs CPU-first matches and stops at KO with the same outcome", () => {
  const initial = createBattle({ ...BASE_STATS, spd: 1 });
  const hit = resolveTurn(initial, "cpu", cpuAction(initial));
  expect(openingFrame(hit)).toEqual(initial);
  expect(nextFrame(initial, hit)).toEqual(hit);
  let state = initial;
  while (state.status === "active")
    state = resolveTurn(
      state,
      state.currentActorId!,
      state.currentActorId === "cpu" ? cpuAction(state) : "pinch",
    );
  let display = openingFrame(state);
  while (display.version < state.version) display = nextFrame(display, state)!;
  expect(display).toEqual(state);
  expect(nextFrame(display, state)).toBeNull();
});
