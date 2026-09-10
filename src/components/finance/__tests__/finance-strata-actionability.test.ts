import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Finance Strata actionability", () => {
  it("uses the canonical dashboard shell and Finance density", () => {
    const layout = read("app/(dashboard)/finance/layout.tsx");

    expect(layout).toContain('data-density="ultra-compact"');
    expect(layout).toContain("FinanceShellV2");
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

  it("wires right-click context menu on all sidebar navigation links and controls", () => {
    const sidebar = read("src/components/shell/FinanceSidebarV2.tsx");
    // All <Link> tags in the sidebar body and collapsed nav must include onContextMenu
    const linkMatches = [...sidebar.matchAll(/<Link\b([^>]*?)>/g)];
    expect(linkMatches.length).toBeGreaterThan(20);
    for (const match of linkMatches) {
      expect(match[1]).toContain("onContextMenu");
    }
    // Period button and footer settings must also support right click
    expect(sidebar).toContain('onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/close-tasks", "Period Management", e)}');
    expect(sidebar).toContain('onContextMenu={(e) => onNavContextMenu?.("/finance/settings", "Settings", e)}');
  });

  it("wires hover-only more options (...) buttons across sidebar navigation options", () => {
    const sidebar = read("src/components/shell/FinanceSidebarV2.tsx");
    const css = read("src/components/shell/FinanceSidebarV2.module.css");
    // renderMoreButton helper must be defined and rendered
    expect(sidebar).toContain("renderMoreButton");
    expect(sidebar).toContain("moreBtn");
    expect(sidebar).toContain("MoreHorizontal");

    // CSS must hide moreBtn by default and reveal on hover or focus
    expect(css).toContain(".moreBtn");
    expect(css).toContain("opacity: 0;");
    expect(css).toContain(".navItem:hover .moreBtn");
    expect(css).toContain(".groupItemHeader:hover .moreBtn");
  });

  it("enforces global Inter typography and token styles in app/layout.tsx", () => {
    const layout = read("app/layout.tsx");
    expect(layout).toContain('import "@/styles/strata-global.css";');
    expect(layout).toContain("inter.className");
    expect(layout).toContain("inter.variable");
  });
});
