import { test, expect } from "@playwright/test";
import { mockLocation } from "./device";
test("characters react independently without changing camera follow or opening menu", async ({
  page,
}) => {
  await mockLocation(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Enable location" }).click();
  const player = page.getByRole("button", {
    name: "Celebrate with your explorer",
  });
  const crab = page.getByRole("button", { name: "Play with your crab" });
  await player.click();
  await expect(player.locator(".character-reaction")).toHaveAttribute(
    "data-reaction",
    "1",
  );
  await crab.click();
  await crab.click();
  await expect(crab.locator(".character-reaction")).toHaveAttribute(
    "data-reaction",
    "2",
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".overworld")).toHaveAttribute(
    "data-camera-mode",
    "follow",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await player.focus();
  await page.keyboard.press("Enter");
  await expect(player.locator(".character-reaction")).toHaveAttribute(
    "data-reaction",
    "2",
  );
  expect(
    await player
      .locator(".character-reaction")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});
test("preparation actions, equipped move cards, and phone layouts", async ({
  page,
}, info) => {
  await mockLocation(page);
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/battle/practice");
    await expect(
      page.getByRole("region", { name: "Equipped attacks" }),
    ).toContainText("Basic Splash");
    for (const name of ["Start Battle", "Change Attacks", "Change Gear"]) {
      const control = page.getByRole(
        name === "Start Battle" ? "button" : "link",
        { name, exact: true },
      );
      await expect(control).toBeVisible();
      const box = await control.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(height);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`preparation-${width}.png`),
    });
  }
  await page.getByRole("link", { name: "Change Attacks", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Moves", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Unlock at level 3", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Done · Return to Matchup" }).click();
  await page.getByRole("link", { name: "Change Gear", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Crab Workshop" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Return to Matchup", exact: true })
    .click();
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Beach battle" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Basic Splash/ }),
  ).toBeVisible();
});
