import { mockAccount } from "./cloudFixture";
import { test, expect } from "@playwright/test";
import {
  mockCamera,
  mockLocation,
  takePhoto,
  mockRecognition,
  safeRecognition,
  identify,
  enableScanning,
} from "./device";
test.beforeEach(async ({ page }) => {
  await mockAccount(page);
  await mockCamera(page);
  await mockLocation(page);
  await mockRecognition(page);
});
test("AI discovery → saved gear → CPU battle → persistent optional cleanup", async ({
  page,
}) => {
  test.setTimeout(90000);
  let aiRequests = 0;
  page.on("request", (req) => {
    if (req.url().includes("/api/analyze")) aiRequests++;
  });
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Pixelogy GPS overworld" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page.getByRole("link", { name: /^Scan Camera/ }).click();
  await takePhoto(page);
  await identify(page);
  await page
    .getByRole("checkbox", {
      name: "I reviewed the object. This catalog match is correct and the litter is safe.",
    })
    .check();
  await page.getByRole("button", { name: "Save discovery" }).click();
  await expect(
    page.getByRole("heading", { name: "A little treasure, all yours." }),
  ).toBeVisible();
  await expect(page.locator(".hud-info > small")).toContainText("0");
  expect(aiRequests).toBe(1);
  await page.getByRole("link", { name: "Equip on your crab" }).click();
  await page.getByRole("button", { name: "Equip this find" }).click();
  await expect(
    page.getByRole("button", { name: "Unequip head" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Unequip head" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await page.getByRole("button", { name: "Enable location" }).click();
  await expect(page.locator(".companion")).toHaveAttribute(
    "data-gear",
    /bag_helm/,
  );
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page.getByRole("link", { name: /^Battle Practice/ }).click();
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await expect(page.locator(".arena-crab.ally")).toHaveAttribute(
    "data-gear",
    /bag_helm/,
  );
  for (let n = 0; n < 15; n++) {
    if (
      await page
        .getByRole("heading", { name: "Practice complete." })
        .isVisible()
    )
      break;
    const pinch = page.getByRole("button", {
      name: "Pinch Attack Power 7",
    });
    await expect(pinch).toBeEnabled();
    const slam = page.getByRole("button", { name: /Bag Snare/ });
    const previous = await page
      .locator(".battle-scene")
      .getAttribute("data-version");
    await Promise.all([
      page.waitForResponse("**/api/battle"),
      ((await slam.isEnabled()) ? slam : pinch).click(),
    ]);
    await expect(page.locator(".battle-scene")).not.toHaveAttribute(
      "data-version",
      previous!,
    );
    await expect(page.locator(".battle-scene")).toHaveAttribute(
      "data-phase",
      "ready",
      { timeout: 10000 },
    );
  }
  await expect(
    page.getByRole("heading", { name: "Practice complete." }),
  ).toBeVisible();
  await expect(page.locator(".hud-info > small")).toContainText("0");
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page.getByRole("link", { name: /^ShoreDex Collection/ }).click();
  await page.locator(".dex-entry.unlocked").click();
  await page
    .getByRole("button", { name: "I safely disposed of this litter" })
    .click();
  await expect(
    page.getByText("All owned finds have cleanup self-reports."),
  ).toBeVisible();
  await expect(page.locator(".hud-info > small")).toContainText("15");
  await page.reload();
  await page.locator(".dex-entry.unlocked").click();
  await expect(
    page.getByText("All owned finds have cleanup self-reports."),
  ).toBeVisible();
  await expect(page.locator(".hud-info > small")).toContainText("15");
});
test("unsafe results cannot save and declining first-time consent never uploads", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (req) => {
    if (req.url().includes("/api/analyze")) requests++;
  });
  await page.goto("/scan");
  await expect(
    page.getByRole("button", { name: "Enable automatic scanning" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Identify with Gemini" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Choose item manually" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Not now / back to world" }).click();
  expect(requests).toBe(0);
  await mockRecognition(page, {
    status: "blocked",
    candidates: [],
    recognition: { ...safeRecognition.recognition, safety: "hazardous" },
  });
  await page.goto("/scan");
  await takePhoto(page);
  await expect(page.locator(".scan-flow")).toHaveAttribute(
    "data-scan-state",
    "blocked",
  );
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toHaveCount(0);
});
test("failed AI request offers retry and never allows an unrecognized save", async ({
  page,
}) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({ status: 502, json: { error: "Gemini is unavailable" } }),
  );
  await page.goto("/scan");
  await takePhoto(page);

  await expect(
    page.getByRole("button", { name: "Retry identification" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Gemini is unavailable");
});
test("routes fit mobile and desktop, unavailable rankings stay honest", async ({
  page,
}) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/",
      "/scan",
      "/collection",
      "/workshop",
      "/battle/practice",
      "/leaderboard",
    ]) {
      await page.goto(route);
      if (route !== "/")
        await expect(page.locator(".feature-overlay h1")).toBeVisible();
      else
        await expect(
          page.getByRole("button", { name: "Open crab menu" }),
        ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
  await expect(
    page.getByText("Live rankings are not connected in this release."),
  ).toBeVisible();
});

test("failed storage never show a saved discovery", async ({ page }) => {
  await page.goto("/scan");
  await takePhoto(page);
  await identify(page);
  await page
    .getByRole("checkbox", {
      name: "I reviewed the object. This catalog match is correct and the litter is safe.",
    })
    .check();
  await page.route("**/rest/v1/rpc/award_discovery", (route) =>
    route.fulfill({ status: 503, json: { message: "Database unavailable" } }),
  );
  await page.getByRole("button", { name: "Save discovery" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not save discovery",
  );
  await expect(
    page.getByRole("heading", { name: "A little treasure, all yours." }),
  ).toHaveCount(0);
  await expect(page.locator(".hud-info > small")).toContainText("0");
});
test("keyboard navigation and reduced motion remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open crab menu" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to controls" }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Scan a discovery" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Discover something good." }),
  ).toBeVisible();
});
test("remembered consent analyzes later captures and can be revoked", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/analyze", (route) => {
    requests++;
    return route.fulfill({
      json: safeRecognition,
    });
  });
  await page.goto("/scan");
  await takePhoto(page);
  await expect.poll(() => requests).toBe(1);
  await page.goto("/scan");
  await takePhoto(page);
  await expect.poll(() => requests).toBe(2);
  await page.goto("/profile");
  await page
    .getByRole("checkbox", { name: "Automatically send resized" })
    .uncheck();
  await expect(
    page.getByText("Privacy preference saved.", { exact: true }),
  ).toBeVisible();
  await page.goto("/scan");
  await expect(
    page.getByRole("button", { name: "Enable automatic scanning" }),
  ).toBeVisible();
  expect(requests).toBe(2);
});
test("camera denial shows retry and preserves world navigation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(
      Object.getPrototypeOf(navigator.mediaDevices),
      "getUserMedia",
      {
        configurable: true,
        value: async () => {
          throw new DOMException("denied", "NotAllowedError");
        },
      },
    ),
  );
  await page.goto("/scan");
  await enableScanning(page);
  await expect(page.getByRole("alert")).toContainText("Camera unavailable");
  await expect(
    page.getByRole("button", { name: "Retry camera" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open crab menu" }),
  ).toBeVisible();
});
test("leaving the scanner stops its browser camera tracks", async ({
  page,
}) => {
  await page.goto("/scan");
  await enableScanning(page);
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const video = document.querySelector("video")!;
    (window as unknown as { testTrack: MediaStreamTrack }).testTrack = (
      video.srcObject as MediaStream
    ).getTracks()[0];
  });
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { testTrack: MediaStreamTrack }).testTrack
            .readyState,
      ),
    )
    .toBe("ended");
});

test("offline and malformed analysis cannot create discoveries, retry recovers", async ({
  page,
  context,
}) => {
  await page.goto("/scan");
  await enableScanning(page);
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await takePhoto(page);
  await expect(page.getByRole("alert")).toContainText("offline");
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toHaveCount(0);
  await context.setOffline(false);
  await mockRecognition(page, {
    ...safeRecognition,
    recognition: { ...safeRecognition.recognition, confidence: 2 },
  });
  await page.getByRole("button", { name: "Retry identification" }).click();
  await expect(page.getByRole("alert")).toContainText("invalid result");
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toHaveCount(0);
  await mockRecognition(page);
  await page.getByRole("button", { name: "Retry identification" }).click();
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", {
      name: "I reviewed the object. This catalog match is correct and the litter is safe.",
    })
    .check();
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toBeEnabled();
});

test("retake and consent revocation invalidate delayed recognition", async ({
  page,
}) => {
  const pending: import("@playwright/test").Route[] = [];
  await page.route("**/api/analyze", (route) => {
    pending.push(route);
  });
  await page.goto("/scan");
  await takePhoto(page);
  await expect.poll(() => pending.length).toBe(1);
  await page
    .getByRole("link", { name: "Automatic photo analysis is on" })
    .click();
  await page
    .getByRole("checkbox", { name: "Automatically send resized" })
    .uncheck();
  await expect(
    page.getByText("Privacy preference saved.", { exact: true }),
  ).toBeVisible();
  await pending[0].fulfill({ json: safeRecognition }).catch(() => {});
  await page.goto("/scan");
  await expect(
    page.getByRole("button", { name: "Enable automatic scanning" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toHaveCount(0);
  await takePhoto(page);
  await expect.poll(() => pending.length).toBe(2);
  await page.getByRole("button", { name: "Retake photo" }).click();
  await pending[1].fulfill({ json: safeRecognition }).catch(() => {});
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".scan-flow")).toHaveAttribute(
    "data-scan-state",
    "capture",
  );
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toHaveCount(0);
});

test("automatic capture uses a predefined sprite and has no photo pixelization controls", async ({
  page,
}) => {
  await page.goto("/scan");
  await takePhoto(page);
  await identify(page);
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Identify with Gemini" }),
  ).toHaveCount(0);
  await expect(page.getByRole("group", { name: /Object crop/ })).toHaveCount(0);
  await page.screenshot({
    path: `test-results/automatic-scan-${test.info().project.name}.png`,
    animations: "disabled",
  });
  await page
    .getByRole("checkbox", {
      name: "I reviewed the object. This catalog match is correct and the litter is safe.",
    })
    .check();
  await expect(
    page.getByRole("button", { name: "Adjust crop", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".catalog-candidate img")).toHaveAttribute(
    "src",
    "/shoredex/grocery-bag.svg",
  );
  await expect(
    page.getByRole("button", { name: "Save discovery" }),
  ).toBeEnabled();
});

test("ShoreDex is dense, numbered and keyboard accessible at phone sizes", async ({
  page,
}) => {
  await page.goto("/collection");
  await expect(page.locator(".dex-entry")).toHaveCount(200);
  await expect(page.getByText("0 / 200", { exact: true })).toBeVisible();
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const grid = page.locator(".dex-grid");
    const columns = await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );
    expect(columns).toBe(5);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/shoredex-${width}-${test.info().project.name}.png`,
      animations: "disabled",
    });
  }
  await page.locator(".dex-entry").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close item details" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("searchbox").fill("grocery bag");
  await expect(page.locator(".dex-entry")).toHaveCount(1);
  await page.getByRole("button", { name: "owned", exact: true }).click();
  await expect(page.getByText("No entries match these filters.")).toBeVisible();
});

test("two validated discoveries of one species increase quantity, not completion", async ({
  page,
}) => {
  await page.goto("/scan");
  for (let i = 0; i < 2; i++) {
    await takePhoto(page);
    await identify(page);
    await page
      .getByRole("checkbox", {
        name: "I reviewed the object. This catalog match is correct and the litter is safe.",
      })
      .check();
    await page.getByRole("button", { name: "Save discovery" }).click();
    await expect(
      page.getByRole("heading", { name: "A little treasure, all yours." }),
    ).toBeVisible();
    await expect(
      page.getByText(
        i ? "DUPLICATE DISCOVERY · QUANTITY +1" : "NEW DISCOVERY",
        { exact: true },
      ),
    ).toBeVisible();
    if (!i) await page.getByRole("button", { name: "Scan again" }).click();
  }
  await page.getByRole("link", { name: "Open ShoreDex" }).click();
  await expect(page.getByText("1 / 200", { exact: true })).toBeVisible();
  await expect(page.locator(".dex-entry.unlocked")).toHaveCount(1);
  await expect(page.locator(".dex-entry.unlocked")).toContainText("×2");
  await page.reload();
  await expect(page.locator(".dex-entry.unlocked")).toContainText("×2");
  await page.locator(".dex-entry.unlocked").click();
  await expect(
    page.getByText("Discovery history (2)", { exact: true }),
  ).toBeVisible();
});

test("account practice remains available offline without awarding cloud XP", async ({
  page,
  context,
}) => {
  await page.goto("/battle/practice");
  await expect(
    page.getByRole("button", { name: "Start Battle", exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Beach battle", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Exit Practice", exact: true })
    .click();
  await expect(
    page.getByText(/Offline practice · no battle XP awarded/),
  ).toBeVisible();
  await context.setOffline(false);
});
