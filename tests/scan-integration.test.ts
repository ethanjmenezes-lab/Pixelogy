import "fake-indexeddb/auto";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  generate: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ rpc: mock.rpc, auth: { getUser: mock.getUser } }),
}));
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: mock.generate };
  },
}));
vi.mock("../src/cloud/client", () => ({ cloudSession: async () => null }));
import handler, { type AnalyzeResponse } from "../api/analyze";
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
async function scan(token = "fixture-token") {
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
        ...(token ? { authorization: `Bearer ${token}` } : {}),
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
  mock.getUser
    .mockReset()
    .mockResolvedValue({
      data: { user: { id: "c3333333-3333-4333-8333-333333333333" } },
      error: null,
    });
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
it("routes a sample bottle through verified Supabase auth, per-user reservation, Gemini and the real catalog", async () => {
  const { status, body } = await scan();
  expect(status).toBe(200);
  expect(shoreCatalog).toHaveLength(200);
  expect(body.candidates).toEqual(["water-bottle"]);
  expect(mock.rpc).toHaveBeenCalledWith("begin_scan", {
    image_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
  });
  expect(mock.generate.mock.calls[0][0].contents[0].inlineData.data).toBe(
    image.split(",")[1],
  );
  expect(body.signature).toBe(
    createHmac("sha256", "fixture-signing-secret")
      .update(body.payload!)
      .digest("hex"),
  );
  expect((await readGame()).items).toHaveLength(0);
  expect(mock.getUser).toHaveBeenCalledWith("fixture-token");
  expect(JSON.parse(body.payload!)).toMatchObject({
    purpose: "discovery",
    userId: "c3333333-3333-4333-8333-333333333333",
    scanId,
    candidates: ["water-bottle"],
  });
  expect(mock.rpc.mock.calls.every(([name]) => name === "begin_scan")).toBe(
    true,
  );
});
it.each([
  [
    { code: "PGRST202", message: "missing function" },
    "ACCOUNT_SCAN_NOT_DEPLOYED",
    503,
  ],
  [
    { message: "Wait 30 seconds before retrying this photo" },
    "SCAN_RETRY_TOO_SOON",
    429,
  ],
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

it("rejects absent and forged tokens without Gemini, reservation or any award receipt", async () => {
  expect((await scan("")).status).toBe(401);
  expect(mock.getUser).not.toHaveBeenCalled();
  mock.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: "invalid jwt" },
  });
  const response = await scan("forged");
  expect(response.status).toBe(401);
  expect(response.body.payload).toBeUndefined();
  expect(mock.generate).not.toHaveBeenCalled();
  expect(mock.rpc).not.toHaveBeenCalled();
});
