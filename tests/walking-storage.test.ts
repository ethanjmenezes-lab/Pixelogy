import "fake-indexeddb/auto";
import { it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), session: vi.fn() }));
vi.mock("../src/cloud/client", () => ({
  rpc: mock.rpc,
  cloudSession: mock.session,
}));
import {
  queueWalking,
  pendingWalking,
  syncWalking,
} from "../src/progression/walkingStore";
import { dbPromise, readGame } from "../src/lib/storage";
it("durably retries the identical event after a lost response without doubling either reward", async () => {
  const user = "retry-account";
  mock.session.mockResolvedValue({ user: { id: user } });
  await queueWalking(user, { distanceMm: 100000, durationMs: 50000 });
  const original = (await pendingWalking(user))[0];
  let xp = 0;
  const ledger = new Set<string>();
  let lost = true;
  mock.rpc.mockImplementation(async (_name, args) => {
    if (!ledger.has(args.event_id)) {
      ledger.add(args.event_id);
      xp += 8;
    }
    if (lost) {
      lost = false;
      throw new Error("Response lost");
    }
    return { playerXp: 0, crabXp: 0 };
  });
  await expect(syncWalking(user)).rejects.toThrow("Response lost");
  expect((await pendingWalking(user))[0].id).toBe(original.id);
  await syncWalking(user);
  expect(xp).toBe(8);
  expect(await pendingWalking(user)).toHaveLength(0);
  await queueWalking("other-account", { distanceMm: 50000, durationMs: 25000 });
  await syncWalking(user);
  expect(await pendingWalking("other-account")).toHaveLength(1);
});
it("seeds legacy explorer XP once, preserving crab XP and independent future cleanups", async () => {
  mock.session.mockResolvedValue(null);
  const db = await dbPromise;
  await db.clear("playerProgression");
  await db.put("cleanupEvents", {
    eventId: "old",
    collectibleId: "old",
    category: "plastic_bottle",
    confirmedAtIso: new Date().toISOString(),
    xpAwarded: 15,
    selfReported: true,
  });
  expect((await readGame()).player.xp).toBe(15);
  await db.put("cleanupEvents", {
    eventId: "new",
    collectibleId: "new",
    category: "plastic_bottle",
    confirmedAtIso: new Date().toISOString(),
    xpAwarded: 10,
    selfReported: true,
  });
  const next = await readGame();
  expect(next.player.xp).toBe(15);
  expect(next.claims.reduce((n, c) => n + c.xpAwarded, 0)).toBe(25);
  expect(next.progression.xp).toBe(0);
});
