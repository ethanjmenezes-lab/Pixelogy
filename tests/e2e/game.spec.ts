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
  await mockCamera(page);
  await mockLocation(page);
  await mockRecognition(page);
});
test("AI discovery → saved gear → CPU battle → persistent optional cleanup", async ({
  page,
}) => {
  let aiRequests = 0;
  page.on("request", (req) => {
    if (req.url().includes("/api/analyze")) aiRequests++;
  });
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Pixelogy GPS overworld" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page.getByRole("link", { name: /^Scan A new discovery/ }).click();
  await takePhoto(page);
  await identify(page);
  await page
    .getByRole("checkbox", { name: "I reviewed the object and crop." })
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
  for (let n = 0; n < 15; n++) {
    if (
      await page
        .getByRole("heading", { name: "Practice complete." })
        .isVisible()
    )
      break;
    const pinch = page.getByRole("button", {
      name: "Pinch A trusty little hit",
    });
    await expect(pinch).toBeEnabled();
    const slam = page.getByRole("button", { name: /Tidal Slam/ });
    if (await slam.isEnabled()) await slam.click();
    else await pinch.click();
    await expect(page.locator(".turn-banner")).not.toContainText(
      "Pebble is choosing",
      { timeout: 5000 },
    );
  }
  await expect(
    page.getByRole("heading", { name: "Practice complete." }),
  ).toBeVisible();
  await expect(page.locator(".hud-info > small")).toContainText("0");
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page
    .getByRole("link", { name: /^ShoreDex Your little treasures/ })
    .click();
  await page.locator(".item-card").click();
  await page
    .getByRole("button", { name: "I safely disposed of this litter" })
    .click();
  await expect(page.getByText("Cleanup self-report saved")).toBeVisible();
  await expect(page.locator(".hud-info > small")).toContainText("15");
  await page.reload();
  await page.locator(".item-card").click();
  await expect(page.getByText("Cleanup self-report saved")).toBeVisible();
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
  await mockRecognition(page, { ...safeRecognition, safety: "hazardous" });
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
    route.fulfill({ status: 502, json: { error: "unavailable" } }),
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
    .getByRole("checkbox", { name: "I reviewed the object and crop." })
    .check();
  await page.evaluate(() => {
    IDBObjectStore.prototype.add = function () {
      throw new DOMException("Test storage failure", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Save discovery" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not save this discovery",
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
      json: {
        label: "Bag",
        category: "plastic_bag",
        subtype: null,
        safety: "allowed",
        bbox: [100, 100, 900, 900],
      },
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
  await expect(page.getByRole("status")).toContainText(
    "Privacy preference saved.",
  );
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
    bbox: [900, 900, 100, 100],
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
    .getByRole("checkbox", { name: "I reviewed the object and crop." })
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
  await expect(page.getByRole("status")).toContainText(
    "Privacy preference saved.",
  );
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

test("automatic capture has no analysis button or sliders and optional crop supports keyboard", async ({
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
    .getByRole("checkbox", { name: "I reviewed the object and crop." })
    .check();
  await page.getByRole("button", { name: "Adjust crop", exact: true }).click();
  const crop = page.getByRole("group", { name: /Object crop/ });
  const before = await crop.getAttribute("style");
  await crop.focus();
  await page.keyboard.press("ArrowRight");
  await expect(crop).not.toHaveAttribute("style", before!);
  await expect(
    page.getByRole("checkbox", { name: "I reviewed the object and crop." }),
  ).not.toBeChecked();
  await expect(page.getByRole("slider")).toHaveCount(0);
});
