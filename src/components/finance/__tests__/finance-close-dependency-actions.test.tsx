// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), canManage: true, subtab: "tasks" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams({ subtab: api.subtab }) }));
vi.mock("@kannan19302/framework", () => ({
  useApiClient: () => api,
  usePermission: (permission: string) => permission !== "finance.close.manage" || api.canManage,
  RouteGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@kannan19302/ui/layout", () => ({ SubTabBar: () => null }));
vi.mock("@kannan19302/ui", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, variant: _variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => <button {...props}>{children}</button>,
  ListPageTemplate: ({ columns, data }: {
    columns: Array<{ key: string; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }>;
    data: Array<Record<string, unknown>>;
  }) => <table><tbody>{data.map((row) => <tr key={String(row.id)}>{columns.map((column) =>
    <td key={column.key}>{column.render ? column.render(row[column.key], row) : String(row[column.key] ?? "")}</td>)}</tr>)}</tbody></table>,
  ConfirmDialog: ({ title, message, confirmLabel, onConfirm, onClose, isLoading }: {
    title: string; message: React.ReactNode; confirmLabel: string; onConfirm: () => void; onClose: () => void; isLoading: boolean;
  }) => <div role="dialog" aria-label={title}>{message}
    <button onClick={onConfirm} disabled={isLoading}>{confirmLabel}</button>
    <button onClick={onClose} disabled={isLoading}>Cancel removal</button>
  </div>,
}));
import CloseManagementPage from "../../../../app/(dashboard)/finance/advanced/close-management/page";

describe("Close dependency removal UI boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.canManage = true;
    api.subtab = "tasks";
    api.get.mockResolvedValue([{ id: "edge/1", taskName: "Close ledger", dependsOn: "Review journals", dependencyType: "FINISH_TO_START", status: "DONE" }]);
    api.delete.mockResolvedValue({ success: true });
  });
  afterEach(cleanup);

  async function openRemoval() {
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove dependency for Close ledger" }));
  }

  it("names both tasks and sends no request when canceled", async () => {
    await openRemoval();
    expect(screen.getByRole("dialog").textContent).toContain("Review journals");
    expect(screen.getByRole("dialog").textContent).toContain("Close ledger");
    fireEvent.click(screen.getByRole("button", { name: "Cancel removal" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("removes the selected encoded ID and refreshes server records", async () => {
    await openRemoval();
    api.get.mockResolvedValue([]);
    fireEvent.click(screen.getByRole("button", { name: "Remove dependency" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(api.delete).toHaveBeenCalledTimes(1);
    expect(api.delete).toHaveBeenCalledWith("/advanced-finance/close-management/task-dependencies/edge%2F1");
    expect(screen.getByRole("status").textContent).toContain("Task dependency removed");
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("button", { name: "Remove dependency for Close ledger" })).toBeNull();
  });

  it("retains the confirmation and error after a failed removal", async () => {
    api.delete.mockRejectedValue(new Error("Dependency changed; refresh and retry."));
    await openRemoval();
    fireEvent.click(screen.getByRole("button", { name: "Remove dependency" }));
    expect((await screen.findByRole("alert")).textContent).toContain("refresh and retry");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("does not expose removal to a reader without manage permission", async () => {
    api.canManage = false;
    render(<CloseManagementPage />);
    await screen.findByText("Close ledger");
    expect(screen.queryByRole("button", { name: /Remove dependency/ })).toBeNull();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("loads the breached-SLA endpoint and shows unresolved task references honestly", async () => {
    api.subtab = "breached-slas";
    api.canManage = false;
    api.get.mockResolvedValue([{
      id: "sla-a", task: null, deadlineAt: "2026-09-08T12:00:00Z",
      breachedAt: null, slaMinutes: 90, priority: "HIGH",
    }]);
    render(<CloseManagementPage />);
    await screen.findByText("Unavailable task");
    expect(api.get).toHaveBeenCalledWith("/advanced-finance/close-management/slas/breached");
    expect(screen.getByText("Not recorded")).toBeTruthy();
    expect(screen.getByText("90")).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it("creates a reusable SLA policy with exact millisecond durations", async () => {
    api.get.mockResolvedValue([]);
    api.post.mockResolvedValue({ id: "policy-a" });
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: /Configure SLA/ }));
    fireEvent.change(screen.getByLabelText("Policy name"), { target: { value: "Close approval" } });
    fireEvent.change(screen.getByLabelText("Response hours"), { target: { value: "1.5" } });
    fireEvent.change(screen.getByLabelText("Resolution hours"), { target: { value: "24" } });
    fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "HIGH" } });
    fireEvent.click(screen.getByRole("button", { name: "Create policy" }));
    await screen.findByText("SLA policy created.");
    expect(api.post).toHaveBeenCalledWith("/advanced-finance/close-management/sla-policies", {
      name: "Close approval", taskType: "APPROVAL", priority: "HIGH", timeBasis: "ELAPSED",
      responseTimeMs: 5_400_000, resolutionTimeMs: 86_400_000, escalationRuleIds: [],
    });
  });

  it("rejects a response duration longer than resolution without calling the API", async () => {
    api.get.mockResolvedValue([]);
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: /Configure SLA/ }));
    fireEvent.change(screen.getByLabelText("Policy name"), { target: { value: "Invalid policy" } });
    fireEvent.change(screen.getByLabelText("Response hours"), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText("Resolution hours"), { target: { value: "24" } });
    fireEvent.click(screen.getByRole("button", { name: "Create policy" }));
    expect((await screen.findByRole("alert")).textContent).toContain("resolution must not be shorter");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("lists and revises the current immutable policy version", async () => {
    api.subtab = "sla-policies";
    api.get.mockResolvedValue({ items: [{ id: "policy/a", currentVersion: 2, status: "ACTIVE", versions: [{
      id: "version-a", version: 2, name: "Close approval", taskType: "APPROVAL", priority: "HIGH",
      responseTimeMs: 3_600_000, resolutionTimeMs: 86_400_000,
    }] }], total: 1, page: 1, limit: 100, totalPages: 1 });
    api.post.mockResolvedValue({ id: "policy/a", currentVersion: 3 });
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Revise Close approval" }));
    expect(screen.getByText(/creates version 3/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Resolution hours"), { target: { value: "48" } });
    fireEvent.click(screen.getByRole("button", { name: "Create revision" }));
    await screen.findByText("SLA policy revised.");
    expect(api.post).toHaveBeenCalledWith("/advanced-finance/close-management/sla-policies/policy%2Fa/versions",
      expect.objectContaining({ expectedVersion: 2, resolutionTimeMs: 172_800_000 }));
  });

  it("confirms retirement with the expected policy version and refreshes the list", async () => {
    api.subtab = "sla-policies";
    const policy = { id: "policy/a", currentVersion: 2, status: "ACTIVE", versions: [{
      id: "version-a", version: 2, name: "Close approval", taskType: "APPROVAL", priority: "HIGH",
      responseTimeMs: 3_600_000, resolutionTimeMs: 86_400_000,
    }] };
    api.get.mockResolvedValue({ items: [policy], total: 1, page: 1, limit: 20, totalPages: 1 });
    api.post.mockResolvedValue({ ...policy, status: "RETIRED" });
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Retire" }));
    expect(screen.getByRole("dialog", { name: "Retire SLA policy" }).textContent).toContain("Existing task deadlines remain unchanged");
    fireEvent.click(screen.getByRole("button", { name: "Retire policy" }));
    await screen.findByText("SLA policy retired.");
    expect(api.post).toHaveBeenCalledWith("/advanced-finance/close-management/sla-policies/policy%2Fa/retire", {
      expectedVersion: 2,
    });
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("requests the next bounded policy page", async () => {
    api.subtab = "sla-policies";
    api.get.mockResolvedValue({ items: [], total: 21, page: 1, limit: 20, totalPages: 2 });
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Next" }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(
      "/advanced-finance/close-management/sla-policies?page=2&limit=20",
    ));
  });

  it("creates a field-aligned escalation rule and can disable it", async () => {
    api.subtab = "escalations";
    const rule = { id: "rule/a", name: "Notify controller", conditionField: "status",
      conditionOperator: "EQUALS", conditionValue: "SLA_BREACH", escalateToRole: "FINANCE_CONTROLLER",
      escalateToUser: null, notifyMethod: "BOTH", isActive: true };
    api.get.mockResolvedValue([rule]);
    api.post.mockResolvedValue(rule);
    api.patch.mockResolvedValue({ ...rule, isActive: false });
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Create Escalation Rule" }));
    fireEvent.change(screen.getByLabelText("Rule Name"), { target: { value: "Notify finance" } });
    fireEvent.change(screen.getByLabelText("Escalate to role"), { target: { value: "FINANCE_MANAGER" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await screen.findByText("Escalation rule created.");
    expect(api.post).toHaveBeenCalledWith("/advanced-finance/close-management/escalation-rules", {
      name: "Notify finance", conditionField: "status", conditionOperator: "EQUALS",
      conditionValue: "SLA_BREACH", escalateToRole: "FINANCE_MANAGER", notifyMethod: "EMAIL",
    });
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    await screen.findByText("Escalation rule disabled.");
    expect(api.patch).toHaveBeenCalledWith("/advanced-finance/close-management/escalation-rules/rule%2Fa", {
      isActive: false,
    });
  });

  it("lists bounded task SLAs and resolves the selected record", async () => {
    api.subtab = "task-slas";
    api.get.mockResolvedValue({ items: [{ id: "sla/a", taskId: "task-a", status: "BREACHED", priority: "HIGH",
      startedAt: "2026-09-09T00:00:00Z", responseDeadlineAt: null, deadlineAt: "2026-09-10T00:00:00Z",
      policyVersionId: null }], total: 1, page: 1, limit: 20, totalPages: 1 });
    api.patch.mockResolvedValue({ id: "sla/a", status: "RESOLVED" });
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Resolve" }));
    await screen.findByText("Task SLA resolved.");
    expect(api.patch).toHaveBeenCalledWith("/advanced-finance/close-management/slas/sla%2Fa/status", {
      status: "RESOLVED",
    });
  });

  it("loads close insights for a selected period and captures server-derived snapshot evidence", async () => {
    api.subtab = "analytics";
    api.get.mockImplementation((url: string) => {
      if (url === "/advanced-finance/financial-periods") return Promise.resolve([{ id: "period/a", name: "September" }]);
      if (url.startsWith("/advanced-finance/close-management/status-summary")) return Promise.resolve({ total: 4, done: 2, overdue: 1 });
      if (url === "/advanced-finance/close-management/trends") return Promise.resolve({ periodCount: 1, totalSnapshots: 2 });
      if (url.startsWith("/advanced-finance/close-management/critical-path")) return Promise.resolve({ criticalDependencies: 2, blockedTasks: 1 });
      if (url === "/advanced-finance/close-management/analytics/period%2Fa") return Promise.resolve({
        snapshotCount: 2, latest: { completedTasks: 2, totalTasks: 4, overdueTasks: 1, breachedSlas: 1,
          capturedAt: "2026-09-09T00:00:00Z" },
      });
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    api.post.mockResolvedValue({ id: "snapshot-a" });
    render(<CloseManagementPage />);
    fireEvent.change(await screen.findByLabelText("Financial period"), { target: { value: "period/a" } });
    await screen.findByText(/latest: 2\/4 complete/);
    fireEvent.click(screen.getByRole("button", { name: "Capture current snapshot" }));
    await screen.findByText("Close analytics snapshot captured.");
    expect(api.post).toHaveBeenCalledWith("/advanced-finance/close-management/snapshots", { periodId: "period/a" });
    expect(api.get).toHaveBeenCalledWith("/advanced-finance/close-management/critical-path?periodId=period%2Fa");
  });

  it("assigns a selected policy version to a period-scoped task", async () => {
    const policy = { id: "policy-a", currentVersion: 1, status: "ACTIVE", versions: [{
      id: "version-a", version: 1, name: "Close approval", taskType: "APPROVAL", priority: "HIGH",
      responseTimeMs: 3_600_000, resolutionTimeMs: 86_400_000,
    }] };
    api.get.mockImplementation((url: string) => {
      if (url === "/advanced-finance/close-management/task-dependencies") return Promise.resolve([]);
      if (url === "/advanced-finance/financial-periods") return Promise.resolve([{ id: "period-a", name: "September" }]);
      if (url === "/advanced-finance/close-management/sla-policies?page=1&limit=100") return Promise.resolve({
        items: [policy], total: 1, page: 1, limit: 100, totalPages: 1,
      });
      if (url.includes("/advanced-finance/close-tasks?")) return Promise.resolve([{ id: "task/a", name: "Review journal" }]);
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    api.post.mockResolvedValue({ id: "sla-a" });
    const randomUUID = vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000001");
    render(<CloseManagementPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Assign SLA" }));
    fireEvent.change(await screen.findByLabelText("Financial period"), { target: { value: "period-a" } });
    fireEvent.change(await screen.findByLabelText("Close task"), { target: { value: "task/a" } });
    fireEvent.change(screen.getByLabelText("Starts at (local time)"), { target: { value: "2026-09-09T09:00" } });
    fireEvent.change(screen.getByLabelText("SLA policy version"), { target: { value: "version-a" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Assign SLA" }).at(-1)!);
    await screen.findByText("Task SLA assigned.");
    expect(api.post).toHaveBeenCalledWith("/advanced-finance/close-management/task-slas", expect.objectContaining({
      mode: "POLICY", taskId: "task/a", policyVersionId: "version-a",
      idempotencyKey: "00000000-0000-4000-8000-000000000001",
    }));
    randomUUID.mockRestore();
  });
});
