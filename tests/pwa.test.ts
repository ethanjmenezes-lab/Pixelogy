import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { shellVersion, publicShell } from "../pwa.config";
it("versions static content, including unhashed manifest and icon bytes, deterministically", () => {
  const original: Array<[string, string | Uint8Array]> = [
    ["index.html", "shell"],
    ["manifest.webmanifest", "name"],
    ["icon.png", new Uint8Array([1, 2])],
  ];
  expect(shellVersion(original)).toBe(shellVersion([...original].reverse()));
  for (let i = 0; i < original.length; i++) {
    const changed = [...original];
    changed[i] = [original[i][0], "changed"];
    expect(shellVersion(changed)).not.toBe(shellVersion(original));
  }
  expect(publicShell).toContain("apple-touch-icon.png");
  expect(publicShell).toContain("icon-maskable-512.png");
});
it("keeps Vercel APIs and static PWA resources outside SPA fallback with explicit headers", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8"));
  const matcher = new RegExp("^" + config.rewrites[0].source + "$");
  for (const path of [
    "/scan",
    "/collection",
    "/profile",
    "/battle/practice",
    "/",
  ])
    expect(matcher.test(path)).toBe(true);
  for (const path of [
    "/api",
    "/api/analyze",
    "/sw.js",
    "/manifest.webmanifest",
    "/assets/app.js",
    "/icon-maskable-512.png",
    "/apple-touch-icon.png",
  ])
    expect(matcher.test(path)).toBe(false);
  expect(
    config.headers.find((h: { source: string }) => h.source === "/sw.js")
      .headers,
  ).toContainEqual({
    key: "Cache-Control",
    value: "no-cache, no-store, must-revalidate",
  });
});
