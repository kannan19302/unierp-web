// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
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

import AssetOperationsPage from "../../../../app/(dashboard)/finance/advanced/asset-operations/page";

describe("Asset operations UI contract", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockImplementation((path: string) => {
      if (path.includes("/insurance/expiring")) {
        return Promise.resolve([]);
      }
      if (path.includes("/insurance")) {
        return Promise.resolve([
          {
            id: "ins-1",
            name: "Server Rack Fire Policy",
            status: "ACTIVE",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(cleanup);

  it("renders structured operation result when creating an insurance policy", async () => {
    api.post.mockResolvedValue({
      id: "policy-101",
      policyNumber: "POL-2026-999",
      insurer: "Hartford",
      coverageAmount: 100000,
      premium: 1200,
      status: "ACTIVE",
    });

    render(<AssetOperationsPage />);

    const createButton = await screen.findByRole("button", { name: "Create policy" });
    fireEvent.click(createButton);

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        expect.stringContaining("/insurance"),
        expect.anything(),
      ),
    );

    expect(await screen.findByText("Operation Result & Details")).toBeTruthy();
    expect(screen.getByText("POL-2026-999")).toBeTruthy();
    expect(screen.getByText("Hartford")).toBeTruthy();
    expect(screen.queryByText(/<pre>/i)).toBeNull();
  });

  it("renders structured table for array results such as revaluation history", async () => {
    render(<AssetOperationsPage />);

    const revalNav = await screen.findByRole("button", { name: "revaluation" });
    fireEvent.click(revalNav);

    api.get.mockResolvedValue([
      { id: "rev-1", revaluationDate: "2026-06-30", revaluedValue: 85000, status: "APPROVED" },
      { id: "rev-2", revaluationDate: "2026-12-31", revaluedValue: 92000, status: "DRAFT" },
    ]);

    const historyButton = await screen.findByRole("button", { name: "View history" });
    fireEvent.click(historyButton);

    expect(await screen.findByText("Operation Result & Details")).toBeTruthy();
    expect(await screen.findByText("85000")).toBeTruthy();
    expect(screen.getByText("92000")).toBeTruthy();
    expect(screen.queryByText(/<pre>/i)).toBeNull();
  });
});
