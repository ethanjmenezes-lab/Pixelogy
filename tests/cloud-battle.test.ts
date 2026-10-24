import { it, expect, vi, beforeEach } from "vitest";
import handler from "../api/battle";
import { createBattle } from "../src/lib/battle";
import { BASE_STATS } from "../src/lib/gear";
import type { AnalyzeResponse } from "../api/analyze";
const { auth, rpc, from } = vi.hoisted(() => ({
  auth: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
}));
vi.mock("../server/cloud.js", () => ({
  authorized: auth,
  receipt: (data: unknown) => ({
    payload: JSON.stringify(data),
    signature: "test",
  }),
}));
beforeEach(() => {
  auth.mockResolvedValue({ userId: "owner", client: { from, rpc } });
  rpc.mockImplementation(async (_name, args) => ({
    data: JSON.parse(args.payload).state,
    error: null,
  }));
});
async function call(body: unknown) {
  let code = 200,
    data: unknown;
  const res: AnalyzeResponse = {
    setHeader: () => {},
    status(c) {
      code = c;
      return res;
    },
    json(d) {
      data = d;
    },
  };
  await handler({ method: "POST", headers: {}, body }, res);
  return { code, data };
}
function table(data: unknown) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => ({ data, error: null }),
    maybeSingle: async () => ({ data, error: null }),
    then: (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data, error: null }).then(resolve),
  };
  return chain;
}
it("creates a match from server-owned gear and moves, ignoring claimed stats", async () => {
  const rows: Record<string, unknown> = {
    practice_matches: null,
    player_discoveries: [{ id: "item", catalog_id: "grocery-bag" }],
    crab_equipment: [{ slot: "head", discovery_id: "item" }],
    player_progression: [{ battle_xp: 0 }],
    selected_moves: [{ main: "pinch", special: "bag_snare" }],
  };
  from.mockImplementation((name) => table(rows[name]));
  const result = await call({
    action: "start",
    requestId: "11111111-1111-4111-8111-111111111111",
    stats: { hp: 99999 },
  });
  expect(result.code).toBe(200);
  expect(result.data).toMatchObject({
    version: 0,
    fighters: [
      {
        startingStats: { hp: 40 },
        snapshotBlueprints: ["bag_helm"],
        moves: ["pinch", "guard", "bag_snare"],
      },
      {},
    ],
  });
});
it("does not apply a stale turn twice", async () => {
  const state = createBattle(BASE_STATS);
  state.version = 2;
  from.mockImplementation(() => table({ state }));
  rpc.mockClear();
  expect(
    await call({
      action: "turn",
      matchId: state.id,
      version: 0,
      move: "pinch",
    }),
  ).toEqual({ code: 200, data: state });
  expect(rpc).not.toHaveBeenCalled();
});
it("rejects unavailable moves without committing a battle update", async () => {
  const state = createBattle(BASE_STATS);
  from.mockImplementation(() => table({ state }));
  rpc.mockClear();
  expect(
    (
      await call({
        action: "turn",
        matchId: state.id,
        version: 0,
        move: "crushing_claw",
      })
    ).code,
  ).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});
it("rejects missing account authentication", async () => {
  auth.mockRejectedValueOnce(new Error("AUTH"));
  expect(
    (
      await call({
        action: "start",
        requestId: "11111111-1111-4111-8111-111111111111",
      })
    ).code,
  ).toBe(401);
});
