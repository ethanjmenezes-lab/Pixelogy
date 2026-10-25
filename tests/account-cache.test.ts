import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  open: vi.fn(),
  query: vi.fn(),
  session: vi.fn(),
}));
vi.mock("idb", () => ({ openDB: mocks.open }));
vi.mock("../src/cloud/client", () => ({
  cloudSession: mocks.session,
  cloud: { from: () => ({ select: () => ({ eq: mocks.query }) }) },
}));
import { fetchCloudGame } from "../src/cloud/game";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("navigator", { onLine: true });
  mocks.session.mockResolvedValue({ user: { id: "account-a" } });
  mocks.query.mockResolvedValue({ data: [], error: null });
});
it("loads online account data when IndexedDB cannot open", async () => {
  mocks.open.mockRejectedValue(new Error("Storage denied"));
  await expect(fetchCloudGame()).resolves.toMatchObject({
    userId: "account-a",
    offline: false,
  });
});
it("retains a successful server response when offline-cache quota is exhausted", async () => {
  const close = vi.fn();
  mocks.open.mockResolvedValue({
    put: vi.fn().mockRejectedValue(new Error("Quota exceeded")),
    close,
  });
  await expect(fetchCloudGame()).resolves.toMatchObject({
    userId: "account-a",
    offline: false,
  });
  expect(close).toHaveBeenCalledOnce();
});
it("only reads this account's offline snapshot and never fabricates an empty save", async () => {
  vi.stubGlobal("navigator", { onLine: false });
  mocks.query.mockRejectedValue(new Error("Offline"));
  const get = vi.fn().mockResolvedValue(undefined);
  mocks.open.mockResolvedValue({ get, close: vi.fn() });
  await expect(fetchCloudGame()).rejects.toThrow("no offline save");
  expect(get).toHaveBeenCalledWith("snapshots", "account-a");
});
