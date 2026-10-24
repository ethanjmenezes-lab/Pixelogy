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
const valid = {
  label: "Plastic bag",
  category: "plastic_bag",
  subtype: null,
  safety: "allowed",
  bbox: [100, 100, 900, 900],
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
it("returns validated provider output and rejects malformed bounds", async () => {
  generateContent.mockResolvedValueOnce({ text: JSON.stringify(valid) });
  expect(
    await call({ consent: true, image: "data:image/jpeg;base64,YQ==" }),
  ).toEqual({ code: 200, data: valid });
  generateContent.mockResolvedValueOnce({
    text: JSON.stringify({ ...valid, bbox: [900, 900, 100, 100] }),
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
