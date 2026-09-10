import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Finance Module Trustworthiness & Master Standards (2026-09-10)", () => {
  describe("1. Scope Context Integration & Scoped Data Fetching", () => {
    it("wraps the finance layout in FinanceScopeProvider", () => {
      const layout = read("app/(dashboard)/finance/layout.tsx");
      expect(layout).toContain("FinanceScopeProvider");
      expect(layout).toContain("<FinanceScopeProvider>");
      expect(layout).toContain("</FinanceScopeProvider>");
    });

    it("wires useFinanceScope into all daily finance operational hubs", () => {
      const hubs = [
        "app/(dashboard)/finance/page.tsx",
        "app/(dashboard)/finance/gl/page.tsx",
        "app/(dashboard)/finance/ar/page.tsx",
        "app/(dashboard)/finance/ap/page.tsx",
        "app/(dashboard)/finance/reports/page.tsx",
        "app/(dashboard)/finance/assets/page.tsx",
        "app/(dashboard)/finance/budget-planning/page.tsx",
        "app/(dashboard)/finance/banking/page.tsx",
        "app/(dashboard)/finance/tax/page.tsx",
      ];

      for (const hub of hubs) {
        const content = read(hub);
        expect(content, `${hub} must consume useFinanceScope()`).toContain("useFinanceScope()");
      }
    });

    it("scopes summary queries by entity and period instead of purely cosmetic labels", () => {
      const gl = read("app/(dashboard)/finance/gl/page.tsx");
      expect(gl).toContain("scope.entity");
      expect(gl).toContain("scope.period");

      const ar = read("app/(dashboard)/finance/ar/page.tsx");
      expect(ar).toContain("scope.entity");
      expect(ar).toContain("scope.period");

      const ap = read("app/(dashboard)/finance/ap/page.tsx");
      expect(ap).toContain("scope.entity");
      expect(ap).toContain("scope.period");

      const reports = read("app/(dashboard)/finance/reports/page.tsx");
      expect(reports).toContain("scope.entity");
      expect(reports).toContain("scope.period");

      const assets = read("app/(dashboard)/finance/assets/page.tsx");
      expect(assets).toContain("scope.entity");
      expect(assets).toContain("scope.period");

      const budget = read("app/(dashboard)/finance/budget-planning/page.tsx");
      expect(budget).toContain("scope.entity");
      expect(budget).toContain("scope.period");
    });
  });

  describe("2. Elimination of Fake Fallback Records & Zero-Mock Enforcement", () => {
    it("does not contain fake 14.82M debit/credit in General Ledger", () => {
      const gl = read("app/(dashboard)/finance/gl/page.tsx");
      expect(gl).not.toContain("14.82M");
      expect(gl).not.toContain("14,820,000");
    });

    it("does not contain fake 842k receivables in Accounts Receivable", () => {
      const ar = read("app/(dashboard)/finance/ar/page.tsx");
      expect(ar).not.toContain("842.5k");
      expect(ar).not.toContain("842,500");
    });

    it("does not contain fake 3.42M capital asset values in Fixed Assets", () => {
      const assets = read("app/(dashboard)/finance/assets/page.tsx");
      expect(assets).not.toContain("3.42M");
      expect(assets).not.toContain("1.15M");
      expect(assets).not.toContain("2.27M");
    });

    it("does not contain fake 18.50M budget values in Budget & Planning", () => {
      const budget = read("app/(dashboard)/finance/budget-planning/page.tsx");
      expect(budget).not.toContain("18.50M");
      expect(budget).not.toContain("18.84M");
    });

    it("does not claim In balance unconditionally in GL when records are empty or errored", () => {
      const gl = read("app/(dashboard)/finance/gl/page.tsx");
      // Must verify inBalance AND debits > 0 before claiming balance
      expect(gl).toContain("data.kpis.inBalance && (data.kpis.totalDebits ?? 0) > 0");
    });
  });

  describe("3. Truthful Live Badges and Error Recovery State", () => {
    it("integrates FinanceErrorState component across all finance hubs", () => {
      const hubs = [
        "app/(dashboard)/finance/page.tsx",
        "app/(dashboard)/finance/gl/page.tsx",
        "app/(dashboard)/finance/ar/page.tsx",
        "app/(dashboard)/finance/ap/page.tsx",
        "app/(dashboard)/finance/reports/page.tsx",
        "app/(dashboard)/finance/assets/page.tsx",
        "app/(dashboard)/finance/budget-planning/page.tsx",
        "app/(dashboard)/finance/banking/page.tsx",
        "app/(dashboard)/finance/tax/page.tsx",
      ];

      for (const hub of hubs) {
        const content = read(hub);
        expect(content, `${hub} must render FinanceErrorState`).toContain("FinanceErrorState");
      }
    });

    it("renders dynamic badge states indicating connection errors rather than unconditional Live database", () => {
      const hubs = [
        "app/(dashboard)/finance/page.tsx",
        "app/(dashboard)/finance/gl/page.tsx",
        "app/(dashboard)/finance/ar/page.tsx",
        "app/(dashboard)/finance/ap/page.tsx",
        "app/(dashboard)/finance/assets/page.tsx",
        "app/(dashboard)/finance/budget-planning/page.tsx",
        "app/(dashboard)/finance/banking/page.tsx",
        "app/(dashboard)/finance/tax/page.tsx",
      ];

      for (const hub of hubs) {
        const content = read(hub);
        expect(content, `${hub} must handle Connection error in badge`).toContain("Connection error");
      }
    });
  });

  describe("4. Financial Report Export Integrity (No CSV Masquerading)", () => {
    it("exports honest formats without disguising CSV as PDF or XLSX", () => {
      const reports = read("app/(dashboard)/finance/reports/page.tsx");

      // Excel export must use SpreadsheetML XML or proper Excel MIME, not CSV
      expect(reports).toContain("vnd.ms-excel");
      expect(reports).toContain("urn:schemas-microsoft-com:office:spreadsheet");

      // CSV export must be explicitly text/csv
      expect(reports).toContain("text/csv;charset=utf-8;");

      // PDF export must trigger real browser print dialog rather than downloading CSV as .pdf
      expect(reports).toContain("window.print()");
    });
  });

  describe("5. Mobile Layout Geometry & Viewport Preservation (Elimination of 106px bug)", () => {
    it("hides app rail on mobile viewports <= 768px in CSS", () => {
      const railCss = read("src/components/shell/FinanceAppRail.module.css");
      expect(railCss).toContain("@media (max-width: 768px)");
      expect(railCss).toContain("display: none !important");
    });

    it("configures sidebar as off-canvas drawer overlay on <= 768px in CSS", () => {
      const sidebarCss = read("src/components/shell/FinanceSidebarV2.module.css");
      expect(sidebarCss).toContain("@media (max-width: 768px)");
      expect(sidebarCss).toContain("position: fixed");
      expect(sidebarCss).toContain("translateX(-100%)");
    });

    it("expands workspaceMain to full 100vw on mobile in CSS", () => {
      const shellCss = read("src/components/shell/FinanceShellV2.module.css");
      expect(shellCss).toContain("@media (max-width: 768px)");
      expect(shellCss).toContain("width: 100vw !important");
      expect(shellCss).toContain("mobileBackdrop");
    });

    it("renders mobile backdrop overlay in FinanceShellV2", () => {
      const shell = read("src/components/shell/FinanceShellV2.tsx");
      expect(shell).toContain("mobileBackdrop");
      expect(shell).toContain("handleToggleCollapse(true)");
    });
  });
});
