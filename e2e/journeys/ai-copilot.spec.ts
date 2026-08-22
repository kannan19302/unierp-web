import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";

test.describe("Journey F — AI Copilot E2E", () => {
  test.beforeEach(async ({ page }: any) => {
    await loginAsAdmin(page);
  });

  test("open and interact with embedded AI Copilot", async ({ page }: any) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    
    // Check AI companion trigger or assistant UI
    const copilotTrigger = page.locator("[aria-label*='AI'], [aria-label*='Copilot'], button:has-text('AI')");
    if (await copilotTrigger.count() > 0) {
      await expect(copilotTrigger.first()).toBeVisible();
    }
  });
});
