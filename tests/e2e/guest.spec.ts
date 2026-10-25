import { test, expect, type Page } from "@playwright/test";
import { mockCamera, mockLocation, takePhoto, safeRecognition } from "./device";
async function scan(page: Page) {
  await page.goto("/scan");
  await takePhoto(page);
  await page
    .getByRole("checkbox", {
      name: "I reviewed the object. This catalog match is correct and the litter is safe.",
    })
    .check();
  await page
    .getByRole("button", { name: "Save discovery", exact: true })
    .click();
  await expect(page.locator(".discovery-result")).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await mockCamera(page);
  await mockLocation(page);
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      json: {
        ...safeRecognition,
        payload: JSON.stringify({
          scanId: crypto.randomUUID(),
          candidates: ["grocery-bag"],
        }),
        signature: "fixture",
      },
    }),
  );
});
test("guest camera, discoveries, two-state cleanups, map, equipment and CPU XP persist", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await scan(page);
  await expect(page).toHaveURL(/\/scan$/);
  await page.getByRole("link", { name: "Open ShoreDex" }).click();
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
  await scan(page);
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
    page.getByText("+10 cleanup XP saved. OK recorded."),
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
  await scan(page);
  await page
    .getByRole("button", { name: "I Picked It Up", exact: true })
    .click();
  await expect(
    page.getByText("+15 cleanup XP saved. No state assigned."),
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
