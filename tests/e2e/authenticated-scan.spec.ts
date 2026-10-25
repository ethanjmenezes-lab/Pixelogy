import { test, expect } from "@playwright/test";
import { mockAccount } from "./cloudFixture";
import { mockCamera, mockLocation, takePhoto } from "./device";
test("login → bottle identification → cloud award → logout/login retains bottle while guest save survives failed import", async ({
  page,
}) => {
  await mockCamera(page);
  await mockLocation(page);
  const state = await mockAccount(page, "water-bottle", false);
  await page.route("**/rest/v1/rpc/import_guest", (route) =>
    route.fulfill({
      status: 404,
      json: { code: "PGRST202", message: "Missing import function" },
    }),
  );
  let analyzed = 0;
  await page.route("**/api/analyze", (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    analyzed++;
    return route.fulfill({
      json: {
        status: "matched",
        candidates: ["water-bottle"],
        recognition: {
          objectName: "Plastic water bottle",
          material: "plastic",
          category: "bottle",
          attributes: [],
          confidence: 0.98,
          ambiguous: false,
          safety: "allowed",
        },
        payload: "fixture-receipt",
        signature: "fixture-signature",
      },
    });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open crab menu" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const path = "/src/guest/local.ts";
    const { saveGuestDiscovery } = await import(path);
    await saveGuestDiscovery(
      "grocery-bag",
      JSON.stringify({
        scanId: crypto.randomUUID(),
        candidates: ["grocery-bag"],
      }),
    );
  });
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page.getByRole("link", { name: /Scan/ }).click();
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fscan$/);
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toHaveCount(0);
  const login = async () => {
    await page
      .getByLabel("Email", { exact: true })
      .fill("fixture@example.test");
    await page.getByLabel("Password", { exact: true }).fill("fixture-password");
    await page.getByRole("button", { name: "Log In", exact: true }).click();
  };
  await login();
  await expect(page).toHaveURL(/\/scan$/);
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeVisible();
  await takePhoto(page);
  await page
    .getByRole("checkbox", {
      name: "I reviewed the object. This catalog match is correct and the litter is safe.",
    })
    .check();
  await page
    .getByRole("button", { name: "Save discovery", exact: true })
    .click();
  await expect(page.locator(".discovery-result")).toContainText("Water bottle");
  expect(analyzed).toBe(1);
  expect(state.discoveries).toHaveLength(1);
  expect(state.discoveries[0].catalog_id).toBe("water-bottle");
  await page.goto("/collection");
  await expect(page.locator(".dex-entry.unlocked")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".dex-entry.unlocked")).toHaveCount(1);
  await page.goto("/profile");
  await page.getByRole("button", { name: /Log out/i }).click();
  await page.goto("/collection");
  await expect(page.locator(".dex-entry.unlocked")).toContainText(
    "Grocery bag",
  );
  await page.goto("/scan");
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fscan$/);
  await login();
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeVisible();
  await page.goto("/collection");
  await expect(page.locator(".dex-entry.unlocked")).toContainText(
    "Water bottle",
  );
});
