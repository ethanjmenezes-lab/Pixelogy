import { test, expect } from "@playwright/test";
import { mockLocation } from "./device";
test.beforeEach(async ({ page }) => {
  await mockLocation(page);
});
test("ShoreDex chip filters apply, cancel and reset at phone sizes", async ({
  page,
}, info) => {
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/collection");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    const sheet = page.getByRole("dialog");
    await sheet.getByRole("button", { name: "legendary", exact: true }).click();
    await page.screenshot({ path: info.outputPath(`filters-${width}.png`) });
    await sheet.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.locator(".dex-entry")).toHaveCount(8);
    await expect(
      page.getByRole("button", { name: "Filter · 1" }),
    ).toBeFocused();
    await page.getByRole("button", { name: "Filter · 1" }).click();
    await sheet.getByRole("button", { name: "straws", exact: true }).click();
    await sheet.getByRole("button", { name: "Main claw", exact: true }).click();
    await sheet.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.locator(".dex-entry")).toHaveCount(1);
    await page.getByRole("searchbox").fill("spiral");
    await expect(page.locator(".dex-entry")).toHaveCount(1);
    await page.getByRole("button", { name: "Filter · 3" }).click();
    await sheet.getByRole("button", { name: "Reset", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Filter · 3" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Filter · 3" }).click();
    await sheet.getByRole("button", { name: "Reset", exact: true }).click();
    await sheet.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByRole("searchbox").fill("");
    await expect(page.locator(".dex-entry")).toHaveCount(200);
  }
});
test("damage waits for impact, input locks, and CPU has a visible transition", async ({
  page,
}, info) => {
  await page.goto("/battle/practice");
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  const scene = page.locator(".battle-scene");
  const player = page.getByRole("meter", { name: "Your crab health" });
  const cpu = page.getByRole("meter", { name: "Pebble · CPU health" });
  const pinch = page.getByRole("button", { name: /^Pinch Attack/ });
  await pinch.click();
  await expect(scene).toHaveAttribute("data-phase", "windup");
  await expect(cpu).toHaveAttribute("aria-valuenow", "40");
  await expect(pinch).toBeDisabled();
  await pinch.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.locator(".ally .combat-windup")).toBeVisible();
  await page.screenshot({ path: info.outputPath("player-windup.png") });
  await expect(scene).toHaveAttribute("data-phase", "impact");
  await expect(cpu).toHaveAttribute("aria-valuenow", "30");
  await expect(player).toHaveAttribute("aria-valuenow", "40");
  await expect(page.locator(".enemy .hit-reaction")).toBeVisible();
  await expect(scene).toHaveAttribute("data-phase", "transition");
  await expect(page.locator(".turn-banner")).toHaveText("Pebble’s Turn!");
  await expect(page.locator(".enemy .combat-windup")).toBeVisible();
  await expect(page.locator(".cpu-trainer")).toHaveClass(/trainer-cheer/);
  await expect(player).toHaveAttribute("aria-valuenow", "40");
  await expect(player).toHaveAttribute("aria-valuenow", "29");
  await expect(scene).toHaveAttribute("data-phase", "ready");
  await expect(pinch).toBeEnabled();
  await expect(scene).toHaveAttribute("data-version", "2");
});

test("Legendary discovery reveals, persists canonical rarity and awards no cleanup XP", async ({
  page,
}, info) => {
  const { mockAccount } = await import("./cloudFixture");
  const { mockCamera, mockRecognition, takePhoto, safeRecognition } =
    await import("./device");
  const account = await mockAccount(page, "spiral-straw");
  await mockCamera(page);
  await mockRecognition(page, {
    ...safeRecognition,
    candidates: ["spiral-straw"],
    recognition: { ...safeRecognition.recognition, objectName: "Spiral straw" },
  });
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
  await expect(page.locator(".discovery-result.legendary")).toBeVisible();
  await expect(page.locator(".discovery-result .rarity")).toHaveText(
    "legendary",
  );
  await expect(page.locator(".hud-info > small")).toContainText("0 Player XP");
  expect(account.claims).toHaveLength(0);
  await expect(page.locator(".catalog-reveal")).toHaveCSS(
    "filter",
    /^(none|brightness\(1\))$/,
  );
  await page.screenshot({
    path: info.outputPath("legendary-reveal.png"),
    animations: "disabled",
  });
  await page.getByRole("link", { name: "Open ShoreDex" }).click();
  await expect(page.locator(".dex-entry.unlocked.legendary")).toHaveCount(1);
  await page.reload();
  await page.locator(".dex-entry.unlocked.legendary").click();
  await expect(page.getByRole("dialog").locator(".rarity")).toHaveText(
    "legendary",
  );
  await expect(page.getByRole("dialog")).toContainText("tide-twisting spear");
  await expect(page.locator(".hud-info > small")).toContainText("0 Player XP");
  expect(account.claims).toHaveLength(0);
});

test("compact Workshop preserves slot artwork and stat preview at phone sizes", async ({
  page,
}, info) => {
  const { mockAccount } = await import("./cloudFixture");
  const state = await mockAccount(page);
  state.discoveries.push({
    id: "22222222-2222-4222-8222-222222222222",
    user_id: "11111111-1111-4111-8111-111111111111",
    catalog_id: "grocery-bag",
    discovered_at: "2026-10-24T00:00:00Z",
  });
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/workshop");
    await expect(page.locator(".slot-row button")).toHaveCount(5);
    await page.locator(".gear-option").click();
    await expect(page.locator(".stat-grid")).toContainText("+2");
    await expect(
      page.getByRole("button", { name: "Equip this find" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator("#feature-content").evaluate((el) => el.scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath(`workshop-${width}.png`),
      animations: "disabled",
    });
  }
  await page.getByRole("button", { name: "Equip this find" }).click();
  await expect(
    page.getByRole("button", { name: "Unequip head" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Head", exact: true }).locator("img"),
  ).toHaveAttribute("src", "/shoredex/grocery-bag.svg");
  await expect(page.getByRole("region", { name: "Crab moves" })).toContainText(
    "Bag Snare",
  );
});
