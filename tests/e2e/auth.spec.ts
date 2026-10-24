import { test, expect } from "@playwright/test";
import { mockCamera, mockLocation } from "./device";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "auth@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: user.id, exp: 4102444800 })).toString("base64url")}.fixture`;
const session = {
  access_token: token,
  refresh_token: "fixture-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user,
};
test.beforeEach(async ({ page }) => {
  await mockCamera(page);
  await mockLocation(page);
  await page.route(
    "https://rsdgbxpqpdewqpmeuwvp.supabase.co/**",
    async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/token")) return route.fulfill({ json: session });
      if (path.endsWith("/user")) return route.fulfill({ json: user });
      if (path.endsWith("/signup")) return route.fulfill({ json: user });
      if (path.startsWith("/auth/")) return route.fulfill({ json: {} });
      return route.fulfill({ json: [] });
    },
  );
});
test("guest scan redirects, login persists across reload, logout restores guest", async ({
  page,
}) => {
  await page.goto("/scan");
  await expect(page).toHaveURL(/auth\/login/);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page).toHaveURL(/\/scan$/);
  await page.reload();
  await expect(page).toHaveURL(/\/scan$/);
  await expect(
    page.getByRole("button", { name: "Log In", exact: true }),
  ).toHaveCount(0);
  await page.goto("/profile");
  await page.getByRole("button", { name: /Log out/i }).click();
  await page.goto("/scan");
  await expect(page).toHaveURL(/auth\/login/);
});
test("signup confirmation and password reset preserve scan destination", async ({
  page,
}) => {
  await page.goto("/auth/signup?next=%2Fscan");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  const signup = page.waitForRequest((r) =>
    r.url().includes("/auth/v1/signup"),
  );
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  expect((await signup).url()).toContain(
    encodeURIComponent("/auth/callback?next=%2Fscan"),
  );
  await expect(
    page.getByRole("heading", { name: "Check your inbox." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "I’ve confirmed — Log In" }).click();
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(
    page.getByRole("heading", { name: "Reset your password." }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  const reset = page.waitForRequest((r) =>
    r.url().includes("/auth/v1/recover"),
  );
  await page.getByRole("button", { name: "Send reset link" }).click();
  expect((await reset).url()).toContain(
    encodeURIComponent("/auth/update-password?next=%2Fscan"),
  );
  await expect(page.getByRole("status")).toContainText("If an account exists");
});
test("login failure remains retryable and rejects external return destinations", async ({
  page,
}) => {
  await page.route("**/auth/v1/token**", (route) =>
    route.fulfill({
      status: 400,
      json: {
        error: "invalid_grant",
        error_description: "Invalid login credentials",
      },
    }),
  );
  await page.goto("/auth/login?next=https://example.com");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid login credentials",
  );
  await expect(
    page.getByRole("button", { name: "Log In", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("link", { name: "Create an account" }),
  ).toHaveAttribute("href", "/auth/signup?next=%2Fscan");
});
test("confirmation callback consumes a session and returns to scan", async ({
  page,
}) => {
  await page.goto(
    `/auth/callback?next=%2Fscan#access_token=${token}&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=signup`,
  );
  await expect(page).toHaveURL(/\/scan$/);
  await page.reload();
  await expect(page).toHaveURL(/\/scan$/);
});
test("recovery session can update password and expired link cannot", async ({
  page,
}) => {
  await page.goto("/auth/update-password");
  await expect(
    page.getByRole("button", { name: "Update password" }),
  ).toBeDisabled();
  // Email links open a new document, not a same-document fragment change.
  await page.goto("about:blank");
  await page.goto(
    `/auth/update-password#access_token=${token}&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=recovery`,
  );
  await expect(
    page.getByRole("button", { name: "Update password" }),
  ).toBeEnabled();
  await page
    .locator("form")
    .getByLabel("New password", { exact: true })
    .fill("fixture-new-password");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("fixture-new-password");
  const update = page.waitForRequest(
    (r) => r.method() === "PUT" && r.url().includes("/auth/v1/user"),
  );
  await page.getByRole("button", { name: "Update password" }).click();
  expect((await update).postDataJSON()).toMatchObject({
    password: "fixture-new-password",
  });
  await expect(page.getByRole("status")).toContainText("Password updated");
});
test("account controls fit phone widths and remain keyboard accessible", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/auth/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByLabel("Email", { exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Password", { exact: true })).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`auth-${width}.png`) });
  }
});
