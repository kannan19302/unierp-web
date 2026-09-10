// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  subtab: "jurisdictions",
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

import AdvancedTaxOperationsPage from "../../../../app/(dashboard)/finance/advanced/tax-operations/page";

describe("Tax operations UI contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.subtab = "jurisdictions";
    api.get.mockImplementation((path: string) => {
      if (path.endsWith("/dashboard")) {
        return Promise.resolve({
          jurisdictions: 12,
          certificates: 34,
          reconciliations: 5,
          withholdingCerts: 18,
          amendedFilings: 2,
        });
      }
      if (path.endsWith("/jurisdictions")) {
        return Promise.resolve([
          {
            id: "jur-1",
            name: "California Dept of Tax",
            code: "CA-STATE",
            status: "ACTIVE",
            country: "US",
            state: "CA",
            taxType: "SALES_TAX",
            rate: 7.25,
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(cleanup);

  it("renders structured KPI metrics deck for tax dashboard without raw pre tag", async () => {
    render(<AdvancedTaxOperationsPage />);

    expect(await screen.findByText("Active tax boundaries")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("Active exemptions")).toBeTruthy();
    expect(screen.getByText("34")).toBeTruthy();
    expect(screen.queryByText(/<pre>/i)).toBeNull();
  });

  it("renders structured operation result inspector when viewing jurisdiction", async () => {
    api.get.mockImplementation((path: string) => {
      if (path.endsWith("/dashboard")) {
        return Promise.resolve({ jurisdictions: 12, certificates: 34 });
      }
      if (path.endsWith("/jurisdictions/jur-1")) {
        return Promise.resolve({
          id: "jur-1",
          name: "California Dept of Tax",
          code: "CA-STATE",
          status: "ACTIVE",
          rate: 7.25,
        });
      }
      if (path.endsWith("/jurisdictions")) {
        return Promise.resolve([
          { id: "jur-1", name: "California Dept of Tax", code: "CA-STATE", status: "ACTIVE" },
        ]);
      }
      return Promise.resolve([]);
    });

    render(<AdvancedTaxOperationsPage />);

    const viewButton = await screen.findByRole("button", { name: "View" });
    fireEvent.click(viewButton);

    expect(await screen.findByText("Operation Result & Details")).toBeTruthy();
    expect(screen.getAllByText("California Dept of Tax").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/<pre>/i)).toBeNull();
  });
});
