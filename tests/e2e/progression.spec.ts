import { test, expect } from "@playwright/test";
import { mockAccount } from "./cloudFixture";
import { mockLocation } from "./device";
test("foreground walking awards both levels, queues celebrations, preserves choices and survives reload", async ({
  page,
}, info) => {
  const account = await mockAccount(page);
  account.playerXp = 96;
  account.xp = 195;
  await mockLocation(page);
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(page.locator(".gps-avatar")).toBeVisible();
  await page.getByRole("button", { name: "Recenter map" }).click();
  await page.mouse.move(180, 570);
  await page.mouse.down();
  await page.mouse.move(230, 600, { steps: 5 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Recenter map" }).click();
  expect(account.walkingMm).toBe(0);
  for (let i = 1; i <= 6; i++) {
    await page.clock.fastForward(10000);
    await page.evaluate(
      (i) =>
        window.dispatchEvent(
          new CustomEvent("test-location", {
            detail: { latitude: 30.62 + (i * 20) / 111195 },
          }),
        ),
      i,
    );
    // Wait for the durable queue before advancing the virtual clock.
    await expect
      .poll(async () => {
        const pending = await page.evaluate(async () => {
          const db = await new Promise<IDBDatabase>((resolve) => {
            const request = indexedDB.open("pixelogy-walking");
            request.onsuccess = () => resolve(request.result);
          });
          const rows = await new Promise<{ distanceMm: number }[]>(
            (resolve) => {
              const request = db
                .transaction("outbox")
                .objectStore("outbox")
                .getAll();
              request.onsuccess = () => resolve(request.result);
            },
          );
          db.close();
          return rows.reduce((n, row) => n + row.distanceMm, 0);
        });
        return pending + account.walkingMm;
      })
      .toBeGreaterThan(i * 19000);
    await page.clock.fastForward(10000);
    await expect.poll(() => account.walkingMm).toBeGreaterThan(i * 19000);
  }
  expect(account.playerXp).toBe(104);
  expect(account.xp).toBe(200);
  const celebration = page.getByRole("status", { name: "Level up" });
  await expect(celebration).toContainText("PLAYER LEVEL UP!");
  await expect(celebration).toContainText("Cosmetic Unlocked!");
  await page.screenshot({ path: info.outputPath("dual-level-up.png") });
  await celebration.getByRole("button", { name: "Next level-up" }).click();
  await expect(celebration).toContainText("CRAB LEVEL UP!");
  await expect(celebration).toContainText("Shell Slam");
  await celebration.getByRole("button", { name: "Close level-up" }).click();
  await page.getByRole("link", { name: "Open explorer profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Player Lv. 2" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Crab Lv. 3" })).toBeVisible();
  await page.getByRole("button", { name: /Lagoon shirt/ }).click();
  await page.getByRole("button", { name: "Save explorer" }).click();
  await expect(page.getByRole("status")).toContainText("Explorer saved");
  expect(account.appearance.clothing).toBe(4);
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: info.outputPath(`progression-${width}.png`),
    });
  }
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Player Lv. 2" }),
  ).toBeVisible();
  await expect(page.getByText("Selected: Pinch Attack")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Explorer vest/ }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(
    page.locator('.gps-avatar svg path[fill="#25C6B2"]'),
  ).toHaveCount(1);
});
test("denied GPS and fictional story screens never create walking events", async ({
  page,
}) => {
  const account = await mockAccount(page);
  await page.addInitScript(() =>
    Object.defineProperty(
      Object.getPrototypeOf(navigator.geolocation),
      "getCurrentPosition",
      {
        value: (_ok: unknown, fail: PositionErrorCallback) =>
          fail({ code: 1 } as GeolocationPositionError),
      },
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(
    page.getByRole("heading", { name: "Location permission is off" }),
  ).toBeVisible();
  await page.goto("/story");
  await page
    .getByRole("button", { name: "Watch Opening", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Story cinematic" }),
  ).toBeVisible();
  expect(account.playerXp).toBe(0);
  expect(account.walkingMm).toBe(0);
});
