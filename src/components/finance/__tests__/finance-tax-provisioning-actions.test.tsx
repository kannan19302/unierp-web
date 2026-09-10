// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  subtab: "details",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams({ subtab: api.subtab }),
}));

const clientInstance = {
  get: api.get,
  post: api.post,
  patch: api.patch,
  delete: api.delete,
};

vi.mock("@kannan19302/framework", () => ({
  RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useApiClient: () => clientInstance,
}));

vi.mock("@kannan19302/ui/layout", () => ({
  SubTabBar: () => null,
}));

vi.mock("@kannan19302/ui", () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
  Button: ({
    children,
    variant: _variant,
    size: _size,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
  ListPageTemplate: ({
    columns,
    data,
    emptyTitle,
  }: {
    columns: Array<{ key: string; header: string; render?: (val: unknown, row: Record<string, unknown>) => React.ReactNode }>;
    data: Array<Record<string, unknown>>;
    emptyTitle?: string;
  }) => {
    if (!data || data.length === 0) return <div>{emptyTitle || "No records"}</div>;
    return (
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={String(row.id || idx)}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

import TaxProvisioningPage from "../../../../app/(dashboard)/finance/advanced/tax-provisioning/page";

describe("Tax provisioning UI contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.subtab = "details";
    api.get.mockImplementation((path: string) => {
      if (path.includes("/provision-runs")) {
        return Promise.resolve([
          {
            id: "run-101",
            fiscalYear: 2026,
            period: "2026-Q1",
            totalTaxProvision: 45000,
            status: "REVIEWED",
            createdAt: "2026-03-31T00:00:00.000Z",
          },
        ]);
      }
      if (path.includes("/dashboard")) {
        return Promise.resolve({
          totalRuns: 1,
          draftRuns: 0,
          reviewedRuns: 1,
          postedRuns: 0,
          uncertainReserveTotal: 12000,
        });
      }
      if (path.includes("/provision-details")) {
        return Promise.resolve([
          {
            id: "detail-1",
            runId: "run-101",
            jurisdiction: "Federal US",
            taxableIncome: 100000,
            taxRate: 21,
            currentTaxAmount: 21000,
            credits: 1000,
            payments: 5000,
            netTaxPayable: 15000,
            filingStatus: "ESTIMATED",
          },
        ]);
      }
      return Promise.resolve([]);
    });

    api.post.mockResolvedValue({
      effectiveTaxRate: 24.5,
      statutoryRate: 21,
      rateDifference: 3.5,
      totalTaxProvision: 45000,
      runId: "run-101",
      reconciliationItems: [
        { item: "Statutory rate", rate: 21, taxEffect: 21000 },
        { item: "State taxes net of federal benefit", rate: 3.5, taxEffect: 3500 },
      ],
    });
  });

  afterEach(cleanup);

  it("renders reconciliation details card when clicking Reconcile effective rate", async () => {
    render(<TaxProvisioningPage />);

    const select = await screen.findByLabelText("Provision run");
    fireEvent.change(select, { target: { value: "run-101" } });

    const reconcileButton = await screen.findByRole("button", {
      name: "Reconcile effective rate",
    });
    fireEvent.click(reconcileButton);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/advanced-finance/tax-provisioning/effective-rate-reconciliation",
        { runId: "run-101" },
      ),
    );

    expect(await screen.findByText("Effective Rate Reconciliation")).toBeTruthy();
    expect(screen.getByText("24.5%")).toBeTruthy();
    expect(screen.getByText("State taxes net of federal benefit")).toBeTruthy();
  });

  it("renders structured record inspector when clicking View detail action", async () => {
    api.get.mockImplementation((path: string) => {
      if (path.includes("/provision-runs")) {
        return Promise.resolve([
          { id: "run-101", fiscalYear: 2026, period: "2026-Q1", totalTaxProvision: 45000, status: "REVIEWED" },
        ]);
      }
      if (path.includes("/provision-details/detail-1")) {
        return Promise.resolve({
          id: "detail-1",
          jurisdiction: "Federal US",
          taxableIncome: 100000,
          taxRate: 21,
          filingStatus: "ESTIMATED",
        });
      }
      if (path.includes("/provision-details")) {
        return Promise.resolve([
          { id: "detail-1", jurisdiction: "Federal US", taxableIncome: 100000, taxRate: 21, netTaxPayable: 21000, filingStatus: "ESTIMATED" },
        ]);
      }
      return Promise.resolve([]);
    });

    render(<TaxProvisioningPage />);

    const viewButtons = await screen.findAllByRole("button", { name: "View" });
    fireEvent.click(viewButtons[0]);

    expect(await screen.findByText("Record Inspection")).toBeTruthy();
    expect(screen.getAllByText("Federal US").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/<pre>/i)).toBeNull();
  });
});
