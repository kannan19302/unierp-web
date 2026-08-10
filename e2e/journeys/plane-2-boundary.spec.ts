import { expect } from "@playwright/test";
import { test } from "../fixtures/auth.fixture";

test.describe("Plane-2 Boundary", () => {
  test("tenant user without admin grant receives 403 on plane-2 routes", async ({ page, loginPage, dashboardPage }: any) => {
    // 1. Log in as a standard user (HR Director)
    await loginPage.goto();
    await loginPage.login("john.miller@company.com", "admin123");
    
    // 2. Try to access plane-2 routes
    const plane2Routes = [
      "/settings",
      "/subscriptions",
      "/apps", 
      "/profile"
    ];

    for (const route of plane2Routes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      
      // Look for a 403 indicator
      const bodyText = await page.locator("body").innerText();
      const isForbidden = bodyText.includes("403") || 
                          bodyText.includes("Forbidden") || 
                          bodyText.includes("Unauthorized") ||
                          bodyText.includes("not authorized") ||
                          bodyText.includes("Permission denied");
                          
      expect(isForbidden).toBeTruthy();
    }
  });
});
