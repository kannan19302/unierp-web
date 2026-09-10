// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), subtab: "thresholds" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams({ subtab: api.subtab }) }));
vi.mock("@/lib/api", () => ({ apiGet: api.get, apiPost: api.post, apiPatch: api.patch, apiDelete: api.delete }));
vi.mock("@kannan19302/ui/layout", () => ({ SubTabBar: () => null }));
vi.mock("@kannan19302/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, variant: _variant, size: _size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => <button {...props}>{children}</button>,
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  ProtectedComponent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DataTable: ({ columns, data }: { columns: Array<{ key: string; render?: (row: Record<string, unknown>) => React.ReactNode }>; data: Array<Record<string, unknown>> }) => <table><tbody>{data.map((row) => <tr key={String(row.id)}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : String(row[column.key] ?? "")}</td>)}</tr>)}</tbody></table>,
}));
import TaxNexusPage from "../../../../app/(dashboard)/finance/advanced/tax-nexus/page";

describe("Tax nexus UI contract", () => {
  beforeEach(() => {
    vi.resetAllMocks(); api.subtab = "thresholds";
    api.get.mockImplementation((path: string) => {
      if (path.endsWith("/dashboard")) return Promise.resolve(null);
      if (path.endsWith("/thresholds")) return Promise.resolve([]);
      return Promise.resolve([]);
    });
    api.post.mockResolvedValue({ id: "threshold-1" });
  });
  afterEach(cleanup);

  it("creates a state threshold with numeric limits", async () => {
    render(<TaxNexusPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Create threshold" }));
    fireEvent.change(screen.getByLabelText("State code"), { target: { value: "CA" } });
    fireEvent.change(screen.getByLabelText("Revenue threshold"), { target: { value: "500000" } });
    fireEvent.change(screen.getByLabelText("Transaction threshold"), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: "Save threshold" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/advanced-finance/tax/nexus/thresholds", {
      state: "CA", revenueThreshold: 500000, transactionThreshold: 200, measurementPeriod: "PREVIOUS_12_MONTHS",
    }));
  });

  it("loads state monitoring history from a monitor-row action", async () => {
    api.subtab = "monitor";
    api.get.mockImplementation((path: string) => {
      if (path.endsWith("/dashboard")) return Promise.resolve(null);
      if (path.endsWith("/monitor")) return Promise.resolve([{ id: "s-1", state: "CA", status: "EXCEEDED", totalRevenue: 1, revenueThreshold: 1, revenuePct: 100, transactionCount: 1, transactionThreshold: null }]);
      return Promise.resolve(path.includes("/history") ? [{ id: "h-1" }] : []);
    });
    render(<TaxNexusPage />);
    fireEvent.click(await screen.findByRole("button", { name: "History" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/advanced-finance/tax/nexus/monitor/CA/history"));
  });

  it("renders structured historical snapshot details without raw JSON", async () => {
    api.subtab = "monitor";
    api.get.mockImplementation((path: string) => {
      if (path.endsWith("/dashboard")) return Promise.resolve(null);
      if (path.endsWith("/monitor")) return Promise.resolve([{ id: "s-1", state: "NY", status: "APPROACHING", totalRevenue: 85000, revenueThreshold: 100000, revenuePct: 85, transactionCount: 150, transactionThreshold: 200 }]);
      if (path.includes("/history")) return Promise.resolve([{
        id: "h-1", state: "NY", computedAt: "2026-09-01T00:00:00.000Z", totalRevenue: 85000, revenueThreshold: 100000, revenuePct: 85, transactionCount: 150, transactionThreshold: 200, status: "APPROACHING"
      }]);
      return Promise.resolve([]);
    });
    render(<TaxNexusPage />);
    fireEvent.click(await screen.findByRole("button", { name: "History" }));
    expect(await screen.findByText("Historical Monitoring Snapshots")).toBeDefined();
    expect(screen.getAllByText("NY").length).toBeGreaterThan(0);
    expect(screen.getAllByText("85.0%").length).toBeGreaterThan(0);
  });
});
