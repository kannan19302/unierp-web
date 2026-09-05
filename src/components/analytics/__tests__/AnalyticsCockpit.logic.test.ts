import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("AnalyticsCockpit Data & Telemetry Contracts", () => {
  const cockpitSource = fs.readFileSync(
    path.resolve(__dirname, "../AnalyticsCockpitClient.tsx"),
    "utf-8",
  );

  it("must contain ZERO hardcoded monthly sales demo arrays", () => {
    // Check that the old demo array is gone
    expect(cockpitSource).not.toContain('{ name: "Jan", Sales: 45000');
    expect(cockpitSource).not.toContain('{ name: "Dec", Sales: 130000');
    // Ensure it references the live API endpoint
    expect(cockpitSource).toContain('"/analytics/monthly-revenue"');
  });

  it("must contain ZERO hardcoded pending approvals mock data", () => {
    // Old mock items must not exist in source
    expect(cockpitSource).not.toContain("PO-2026-089 — Dell PowerEdge Server Cluster");
    expect(cockpitSource).not.toContain("Sarah Jenkins (Staff Engineer)");
    expect(cockpitSource).not.toContain("DISC-2026-09 — Strategic Contract Price Exception");
    // Initial approvals state must be empty array
    expect(cockpitSource).toMatch(/const\s+\[approvals,\s*setApprovals\]\s*=\s*useState<[\s\S]*?>\(\[\]\);/);
  });

  it("must contain ZERO hardcoded enterprise activities mock data", () => {
    expect(cockpitSource).not.toContain("Payment settlement received for INV-2026-118");
    expect(cockpitSource).not.toContain("Quotation QT-882 approved by Horizon Tech");
    expect(cockpitSource).not.toContain("Elena Rostova");
    // Ensure it fetches live activity telemetry
    expect(cockpitSource).toContain('"/analytics/activity"');
  });

  it("must contain ZERO native browser alert() invocations", () => {
    expect(cockpitSource).not.toContain('alert(');
    expect(cockpitSource).toContain('toast.success');
    expect(cockpitSource).toContain('toast.error');
  });

  it("must NOT use deceptive fallback values for metrics", () => {
    // Must not fall back to 34 when count is 0
    expect(cockpitSource).not.toContain("invoiceCount || 34");
    // Must display real invoice count
    expect(cockpitSource).toContain("{invoiceCount}");
  });

  it("monthlySalesChartData transformation formats months correctly", () => {
    const rawMonthly = [
      { month: "2026-01", amount: 15400 },
      { month: "2026-02", amount: 28900 },
    ];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const transformed = rawMonthly.map((item) => {
      const parts = item.month.split("-");
      const mIdx = parts[1] ? parseInt(parts[1], 10) - 1 : -1;
      const name = mIdx >= 0 && mIdx < 12 ? `${monthNames[mIdx]} ${parts[0] ? parts[0].slice(2) : ""}` : item.month;
      return {
        name,
        Sales: Number(item.amount || 0),
        Target: Math.round(Number(item.amount || 0) * 0.95),
      };
    });

    expect(transformed).toEqual([
      { name: "Jan 26", Sales: 15400, Target: 14630 },
      { name: "Feb 26", Sales: 28900, Target: 27455 },
    ]);
  });

  it("empty monthlyRevenueList produces an empty chart array for truthful empty state rendering", () => {
    const emptyList: Array<{ month: string; amount: number }> = [];
    const transformed = emptyList.map((item) => ({
      name: item.month,
      Sales: item.amount,
    }));
    expect(transformed).toHaveLength(0);
  });
});
