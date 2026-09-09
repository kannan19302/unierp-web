import { expect } from "@playwright/test";
import { loginAsAdmin, test } from "../fixtures/auth.fixture";

test("Finance close calendar creates and completes an event in a real financial period", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/finance/advanced/close-management?subtab=calendar");
  await page.getByRole("button", { name: "Add Calendar Event" }).click();
  const periods = page.getByLabel("Financial period", { exact: true });
  await expect.poll(() => periods.locator("option").count()).toBeGreaterThan(1);
  await periods.selectOption({ index: 1 });
  const title = `Agent close calendar verification ${Date.now()}`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Due time (local time)").fill("2026-12-31T12:00");
  await page.getByLabel("Description", { exact: true }).fill("Synthetic Finance integration verification.");
  const created = page.waitForResponse(response =>
    response.request().method() === "POST" && response.url().endsWith("/close-management/calendar/events"),
  );
  await page.getByRole("button", { name: "Add", exact: true }).click();
  expect((await created).ok()).toBe(true);
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toBeVisible();
  const completed = page.waitForResponse(response =>
    response.request().method() === "POST" && /\/close-management\/calendar\/events\/[^/]+\/complete$/.test(response.url()),
  );
  await row.getByRole("button", { name: `Complete ${title}`, exact: true }).click();
  expect((await completed).ok()).toBe(true);
  await expect(row.getByRole("cell", { name: "COMPLETED", exact: true })).toBeVisible();
});
