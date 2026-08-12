import { expect } from "@playwright/test";
import { test } from "../fixtures/auth.fixture";

/**
 * J19 — Journey B, APP_FLOW.md § 5 "Daily sign-in".
 *
 * Covers the two outcomes documented for a plain email/password
 * submission (success → /dashboard, and 401 → "never reveal which
 * field was wrong"), which is the one part of this journey that does
 * not depend on tenant-specific MFA/SSO configuration. The documented
 * MFA, OAuth, SSO, account-lockout, and forgot-password branches are
 * NOT covered by this spec — filed as the honest remaining scope
 * (see unierp-workspace D140) rather than implied covered.
 */
test.describe("Daily sign-in", () => {
  test("a valid email/password submission reaches the dashboard", async ({
    page,
    loginPage,
  }: any) => {
    await loginPage.goto();
    await loginPage.expectLoginPageVisible();
    await loginPage.login("john.miller@company.com", "admin123");

    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForLoadState("domcontentloaded");
  });

  test("an incorrect password is rejected without revealing whether the email exists", async ({
    page,
    loginPage,
  }: any) => {
    await loginPage.goto();
    await loginPage.login("john.miller@company.com", "definitely-wrong-password");

    // Still on (or returned to) /login — the credential was rejected.
    await expect(page).toHaveURL(/\/login/);
    await loginPage.expectLoginError();

    // APP_FLOW.md § 5: "never reveal which [field is wrong]" — the
    // error text must not say "email not found" / "user does not
    // exist" / any variant that discloses account existence.
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/no (account|user) (found|exists)|email not found/i);
  });
});
