import { test, expect } from "@playwright/test";
import { mockLocation } from "./device";
test("workshop separates main unlocks from equipped specials and persists selections", async ({
  page,
}, testInfo) => {
  await mockLocation(page);
  await page.goto("/workshop");
  const section = page.getByRole("region", { name: "Crab moves" });
  await expect(section).toContainText("Crab level 1");
  await expect(
    page.getByRole("button", { name: "Unlock at level 3", exact: true }),
  ).toBeDisabled();
  await expect(section).toContainText("Basic Splash · Equipped");
  // Seed two owned discoveries and earned battle XP in this isolated test profile.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("pixelogy-v4");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const tx = db.transaction(
      ["collectibles", "loadouts", "battleProgression"],
      "readwrite",
    );
    for (const [id, category, blueprint] of [
      ["bag", "plastic_bag", "bag_helm"],
      ["can", "aluminum_can", "can_shield"],
    ])
      tx.objectStore("collectibles").put({
        id,
        category,
        subtype: null,
        label: id,
        rarity: "common",
        gearBlueprintId: blueprint,
        gearRulesVersion: 1,
        createdAtIso: "2026-10-24",
        sprite: { thumbnailBlobKey: id, width: 256, height: 256 },
      });
    tx.objectStore("loadouts").put({ head: "bag", off_claw: "can" }, "local");
    tx.objectStore("battleProgression").put(
      {
        version: 1,
        xp: 200,
        unlockedMain: ["pinch", "shell_slam"],
        main: "pinch",
        special: "bag_snare",
      },
      "local",
    );
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  });
  await page.goto("/battle/practice");
  await page.getByRole("link", { name: "Change Attacks", exact: true }).click();
  await expect(section).toContainText("Pinch Attack · Equipped");
  await page
    .getByRole("button", { name: "Equip Shell Slam", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Equip Can Counter", exact: true })
    .click();
  await expect(section).toContainText("Can Counter · Equipped");
  await page.reload();
  await expect(section).toContainText("Shell Slam · Equipped");
  await expect(section).toContainText("Can Counter · Equipped");
  await section
    .getByRole("heading", { name: "Moves", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("workshop-moves.png") });
  await section
    .getByRole("heading", { name: "Slot 3 · Equipment Special", exact: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath("workshop-specials.png") });
  await page
    .getByRole("link", { name: "Return to Matchup", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Equipped attacks" }).locator("strong"),
  ).toHaveText(["Shell Slam", "Defend", "Can Counter"]);
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await expect(page.locator(".arena-moves button")).toHaveCount(3);
  await page.getByRole("button", { name: /^Can Counter/ }).click();
  await expect(
    page.getByText(/Defend · next hit halved · counter ready/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Shell Slam/ })).toBeEnabled();
  await expect(page.locator(".combat-log")).toContainText(
    "counter dealt 6 damage",
  );
  await page
    .getByRole("button", { name: "Exit Practice", exact: true })
    .click();
  await page.getByRole("link", { name: "Change Gear", exact: true }).click();
  await page.getByRole("button", { name: "Off claw", exact: true }).click();
  await page
    .getByRole("button", { name: "Unequip off claw", exact: true })
    .click();
  await expect(section).toContainText("Bag Snare · Equipped");
  await expect(section.getByText("Can Counter", { exact: false })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Head", exact: true }).click();
  await page.getByRole("button", { name: "Unequip head", exact: true }).click();
  await expect(section).toContainText("Basic Splash · Equipped");
  await page.reload();
  await expect(section).toContainText("Shell Slam · Equipped");
  await expect(section).toContainText("200 battle XP");
});

test("battle XP retries once, unlocks Shell Slam without replacing Pinch, and survives reload", async ({
  page,
}) => {
  await mockLocation(page);
  await page.goto("/battle/practice");
  await expect(
    page.getByRole("button", { name: "Start Battle", exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("pixelogy-v4");
      r.onsuccess = () => resolve(r.result);
    });
    const tx = db.transaction("battleProgression", "readwrite");
    tx.objectStore("battleProgression").put(
      {
        version: 1,
        xp: 190,
        unlockedMain: ["pinch"],
        main: "pinch",
        special: "tidal_slam",
      },
      "local",
    );
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (
      ...args: Parameters<IDBObjectStore["add"]>
    ) {
      if (this.name === "battleRewards")
        throw new DOMException("Test storage full", "QuotaExceededError");
      return original.apply(this, args);
    };
    window.addEventListener(
      "restore-reward-storage",
      () => {
        IDBObjectStore.prototype.add = original;
      },
      { once: true },
    );
  });
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  for (let i = 0; i < 12; i++) {
    if (
      await page
        .getByRole("heading", { name: "Practice complete." })
        .isVisible()
    )
      break;
    const pinch = page.getByRole("button", { name: /^Pinch Attack/ });
    await expect(pinch).toBeEnabled();
    const special = page.getByRole("button", { name: /^Basic Splash/ });
    if (await special.isEnabled()) await special.click();
    else await pinch.click();
    await expect(page.locator(".turn-banner")).not.toContainText(
      "Pebble is choosing",
    );
  }
  await expect(
    page.getByRole("button", { name: "Retry XP save", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play again", exact: true }),
  ).toBeDisabled();
  await page.evaluate(() =>
    window.dispatchEvent(new Event("restore-reward-storage")),
  );
  await page
    .getByRole("button", { name: "Retry XP save", exact: true })
    .click();
  await expect(page.locator(".arena-results")).toContainText(
    "+40 battle XP saved.",
  );
  await expect(page.locator(".arena-results")).toContainText("Crab level 3");
  await expect(page.locator(".arena-results")).toContainText("Level up!");
  await page.getByRole("link", { name: "Change Gear", exact: true }).click();
  await page.reload();
  const section = page.getByRole("region", { name: "Crab moves" });
  await expect(section).toContainText("230 battle XP");
  await expect(section).toContainText("Pinch Attack · Equipped");
  await expect(
    page.getByRole("button", { name: "Equip Shell Slam", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".hud-info > small")).toContainText("0");
});
