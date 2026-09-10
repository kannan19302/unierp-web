"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calculator,
  RefreshCw,
  Loader2,
  Plus,
  Play,
  Check,
  AlertTriangle,
  FileText,
  Scale,
  DollarSign,
  Shield,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";

interface ProvisionRun {
  id: string;
  fiscalYear: number;
  period: string;
  totalTaxProvision: number | null;
  status: string;
  createdAt: string;
}

interface DeferredSchedule {
  id: string;
  accountId: string;
  temporaryDifference: number;
  taxRate: number;
  deferredTaxAsset: number | null;
  deferredTaxLiability: number | null;
  categorization: string | null;
}

interface UncertainPosition {
  id: string;
  positionName: string;
  jurisdiction: string;
  description: string;
  taxAmountAtRisk: number;
  probabilityOfLoss: number;
  status: string;
}

interface ValuationAllowance {
  id: string;
  jurisdiction: string;
  allowanceAmount: number;
  assessmentType: string;
  conclusion: string | null;
}

interface ProvisionDetail {
  id: string;
  jurisdiction: string;
  taxableIncome: number;
  taxRate: number;
  currentTaxAmount: number;
  netTaxPayable: number | null;
  filingStatus: string;
}

interface ProvisionDashboard {
  totalRuns: number;
  postedRuns: number;
  totalProvisionPosted: number;
  netDeferredTax: number;
  uncertainReserveTotal: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function TaxProvisioningPage() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "runs") as string;

  const [runs, setRuns] = useState<ProvisionRun[]>([]);
  const [schedules, setSchedules] = useState<DeferredSchedule[]>([]);
  const [positions, setPositions] = useState<UncertainPosition[]>([]);
  const [allowances, setAllowances] = useState<ValuationAllowance[]>([]);
  const [details, setDetails] = useState<ProvisionDetail[]>([]);
  const [dashboard, setDashboard] = useState<ProvisionDashboard | null>(null);
  const [reconciliation, setReconciliation] = useState<Record<string, unknown> | null>(null);
  const [inspectedRecord, setInspectedRecord] = useState<Record<string, unknown> | null>(null);
  const [positionActionAmount, setPositionActionAmount] = useState("");
  const [editingRunId, setEditingRunId] = useState("");
  const [editingDetailId, setEditingDetailId] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState("");
  const [editingPositionId, setEditingPositionId] = useState("");
  const [editingAllowanceId, setEditingAllowanceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState("");

  const [showRunForm, setShowRunForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);

  const [runForm, setRunForm] = useState({
    fiscalYear: String(new Date().getFullYear()),
    period: "",
    pretaxIncome: "",
    statutoryRate: "21",
  });
  const [scheduleForm, setScheduleForm] = useState({
    accountId: "",
    temporaryDifference: "",
    taxRate: "21",
    categorization: "",
  });
  const [positionForm, setPositionForm] = useState({
    positionName: "",
    jurisdiction: "",
    description: "",
    taxAmountAtRisk: "",
    probabilityOfLoss: "50",
  });
  const [allowanceForm, setAllowanceForm] = useState({
    jurisdiction: "",
    allowanceAmount: "",
    assessmentType: "MORE_LIKELY_THAN_NOT",
    conclusion: "",
  });
  const [detailForm, setDetailForm] = useState({ jurisdiction: "", taxableIncome: "", taxRate: "21" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r, s, p, a] = await Promise.all([
        client.get<ProvisionRun[]>(
          "/advanced-finance/tax-provisioning/provision-runs",
        ),
        client.get<DeferredSchedule[]>(
          "/advanced-finance/tax-provisioning/deferred-tax-schedules",
        ),
        client.get<UncertainPosition[]>(
          "/advanced-finance/tax-provisioning/uncertain-tax-positions",
        ),
        client.get<ValuationAllowance[]>(
          "/advanced-finance/tax-provisioning/valuation-allowances",
        ),
      ]);
      setRuns(r);
      setSelectedRunId((current) => current || r[0]?.id || "");
      setSchedules(s);
      setPositions(p);
      setAllowances(a);
    } catch {
      setError("Failed to load tax provision data.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedRunId) { setDetails([]); return; }
    client.get<ProvisionDetail[]>(`/advanced-finance/tax-provisioning/provision-details?runId=${encodeURIComponent(selectedRunId)}`)
      .then(setDetails).catch(() => setError("Failed to load provision details."));
  }, [client, selectedRunId]);

  useEffect(() => {
    client.get<ProvisionDashboard>(`/advanced-finance/tax-provisioning/dashboard?fiscalYear=${new Date().getFullYear()}`)
      .then(setDashboard).catch(() => setError("Failed to load the tax provision dashboard."));
  }, [client]);

  const handleCreateRun = async () => {
    if (!runForm.fiscalYear || !runForm.period) return;
    setActionLoading(true);
    try {
      const payload = {
          fiscalYear: Number(runForm.fiscalYear),
          period: runForm.period,
          pretaxIncome: runForm.pretaxIncome ? Number(runForm.pretaxIncome) : undefined,
          statutoryRate: runForm.statutoryRate ? Number(runForm.statutoryRate) : undefined,
        };
      if (editingRunId) {
        await client.patch(`/advanced-finance/tax-provisioning/provision-runs/${editingRunId}`, { pretaxIncome: payload.pretaxIncome, statutoryRate: payload.statutoryRate });
      } else {
        await client.post("/advanced-finance/tax-provisioning/provision-runs", payload);
      }
      setSuccess(editingRunId ? "Provision run updated." : "Provision run created.");
      setEditingRunId("");
      setShowRunForm(false);
      setRunForm({ fiscalYear: String(new Date().getFullYear()), period: "", pretaxIncome: "", statutoryRate: "21" });
      fetchData();
    } catch {
      setError("Failed to create provision run.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComputeProvision = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/tax-provisioning/provision-runs/${id}/compute`,
        {},
      );
      setSuccess("Provision computed.");
      fetchData();
    } catch {
      setError("Failed to compute provision.");
    }
  };

  const handleEditRun = async (id: string) => {
    try {
      const run = await client.get<ProvisionRun & { pretaxIncome?: number; statutoryRate?: number }>(`/advanced-finance/tax-provisioning/provision-runs/${id}`);
      setRunForm({ fiscalYear: String(run.fiscalYear), period: run.period, pretaxIncome: String(run.pretaxIncome ?? ""), statutoryRate: String(run.statutoryRate ?? "") });
      setEditingRunId(id); setShowRunForm(true);
    } catch { setError("Failed to load the provision run."); }
  };

  const handleReviewProvision = async (id: string) => {
    try {
      await client.post(`/advanced-finance/tax-provisioning/provision-runs/${id}/review`, {});
      setSuccess("Provision reviewed.");
      fetchData();
    } catch { setError("Failed to review provision."); }
  };

  const handlePostProvision = async (id: string) => {
    try {
      await client.post(`/advanced-finance/tax-provisioning/provision-runs/${id}/post`, {});
      setSuccess("Provision posted.");
      fetchData();
    } catch { setError("Failed to post provision."); }
  };

  const handleDeleteRun = async (id: string) => {
    try {
      await client.delete(`/advanced-finance/tax-provisioning/provision-runs/${id}`);
      setSuccess("Draft provision deleted.");
      fetchData();
    } catch { setError("Only an unused draft provision can be deleted."); }
  };

  const handleCreateSchedule = async () => {
    if (!selectedRunId || !scheduleForm.accountId) return;
    setActionLoading(true);
    try {
      const payload = {
        runId: selectedRunId,
        ...scheduleForm,
        temporaryDifference: parseFloat(scheduleForm.temporaryDifference),
        taxRate: parseFloat(scheduleForm.taxRate),
      };
      if (editingScheduleId) await client.patch(`/advanced-finance/tax-provisioning/deferred-tax-schedules/${editingScheduleId}`, { temporaryDifference: payload.temporaryDifference, taxRate: payload.taxRate, categorization: payload.categorization });
      else await client.post("/advanced-finance/tax-provisioning/deferred-tax-schedules", payload);
      setSuccess(editingScheduleId ? "Deferred schedule updated." : "Deferred schedule created.");
      setEditingScheduleId("");
      setShowScheduleForm(false);
      setScheduleForm({
        accountId: "",
        temporaryDifference: "",
        taxRate: "21",
        categorization: "",
      });
      fetchData();
    } catch {
      setError("Failed to create deferred schedule.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSchedule = async (id: string) => {
    try { const row = await client.get<DeferredSchedule>(`/advanced-finance/tax-provisioning/deferred-tax-schedules/${id}`); setScheduleForm({ accountId: row.accountId, temporaryDifference: String(row.temporaryDifference), taxRate: String(row.taxRate), categorization: row.categorization ?? "" }); setEditingScheduleId(id); setShowScheduleForm(true); }
    catch { setError("Failed to load the deferred-tax schedule."); }
  };

  const handleViewSchedule = async (id: string) => {
    try { setInspectedRecord(await client.get<Record<string, unknown>>(`/advanced-finance/tax-provisioning/deferred-tax-schedules/${id}`)); }
    catch { setError("Failed to load the deferred-tax schedule."); }
  };

  const handleRecomputeSchedule = async (id: string) => {
    try { await client.post(`/advanced-finance/tax-provisioning/deferred-tax-schedules/${id}/compute`, {}); setSuccess("Deferred tax recalculated."); fetchData(); }
    catch { setError("Failed to recalculate deferred tax."); }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Delete this draft deferred-tax schedule?")) return;
    try { await client.delete(`/advanced-finance/tax-provisioning/deferred-tax-schedules/${id}`); setSuccess("Deferred-tax schedule deleted."); fetchData(); }
    catch { setError("Failed to delete the deferred-tax schedule."); }
  };

  const handleCreateDetail = async () => {
    if (!selectedRunId || !detailForm.jurisdiction || !detailForm.taxableIncome) return;
    setActionLoading(true);
    try {
      const payload = {
        runId: selectedRunId, jurisdiction: detailForm.jurisdiction,
        taxableIncome: Number(detailForm.taxableIncome), taxRate: Number(detailForm.taxRate),
      };
      if (editingDetailId) await client.patch(`/advanced-finance/tax-provisioning/provision-details/${editingDetailId}`, { taxableIncome: payload.taxableIncome, taxRate: payload.taxRate });
      else await client.post("/advanced-finance/tax-provisioning/provision-details", payload);
      setEditingDetailId("");
      setDetailForm({ jurisdiction: "", taxableIncome: "", taxRate: "21" });
      setSuccess("Provision detail created.");
      const next = await client.get<ProvisionDetail[]>(`/advanced-finance/tax-provisioning/provision-details?runId=${encodeURIComponent(selectedRunId)}`);
      setDetails(next);
    } catch { setError("Failed to create provision detail."); }
    finally { setActionLoading(false); }
  };

  const handleEditDetail = async (id: string) => {
    try { const row = await client.get<ProvisionDetail>(`/advanced-finance/tax-provisioning/provision-details/${id}`); setDetailForm({ jurisdiction: row.jurisdiction, taxableIncome: String(row.taxableIncome), taxRate: String(row.taxRate) }); setEditingDetailId(id); }
    catch { setError("Failed to load the provision detail."); }
  };

  const handleComputeDetail = async (id: string) => {
    try {
      await client.post(`/advanced-finance/tax-provisioning/provision-details/${id}/compute`, {});
      setSuccess("Provision detail recalculated.");
    } catch { setError("Failed to recalculate provision detail."); }
  };

  const handleDeleteDetail = async (id: string) => {
    try {
      await client.delete(`/advanced-finance/tax-provisioning/provision-details/${id}`);
      setDetails((items) => items.filter((item) => item.id !== id));
      setSuccess("Provision detail deleted.");
    } catch { setError("Failed to delete provision detail."); }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const record = await client.get<Record<string, unknown>>(`/advanced-finance/tax-provisioning/provision-details/${id}`);
      setInspectedRecord(record);
    } catch {
      setError("Failed to load provision detail.");
    }
  };

  const handleReconcile = async () => {
    if (!selectedRunId) return;
    try {
      const result = await client.post<Record<string, unknown>>("/advanced-finance/tax-provisioning/effective-rate-reconciliation", { runId: selectedRunId });
      setReconciliation(result);
      setSuccess("Effective tax rate reconciled.");
    } catch { setError("Failed to reconcile the effective tax rate."); }
  };

  const handleEvaluatePosition = async (id: string) => {
    try {
      await client.post(
        `/advanced-finance/tax-provisioning/uncertain-tax-positions/${id}/evaluate`,
        { probabilityOfLoss: Number(positionForm.probabilityOfLoss) },
      );
      setSuccess("Uncertain position evaluated.");
      fetchData();
    } catch {
      setError("Failed to evaluate position.");
    }
  };

  const handleCreatePosition = async () => {
    if (!selectedRunId || !positionForm.positionName || !positionForm.jurisdiction || !positionForm.description) return;
    setActionLoading(true);
    try {
      const payload = {
        runId: selectedRunId,
        ...positionForm,
        taxAmountAtRisk: parseFloat(positionForm.taxAmountAtRisk),
        probabilityOfLoss: parseFloat(positionForm.probabilityOfLoss),
      };
      if (editingPositionId) await client.patch(`/advanced-finance/tax-provisioning/uncertain-tax-positions/${editingPositionId}`, { positionName: payload.positionName, jurisdiction: payload.jurisdiction, description: payload.description, taxAmountAtRisk: payload.taxAmountAtRisk, probabilityOfLoss: payload.probabilityOfLoss });
      else await client.post("/advanced-finance/tax-provisioning/uncertain-tax-positions", payload);
      setSuccess(editingPositionId ? "Uncertain position updated." : "Uncertain position created.");
      setEditingPositionId("");
      setShowPositionForm(false);
      setPositionForm({
        positionName: "",
        jurisdiction: "",
        description: "",
        taxAmountAtRisk: "",
        probabilityOfLoss: "50",
      });
      fetchData();
    } catch {
      setError("Failed to create uncertain position.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPosition = async (id: string) => {
    try { const row = await client.get<UncertainPosition>(`/advanced-finance/tax-provisioning/uncertain-tax-positions/${id}`); setPositionForm({ positionName: row.positionName, jurisdiction: row.jurisdiction, description: row.description, taxAmountAtRisk: String(row.taxAmountAtRisk), probabilityOfLoss: String(row.probabilityOfLoss) }); setEditingPositionId(id); setShowPositionForm(true); }
    catch { setError("Failed to load the uncertain tax position."); }
  };

  const handleViewPosition = async (id: string) => {
    try { setInspectedRecord(await client.get<Record<string, unknown>>(`/advanced-finance/tax-provisioning/uncertain-tax-positions/${id}`)); }
    catch { setError("Failed to load the uncertain tax position."); }
  };

  const handleReservePosition = async (id: string) => {
    if (!positionActionAmount) return;
    try { await client.post(`/advanced-finance/tax-provisioning/uncertain-tax-positions/${id}/reserve`, { reserveAmount: Number(positionActionAmount) }); setSuccess("Reserve recorded."); fetchData(); }
    catch { setError("Failed to record the reserve."); }
  };

  const handleSettlePosition = async (id: string) => {
    if (!positionActionAmount) return;
    try { await client.post(`/advanced-finance/tax-provisioning/uncertain-tax-positions/${id}/settle`, { settlementAmount: Number(positionActionAmount) }); setSuccess("Position settled."); fetchData(); }
    catch { setError("Failed to settle the position."); }
  };

  const handleDeletePosition = async (id: string) => {
    if (!window.confirm("Delete this draft uncertain tax position?")) return;
    try { await client.delete(`/advanced-finance/tax-provisioning/uncertain-tax-positions/${id}`); setSuccess("Uncertain tax position deleted."); fetchData(); }
    catch { setError("Failed to delete the uncertain tax position."); }
  };

  const handleAssessAllowance = async () => {
    if (!selectedRunId || !allowanceForm.jurisdiction || !allowanceForm.allowanceAmount) return;
    setActionLoading(true);
    try {
      const payload = {
          runId: selectedRunId,
          ...allowanceForm,
          allowanceAmount: parseFloat(allowanceForm.allowanceAmount),
        };
      if (editingAllowanceId) await client.patch(`/advanced-finance/tax-provisioning/valuation-allowances/${editingAllowanceId}`, { allowanceAmount: payload.allowanceAmount, assessmentType: payload.assessmentType, conclusion: payload.conclusion });
      else await client.post("/advanced-finance/tax-provisioning/valuation-allowances", payload);
      setSuccess(editingAllowanceId ? "Valuation allowance updated." : "Valuation allowance assessed.");
      setEditingAllowanceId("");
      setShowAllowanceForm(false);
      setAllowanceForm({
        jurisdiction: "",
        allowanceAmount: "",
        assessmentType: "MORE_LIKELY_THAN_NOT",
        conclusion: "",
      });
      fetchData();
    } catch {
      setError("Failed to assess allowance.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAllowance = async (id: string) => {
    try { const row = await client.get<ValuationAllowance>(`/advanced-finance/tax-provisioning/valuation-allowances/${id}`); setAllowanceForm({ jurisdiction: row.jurisdiction, allowanceAmount: String(row.allowanceAmount), assessmentType: row.assessmentType, conclusion: row.conclusion ?? "" }); setEditingAllowanceId(id); setShowAllowanceForm(true); }
    catch { setError("Failed to load the valuation allowance."); }
  };

  const handleViewAllowance = async (id: string) => {
    try { setInspectedRecord(await client.get<Record<string, unknown>>(`/advanced-finance/tax-provisioning/valuation-allowances/${id}`)); }
    catch { setError("Failed to load the valuation allowance."); }
  };

  const handleReviewAllowance = async (id: string) => {
    try { await client.post(`/advanced-finance/tax-provisioning/valuation-allowances/${id}/assess`, {}); setSuccess("Valuation allowance reviewed."); fetchData(); }
    catch { setError("Failed to review the valuation allowance."); }
  };

  const handleDeleteAllowance = async (id: string) => {
    if (!window.confirm("Delete this draft valuation allowance?")) return;
    try { await client.delete(`/advanced-finance/tax-provisioning/valuation-allowances/${id}`); setSuccess("Valuation allowance deleted."); fetchData(); }
    catch { setError("Failed to delete the valuation allowance."); }
  };

  const totalProvision = runs.reduce((sum, run) => sum + Number(run.totalTaxProvision || 0), 0);

  return (
    <RouteGuard permission="finance.tax-provision.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <div className="ui-title-section">
              <Calculator className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">ASC 740 Tax Provisioning</h1>
            </div>
            <p className="ui-page-subtitle">
              Manage provision runs, deferred tax schedules, uncertain tax
              positions, and valuation allowances.
            </p>
          </div>
          <div className="ui-page-actions">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="ui-alert ui-alert-error mb-4">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="ui-alert ui-alert-success mb-4">
            <Check size={16} /> {success}
          </div>
        )}

        <div className="ui-grid-3 mb-4">
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Total Provision
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {fmt(dashboard?.totalProvisionPosted ?? totalProvision)}
            </p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Provision Runs
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {dashboard?.totalRuns ?? runs.length}
            </p>
          </Card>
          <Card className="ui-card p-4">
            <h3 className="text-xs text-gray-500 uppercase font-semibold">
              Uncertain Tax Reserve
            </h3>
            <p className="text-2xl font-bold mt-1" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {dashboard ? fmt(dashboard.uncertainReserveTotal) : "—"}
            </p>
          </Card>
        </div>

        <div className="mb-4">
          <SubTabBar
            tabs={
              [
                {
                  id: "runs",
                  label: "Provision Runs",
                  href: "/finance/advanced/tax-provisioning?subtab=runs",
                  icon: Play,
                },
                {
                  id: "details",
                  label: "Jurisdiction Details",
                  href: "/finance/advanced/tax-provisioning?subtab=details",
                  icon: DollarSign,
                },
                {
                  id: "deferred",
                  label: "Deferred Tax",
                  href: "/finance/advanced/tax-provisioning?subtab=deferred",
                  icon: FileText,
                },
                {
                  id: "positions",
                  label: "Uncertain Positions",
                  href: "/finance/advanced/tax-provisioning?subtab=positions",
                  icon: Scale,
                },
                {
                  id: "allowances",
                  label: "Valuation Allowances",
                  href: "/finance/advanced/tax-provisioning?subtab=allowances",
                  icon: Shield,
                },
              ] as SubTab[]
            }
          />
        </div>

        {activeTab !== "runs" && (
          <Card className="ui-form-card mb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
              <div className="ui-form-group flex-1">
                <label className="ui-label" htmlFor="tax-provision-run">Provision run</label>
                <select
                  id="tax-provision-run"
                  className="ui-input"
                  value={selectedRunId}
                  onChange={(event) => setSelectedRunId(event.target.value)}
                >
                  <option value="">Select a provision run</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>{run.fiscalYear} · {run.period}</option>
                  ))}
                </select>
              </div>
              <Button variant="outline" onClick={handleReconcile} disabled={!selectedRunId}>
                Reconcile effective rate
              </Button>
            </div>

            {reconciliation && (
              <div className="mt-4 pt-4 border-t border-gray-100" aria-live="polite">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">Effective Rate Reconciliation</h4>
                  <span className="text-xs text-gray-500 font-medium">Run ID: {String(reconciliation.runId ?? selectedRunId)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <span className="text-xs text-gray-500 block">Effective Tax Rate</span>
                    <span className="text-lg font-bold text-gray-900" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                      {String(reconciliation.effectiveTaxRate ?? "—")}%
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <span className="text-xs text-gray-500 block">Statutory Rate</span>
                    <span className="text-lg font-bold text-gray-700" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                      {String(reconciliation.statutoryRate ?? "—")}%
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <span className="text-xs text-gray-500 block">Rate Difference</span>
                    <span className="text-lg font-bold text-blue-700" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                      {Number(reconciliation.rateDifference || 0) >= 0 ? "+" : ""}
                      {String(reconciliation.rateDifference ?? "0")}%
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-100">
                    <span className="text-xs text-gray-500 block">Total Provision</span>
                    <span className="text-lg font-bold text-gray-900" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                      {fmt(Number(reconciliation.totalTaxProvision ?? 0))}
                    </span>
                  </div>
                </div>

                {Array.isArray(reconciliation.reconciliationItems) && (reconciliation.reconciliationItems as Array<{ item: string; rate: number; taxEffect: number }>).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-gray-600 border border-gray-100 rounded">
                      <thead className="bg-gray-50 uppercase text-2xs font-semibold text-gray-500">
                        <tr>
                          <th className="px-3 py-2">Reconciliation Component</th>
                          <th className="px-3 py-2 text-right">Effective Rate (%)</th>
                          <th className="px-3 py-2 text-right">Tax Effect Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(reconciliation.reconciliationItems as Array<{ item: string; rate: number; taxEffect: number }>).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 font-medium text-gray-800">{item.item}</td>
                            <td className="px-3 py-2 text-right" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                              {Number(item.rate).toFixed(2)}%
                            </td>
                            <td className="px-3 py-2 text-right font-medium" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                              {fmt(Number(item.taxEffect))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
        {inspectedRecord && (
          <Card className="ui-card p-4 mb-4 border border-blue-100 bg-blue-50/10">
            <div className="flex justify-between items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h3 className="font-semibold text-sm text-gray-900">Record Inspection</h3>
                {inspectedRecord.id ? (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                    {String(inspectedRecord.id)}
                  </span>
                ) : null}
              </div>
              <Button variant="outline" onClick={() => setInspectedRecord(null)}>Close</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3 rounded-md border border-gray-100">
              {Object.entries(inspectedRecord).map(([key, val]) => (
                <div key={key} className="p-2 rounded bg-gray-50/80 border border-gray-100/80">
                  <span className="text-2xs uppercase tracking-wider text-gray-500 font-semibold block">{key}</span>
                  <span className="text-xs text-gray-800 font-medium break-all mt-0.5 block" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                    {val === null || val === undefined
                      ? "—"
                      : typeof val === "object"
                        ? JSON.stringify(val)
                        : typeof val === "boolean"
                          ? val ? "Yes" : "No"
                          : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "runs" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowRunForm(!showRunForm)}>
                <Plus size={16} className="mr-1" /> Create Run
              </Button>
            </div>
            {showRunForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Provision Run</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="provision-fiscal-year">Fiscal Year</label>
                    <input
                      id="provision-fiscal-year"
                      className="ui-input"
                      type="number"
                      value={runForm.fiscalYear}
                      onChange={(e: any) =>
                        setRunForm({ ...runForm, fiscalYear: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="provision-period">Period</label>
                    <input
                      id="provision-period"
                      className="ui-input"
                      placeholder="e.g. 2026-Q2"
                      value={runForm.period}
                      onChange={(e: any) =>
                        setRunForm({ ...runForm, period: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="provision-pretax-income">Pretax Income</label>
                    <input
                      id="provision-pretax-income"
                      className="ui-input"
                      type="number"
                      value={runForm.pretaxIncome}
                      onChange={(e: any) =>
                        setRunForm({ ...runForm, pretaxIncome: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label" htmlFor="provision-statutory-rate">Statutory Rate (%)</label>
                    <input id="provision-statutory-rate" className="ui-input" type="number" min="0" max="100" step="0.01"
                      value={runForm.statutoryRate}
                      onChange={(e: any) => setRunForm({ ...runForm, statutoryRate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button onClick={handleCreateRun} disabled={actionLoading}>
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    {editingRunId ? "Save" : "Create"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowRunForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "fiscalYear",
                        header: "Fiscal Year",
                        render: (v: any) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "period",
                        header: "Period",
                        render: (v: any) => String(v),
                      },
                      {
                        key: "createdAt",
                        header: "Created",
                        render: (v: any) => new Date(String(v)).toLocaleDateString(),
                      },
                      {
                        key: "totalTaxProvision",
                        header: "Provision",
                        render: (v: any) => (
                          <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v: any) => (
                          <span
                            className={`ui-badge ${v === "COMPLETED" ? "ui-badge-green" : v === "RUNNING" ? "ui-badge-blue" : "ui-badge-yellow"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v: any, row: any) => (
                          <div className="flex gap-2 flex-wrap">
                            {row.status !== "POSTED" && <button onClick={() => handleEditRun(String(v))} className="text-xs bg-gray-50 px-2 py-1 rounded">Edit</button>}
                            {row.status === "DRAFT" && <button
                              onClick={() => handleComputeProvision(String(v))}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              Compute Provision
                            </button>}
                            {row.status === "COMPUTED" && <button onClick={() => handleReviewProvision(String(v))} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Review</button>}
                            {row.status === "REVIEWED" && <button onClick={() => handlePostProvision(String(v))} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">Post</button>}
                            {row.status === "DRAFT" && <button onClick={() => handleDeleteRun(String(v))} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">Delete</button>}
                          </div>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={runs as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No provision runs"
                  emptyDescription="Create your first ASC 740 provision run."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "details" && (
          <>
            <Card className="ui-form-card mb-4">
              <h3 className="ui-form-title">Jurisdiction provision detail</h3>
              <div className="ui-form-grid">
                <div className="ui-form-group"><label className="ui-label">Jurisdiction</label><input className="ui-input" value={detailForm.jurisdiction} onChange={(event) => setDetailForm({ ...detailForm, jurisdiction: event.target.value })} /></div>
                <div className="ui-form-group"><label className="ui-label">Taxable income</label><input className="ui-input" type="number" value={detailForm.taxableIncome} onChange={(event) => setDetailForm({ ...detailForm, taxableIncome: event.target.value })} /></div>
                <div className="ui-form-group"><label className="ui-label">Tax rate (%)</label><input className="ui-input" type="number" min="0" max="100" step="0.01" value={detailForm.taxRate} onChange={(event) => setDetailForm({ ...detailForm, taxRate: event.target.value })} /></div>
              </div>
              <div className="ui-form-actions"><Button onClick={handleCreateDetail} disabled={actionLoading || !selectedRunId}>{editingDetailId ? "Save detail" : "Create detail"}</Button></div>
            </Card>
            <Card className="ui-list-card">
              <ListPageTemplate columns={[
                { key: "jurisdiction", header: "Jurisdiction" },
                { key: "taxableIncome", header: "Taxable income", render: (value: any) => fmt(Number(value)) },
                { key: "taxRate", header: "Rate", render: (value: any) => `${Number(value)}%` },
                { key: "currentTaxAmount", header: "Current tax", render: (value: any) => fmt(Number(value)) },
                { key: "filingStatus", header: "Filing status" },
                { key: "id", header: "Actions", render: (value: any) => <div className="flex gap-2"><button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleViewDetail(String(value))}>View</button><button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleEditDetail(String(value))}>Edit</button><button className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded" onClick={() => handleComputeDetail(String(value))}>Recalculate</button><button className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded" onClick={() => handleDeleteDetail(String(value))}>Delete</button></div> },
              ] as ListColumn[]} data={details as unknown as Record<string, unknown>[]} loading={false} emptyTitle="No jurisdiction details" emptyDescription="Select a run and add its jurisdiction tax details." />
            </Card>
          </>
        )}

        {activeTab === "deferred" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowScheduleForm(!showScheduleForm)}>
                <Plus size={16} className="mr-1" /> Create Deferred Schedule
              </Button>
            </div>
            {showScheduleForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Deferred Tax Schedule</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Account ID</label>
                    <input
                      className="ui-input"
                      value={scheduleForm.accountId}
                      onChange={(e: any) =>
                        setScheduleForm({
                          ...scheduleForm,
                          accountId: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Temporary Difference ($)</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={scheduleForm.temporaryDifference}
                      onChange={(e: any) =>
                        setScheduleForm({
                          ...scheduleForm,
                          temporaryDifference: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Tax Rate (%)</label>
                    <input
                      className="ui-input"
                      type="number"
                      step="0.1"
                      value={scheduleForm.taxRate}
                      onChange={(e: any) =>
                        setScheduleForm({
                          ...scheduleForm,
                          taxRate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Category</label>
                    <input
                      className="ui-input"
                      value={scheduleForm.categorization}
                      onChange={(e: any) =>
                        setScheduleForm({
                          ...scheduleForm,
                          categorization: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreateSchedule}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    {editingScheduleId ? "Save" : "Create"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowScheduleForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "accountId",
                        header: "Account",
                        render: (v: any) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "temporaryDifference",
                        header: "Temp Difference",
                        render: (v: any) => (
                          <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "taxRate",
                        header: "Rate %",
                        render: (v: any) => (
                          <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {Number(v).toFixed(1)}%
                          </span>
                        ),
                      },
                      {
                        key: "deferredTaxLiability",
                        header: "Deferred Tax",
                        render: (v: any) => (
                          <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "categorization",
                        header: "Type",
                        render: (v: any) => (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700"
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      { key: "id", header: "Actions", render: (value: any) => <div className="flex gap-2 flex-wrap"><button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleViewSchedule(String(value))}>View</button><button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleEditSchedule(String(value))}>Edit</button><button className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded" onClick={() => handleRecomputeSchedule(String(value))}>Recalculate</button><button className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded" onClick={() => handleDeleteSchedule(String(value))}>Delete</button></div> },
                    ] as ListColumn[]
                  }
                  data={schedules as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No deferred schedules"
                  emptyDescription="Create a deferred tax schedule."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "positions" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowPositionForm(!showPositionForm)}>
                <Plus size={16} className="mr-1" /> Create Uncertain Position
              </Button>
              <div className="ui-form-group"><label className="ui-label" htmlFor="position-action-amount">Reserve or settlement amount</label><input id="position-action-amount" className="ui-input" type="number" min="0" value={positionActionAmount} onChange={(event) => setPositionActionAmount(event.target.value)} /></div>
            </div>
            {showPositionForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">New Uncertain Tax Position</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Position Name</label>
                    <input
                      className="ui-input"
                      value={positionForm.positionName}
                      onChange={(e: any) =>
                        setPositionForm({
                          ...positionForm,
                          positionName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Jurisdiction</label>
                    <input
                      className="ui-input"
                      value={positionForm.jurisdiction}
                      onChange={(e: any) =>
                        setPositionForm({
                          ...positionForm,
                          jurisdiction: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Tax Amount at Risk</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={positionForm.taxAmountAtRisk}
                      onChange={(e: any) =>
                        setPositionForm({
                          ...positionForm,
                          taxAmountAtRisk: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">
                      Probability of Loss (%)
                    </label>
                    <input
                      className="ui-input"
                      type="number"
                      min="0"
                      max="100"
                      value={positionForm.probabilityOfLoss}
                      onChange={(e: any) =>
                        setPositionForm({
                          ...positionForm,
                          probabilityOfLoss: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Description</label>
                    <input className="ui-input" value={positionForm.description}
                      onChange={(e: any) => setPositionForm({ ...positionForm, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleCreatePosition}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    {editingPositionId ? "Save" : "Create"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowPositionForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "positionName",
                        header: "Position",
                        render: (v: any) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "jurisdiction",
                        header: "Jurisdiction",
                        render: (v: any) => String(v),
                      },
                      {
                        key: "taxAmountAtRisk",
                        header: "Exposure",
                        render: (v: any) => (
                          <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "probabilityOfLoss",
                        header: "Loss %",
                        render: (v: any) => (
                          <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {Number(v)}%
                          </span>
                        ),
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v: any) => (
                          <span
                            className={`ui-badge ${v === "EVALUATED" ? "ui-badge-green" : v === "UNDER_REVIEW" ? "ui-badge-yellow" : "ui-badge-gray"}`}
                          >
                            {String(v)}
                          </span>
                        ),
                      },
                      {
                        key: "id",
                        header: "Actions",
                        render: (v: any, row: any) => (
                          <div className="flex gap-2 flex-wrap">
                            <button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleViewPosition(String(v))}>View</button>
                            {row.status !== "SETTLED" && <button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleEditPosition(String(v))}>Edit</button>}
                          {row.status !== "SETTLED" && <button
                              onClick={() => handleEvaluatePosition(String(v))}
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              Evaluate
                            </button>}
                            {row.status !== "SETTLED" && <button className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded" onClick={() => handleReservePosition(String(v))}>Reserve</button>}
                            {row.status !== "SETTLED" && <button className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded" onClick={() => handleSettlePosition(String(v))}>Settle</button>}
                            {row.status === "IDENTIFIED" && <button className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded" onClick={() => handleDeletePosition(String(v))}>Delete</button>}
                          </div>
                        ),
                      },
                    ] as ListColumn[]
                  }
                  data={positions as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No uncertain positions"
                  emptyDescription="Add uncertain tax positions for evaluation."
                />
              )}
            </Card>
          </>
        )}

        {activeTab === "allowances" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => setShowAllowanceForm(!showAllowanceForm)}>
                <Plus size={16} className="mr-1" /> Assess Allowance
              </Button>
            </div>
            {showAllowanceForm && (
              <Card className="ui-form-card mb-4">
                <h3 className="ui-form-title">Assess Valuation Allowance</h3>
                <div className="ui-form-grid">
                  <div className="ui-form-group">
                    <label className="ui-label">Jurisdiction</label>
                    <input
                      className="ui-input"
                      value={allowanceForm.jurisdiction}
                      onChange={(e: any) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          jurisdiction: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Allowance Amount</label>
                    <input
                      className="ui-input"
                      type="number"
                      value={allowanceForm.allowanceAmount}
                      onChange={(e: any) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          allowanceAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Conclusion</label>
                    <input
                      className="ui-input"
                      placeholder="Why partial allowance?"
                      value={allowanceForm.conclusion}
                      onChange={(e: any) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          conclusion: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Assessment Type</label>
                    <select
                      className="ui-input"
                      value={allowanceForm.assessmentType}
                      onChange={(e: any) =>
                        setAllowanceForm({
                          ...allowanceForm,
                          assessmentType: e.target.value,
                        })
                      }
                    ><option value="MORE_LIKELY_THAN_NOT">More likely than not</option><option value="FULL">Full</option><option value="PARTIAL">Partial</option></select>
                  </div>
                </div>
                <div className="ui-form-actions">
                  <Button
                    onClick={handleAssessAllowance}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin mr-1" />
                    ) : null}{" "}
                    {editingAllowanceId ? "Save" : "Assess"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAllowanceForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            <Card className="ui-list-card">
              {loading ? (
                <div className="ui-loading">
                  <Loader2 className="animate-spin mr-2" size={20} /> Loading...
                </div>
              ) : (
                <ListPageTemplate
                  columns={
                    [
                      {
                        key: "jurisdiction",
                        header: "Jurisdiction",
                        render: (v: any) => (
                          <span className="font-medium">{String(v)}</span>
                        ),
                      },
                      {
                        key: "assessmentType",
                        header: "Assessment",
                        render: (v: any) => (
                          <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {String(v).replace(/_/g, " ")}
                          </span>
                        ),
                      },
                      {
                        key: "allowanceAmount",
                        header: "Allowance",
                        render: (v: any) => (
                          <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                            {fmt(Number(v))}
                          </span>
                        ),
                      },
                      {
                        key: "conclusion",
                        header: "Conclusion",
                        render: (v: any) => String(v) || "—",
                      },
                      {
                        key: "status",
                        header: "Status",
                        render: (v: any) => String(v),
                      },
                      { key: "id", header: "Actions", render: (value: any, row: any) => <div className="flex gap-2 flex-wrap"><button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleViewAllowance(String(value))}>View</button>{row.status === "DRAFT" && <button className="text-xs bg-gray-50 px-2 py-1 rounded" onClick={() => handleEditAllowance(String(value))}>Edit</button>}{row.status === "DRAFT" && <button className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded" onClick={() => handleReviewAllowance(String(value))}>Review</button>}{row.status === "DRAFT" && <button className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded" onClick={() => handleDeleteAllowance(String(value))}>Delete</button>}</div> },
                    ] as ListColumn[]
                  }
                  data={allowances as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No valuation allowances"
                  emptyDescription="Assess valuation allowances for deferred tax assets."
                />
              )}
            </Card>
          </>
        )}
      </div>
    </RouteGuard>
  );
}
