"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Info,
  RefreshCw,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Card, Button, Badge, DataTable, ProtectedComponent, type Column } from "@kannan19302/ui";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";
import { apiDelete, apiGet, apiPost, apiPatch } from "@/lib/api";

interface Threshold {
  id: string;
  country: string;
  state: string;
  revenueThreshold: number;
  transactionThreshold: number | null;
  measurementPeriod: string;
  isActive: boolean;
}

interface Snapshot {
  id: string;
  state: string;
  totalRevenue: number;
  transactionCount: number;
  revenueThreshold: number;
  transactionThreshold: number | null;
  revenuePct: number;
  transactionPct: number | null;
  status: "NOT_MET" | "APPROACHING" | "EXCEEDED" | "REGISTERED";
  computedAt: string;
}

interface Registration {
  id: string;
  state: string;
  status: "NOT_REGISTERED" | "PENDING" | "REGISTERED" | "DEREGISTERED";
  registrationNumber: string | null;
  filingFrequency: string | null;
  effectiveDate: string | null;
}

interface Dashboard {
  totalStatesMonitored: number;
  exceededCount: number;
  approachingCount: number;
  registeredCount: number;
  registrationsOnFile: number;
  totalRevenue: number;
  exceededStates: string[];
  approachingStates: string[];
}

const statusVariant: Record<
  string,
  "default" | "success" | "warning" | "danger"
> = {
  NOT_MET: "default",
  APPROACHING: "warning",
  EXCEEDED: "danger",
  REGISTERED: "success",
  NOT_REGISTERED: "default",
  PENDING: "warning",
  DEREGISTERED: "default",
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function EconomicNexusMonitoringPage() {
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("subtab") || "monitor") as
    | "monitor"
    | "thresholds"
    | "registrations";
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<unknown>(null);
  const [showThresholdForm, setShowThresholdForm] = useState(false);
  const [editingThresholdId, setEditingThresholdId] = useState("");
  const [thresholdForm, setThresholdForm] = useState({ state: "", revenueThreshold: "", transactionThreshold: "", measurementPeriod: "PREVIOUS_12_MONTHS" });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, snapRes, thresholdRes, regRes] = await Promise.all([
        apiGet<Dashboard>("/advanced-finance/tax/nexus/dashboard"),
        apiGet<Snapshot[]>("/advanced-finance/tax/nexus/monitor"),
        apiGet<Threshold[]>("/advanced-finance/tax/nexus/thresholds"),
        apiGet<Registration[]>("/advanced-finance/tax/nexus/registrations"),
      ]);
      setDashboard(dashRes || null);
      setSnapshots(snapRes || []);
      setThresholds(thresholdRes || []);
      setRegistrations(regRes || []);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to load nexus monitoring dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeedDefaults = async () => {
    try {
      const result = await apiPost<{ seeded: number; totalStates: number }>(
        "/advanced-finance/tax/nexus/thresholds/seed-defaults",
        {},
      );
      alert(
        `Seeded ${result.seeded} of ${result.totalStates} reference state thresholds.`,
      );
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to seed default thresholds."));
    }
  };

  const handleRefreshMonitoring = async () => {
    setRefreshing(true);
    try {
      await apiPost("/advanced-finance/tax/nexus/monitor/refresh", {});
      await loadData();
    } catch (err: unknown) {
      setError(
        errorMessage(err, "Failed to recompute nexus monitoring snapshots."),
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleRegisterState = async (state: string) => {
    try {
      const existing = registrations.find((r: any) => r.state === state);
      if (existing) {
        await apiPatch(
          `/advanced-finance/tax/nexus/registrations/${existing.id}`,
          { status: "REGISTERED" },
        );
      } else {
        await apiPost("/advanced-finance/tax/nexus/registrations", {
          state,
          status: "REGISTERED",
        });
      }
      loadData();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to register nexus for this state."));
    }
  };

  const handleSaveThreshold = async () => {
    const payload = {
      revenueThreshold: Number(thresholdForm.revenueThreshold),
      transactionThreshold: thresholdForm.transactionThreshold ? Number(thresholdForm.transactionThreshold) : null,
      measurementPeriod: thresholdForm.measurementPeriod,
    };
    try {
      if (editingThresholdId) await apiPatch(`/advanced-finance/tax/nexus/thresholds/${editingThresholdId}`, payload);
      else await apiPost("/advanced-finance/tax/nexus/thresholds", { ...payload, state: thresholdForm.state.toUpperCase() });
      setShowThresholdForm(false); setEditingThresholdId("");
      setThresholdForm({ state: "", revenueThreshold: "", transactionThreshold: "", measurementPeriod: "PREVIOUS_12_MONTHS" });
      await loadData();
    } catch (err) { setError(errorMessage(err, "Failed to save the nexus threshold.")); }
  };

  const handleEditThreshold = (threshold: Threshold) => {
    setThresholdForm({ state: threshold.state, revenueThreshold: String(threshold.revenueThreshold), transactionThreshold: threshold.transactionThreshold == null ? "" : String(threshold.transactionThreshold), measurementPeriod: threshold.measurementPeriod });
    setEditingThresholdId(threshold.id); setShowThresholdForm(true);
  };

  const handleDeleteThreshold = async (id: string) => {
    if (!window.confirm("Retire this tenant nexus threshold?")) return;
    try { await apiDelete(`/advanced-finance/tax/nexus/thresholds/${id}`); await loadData(); }
    catch (err) { setError(errorMessage(err, "Failed to delete the nexus threshold.")); }
  };

  const handleViewHistory = async (state: string) => {
    try { setDetail(await apiGet(`/advanced-finance/tax/nexus/monitor/${encodeURIComponent(state)}/history`)); }
    catch (err) { setError(errorMessage(err, "Failed to load nexus monitoring history.")); }
  };

  const handleViewRegistration = async (id: string) => {
    try { setDetail(await apiGet(`/advanced-finance/tax/nexus/registrations/${id}`)); }
    catch (err) { setError(errorMessage(err, "Failed to load the nexus registration.")); }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!window.confirm("Mark this nexus registration as deregistered?")) return;
    try { await apiDelete(`/advanced-finance/tax/nexus/registrations/${id}`); await loadData(); }
    catch (err) { setError(errorMessage(err, "Failed to delete the nexus registration.")); }
  };

  const snapshotColumns: Column<Snapshot>[] = [
    {
      key: "state",
      header: "State",
      sortable: true,
      render: (s: any) => (
        <span className="font-medium flex items-center gap-1">
          <MapPin size={12} />
          {s.state}
        </span>
      ),
    },
    {
      key: "totalRevenue",
      header: "TTM Revenue",
      sortable: true,
      render: (s: any) => (
        <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
          ${Number(s.totalRevenue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "revenueThreshold",
      header: "Threshold",
      render: (s: any) => (
        <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
          ${Number(s.revenueThreshold).toLocaleString("en-US")}
        </span>
      ),
    },
    {
      key: "revenuePct",
      header: "% of Threshold",
      sortable: true,
      render: (s: any) => (
        <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
          {Number(s.revenuePct).toFixed(1)}%
        </span>
      ),
    },
    {
      key: "transactionCount",
      header: "Transactions",
      render: (s: any) => (
        <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
          {s.transactionThreshold
            ? `${s.transactionCount} / ${s.transactionThreshold}`
            : String(s.transactionCount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s: any) => (
        <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s: any) => (
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={(event: any) => { event.stopPropagation(); handleViewHistory(s.state); }}>History</Button>
        {s.status !== "REGISTERED" && (s.status === "EXCEEDED" || s.status === "APPROACHING") && <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-1 inline-flex"
            onClick={(e: any) => {
              e.stopPropagation();
              handleRegisterState(s.state);
            }}
          >
            <ShieldCheck size={12} /> Mark Registered
          </Button>}
        </div>
      ),
    },
  ];

  const thresholdColumns: Column<Threshold>[] = [
    { key: "state", header: "State", sortable: true },
    {
      key: "revenueThreshold",
      header: "Revenue Threshold",
      render: (t: any) => `$${Number(t.revenueThreshold).toLocaleString("en-US")}`,
    },
    {
      key: "transactionThreshold",
      header: "Transaction Threshold",
      render: (t: any) =>
        t.transactionThreshold != null ? t.transactionThreshold : "None",
    },
    { key: "measurementPeriod", header: "Measurement Period" },
    {
      key: "isActive",
      header: "Active",
      render: (t: any) => (
        <Badge variant={t.isActive ? "success" : "default"}>
          {t.isActive ? "Yes" : "No"}
        </Badge>
      ),
    },
    { key: "actions", header: "Actions", align: "right", render: (threshold: any) => <div className="flex gap-2 justify-end"><Button variant="secondary" size="sm" onClick={() => handleEditThreshold(threshold)}>Edit</Button><Button variant="secondary" size="sm" onClick={() => handleDeleteThreshold(threshold.id)}>Retire</Button></div> },
  ];

  const registrationColumns: Column<Registration>[] = [
    { key: "state", header: "State", sortable: true },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
      ),
    },
    {
      key: "registrationNumber",
      header: "Registration #",
      render: (r: any) => r.registrationNumber || "—",
    },
    {
      key: "filingFrequency",
      header: "Filing Frequency",
      render: (r: any) => r.filingFrequency || "—",
    },
    {
      key: "effectiveDate",
      header: "Effective Date",
      render: (r: any) =>
        r.effectiveDate ? new Date(r.effectiveDate).toLocaleDateString() : "—",
    },
    { key: "actions", header: "Actions", align: "right", render: (registration: any) => <div className="flex gap-2 justify-end"><Button variant="secondary" size="sm" onClick={() => handleViewRegistration(registration.id)}>View</Button>{registration.status !== "DEREGISTERED" && <Button variant="secondary" size="sm" onClick={() => handleDeleteRegistration(registration.id)}>Deregister</Button>}</div> },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ui-text-primary">
            Economic Nexus Monitoring
          </h1>
          <p className="text-sm ui-text-muted mt-1">
            Trailing-12-month sales/use-tax nexus threshold tracking by state
          </p>
        </div>
        <ProtectedComponent permission="finance.tax-nexus.manage">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleSeedDefaults}>
              Seed Reference Thresholds
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleRefreshMonitoring}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />{" "}
              Recompute
            </Button>
          </div>
        </ProtectedComponent>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {detail != null && (
        <Card className="p-4 border shadow-sm">
          <div className="flex justify-between items-center gap-4 mb-3 border-b pb-2">
            <h2 className="font-semibold text-base">
              {Array.isArray(detail) ? "Historical Monitoring Snapshots" : "Nexus Registration Details"}
            </h2>
            <Button variant="secondary" size="sm" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
          {Array.isArray(detail) ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs ui-text-muted">
                    <th className="pb-2">State</th>
                    <th className="pb-2">Computed At</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Transactions</th>
                    <th className="pb-2 text-right">% of Threshold</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(detail as Snapshot[]).map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-gray-50/50">
                      <td className="py-2 font-medium">{s.state}</td>
                      <td className="py-2 ui-text-muted">
                        {s.computedAt ? new Date(s.computedAt).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 text-right font-mono">
                        ${Number(s.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {s.transactionThreshold
                          ? `${s.transactionCount} / ${s.transactionThreshold}`
                          : String(s.transactionCount || 0)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {Number(s.revenuePct || 0).toFixed(1)}%
                      </td>
                      <td className="py-2 text-center">
                        <Badge variant={statusVariant[s.status] || "default"}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : typeof detail === "object" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs ui-text-muted block">State</span>
                <span className="font-semibold">{(detail as any).state || "—"}</span>
              </div>
              <div>
                <span className="text-xs ui-text-muted block">Status</span>
                <Badge variant={statusVariant[(detail as any).status] || "default"}>
                  {(detail as any).status || "—"}
                </Badge>
              </div>
              <div>
                <span className="text-xs ui-text-muted block">Registration #</span>
                <span className="font-mono">{(detail as any).registrationNumber || "—"}</span>
              </div>
              <div>
                <span className="text-xs ui-text-muted block">Filing Frequency</span>
                <span>{(detail as any).filingFrequency || "—"}</span>
              </div>
              <div>
                <span className="text-xs ui-text-muted block">Effective Date</span>
                <span>
                  {(detail as any).effectiveDate
                    ? new Date((detail as any).effectiveDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs ui-text-muted block">Registered At</span>
                <span>
                  {(detail as any).registeredAt
                    ? new Date((detail as any).registeredAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs ui-text-muted block">Next Filing Due</span>
                <span>
                  {(detail as any).nextFilingDueDate
                    ? new Date((detail as any).nextFilingDueDate).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs ui-text-muted block">Notes</span>
                <span className="text-xs">{(detail as any).notes || "—"}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm ui-text-muted">No details available.</p>
          )}
        </Card>
      )}

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <p className="text-xs ui-text-muted">States Monitored</p>
            <p className="text-2xl font-bold ui-text-primary" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {dashboard.totalStatesMonitored}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs ui-text-muted">Exceeded (Action Needed)</p>
            <p className="text-2xl font-bold text-red-600" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {dashboard.exceededCount}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs ui-text-muted">Approaching</p>
            <p className="text-2xl font-bold text-amber-600" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {dashboard.approachingCount}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs ui-text-muted">Registered</p>
            <p className="text-2xl font-bold text-green-600" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              {dashboard.registeredCount}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs ui-text-muted">TTM Revenue Tracked</p>
            <p className="text-2xl font-bold ui-text-primary" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              $
              {dashboard.totalRevenue.toLocaleString("en-US", {
                minimumFractionDigits: 0,
              })}
            </p>
          </Card>
        </div>
      )}

      <SubTabBar
        tabs={
          [
            {
              id: "monitor",
              label: `Monitor (${snapshots.length})`,
              href: "/finance/advanced/tax-nexus?subtab=monitor",
              icon: MapPin,
            },
            {
              id: "thresholds",
              label: `Thresholds (${thresholds.length})`,
              href: "/finance/advanced/tax-nexus?subtab=thresholds",
              icon: Info,
            },
            {
              id: "registrations",
              label: `Registrations (${registrations.length})`,
              href: "/finance/advanced/tax-nexus?subtab=registrations",
              icon: ShieldCheck,
            },
          ] as SubTab[]
        }
      />

      {activeTab === "thresholds" && (
        <ProtectedComponent permission="finance.tax-nexus.manage">
          <div className="space-y-3">
            <Button variant="primary" size="sm" onClick={() => { setEditingThresholdId(""); setShowThresholdForm((visible) => !visible); }}>Create threshold</Button>
            {showThresholdForm && <Card className="p-4">
              <h2 className="font-semibold mb-3">{editingThresholdId ? "Edit" : "Create"} nexus threshold</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="text-sm">State code<input aria-label="State code" className="ui-input block mt-1" maxLength={2} disabled={Boolean(editingThresholdId)} value={thresholdForm.state} onChange={(event) => setThresholdForm({ ...thresholdForm, state: event.target.value })} /></label>
                <label className="text-sm">Revenue threshold<input aria-label="Revenue threshold" className="ui-input block mt-1" type="number" min="0" value={thresholdForm.revenueThreshold} onChange={(event) => setThresholdForm({ ...thresholdForm, revenueThreshold: event.target.value })} /></label>
                <label className="text-sm">Transaction threshold<input aria-label="Transaction threshold" className="ui-input block mt-1" type="number" min="0" value={thresholdForm.transactionThreshold} onChange={(event) => setThresholdForm({ ...thresholdForm, transactionThreshold: event.target.value })} /></label>
                <label className="text-sm">Measurement period<input aria-label="Measurement period" className="ui-input block mt-1" value={thresholdForm.measurementPeriod} onChange={(event) => setThresholdForm({ ...thresholdForm, measurementPeriod: event.target.value })} /></label>
              </div>
              <div className="flex gap-2 mt-3"><Button variant="primary" size="sm" disabled={!thresholdForm.state || !thresholdForm.revenueThreshold} onClick={handleSaveThreshold}>Save threshold</Button><Button variant="secondary" size="sm" onClick={() => setShowThresholdForm(false)}>Cancel</Button></div>
            </Card>}
          </div>
        </ProtectedComponent>
      )}

      {activeTab === "monitor" ? (
        <DataTable
          columns={snapshotColumns}
          data={snapshots}
          loading={loading}
          rowKey={(s: any) => s.id}
          emptyTitle="No monitoring snapshots yet"
          emptyMessage='Click "Recompute" to calculate trailing-12-month sales by state against configured thresholds.'
          emptyIcon={<Info size={48} />}
        />
      ) : activeTab === "thresholds" ? (
        <DataTable
          columns={thresholdColumns}
          data={thresholds}
          loading={loading}
          rowKey={(t: any) => t.id}
          emptyTitle="No thresholds configured"
          emptyMessage='Click "Seed Reference Thresholds" to load default US state economic-nexus rules.'
          emptyIcon={<Info size={48} />}
        />
      ) : (
        <DataTable
          columns={registrationColumns}
          data={registrations}
          loading={loading}
          rowKey={(r: any) => r.id}
          emptyTitle="No nexus registrations on file"
          emptyMessage="Register a state from the Monitor tab once its threshold is exceeded."
          emptyIcon={<Info size={48} />}
        />
      )}
    </div>
  );
}
