import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { openDB, deleteDB } from "idb";
import {
  SPAWN,
  normalizeInput,
  movePlayer,
  walkable,
  followTrail,
  cameraFor,
  levelFor,
} from "../src/world/model";
import { upgradePixelDB, type PixelDB } from "../src/lib/storage";
import { defaultProfile, validProfile } from "../src/world/profile";
it("normalizes diagonal speed and preserves proportional joystick input", () => {
  expect(
    Math.hypot(...Object.values(normalizeInput({ x: 1, y: 1 }))),
  ).toBeCloseTo(1);
  expect(normalizeInput({ x: 0.2, y: 0 })).toEqual({ x: 0.2, y: 0 });
  const a = movePlayer(SPAWN, { x: 1, y: 0 }, 0.05),
    b = movePlayer(SPAWN, { x: 1, y: 1 }, 0.05);
  expect(Math.hypot(a.x - SPAWN.x, a.y - SPAWN.y)).toBeCloseTo(
    Math.hypot(b.x - SPAWN.x, b.y - SPAWN.y),
  );
});
it("blocks water, buildings, trees and edges but permits pier and spawn", () => {
  expect(walkable(SPAWN)).toBe(true);
  expect(walkable({ x: 24 * 16, y: 41 * 16 })).toBe(true);
  for (const point of [
    { x: 10, y: 10 },
    { x: 10 * 16, y: 43 * 16 },
    { x: 19 * 16, y: 18 * 16 },
    { x: 10 * 16 + 8, y: 22 * 16 + 14 },
  ])
    expect(walkable(point)).toBe(false);
});
it("stops with zero input and caps elapsed time after backgrounding", () => {
  expect(movePlayer(SPAWN, { x: 0, y: 0 }, 1)).toEqual(SPAWN);
  expect(movePlayer(SPAWN, { x: 1, y: 0 }, 10)).toEqual(
    movePlayer(SPAWN, { x: 1, y: 0 }, 0.05),
  );
});
it("follows the travelled path around turns rather than cutting corners", () => {
  expect(
    followTrail(
      [
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 20 },
      ],
      25,
    ),
  ).toEqual({ x: 25, y: 0 });
  expect(
    followTrail(
      [
        { x: 0, y: 0 },
        { x: 30, y: 0 },
        { x: 30, y: 20 },
      ],
      10,
    ),
  ).toEqual({ x: 30, y: 10 });
});
it("recenters on the player and derives cosmetic level boundaries", () => {
  expect(cameraFor(SPAWN, null)).toEqual(SPAWN);
  expect(cameraFor(SPAWN, { x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
  expect([0, 99, 100, 199, 200].map((x) => levelFor(x).level)).toEqual([
    1, 1, 2, 2, 3,
  ]);
  expect(levelFor(115).progress).toBe(15);
});
it("validates profile choices and nickname", () => {
  expect(validProfile(defaultProfile)).toBe(true);
  expect(validProfile({ ...defaultProfile, skin: 99 })).toBe(false);
  expect(validProfile({ ...defaultProfile, nickname: " " })).toBe(false);
});
it("migrates version-one saves additively without changing owned items or XP", async () => {
  const name = "pixelogy-migration-test";
  const old = await openDB<PixelDB>(name, 1, {
    upgrade(db) {
      db.createObjectStore("collectibles", { keyPath: "id" });
      db.createObjectStore("artBlobs");
      db.createObjectStore("discoveryEvents", { keyPath: "collectibleId" });
      db.createObjectStore("cleanupEvents", { keyPath: "eventId" }).createIndex(
        "by-collectible",
        "collectibleId",
        { unique: true },
      );
      db.createObjectStore("loadouts");
    },
  });
  const item = {
    id: "original",
    category: "plastic_bag" as const,
    subtype: null,
    label: "Bag",
    createdAtIso: "2026-10-24",
    rarity: "rare" as const,
    gearBlueprintId: "bag_helm",
    gearRulesVersion: 1 as const,
    sprite: { thumbnailBlobKey: "original", width: 256, height: 256 },
  };
  await old.put("collectibles", item);
  await old.put("loadouts", { head: "original" }, "local");
  await old.put("cleanupEvents", {
    eventId: "claim",
    collectibleId: "original",
    category: "plastic_bag",
    confirmedAtIso: "2026-10-24",
    xpAwarded: 15,
    selfReported: true,
  });
  old.close();
  const current = await openDB<PixelDB>(name, 3, { upgrade: upgradePixelDB });
  expect(await current.get("collectibles", "original")).toEqual(item);
  expect(await current.get("loadouts", "local")).toEqual({ head: "original" });
  expect((await current.get("cleanupEvents", "claim"))?.xpAwarded).toBe(15);
  expect(current.objectStoreNames.contains("profiles")).toBe(true);
  await current.put("profiles", defaultProfile, "local");
  expect(await current.get("profiles", "local")).toEqual(defaultProfile);
  expect(current.objectStoreNames.contains("preferences")).toBe(true);
  await current.put(
    "preferences",
    { version: 1, analysisConsent: true },
    "privacy",
  );
  expect((await current.get("preferences", "privacy"))?.analysisConsent).toBe(
    true,
  );
  current.close();
  await deleteDB(name);
});
it("upgrades an existing version-two profile while preserving its appearance", async () => {
  const name = "pixelogy-v2-migration";
  const old = await openDB<PixelDB>(name, 2, {
    upgrade(db) {
      db.createObjectStore("profiles");
    },
  });
  await old.put(
    "profiles",
    { ...defaultProfile, nickname: "Existing explorer" },
    "local",
  );
  old.close();
  const next = await openDB<PixelDB>(name, 3, { upgrade: upgradePixelDB });
  expect((await next.get("profiles", "local"))?.nickname).toBe(
    "Existing explorer",
  );
  expect(next.objectStoreNames.contains("preferences")).toBe(true);
  next.close();
  await deleteDB(name);
});
