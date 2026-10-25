import "fake-indexeddb/auto";
import { it, expect, vi, beforeEach } from "vitest";
vi.mock("../src/cloud/client", () => ({ cloudSession: async () => null }));
import {
  dbPromise,
  readGame,
  claimCleanup,
  saveEquipment,
} from "../src/lib/storage";
import { saveGuestDiscovery, creditGuestWalk } from "../src/guest/local";
import {
  guestStoryRequest,
  readGuestStory,
  watchGuestStory,
} from "../src/guest/story";
import { states, locateState, stateStats } from "../src/cleanup/states";
import { resolveTurn } from "../src/lib/battle";
beforeEach(async () => {
  const db = await dbPromise;
  for (const name of db.objectStoreNames) await db.clear(name);
});
it("contains 50 geographic states and resolves TX, OK, CA, AK, HI without IP inference", () => {
  expect(states).toHaveLength(50);
  expect(new Set(states.map((s) => s.code)).size).toBe(50);
  for (const [lat, lon, code] of [
    [30.62, -96.34, "TX"],
    [35.46, -97.51, "OK"],
    [36.74, -119.78, "CA"],
    [64.84, -147.72, "AK"],
    [19.6, -155.5, "HI"],
  ] as const)
    expect(locateState(lat, lon, 10).state).toBe(code);
  expect(locateState(19.72, -155.08, 10).candidates).toContain("HI");
  expect(locateState(51.5, -0.1, 10).state).toBeNull();
  expect(locateState(30.62, -96.34, 500).state).toBeNull();
  expect(locateState(36.5, -100, 10).candidates.length).toBeGreaterThan(0);
});
it("saves canonical guest discoveries idempotently, equips and colors states only on cleanup", async () => {
  const id = crypto.randomUUID(),
    payload = JSON.stringify({ scanId: id, candidates: ["grocery-bag"] });
  await saveGuestDiscovery("grocery-bag", payload);
  await saveGuestDiscovery("grocery-bag", payload);
  let g = await readGame();
  expect(g.items).toHaveLength(1);
  expect(stateStats("TX", g.claims, g.items).pickups).toBe(0);
  await saveEquipment("head", id);
  await claimCleanup(id, crypto.randomUUID(), "TX");
  await claimCleanup(id, crypto.randomUUID(), "OK");
  g = await readGame();
  expect(g.loadout.head).toBe(id);
  expect(g.claims).toHaveLength(1);
  expect(stateStats("TX", g.claims, g.items).pickups).toBe(1);
  expect(stateStats("OK", g.claims, g.items).pickups).toBe(0);
});
it("guest walking retains partial distance, awards both once, caps daily distance", async () => {
  await creditGuestWalk("one", { distanceMm: 50000, durationMs: 25000 });
  expect((await readGame()).player.xp).toBe(0);
  await creditGuestWalk("two", { distanceMm: 50000, durationMs: 25000 });
  await creditGuestWalk("two", { distanceMm: 50000, durationMs: 25000 });
  const g = await readGame();
  expect(g.player).toEqual({ xp: 8, distanceMm: 100000 });
  expect(g.progression.xp).toBe(5);
  const db = await dbPromise;
  await db.put(
    "guest",
    10000000,
    "day:" + new Date().toISOString().slice(0, 10),
  );
  await creditGuestWalk("cap", { distanceMm: 50000, durationMs: 25000 });
  expect((await readGame()).player.xp).toBe(8);
});
it("guest story saves cinematics, enforces locks and rewards first clears once", async () => {
  await watchGuestStory("opening");
  expect((await readGuestStory()).watched).toContain("opening");
  await expect(
    guestStoryRequest({
      action: "start",
      requestId: crypto.randomUUID(),
      stageId: "shellshore-5",
    }),
  ).rejects.toThrow("locked");
  let b = await guestStoryRequest({
    action: "start",
    requestId: crypto.randomUUID(),
    stageId: "shellshore-1",
  });
  // Drive the same resolver and request path used by gameplay.
  for (let i = 0; i < 80 && b.status === "active"; i++) {
    const move = b.fighters[0].cooldowns.tidal_slam ? "pinch" : "tidal_slam";
    b = await guestStoryRequest({
      action: "turn",
      matchId: b.id,
      version: b.version,
      move,
    });
  }
  expect(b.status).toBe("completed");
  expect(b.winnerId).toBe("player");
  expect((await readGuestStory()).progress).toHaveLength(1);
  expect((await readGame()).progression.xp).toBe(40);
  await guestStoryRequest({
    action: "turn",
    matchId: b.id,
    version: b.version,
    move: "pinch",
  });
  expect((await readGame()).progression.xp).toBe(40);
  expect(typeof resolveTurn).toBe("function");
});
