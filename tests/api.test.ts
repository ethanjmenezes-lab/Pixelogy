import { beforeEach, it, expect, vi } from "vitest";
import handler, {
  type AnalyzeRequest,
  type AnalyzeResponse,
} from "../api/analyze";
const generateContent = vi.hoisted(() => vi.fn());
vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
}));
const authorize = vi.hoisted(() => vi.fn());
const beginScan = vi.hoisted(() => vi.fn());
vi.mock("../server/cloud.js", () => ({
  authorized: authorize,
  receipt: (data: unknown) => ({
    payload: JSON.stringify(data),
    signature: "test-signature",
  }),
}));
const valid = {
  objectName: "Plastic bag",
  material: "plastic",
  category: "bag",
  attributes: [],
  confidence: 0.95,
  ambiguous: false,
  safety: "allowed",
};
async function call(
  body: unknown,
  method = "POST",
  headers: AnalyzeRequest["headers"] = { "content-type": "application/json" },
) {
  let code = 200;
  let data: unknown;
  const response: AnalyzeResponse = {
    setHeader: () => {},
    status: (c) => {
      code = c;
      return response;
    },
    json: (value) => {
      data = value;
    },
  };
  await handler({ method, headers, body }, response);
  return { code, data };
}
beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-only");
  generateContent.mockReset();
  beginScan.mockResolvedValue({ data: "scan-id", error: null });
  authorize.mockResolvedValue({
    userId: "user-id",
    client: { rpc: beginScan },
  });
});
it("requires POST, JSON and explicit consent before invoking the provider", async () => {
  expect((await call({}, "GET")).code).toBe(405);
  expect((await call({}, "POST", {})).code).toBe(415);
  expect(
    (await call({ consent: false, image: "data:image/jpeg;base64,YQ==" })).code,
  ).toBe(400);
  expect(generateContent).not.toHaveBeenCalled();
});
it("rejects oversized requests and absent credentials", async () => {
  expect(
    (
      await call({}, "POST", {
        "content-type": "application/json",
        "content-length": "3000000",
      })
    ).code,
  ).toBe(413);
  vi.stubEnv("GEMINI_API_KEY", "");
  expect(
    (await call({ consent: true, image: "data:image/jpeg;base64,YQ==" })).code,
  ).toBe(503);
  expect(generateContent).not.toHaveBeenCalled();
});
it("returns catalog candidates from validated recognition and rejects malformed data", async () => {
  generateContent.mockResolvedValueOnce({ text: JSON.stringify(valid) });
  expect(
    await call({ consent: true, image: "data:image/jpeg;base64,YQ==" }),
  ).toMatchObject({
    code: 200,
    data: {
      status: "matched",
      candidates: ["grocery-bag"],
      recognition: valid,
    },
  });
  generateContent.mockResolvedValueOnce({
    text: JSON.stringify({ ...valid, confidence: 2 }),
  });
  expect(
    (await call({ consent: true, image: "data:image/jpeg;base64,YQ==" })).code,
  ).toBe(502);
});
it("does not leak provider errors or secrets", async () => {
  generateContent.mockRejectedValue(new Error("sensitive-provider-detail"));
  const result = await call({
    consent: true,
    image: "data:image/jpeg;base64,YQ==",
  });
  expect(result.code).toBe(502);
  expect(JSON.stringify(result)).not.toContain("sensitive-provider-detail");
});
it("allows native preflight only for explicitly configured origins", async () => {
  vi.stubEnv("ALLOWED_ORIGINS", "capacitor://localhost,https://localhost");
  expect(
    (await call({}, "OPTIONS", { origin: "capacitor://localhost" })).code,
  ).toBe(200);
  expect(
    (await call({}, "OPTIONS", { origin: "https://untrusted.example" })).code,
  ).toBe(403);
  expect(generateContent).not.toHaveBeenCalled();
});

it("rejects unauthenticated scans before contacting Gemini", async () => {
  authorize.mockRejectedValueOnce(new Error("AUTH"));
  expect(
    (await call({ consent: true, image: "data:image/jpeg;base64,YQ==" })).code,
  ).toBe(401);
  expect(generateContent).not.toHaveBeenCalled();
});
it("rate limits before invoking Gemini and does not issue unsafe receipts", async () => {
  beginScan.mockResolvedValueOnce({
    data: null,
    error: { message: "Scan limit reached" },
  });
  expect(
    (await call({ consent: true, image: "data:image/jpeg;base64,YQ==" })).code,
  ).toBe(429);
  expect(generateContent).not.toHaveBeenCalled();
  generateContent.mockResolvedValueOnce({
    text: JSON.stringify({ ...valid, safety: "hazardous" }),
  });
  const result = await call({
    consent: true,
    image: "data:image/jpeg;base64,YQ==",
  });
  expect(result).toEqual({
    code: 200,
    data: {
      status: "blocked",
      candidates: [],
      recognition: { ...valid, safety: "hazardous" },
    },
  });
});
