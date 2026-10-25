import { test, expect } from "@playwright/test";
test("production app installs its shell, excludes API and works after offline reload", async ({
  page,
  context,
}) => {
  await page.goto("http://127.0.0.1:4173/");
  await expect(
    page.getByRole("button", { name: "Open crab menu" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  const manifest = await page.evaluate(
    async () => await (await fetch("/manifest.webmanifest")).json(),
  );
  expect(manifest.display).toBe("standalone");
  const keys = await page.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(
        names
          .filter((n) => n.startsWith("pixelogy-shell-"))
          .map(async (name) =>
            (await (await caches.open(name)).keys()).map(
              (r) => new URL(r.url).pathname,
            ),
          ),
      )
    ).flat();
  });
  expect(keys).toContain("/index.html");
  expect(keys.some((k) => k.startsWith("/api/"))).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Open crab menu" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page.getByRole("link", { name: /^Battle Practice/ }).click();
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await expect(page.getByRole("button", { name: /Pinch/ })).toBeEnabled();
  await page.getByRole("button", { name: /Pinch/ }).click();
  await expect(page.locator(".combat-log")).toContainText("You used Pinch");
  await page.goto("http://127.0.0.1:4173/collection/map");
  await page.reload();
  await expect(page.locator(".state-map path")).toHaveCount(50);
  await expect(
    page.getByRole("heading", { name: "U.S. Map", exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
});
