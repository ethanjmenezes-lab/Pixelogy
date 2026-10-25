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
async function authFixture(page: import("@playwright/test").Page) {
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
}
test.beforeEach(async ({ page }) => authFixture(page));
test("guest scan redirects to login, authentication launches camera and logout protects scanning", async ({
  page,
}) => {
  await page.goto("/scan");
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fscan$/);
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page).toHaveURL(/\/scan$/);
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/scan$/);
  await expect(
    page.getByRole("button", { name: "Log In", exact: true }),
  ).toHaveCount(0);
  await page.goto("/profile");
  await page.getByRole("button", { name: /Log out/i }).click();
  await page.goto("/scan");
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fscan$/);
});
test("signup confirmation and password reset preserve scan destination", async ({
  page,
}) => {
  await page.clock.install();
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
  await page.clock.fastForward(61000);
  const reset = page.waitForRequest((r) =>
    r.url().includes("/auth/v1/recover"),
  );
  await page.getByRole("button", { name: "Send reset link" }).click();
  expect((await reset).url()).toContain(encodeURIComponent("/auth/confirm"));
  await expect(
    page.getByRole("status").filter({ hasText: "If an account exists" }),
  ).toBeVisible();
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
    page.getByRole("link", { name: "Request Another Link" }),
  ).toBeVisible();
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
  await page.goto("/auth/login");
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
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

test("reset requested in one browser completes in a fresh browser and survives refresh", async ({
  page,
  browser,
}) => {
  await page.goto("/auth/reset");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "If an account exists" }),
  ).toBeVisible();
  const other = await browser.newContext();
  const second = await other.newPage();
  await authFixture(second);
  try {
    await second.goto(
      "/auth/confirm#access_token=" +
        token +
        "&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=recovery",
    );
    await expect(second).toHaveURL(/reset-password$/);
    await expect(
      second.getByRole("heading", { name: "Set New Password" }),
    ).toBeVisible();
    await second.reload();
    await expect(
      second.getByRole("button", { name: "Update password" }),
    ).toBeEnabled();
    await second
      .getByLabel("New password", { exact: true })
      .fill("changed-password");
    await second
      .getByLabel("Confirm new password", { exact: true })
      .fill("wrong-password");
    await second.getByRole("button", { name: "Update password" }).click();
    await expect(second.getByRole("alert")).toContainText("do not match");
    await second
      .getByLabel("Confirm new password", { exact: true })
      .fill("changed-password");
    await second.getByRole("button", { name: "Update password" }).click();
    await expect(second.getByRole("status")).toContainText("Password updated");
    await second.getByRole("link", { name: "Log In", exact: true }).click();
    await expect(second).toHaveURL(/auth\/login$/);
    await second.getByLabel("Email", { exact: true }).fill(user.email);
    await second
      .getByLabel("Password", { exact: true })
      .fill("changed-password");
    await second.getByRole("button", { name: "Log In", exact: true }).click();
    await expect(second).toHaveURL(/scan$/);
  } finally {
    await other.close();
  }
});

test("root fallback recovery is rescued; expired links and ordinary sessions cannot reset", async ({
  page,
}) => {
  await page.goto(
    "/#access_token=" +
      token +
      "&refresh_token=fixture-refresh&expires_in=3600&token_type=bearer&type=recovery",
  );
  await expect(page).toHaveURL(/reset-password$/);
  await page.goto(
    "/auth/confirm#error=access_denied&error_code=otp_expired&error_description=Expired",
  );
  await expect(page.getByRole("alert")).toContainText("expired");
  await expect(
    page.getByRole("link", { name: "Request Another Link" }),
  ).toBeVisible();
  await page.goto("/reset-password");
  await expect(
    page.getByRole("button", { name: "Update password" }),
  ).toHaveCount(0);
});

test("invalid recovery cannot be bypassed by next or a fake token", async ({
  page,
}) => {
  await page.route("**/auth/v1/user", (route) =>
    route.fulfill({ status: 401, json: { message: "Invalid token" } }),
  );
  await page.goto(
    "/auth/confirm?next=https://example.com#access_token=invalid&refresh_token=invalid&expires_in=3600&token_type=bearer&type=recovery",
  );
  await expect(
    page.getByRole("link", { name: "Request Another Link" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update password" }),
  ).toHaveCount(0);
  expect(new URL(page.url()).hostname).toBe("127.0.0.1");
});

test("email quota errors are friendly and cooldown survives reload without duplicate submissions", async ({
  page,
}) => {
  await page.clock.install();
  let requests = 0;
  await page.route("**/auth/v1/signup**", (route) => {
    requests++;
    return route.fulfill({
      status: 429,
      json: {
        code: "over_email_send_rate_limit",
        msg: "email rate limit exceeded",
      },
    });
  });
  await page.goto("/auth/signup");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Too many email requests",
  );
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toBeDisabled();
  await page.goto("/auth/reset");
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeDisabled();
  await page.clock.fastForward(61000);
  await expect(
    page.getByRole("button", { name: "Send reset link" }),
  ).toBeEnabled();
  expect(requests).toBe(1);
});
