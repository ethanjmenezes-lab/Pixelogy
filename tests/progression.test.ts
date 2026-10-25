import { expect, it } from "vitest";
import {
  walkingStep,
  walkingAward,
  playerLevel,
  rules,
} from "../src/progression/model";
import {
  cosmeticUnlocks,
  appearanceUnlocked,
} from "../src/progression/cosmetics";
import {
  crabLevel,
  mainAtLevel,
  normalizeProgression,
  initialProgression,
} from "../src/lib/moves";
import { defaultProfile } from "../src/world/profile";
import { readFileSync } from "node:fs";
const point = (metres: number, time: number, accuracy = 3) => ({
  latitude: 30 + metres / 111195,
  longitude: -96,
  accuracy,
  timestamp: time,
});
it("awards both XP currencies only at cumulative walking milestones", () => {
  expect(walkingAward(0, 99999)).toEqual({ playerXp: 0, crabXp: 0 });
  expect(walkingAward(99999, 1)).toEqual({ playerXp: 8, crabXp: 5 });
  expect(walkingAward(100000, 250000)).toEqual({ playerXp: 16, crabXp: 10 });
});
it("accepts walking while holding drift below the accuracy radius", () => {
  const a = point(0, 100000);
  expect(walkingStep(a, point(2, 105000), 105000).segment).toBeUndefined();
  expect(
    walkingStep(a, point(20, 115000), 115000).segment?.distanceMm,
  ).toBeCloseTo(20000, -1);
});
it("rejects fast travel, jumps, inaccurate, duplicate, old and discontinuous fixes", () => {
  const a = point(0, 100000);
  for (const b of [
    point(100, 101000),
    point(10000, 110000),
    point(20, 115000, 60),
    point(20, 99999),
    point(0, 100000),
    point(20, 140000),
  ])
    expect(
      walkingStep(a, b, Math.max(b.timestamp, 100000)).segment,
    ).toBeUndefined();
  expect(walkingStep(a, point(20, 110000), 150000).anchor).toBeNull();
  expect(walkingStep(null, point(20, 110000), 110000).segment).toBeUndefined();
});
it("keeps cosmetic and combat levels independent and never auto-selects a new attack", () => {
  expect(playerLevel(99)).toBe(1);
  expect(playerLevel(100)).toBe(2);
  expect(
    cosmeticUnlocks(playerLevel(900)).some((c) => c.id === "explorer"),
  ).toBe(true);
  expect(mainAtLevel(crabLevel(0))).toEqual(["pinch"]);
  expect(
    appearanceUnlocked(
      { ...defaultProfile, outfit: "explorer" },
      playerLevel(0),
    ),
  ).toBe(false);
  const progress = normalizeProgression(
    { ...initialProgression(), xp: 1100 },
    [],
  );
  expect(progress.main).toBe("pinch");
  expect(progress.unlockedMain).toContain("crushing_claw");
  expect(appearanceUnlocked(defaultProfile, 1)).toBe(true);
});
it("pins generated SQL reward configuration to the central rules file", () => {
  const sql = readFileSync(
    "supabase/migrations/20261025120000_dual_progression.sql",
    "utf8",
  );
  const json = sql.match(/values \('(\{[^']+\})'::jsonb\)/)![1];
  expect(JSON.parse(json)).toEqual(rules);
});
