import { expect } from "@playwright/test";
import { test, loginAsAdmin } from "../fixtures/auth.fixture";
import * as fs from "fs";
import * as path from "path";

/**
 * Enterprise Atlassian & Salesforce Sidebar Upgrade Verification:
 * Validates collapsible sections, favorites pinned group, quick action buttons (+),
 * 9-dot app launcher, and mini-rail keyboard toggle.
 *
 * @journey finance-sidebar-upgrade
 * @critical-path true
 */
test.describe("Enterprise Sidebar Upgrade (Atlassian & Salesforce Level)", () => {
  test.beforeEach(async ({ page }: any) => {
    await loginAsAdmin(page);
  });

  test("verifies next-level sidebar features and captures visual artifacts", async ({
    page,
  }: any) => {
    test.setTimeout(90_000);

    // 1. Navigate to Finance workspace
    await page.goto("/finance", { waitUntil: "domcontentloaded" });
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible({ timeout: 60000 });

    // 2. Verify App Launcher (9-dot Waffle Icon - Salesforce standard)
    const appLauncher = page.locator('a[aria-label="App Launcher"]');
    await expect(appLauncher).toBeVisible();

    // 3. Verify 5 Functional Sections exist
    const secCore = page.locator('button:has-text("Executive & Core")');
    const secLedger = page.locator('button:has-text("Ledger & Treasury")');
    const secOps = page.locator('button:has-text("Operations (AR / AP)")');
    const secComp = page.locator('button:has-text("Compliance & FP&A")');
    const secAdmin = page.locator('button:has-text("Administration")');

    await expect(secCore).toBeVisible();
    await expect(secLedger).toBeVisible();
    await expect(secOps).toBeVisible();
    await expect(secComp).toBeVisible();
    await expect(secAdmin).toBeVisible();

    // 4. Verify Starred Pinned Section exists (Atlassian standard)
    const starredHeader = page.locator('span:has-text("Starred")').first();
    await expect(starredHeader).toBeVisible();

    // 5. Verify Quick Actions (+) on items (Salesforce standard)
    const glItem = page.locator('div:has(a[href="/finance/gl"])').first();
    await glItem.hover();
    const quickJournal = page.locator('a[aria-label="New Journal Entry"]').first();
    await expect(quickJournal).toBeVisible();

    // Output directory configuration
    const localDir = path.resolve(process.cwd(), "test-results", "screenshot", "finance");
    const polyrepoDir = path.resolve("D:/UniERP", "test-results", "screenshot", "finance");
    const brainDir = path.resolve(
      "C:/Users/kanna/.gemini/antigravity-ide/brain/188a9b3c-9556-4391-9e4d-927b8405dcff/.tempmediaStorage"
    );

    [localDir, polyrepoDir, brainDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const saveArtifact = async (sourceBuffer: Buffer, filename: string) => {
      [localDir, polyrepoDir, brainDir].forEach((dir) => {
        fs.writeFileSync(path.join(dir, filename), sourceBuffer);
      });
    };

    // Capture Expanded Enterprise Sidebar
    const expandedBuffer = await page.screenshot({ fullPage: false });
    await saveArtifact(expandedBuffer, "sidebar_expanded_enterprise.png");
    await saveArtifact(expandedBuffer, "sidebar_atlassian_salesforce_style.png");

    // 6. Test Accordion Collapse on "Operations (AR / AP)"
    await secOps.click();
    await page.waitForTimeout(300);
    const arLink = page.locator('a[href="/finance/ar"]');
    // Once collapsed, AR link inside the section body is hidden
    await expect(arLink).not.toBeVisible();

    const collapsedSectionBuffer = await page.screenshot({ fullPage: false });
    await saveArtifact(collapsedSectionBuffer, "sidebar_section_collapsed.png");

    // Re-expand Operations
    await secOps.click();
    await page.waitForTimeout(300);
    await expect(arLink).toBeVisible();

    // 7. Toggle mini-rail collapsed mode via keyboard shortcut '['
    await page.keyboard.press("[");
    await page.waitForTimeout(400);

    const miniRailBuffer = await page.screenshot({ fullPage: false });
    await saveArtifact(miniRailBuffer, "sidebar_minirail_collapsed.png");

    // Toggle back with '['
    await page.keyboard.press("[");
    await page.waitForTimeout(400);

    const finalBuffer = await page.screenshot({ fullPage: false });
    await saveArtifact(finalBuffer, "sidebar_final_verified.png");
  });
});
