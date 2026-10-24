import { mockLocation } from "./device";
import { test, expect } from "@playwright/test";
async function openMenu(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
test("real-location adapter moves markers and recenter restores follow", async ({
  page,
}) => {
  await mockLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(page.locator(".gps-avatar")).toBeVisible();
  const before = await page.locator(".companion").getAttribute("style");
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("test-location", { detail: { longitude: -96.3398 } }),
    ),
  );
  await expect
    .poll(() => page.locator(".companion").getAttribute("style"))
    .not.toBe(before);
  await page.mouse.move(180, 570);
  await page.mouse.down();
  await page.mouse.move(250, 600, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator(".overworld")).toHaveAttribute(
    "data-camera-mode",
    "detached",
  );
  await page.getByRole("button", { name: "Recenter map" }).click();
  await expect(page.locator(".overworld")).toHaveAttribute(
    "data-camera-mode",
    "follow",
  );
  await expect(page.locator(".joystick")).toHaveCount(0);
});
test("menu routes return to the same place and profile persists", async ({
  page,
}) => {
  await page.goto("/");
  for (const label of [
    /^Scan A new/,
    /^ShoreDex Your/,
    /^My Crab Gear/,
    /^Battle Practice/,
    /^Leaderboard Online/,
  ]) {
    await openMenu(page);
    await page.getByRole("link", { name: label }).click();
    await expect(page.locator(".feature-overlay")).toBeVisible();
    await page
      .getByRole("link", { name: "Back to world", exact: true })
      .click();
  }
  await openMenu(page);
  await page.getByRole("link", { name: /^Profile \/ Settings/ }).click();
  await page.getByLabel("Explorer name").fill("Sunny");
  await page.getByRole("button", { name: "Outfit color 2" }).click();
  await page.getByLabel("Headwear").selectOption("cap");
  await page.getByRole("button", { name: "Save explorer" }).click();
  await expect(page.getByRole("status")).toContainText("Explorer saved");
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await expect(page.locator(".hud-info strong")).toHaveText("Sunny");
  await page.reload();
  await expect(page.locator(".hud-info strong")).toHaveText("Sunny");
});
test("phone sizes and landscape keep controls within viewport without document scrolling", async ({
  page,
}) => {
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const button = page.getByRole("button", { name: "Open crab menu" });
    await expect(button).toBeVisible();
    const bounds = (await button.boundingBox())!;
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(height);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(
      await page.evaluate(() => ({
        w: document.documentElement.scrollWidth,
        h: document.documentElement.scrollHeight,
      })),
    ).toEqual({ w: width, h: height });
    await openMenu(page);
    await expect(
      page.getByRole("link", { name: /^Profile \/ Settings/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close menu" }).click();
  }
});
test("menu dismisses outside and focuses back on its trigger", async ({
  page,
}) => {
  await page.goto("/");
  await openMenu(page);
  await page.mouse.click(20, 150);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open crab menu" }),
  ).toBeFocused();
});
test("poor accuracy and denied GPS never replace location with a fictional map", async ({
  page,
}) => {
  await mockLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(page.locator(".gps-avatar")).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent("test-location", { detail: { accuracy: 500 } }),
    ),
  );
  await expect(
    page.getByRole("heading", { name: "Waiting for a clearer location" }),
  ).toBeVisible();
  await openMenu(page);
  await page.getByRole("link", { name: /^My Crab Gear/ }).click();
  await expect(page.locator(".feature-overlay")).toBeVisible();
});
test("permission denial leaves local features accessible", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(
      Object.getPrototypeOf(navigator.geolocation),
      "getCurrentPosition",
      {
        value: (_success: PositionCallback, failure: PositionErrorCallback) =>
          failure({
            code: 1,
            message: "Denied",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          }),
      },
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(
    page.getByRole("heading", { name: "Location permission is off" }),
  ).toBeVisible();
  await expect(page.locator(".gps-avatar")).toHaveCount(0);
  await openMenu(page);
  await page.getByRole("link", { name: /^ShoreDex Your/ }).click();
  await expect(page.locator(".feature-overlay")).toBeVisible();
});
test("map service failure offers retry without blocking local gameplay", async ({
  page,
}) => {
  await mockLocation(page);
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(page.getByRole("button", { name: "Retry map" })).toBeVisible();
  await openMenu(page);
  await page.getByRole("link", { name: /^Battle Practice/ }).click();
  await expect(
    page.getByRole("button", { name: "Pinch A trusty little hit" }),
  ).toBeVisible();
});

test("pixel terrain loads real-coordinate vector features with crisp controls and an offset companion", async ({
  page,
}) => {
  await mockLocation(page);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(page.locator(".geographic-map")).toHaveAttribute(
    "data-map-ready",
    "true",
  );
  const canvas = page.locator(".geographic-map canvas");
  const sizes = await canvas.evaluate((c) => ({
    width: (c as HTMLCanvasElement).width,
    display: c.getBoundingClientRect().width,
    rendering: getComputedStyle(c).imageRendering,
  }));
  expect(sizes.width).toBeCloseTo(sizes.display / 3, 0);
  expect(sizes.rendering).toBe("pixelated");
  const player = await page.locator(".gps-avatar").boundingBox();
  const crab = await page.locator(".gps-crab").boundingBox();
  expect(Math.abs(player!.x - crab!.x)).toBeGreaterThan(15);
  await expect(
    page.getByRole("link", { name: "OpenFreeMap", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/pixel-world-${test.info().project.name}.png`,
  });
  expect(errors).toEqual([]);
});
