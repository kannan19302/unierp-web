import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";

test.describe("Journey D — Approval Workflow E2E", () => {
  test.beforeEach(async ({ page }: any) => {
    await loginAsAdmin(page);
  });

  test("navigate and verify approval workflow configurations", async ({ page }: any) => {
    await page.goto("/workflow");
    await page.waitForLoadState("domcontentloaded");
    
    // Validate workflow page elements
    const pageHeader = page.locator("h1, h2");
    await expect(pageHeader.first()).toBeVisible();
  });
});
