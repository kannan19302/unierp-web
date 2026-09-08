import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Finance Strata actionability", () => {
  it("uses the canonical dashboard shell and Finance density", () => {
    const layout = read("app/(dashboard)/finance/layout.tsx");

    expect(layout).toContain('data-density="ultra-compact"');
    expect(layout).not.toContain("FinanceShellV2");
    expect(layout).not.toContain("ModuleTabLayout");
  });

  it("routes hub actions to resource-backed workflows", () => {
    expect(read("app/(dashboard)/finance/ar/page.tsx")).toContain('href="/finance/invoices"');
    expect(read("app/(dashboard)/finance/ap/page.tsx")).toContain('href="/finance/vendor-bills"');
    expect(read("app/(dashboard)/finance/banking/page.tsx")).toContain('href="/finance/advanced/bank-feeds"');
    expect(read("app/(dashboard)/finance/assets/page.tsx")).toContain(
      'href="/finance/advanced/fixed-assets/assets/new"',
    );
    expect(read("app/(dashboard)/finance/tax/page.tsx")).toContain('href="/finance/advanced/tax-filing"');
  });

  it("does not retain placeholder alerts in the redesigned hubs", () => {
    const hubFiles = [
      "gl",
      "ar",
      "ap",
      "banking",
      "assets",
      "tax",
      "budget-planning",
      "reports",
      "settings",
    ];

    for (const hub of hubFiles) {
      expect(read(`app/(dashboard)/finance/${hub}/page.tsx`)).not.toContain("alert(");
    }
  });

  it("does not fabricate Finance records or connection credentials", () => {
    expect(read("app/(dashboard)/finance/page.tsx")).not.toContain("/finance/demo-data/load");
    expect(read("app/(dashboard)/finance/advanced/ap-automation/page.tsx")).not.toContain("Math.random");
    expect(read("app/(dashboard)/finance/advanced/bank-feeds/page.tsx")).not.toContain("Math.random");
  });

  it("provides resource-backed creation workspaces", () => {
    expect(read("app/(dashboard)/finance/invoices/page.tsx")).toContain("invoiceResource");
    expect(read("app/(dashboard)/finance/vendor-bills/page.tsx")).toContain("vendorBillResource");
  });
});
