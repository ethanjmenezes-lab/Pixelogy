import "fake-indexeddb/auto";
import { beforeEach, it, expect, vi } from "vitest";
import { createHash } from "node:crypto";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), session: vi.fn() }));
vi.mock("../src/cloud/client", () => ({
  rpc: mock.rpc,
  cloudSession: mock.session,
}));
import { backupGuest } from "../src/guest/backup";
import { saveGuestDiscovery } from "../src/guest/local";
import { dbPromise, readGame } from "../src/lib/storage";
beforeEach(async () => {
  mock.session.mockResolvedValue({ user: { id: "account-a" } });
  mock.rpc.mockReset();
  const db = await dbPromise;
  for (const name of db.objectStoreNames) await db.clear(name);
  await saveGuestDiscovery(
    "grocery-bag",
    JSON.stringify({
      scanId: crypto.randomUUID(),
      candidates: ["grocery-bag"],
    }),
  );
});
it("failed backup keeps the guest collection intact for retry", async () => {
  mock.rpc.mockRejectedValue(new Error("offline"));
  await expect(backupGuest()).rejects.toThrow("offline");
  expect((await readGame()).items).toHaveLength(1);
});
it("requires a verified hash before rotating to a fresh guest save and keeps a recovery archive", async () => {
  mock.rpc.mockResolvedValue({ hash: "wrong" });
  await expect(backupGuest()).rejects.toThrow("verification");
  expect((await readGame()).items).toHaveLength(1);
  mock.rpc.mockImplementation(async (_name, { snapshot }) => ({
    hash: createHash("sha256").update(snapshot).digest("hex"),
  }));
  await backupGuest();
  expect((await readGame()).items).toHaveLength(0);
  const keys = await (await dbPromise).getAllKeys("guest");
  expect(keys.some((k) => k.startsWith("archive:account-a:"))).toBe(true);
  const calls = mock.rpc.mock.calls.length;
  await backupGuest();
  expect(mock.rpc).toHaveBeenCalledTimes(calls);
});
it("a session switch during upload cannot clear the guest save", async () => {
  mock.rpc.mockImplementation(async (_name, { snapshot }) => {
    mock.session.mockResolvedValue({ user: { id: "account-b" } });
    return { hash: createHash("sha256").update(snapshot).digest("hex") };
  });
  await backupGuest();
  expect((await readGame()).items).toHaveLength(1);
});
