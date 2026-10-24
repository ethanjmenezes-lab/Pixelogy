import { test, expect } from "@playwright/test";
import { mockLocation } from "./device";
test.beforeEach(async ({ page }) => {
  await mockLocation(page);
});
test("matchup, frozen preview, arena, guard, replay and exit", async ({
  page,
}) => {
  await page.goto("/battle/practice");
  await expect(
    page.getByRole("heading", { name: "Practice vs CPU." }),
  ).toBeVisible();
  await expect(page.locator(".battle-scene")).toHaveCount(0);
  await page.waitForTimeout(1000);
  await expect(
    page.getByRole("button", { name: "Pinch", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Beach battle" }),
  ).toBeFocused();
  await expect(page.locator(".battle-trainer svg")).toBeVisible();
  await expect(page.locator(".arena-crab")).toHaveCount(2);
  await page.getByRole("button", { name: /^Guard/ }).click();
  await expect(page.getByText("Guard · next hit halved")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Pinch/ })).toBeEnabled();
  await expect(page.getByText("Guard · next hit halved")).toHaveCount(0);
  await expect(
    page.getByRole("meter", { name: "Your crab health" }),
  ).toHaveAttribute("aria-valuenow", "34");
  await page
    .getByRole("button", { name: "Exit Practice", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Practice ended." }),
  ).toBeFocused();
  const id = await page.locator(".battle-scene").getAttribute("data-battle-id");
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.locator(".battle-scene")).not.toHaveAttribute(
    "data-battle-id",
    id!,
  );
  await page
    .getByRole("button", { name: "Exit Practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Return to Matchup", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start Battle", exact: true }),
  ).toBeVisible();
});
test("arena fits phones and landscape with reduced motion", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/battle/practice");
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  for (const size of [
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    for (const name of [/^Pinch/, /^Guard/, /^Tidal Slam/, /^Exit Practice$/]) {
      const button = page.getByRole("button", { name });
      await expect(button).toBeInViewport({ ratio: 1 });
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page
        .locator("#feature-content")
        .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`arena-${size.width}.png`),
    });
  }
  expect(
    await page
      .locator(".arena-crab .crab")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

test("CPU pauses in background and an exited match cannot advance", async ({
  page,
}) => {
  await page.goto("/battle/practice");
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await page.getByRole("button", { name: /^Pinch/ }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(1100);
  await expect(page.locator(".battle-history summary")).toContainText(
    "1 moves",
  );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".battle-history summary")).toContainText(
    "2 moves",
  );
  await page.getByRole("button", { name: /^Pinch/ }).click();
  await page
    .getByRole("button", { name: "Exit Practice", exact: true })
    .click();
  await page.waitForTimeout(1100);
  await expect(page.locator(".battle-history summary")).toContainText(
    "3 moves",
  );
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.locator(".battle-history summary")).toContainText(
    "0 moves",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Start Battle", exact: true }),
  ).toBeVisible();
});
