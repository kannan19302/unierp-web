import { expect } from "@playwright/test";
import { loginAsAdmin, test } from "../fixtures/auth.fixture";

test("Finance sidebar search reaches resource workspaces and the shared hub", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/finance/advanced");
  const sidebar = page.getByRole("complementary", { name: "Finance Navigation" });
  await sidebar.getByRole("textbox", { name: "Find in Finance" }).fill("Vendor bills");
  const results = sidebar.locator('[aria-label="Finance workspace search results"]');
  await results.getByRole("link", { name: "Vendor bills", exact: true }).click();
  await expect(page).toHaveURL(/\/finance\/vendor-bills$/);
  await expect(page.getByRole("heading", { name: "Vendor bills", exact: true })).toBeVisible();
  await page.goto("/finance/advanced");
  await page.getByRole("textbox", { name: "Search Finance workspaces" }).fill("Intercompany netting");
  await page.getByRole("link", { name: /Intercompany netting Open intercompany netting workspace/ }).click();
  await expect(page).toHaveURL(/\/finance\/advanced\/intercompany\/netting$/);
});
