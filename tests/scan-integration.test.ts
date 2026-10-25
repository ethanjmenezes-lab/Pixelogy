import "fake-indexeddb/auto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
const mock = vi.hoisted(() => ({ rpc: vi.fn(), generate: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: mock.rpc }),
}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mock.generate };
  },
}));
vi.mock("../src/cloud/client", () => ({ cloudSession: async () => null }));
import handler, { type AnalyzeResponse } from "../api/analyze";
import { saveGuestDiscovery } from "../src/guest/local";
import { dbPromise, readGame } from "../src/lib/storage";
import { shoreCatalog } from "../src/catalog";
const image =
  "data:image/jpeg;base64," +
  readFileSync(
    new URL("./fixtures/plastic-water-bottle.jpg", import.meta.url),
  ).toString("base64");
const recognition = {
  objectName: "Plastic water bottle",
  material: "plastic",
  category: "bottle",
  attributes: ["blue label", "intact", "empty"],
  confidence: 0.98,
  ambiguous: false,
  safety: "allowed",
};
const scanId = "07187c59-8aa6-4779-b420-55c646cb8b14";
async function scan() {
  let status = 200;
  let body: {
    code?: string;
    candidates?: string[];
    payload?: string;
    signature?: string;
  } = {};
  const res: AnalyzeResponse = {
    setHeader() {},
    status(n) {
      status = n;
      return res;
    },
    json(value) {
      body = value as typeof body;
    },
  };
  await handler(
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-vercel-forwarded-for": "192.0.2.1",
      },
      body: { consent: true, image },
    },
    res,
  );
  return { status, body };
}
beforeEach(async () => {
  vi.stubEnv("GEMINI_API_KEY", "fixture-key");
  vi.stubEnv("SCAN_SIGNING_SECRET", "fixture-signing-secret");
  vi.stubEnv("SUPABASE_URL", "https://fixture.supabase.co");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "fixture-public-key");
  vi.stubEnv("VERCEL", "1");
  mock.rpc.mockReset().mockResolvedValue({ data: scanId, error: null });
  mock.generate
    .mockReset()
    .mockResolvedValue({ text: JSON.stringify(recognition) });
  const db = await dbPromise;
  for (const store of db.objectStoreNames) await db.clear(store);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("routes a sample bottle through guest quota, Gemini adapter, real catalog and persistent idempotent local save without login", async () => {
  const { status, body } = await scan();
  expect(status).toBe(200);
  expect(shoreCatalog).toHaveLength(200);
  expect(body.candidates).toEqual(["water-bottle"]);
  expect(mock.rpc).toHaveBeenCalledWith(
    "reserve_guest_scan",
    expect.objectContaining({
      payload: expect.any(String),
      signature: expect.any(String),
    }),
  );
  expect(mock.generate.mock.calls[0][0].contents[0].inlineData.data).toBe(
    image.split(",")[1],
  );
  expect(body.signature).toBe(
    createHmac("sha256", "fixture-signing-secret")
      .update(body.payload!)
      .digest("hex"),
  );
  expect((await readGame()).items).toHaveLength(0);
  await saveGuestDiscovery("water-bottle", body.payload!);
  await saveGuestDiscovery("water-bottle", body.payload!);
  const game = await readGame();
  expect(game.items).toHaveLength(1);
  expect(game.items[0].catalogId).toBe("water-bottle");
  expect(game.claims).toHaveLength(0);
  expect(
    mock.rpc.mock.calls.every(([name]) => name === "reserve_guest_scan"),
  ).toBe(true);
});
it.each([
  [
    { code: "PGRST202", message: "missing function" },
    "GUEST_QUOTA_NOT_DEPLOYED",
    503,
  ],
  [{ message: "Invalid quota ticket" }, "SCAN_SIGNING_MISMATCH", 503],
  [{ message: "Scan allowance reached" }, "SCAN_QUOTA_REACHED", 429],
  [{ message: "private database details" }, "SCAN_STORAGE_UNAVAILABLE", 503],
])(
  "reports quota/setup failures before Gemini and awards nothing",
  async (error, code, status) => {
    mock.rpc.mockResolvedValue({ data: null, error });
    const response = await scan();
    expect(response.status).toBe(status);
    expect(response.body.code).toBe(code);
    expect(mock.generate).not.toHaveBeenCalled();
    expect((await readGame()).items).toHaveLength(0);
    expect(JSON.stringify(response)).not.toContain("private database details");
  },
);
it.each([401, 403, 404, 429, 504])(
  "reports provider failure %s without a receipt or award",
  async (status) => {
    mock.generate.mockRejectedValue({
      status,
      message: "secret-provider-error",
    });
    const response = await scan();
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.payload).toBeUndefined();
    expect(JSON.stringify(response)).not.toContain("secret-provider-error");
    expect((await readGame()).items).toHaveLength(0);
  },
);
it.each(["not json", JSON.stringify({ ...recognition, confidence: 9 })])(
  "rejects invalid provider data without an award",
  async (text) => {
    mock.generate.mockResolvedValue({ text });
    expect((await scan()).body.code).toBe("GEMINI_INVALID_RESPONSE");
    expect((await readGame()).items).toHaveLength(0);
  },
);
it("never signs an unsafe bottle result", async () => {
  mock.generate.mockResolvedValue({
    text: JSON.stringify({ ...recognition, safety: "hazardous" }),
  });
  const response = await scan();
  expect(response.body.candidates).toEqual([]);
  expect(response.body.payload).toBeUndefined();
  expect((await readGame()).items).toHaveLength(0);
});
