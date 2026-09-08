import { expect } from "@playwright/test";
import { loginAsAdmin, test } from "../fixtures/auth.fixture";

test.describe("Finance Strata actionability", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("uses one canonical shell and opens resource-backed workflows", async ({ page }) => {
    await page.goto("/finance", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Finance overview" })).toBeVisible();
    await expect(page.getByText("Load sample finance data")).toHaveCount(0);
    await expect(page.locator("aside")).toHaveCount(1);

    await page.goto("/finance/ar", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "New invoice" }).click();
    await expect(page).toHaveURL(/\/finance\/invoices$/);
    await expect(page.getByRole("heading", { name: "Invoices" })).toBeVisible();

    await page.goto("/finance/ap", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "New bill" }).click();
    await expect(page).toHaveURL(/\/finance\/vendor-bills$/);
    await expect(page.getByRole("heading", { name: "Vendor bills" })).toBeVisible();

    await page.goto("/finance/banking", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Import statement" }).click();
    await expect(page).toHaveURL(/\/finance\/advanced\/bank-feeds$/);

    await page.goto("/finance/assets", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Register asset" }).click();
    await expect(page).toHaveURL(/\/finance\/advanced\/fixed-assets\/assets\/new$/);
  });
});
