import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { recoveryUrl } from "../src/cloud/authNavigation";
it("always sends hosted recoveries to the stable callback without arbitrary next values", () => {
  expect(recoveryUrl("https://pixelogy-preview.vercel.app")).toBe(
    "https://pixelogy-three.vercel.app/auth/confirm",
  );
  expect(recoveryUrl("http://localhost:5173")).toBe(
    "http://localhost:5173/auth/confirm",
  );
});
it("Vercel rewrites recovery routes to the app but preserves API/static delivery", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const rule = config.rewrites.find(
    (r: { destination: string }) => r.destination === "/index.html",
  );
  const pattern = new RegExp("^" + rule.source + "$");
  for (const route of [
    "/auth/confirm",
    "/reset-password",
    "/auth/update-password",
  ])
    expect(pattern.test(route)).toBe(true);
  for (const route of ["/api/analyze", "/sw.js", "/assets/main.js"])
    expect(pattern.test(route)).toBe(false);
});
