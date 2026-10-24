import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";

test("iPhone installation instructions are accessible from Profile", async ({
  page,
}) => {
  await page.goto("/profile");
  const guide = page.getByRole("region", { name: "Install Pixelogy" });
  await expect(guide).toContainText("Installation is manual on iPhone.");
  for (const text of ["Share", "Add to Home Screen", "Open as Web App", "Add"])
    await expect(guide.getByText(text, { exact: true })).toBeVisible();
  await expect(guide).toContainText(
    "Gemini and new map tiles need an internet connection.",
  );
});

test("production worker waits for explicit update and never caches private or API responses", async ({
  page,
  context,
}) => {
  let revision = 1;
  const mime: Record<string, string> = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".webmanifest": "application/manifest+json",
  };
  const server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname;
    res.setHeader("Cache-Control", "no-store");
    if (path.startsWith("/api/") || path === "/private-profile.json") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ private: true }));
      return;
    }
    try {
      const filename = path === "/" || !extname(path) ? "/index.html" : path;
      let content = await readFile(resolve("dist", "." + filename));
      if (path === "/sw.js" && revision === 2)
        content = Buffer.from(
          content
            .toString()
            .replace(
              /pixelogy-shell-([a-f0-9]+)/g,
              "pixelogy-shell-$1-test-update",
            ),
        );
      res.setHeader(
        "Content-Type",
        mime[extname(filename)] || "application/octet-stream",
      );
      res.end(content);
    } catch {
      res.statusCode = 404;
      res.end("Not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    await page.goto(origin + "/battle/practice");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    const manifest = await (
      await context.request.get(origin + "/manifest.webmanifest")
    ).json();
    expect(manifest.theme_color).toBe("#594793");
    expect(
      manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable"),
    ).toBe(true);
    for (const file of ["/apple-touch-icon.png", "/icon-maskable-512.png"]) {
      const result = await context.request.get(origin + file);
      expect(result.status()).toBe(200);
      expect(result.headers()["content-type"]).toBe("image/png");
    }
    await page.evaluate(async () => {
      await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"consent":false}',
      });
      await fetch("/api/private");
      await fetch("/private-profile.json");
      await fetch("/icon-192.png?private=do-not-cache");
    });
    const cacheUrls = await page.evaluate(async () => {
      const names = await caches.keys();
      return (
        await Promise.all(
          names.map(async (n) =>
            (await (await caches.open(n)).keys()).map((r) => r.url),
          ),
        )
      ).flat();
    });
    expect(
      cacheUrls.every(
        (url) =>
          !url.includes("/api/") &&
          !url.includes("private") &&
          !url.includes("?"),
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Start Battle", exact: true })
      .click();
    await page.getByRole("button", { name: "Pinch Attack Power 7" }).click();
    await expect(page.locator(".combat-log")).toContainText("You used Pinch");
    const secondTab = await context.newPage();
    await secondTab.goto(origin + "/battle/practice");
    await secondTab
      .getByRole("button", { name: "Start Battle", exact: true })
      .click();
    await secondTab
      .getByRole("button", { name: "Pinch Attack Power 7" })
      .click();
    revision = 2;
    await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      await r!.update();
    });
    await expect(
      page.getByRole("button", { name: "Reload to update" }),
    ).toBeVisible();
    await expect(page.locator(".combat-log")).toContainText("You used Pinch");
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "Reload to update" }).click(),
    ]);
    await expect(
      page.getByRole("button", { name: "Reload to update" }),
    ).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(async () =>
          (await caches.keys()).some((name) => name.endsWith("test-update")),
        ),
      )
      .toBe(true);
    await expect(
      secondTab.getByRole("button", { name: "Reload to update" }),
    ).toBeVisible();
    await expect(secondTab.locator(".combat-log")).toContainText(
      "You used Pinch",
    );
    await Promise.all([
      secondTab.waitForEvent("load"),
      secondTab.getByRole("button", { name: "Reload to update" }).click(),
    ]);
    await expect(
      secondTab.getByRole("button", { name: "Reload to update" }),
    ).toHaveCount(0);
    await secondTab.close();
    await context.setOffline(true);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Start Battle", exact: true }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
