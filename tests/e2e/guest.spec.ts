import { test, expect, type Page } from "@playwright/test";
import { mockCamera, mockLocation } from "./device";
// Existing guest discoveries from the earlier release remain usable. New guest scans are forbidden.
async function existingGuestFind(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open crab menu" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const modulePath = "/src/guest/local.ts";
    const { saveGuestDiscovery } = await import(modulePath);
    await saveGuestDiscovery(
      "grocery-bag",
      JSON.stringify({
        scanId: crypto.randomUUID(),
        candidates: ["grocery-bag"],
      }),
    );
  });
  await page.goto("/collection");
}
test.beforeEach(async ({ page }) => {
  await mockCamera(page);
  await mockLocation(page);
});
test("existing guest discoveries, two-state cleanups, equipment and CPU XP remain usable", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await existingGuestFind(page);
  await expect(page.locator(".dex-grid")).toBeVisible();
  await expect(page.locator(".state-map")).toHaveCount(0);
  await page.getByRole("link", { name: "U.S. Map", exact: true }).click();
  await expect(page.locator(".state-map path")).toHaveCount(50);
  await expect(
    page.locator(".state-map .selected, .state-map .cleaned"),
  ).toHaveCount(0);
  await expect(page.getByText("States Cleaned: 0 / 50")).toBeVisible();
  await page.getByRole("link", { name: "‹ Collection" }).click();
  await page.locator(".dex-entry.unlocked").click();
  await page
    .getByRole("button", { name: "I Picked It Up", exact: true })
    .click();
  await expect(
    page.getByText("All owned finds have cleanup self-reports."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Equip on your crab" }).click();
  await page.getByRole("button", { name: "Equip this find" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unequip head" }),
  ).toBeVisible();
  await existingGuestFind(page);
  await page.locator(".dex-entry.unlocked").click();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("test-location", {
        detail: { latitude: 35.46, longitude: -97.51 },
      }),
    ),
  );
  await page
    .getByRole("button", { name: "I Picked It Up", exact: true })
    .click();
  await expect(
    page.getByText("All owned finds have cleanup self-reports."),
  ).toBeVisible();
  await page.goto("/collection/map");
  await expect(page.getByText("States Cleaned: 2 / 50")).toBeVisible();
  await expect(page.getByText("Total Pickups: 2")).toBeVisible();
  await expect(page.locator("[data-state=TX]")).toHaveClass(/cleaned/);
  await expect(page.locator("[data-state=OK]")).toHaveClass(/cleaned/);
  await page.locator("[data-state=TX]").click();
  await expect(page.locator(".state-detail")).toContainText(
    "1 Pickups · 1 Trash Types",
  );
  await expect(page.locator(".feature-overlay")).toHaveCSS("opacity", "1");
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({ path: info.outputPath(`us-map-${width}.png`) });
  }
  await page.reload();
  await expect(page.getByText("States Cleaned: 2 / 50")).toBeVisible();
  await page.goto("/battle/practice");
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  for (let i = 0; i < 18; i++) {
    if (
      await page
        .getByRole("heading", { name: "Practice complete." })
        .isVisible()
    )
      break;
    const pinch = page.getByRole("button", { name: /^Pinch Attack/ });
    await expect(pinch).toBeEnabled();
    const special = page.getByRole("button", { name: /^Bag Snare/ });
    await ((await special.isEnabled()) ? special : pinch).click();
    await expect(page.locator(".battle-scene")).toHaveAttribute(
      "data-phase",
      "windup",
    );
    await expect(page.locator(".battle-scene")).toHaveAttribute(
      "data-phase",
      "ready",
      { timeout: 10000 },
    );
  }
  await expect(page.locator(".arena-results")).toContainText("Crab XP saved.");
  await page.goto("/profile");
  await page.reload();
  await expect(page.getByText("40 Crab XP", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Save Your Progress" }),
  ).toBeVisible();
});
test("guest location denial leaves cleanup unassigned and story can start without login", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(
      Object.getPrototypeOf(navigator.geolocation),
      "getCurrentPosition",
      {
        value: (_s: unknown, f: PositionErrorCallback) =>
          f({ code: 1 } as GeolocationPositionError),
      },
    ),
  );
  await existingGuestFind(page);
  await page.locator(".dex-entry.unlocked").click();
  await page
    .getByRole("button", { name: "I Picked It Up", exact: true })
    .click();
  await expect(
    page.getByText("All owned finds have cleanup self-reports."),
  ).toBeVisible();
  await page.goto("/collection/map");
  await expect(page.getByText("States Cleaned: 0 / 50")).toBeVisible();
  await expect(page.getByText("Total Pickups: 1")).toBeVisible();
  await page.goto("/story?stage=shellshore.01");
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Start Battle/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Start Battle/ }).click();
  await expect(page.locator(".battle-scene")).toBeVisible();
  await expect(page).toHaveURL(/\/story/);
});
test("guest real-location walking earns and retains both XP balances without an account", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(page.locator(".gps-avatar")).toBeVisible();
  for (let i = 1; i <= 6; i++) {
    await page.clock.fastForward(15000);
    await page.evaluate(
      (i) =>
        window.dispatchEvent(
          new CustomEvent("test-location", {
            detail: { latitude: 30.62 + (i * 20) / 111195 },
          }),
        ),
      i,
    );
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const db = await new Promise<IDBDatabase>((resolve) => {
            const r = indexedDB.open("pixelogy-v4");
            r.onsuccess = () => resolve(r.result);
          });
          const value = await new Promise<number>((resolve) => {
            const r = db
              .transaction("playerProgression")
              .objectStore("playerProgression")
              .get("local");
            r.onsuccess = () => resolve(r.result.distanceMm);
          });
          db.close();
          return value;
        }),
      )
      .toBeGreaterThan(i * 19000);
  }
  await page.goto("/profile");
  await page.reload();
  await expect(page.getByText("5 Crab XP", { exact: true })).toBeVisible();
  await expect(page.locator(".progression-details")).toContainText(
    "8 Player XP",
  );
});
