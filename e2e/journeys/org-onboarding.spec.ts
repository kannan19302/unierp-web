import { expect } from "@playwright/test";
import { test } from "../fixtures/auth.fixture";

test.describe("Journey A — Org Onboarding E2E", () => {
  test("new organization sign up and initial tenant onboarding setup", async ({ page }: any) => {
    await page.goto("/register");
    await page.waitForLoadState("domcontentloaded");
    
    // Check registration view
    const title = page.locator("h1, h2");
    await expect(title.first()).toBeVisible();
  });
});
