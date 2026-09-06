"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  TrendingUp,
  Scale,
  ShieldCheck,
  AlertCircle,
  Plus,
  RefreshCw,
  Layers,
  Percent,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { Card, Button, Badge, DataTable, type Column } from "@kannan19302/ui";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";
import { apiGet, apiPost } from "@/lib/api";
import styles from "./page.module.css";

interface FairValueMeasurement {
  id: string;
  instrumentType: string;
  instrumentId: string;
  measurementDate: string;
  fairValue: number;
  costBasis: number;
  unrealizedGL: number;
  hierarchyLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | string;
  valuationTechnique?: string | null;
  status: string;
  notes?: string | null;
}

interface EclProvision {
  id: string;
  provisionDate: string;
  period: string;
  portfolio?: string | null;
  stage: "STAGE_1" | "STAGE_2" | "STAGE_3" | string;
  grossCarryingAmount: number;
  lossRate: number;
  previousAllowance?: number | null;
  methodology: string;
  status: string;
}

const fmtCurrency = (n: number | string | undefined | null) =>
  `$${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtPercent = (n: number | string | undefined | null) =>
  `${(Number(n || 0) * 100).toFixed(2)}%`;

const levelBadgeVariant = (level: string): "success" | "warning" | "danger" | "default" => {
  switch (level) {
    case "LEVEL_1":
      return "success";
    case "LEVEL_2":
      return "warning";
    case "LEVEL_3":
      return "danger";
    default:
      return "default";
  }
};

const stageBadgeVariant = (stage: string): "success" | "warning" | "danger" | "default" => {
  switch (stage) {
    case "STAGE_1":
      return "success";
    case "STAGE_2":
      return "warning";
    case "STAGE_3":
      return "danger";
    default:
      return "default";
  }
};

export default function FinancialInstrumentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams?.get("tab") || "fair-value") as "fair-value" | "ecl";
  const [measurements, setMeasurements] = useState<FairValueMeasurement[]>([]);
  const [provisions, setProvisions] = useState<EclProvision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showFvModal, setShowFvModal] = useState(false);
  const [showEclModal, setShowEclModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states - Fair Value
  const [fvForm, setFvForm] = useState({
    instrumentType: "FX_FORWARD",
    instrumentId: "",
    measurementDate: new Date().toISOString().substring(0, 10),
    fairValue: "",
    costBasis: "",
    hierarchyLevel: "LEVEL_2",
    valuationTechnique: "DISCOUNTED_CASH_FLOW",
    notes: "",
  });

  // Form states - ECL
  const [eclForm, setEclForm] = useState({
    provisionDate: new Date().toISOString().substring(0, 10),
    period: new Date().toISOString().substring(0, 7),
    portfolio: "TRADE_RECEIVABLES",
    stage: "STAGE_1",
    grossCarryingAmount: "",
    lossRate: "0.015",
    methodology: "PROVISION_MATRIX",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fvData, eclData] = await Promise.all([
        apiGet<FairValueMeasurement[]>(
          "/advanced-finance/financial-instruments/fair-value-measurements",
        ).catch(() => []),
        apiGet<EclProvision[]>(
          "/advanced-finance/financial-instruments/expected-credit-loss-provisions",
        ).catch(() => []),
      ]);
      setMeasurements(Array.isArray(fvData) ? fvData : []);
      setProvisions(Array.isArray(eclData) ? eclData : []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load financial instruments data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFv = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/advanced-finance/financial-instruments/fair-value-measurements", {
        ...fvForm,
        fairValue: Number(fvForm.fairValue),
        costBasis: Number(fvForm.costBasis),
      });
      setShowFvModal(false);
      setFvForm({
        instrumentType: "FX_FORWARD",
        instrumentId: "",
        measurementDate: new Date().toISOString().substring(0, 10),
        fairValue: "",
        costBasis: "",
        hierarchyLevel: "LEVEL_2",
        valuationTechnique: "DISCOUNTED_CASH_FLOW",
        notes: "",
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record fair value measurement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEcl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/advanced-finance/financial-instruments/expected-credit-loss-provisions", {
        ...eclForm,
        grossCarryingAmount: Number(eclForm.grossCarryingAmount),
        lossRate: Number(eclForm.lossRate),
      });
      setShowEclModal(false);
      setEclForm({
        provisionDate: new Date().toISOString().substring(0, 10),
        period: new Date().toISOString().substring(0, 7),
        portfolio: "TRADE_RECEIVABLES",
        stage: "STAGE_1",
        grossCarryingAmount: "",
        lossRate: "0.015",
        methodology: "PROVISION_MATRIX",
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record ECL provision");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveFv = async (id: string) => {
    try {
      await apiPost(`/advanced-finance/financial-instruments/fair-value-measurements/${id}/approve`, {});
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve measurement");
    }
  };

  // KPIs
  const totalFairValue = measurements.reduce((acc, m) => acc + Number(m.fairValue || 0), 0);
  const totalCostBasis = measurements.reduce((acc, m) => acc + Number(m.costBasis || 0), 0);
  const netUnrealizedGL = totalFairValue - totalCostBasis;
  const totalEclExposure = provisions.reduce(
    (acc, p) => acc + Number(p.grossCarryingAmount || 0),
    0,
  );
  const totalEclAllowance = provisions.reduce(
    (acc, p) => acc + Number(p.grossCarryingAmount || 0) * Number(p.lossRate || 0),
    0,
  );

  const fvColumns: Column<FairValueMeasurement>[] = [
    {
      key: "instrumentType",
      header: "Instrument Type",
      sortable: true,
      render: (m) => <span className="font-medium">{m.instrumentType}</span>,
    },
    {
      key: "instrumentId",
      header: "Instrument Ref",
      sortable: true,
      render: (m) => <span className="font-mono text-xs">{m.instrumentId}</span>,
    },
    {
      key: "hierarchyLevel",
      header: "Fair Value Level",
      sortable: true,
      render: (m) => (
        <Badge variant={levelBadgeVariant(m.hierarchyLevel)}>
          {m.hierarchyLevel.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "costBasis",
      header: "Cost Basis",
      sortable: true,
      render: (m) => (
        <span className={styles.tabularNum}>{fmtCurrency(m.costBasis)}</span>
      ),
    },
    {
      key: "fairValue",
      header: "Fair Value (MtM)",
      sortable: true,
      render: (m) => (
        <span className={styles.tabularNum}>{fmtCurrency(m.fairValue)}</span>
      ),
    },
    {
      key: "unrealizedGL",
      header: "Unrealized Gain / Loss",
      sortable: true,
      render: (m) => {
        const gl = Number(m.unrealizedGL ?? Number(m.fairValue) - Number(m.costBasis));
        const isPos = gl >= 0;
        return (
          <span
            className={styles.tabularNum}
            style={{ color: isPos ? "var(--color-success)" : "var(--color-danger)" }}
          >
            {isPos ? "+" : ""}
            {fmtCurrency(gl)}
          </span>
        );
      },
    },
    {
      key: "measurementDate",
      header: "Valuation Date",
      sortable: true,
      render: (m) => new Date(m.measurementDate).toLocaleDateString(),
    },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <Badge variant={m.status === "APPROVED" ? "success" : "default"}>
          {m.status || "DRAFT"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (m) =>
        m.status !== "APPROVED" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleApproveFv(m.id);
            }}
          >
            Approve
          </Button>
        ) : null,
    },
  ];

  const eclColumns: Column<EclProvision>[] = [
    {
      key: "period",
      header: "Fiscal Period",
      sortable: true,
      render: (p) => <span className="font-medium">{p.period}</span>,
    },
    {
      key: "portfolio",
      header: "Asset Portfolio",
      render: (p) => p.portfolio || "GENERAL",
    },
    {
      key: "stage",
      header: "Credit Stage",
      sortable: true,
      render: (p) => (
        <Badge variant={stageBadgeVariant(p.stage)}>
          {p.stage.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "grossCarryingAmount",
      header: "Gross Exposure",
      sortable: true,
      render: (p) => (
        <span className={styles.tabularNum}>
          {fmtCurrency(p.grossCarryingAmount)}
        </span>
      ),
    },
    {
      key: "lossRate",
      header: "Loss Rate",
      sortable: true,
      render: (p) => (
        <span className={styles.tabularNum}>{fmtPercent(p.lossRate)}</span>
      ),
    },
    {
      key: "provisionAmount",
      header: "ECL Allowance",
      sortable: true,
      render: (p) => {
        const allowance =
          Number(p.grossCarryingAmount || 0) * Number(p.lossRate || 0);
        return (
          <span
            className={styles.tabularNum}
            style={{ color: "var(--color-danger)" }}
          >
            {fmtCurrency(allowance)}
          </span>
        );
      },
    },
    {
      key: "methodology",
      header: "Methodology",
      render: (p) => (
        <span className="text-xs text-muted-foreground">{p.methodology}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <Badge variant={p.status === "POSTED" ? "success" : "default"}>
          {p.status || "DRAFT"}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.container} data-density="compact">
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Financial Instruments &amp; Hedging</h1>
          <p className={styles.subtitle}>
            ASC 820 / IFRS 13 Fair Value Hierarchy, Mark-to-Market Derivatives &amp; IFRS 9 ECL Provisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          {activeTab === "fair-value" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowFvModal(true)}
              className="flex items-center gap-1"
            >
              <Plus size={14} /> Record Fair Value
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEclModal(true)}
              className="flex items-center gap-1"
            >
              <Plus size={14} /> Record ECL Provision
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIcon}
            style={{ background: "rgba(79, 70, 229, 0.08)", color: "var(--color-primary)" }}
          >
            <TrendingUp size={20} />
          </div>
          <div>
            <p className={styles.kpiLabel}>Total Fair Value (MtM)</p>
            <p className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
              {fmtCurrency(totalFairValue)}
            </p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIcon}
            style={{
              background: netUnrealizedGL >= 0 ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
              color: netUnrealizedGL >= 0 ? "var(--color-success)" : "var(--color-danger)",
            }}
          >
            <Scale size={20} />
          </div>
          <div>
            <p className={styles.kpiLabel}>Net Unrealized Gain / (Loss)</p>
            <p
              className={styles.kpiValue}
              style={{
                color: netUnrealizedGL >= 0 ? "var(--color-success)" : "var(--color-danger)",
              }}
            >
              {netUnrealizedGL >= 0 ? "+" : ""}
              {fmtCurrency(netUnrealizedGL)}
            </p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIcon}
            style={{ background: "rgba(245, 158, 11, 0.08)", color: "var(--color-warning)" }}
          >
            <Layers size={20} />
          </div>
          <div>
            <p className={styles.kpiLabel}>Valued Instruments</p>
            <p className={styles.kpiValue} style={{ color: "var(--color-text-primary)" }}>
              {measurements.length} Positions
            </p>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIcon}
            style={{ background: "rgba(239, 68, 68, 0.08)", color: "var(--color-danger)" }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className={styles.kpiLabel}>ECL Credit Allowance</p>
            <p className={styles.kpiValue} style={{ color: "var(--color-danger)" }}>
              {fmtCurrency(totalEclAllowance)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <SubTabBar
        tabs={
          [
            {
              id: "fair-value",
              label: `Fair Value Measurements (${measurements.length})`,
              href: "/finance/advanced/financial-instruments?tab=fair-value",
              icon: TrendingUp,
            },
            {
              id: "ecl",
              label: `Expected Credit Loss (${provisions.length})`,
              href: "/finance/advanced/financial-instruments?tab=ecl",
              icon: ShieldCheck,
            },
          ] as SubTab[]
        }
      />

      {/* Data Table */}
      <Card className="p-4">
        {activeTab === "fair-value" ? (
          <DataTable
            columns={fvColumns}
            data={measurements}
            loading={loading}
            rowKey={(m: FairValueMeasurement) => m.id}
            emptyTitle="No fair value measurements"
            emptyMessage="No fair value measurements recorded yet. Click 'Record Fair Value' to value financial assets or derivative hedges."
            emptyIcon={<TrendingUp size={48} />}
          />
        ) : (
          <DataTable
            columns={eclColumns}
            data={provisions}
            loading={loading}
            rowKey={(p: EclProvision) => p.id}
            emptyTitle="No ECL provisions"
            emptyMessage="No ECL provisions recorded yet. Click 'Record ECL Provision' to model IFRS 9 credit impairment."
            emptyIcon={<ShieldCheck size={48} />}
          />
        )}
      </Card>

      {/* Fair Value Modal */}
      {showFvModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className="text-lg font-bold">Record Fair Value Measurement</h2>
              <button
                type="button"
                onClick={() => setShowFvModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateFv} className="space-y-4">
              <div className={styles.formGrid}>
                <div>
                  <label className="ui-label text-xs">Instrument Type</label>
                  <select
                    className="ui-input text-sm w-full"
                    value={fvForm.instrumentType}
                    onChange={(e) =>
                      setFvForm({ ...fvForm, instrumentType: e.target.value })
                    }
                    required
                  >
                    <option value="FX_FORWARD">FX Forward Contract</option>
                    <option value="INTEREST_RATE_SWAP">Interest Rate Swap</option>
                    <option value="EQUITY_SECURITY">Equity Security</option>
                    <option value="BOND_HOLDING">Corporate / Treasury Bond</option>
                    <option value="COMMODITY_FUTURES">Commodity Future</option>
                  </select>
                </div>
                <div>
                  <label className="ui-label text-xs">Instrument ID / Ticker</label>
                  <input
                    type="text"
                    className="ui-input text-sm w-full"
                    placeholder="e.g. FXF-2026-EUR-01"
                    value={fvForm.instrumentId}
                    onChange={(e) =>
                      setFvForm({ ...fvForm, instrumentId: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="ui-label text-xs">Cost Basis ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ui-input text-sm w-full"
                    placeholder="100000.00"
                    value={fvForm.costBasis}
                    onChange={(e) =>
                      setFvForm({ ...fvForm, costBasis: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="ui-label text-xs">Fair Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ui-input text-sm w-full"
                    placeholder="104500.00"
                    value={fvForm.fairValue}
                    onChange={(e) =>
                      setFvForm({ ...fvForm, fairValue: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="ui-label text-xs">ASC 820 Hierarchy</label>
                  <select
                    className="ui-input text-sm w-full"
                    value={fvForm.hierarchyLevel}
                    onChange={(e) =>
                      setFvForm({ ...fvForm, hierarchyLevel: e.target.value })
                    }
                    required
                  >
                    <option value="LEVEL_1">Level 1: Quoted Active Market</option>
                    <option value="LEVEL_2">Level 2: Observable Inputs</option>
                    <option value="LEVEL_3">Level 3: Unobservable Model</option>
                  </select>
                </div>
                <div>
                  <label className="ui-label text-xs">Measurement Date</label>
                  <input
                    type="date"
                    className="ui-input text-sm w-full"
                    value={fvForm.measurementDate}
                    onChange={(e) =>
                      setFvForm({ ...fvForm, measurementDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className={styles.fullWidth}>
                  <label className="ui-label text-xs">Valuation Technique</label>
                  <input
                    type="text"
                    className="ui-input text-sm w-full"
                    placeholder="e.g. Discounted Cash Flow / Black-Scholes"
                    value={fvForm.valuationTechnique}
                    onChange={(e) =>
                      setFvForm({ ...fvForm, valuationTechnique: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFvModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  className="flex items-center gap-1"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Save Fair Value
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ECL Modal */}
      {showEclModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className="text-lg font-bold">Record IFRS 9 ECL Provision</h2>
              <button
                type="button"
                onClick={() => setShowEclModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateEcl} className="space-y-4">
              <div className={styles.formGrid}>
                <div>
                  <label className="ui-label text-xs">Portfolio</label>
                  <select
                    className="ui-input text-sm w-full"
                    value={eclForm.portfolio}
                    onChange={(e) =>
                      setEclForm({ ...eclForm, portfolio: e.target.value })
                    }
                    required
                  >
                    <option value="TRADE_RECEIVABLES">Trade Receivables</option>
                    <option value="CONTRACT_ASSETS">Contract Assets</option>
                    <option value="INTERCOMPANY_LOANS">Intercompany Loans</option>
                    <option value="DEBT_SECURITIES">Debt Securities</option>
                  </select>
                </div>
                <div>
                  <label className="ui-label text-xs">Fiscal Period</label>
                  <input
                    type="text"
                    className="ui-input text-sm w-full"
                    placeholder="YYYY-MM"
                    value={eclForm.period}
                    onChange={(e) =>
                      setEclForm({ ...eclForm, period: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="ui-label text-xs">Credit Risk Stage</label>
                  <select
                    className="ui-input text-sm w-full"
                    value={eclForm.stage}
                    onChange={(e) =>
                      setEclForm({ ...eclForm, stage: e.target.value })
                    }
                    required
                  >
                    <option value="STAGE_1">Stage 1: 12-Month ECL</option>
                    <option value="STAGE_2">Stage 2: Lifetime ECL (Significant Increase)</option>
                    <option value="STAGE_3">Stage 3: Credit Impaired</option>
                  </select>
                </div>
                <div>
                  <label className="ui-label text-xs">Gross Carrying Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="ui-input text-sm w-full"
                    placeholder="500000.00"
                    value={eclForm.grossCarryingAmount}
                    onChange={(e) =>
                      setEclForm({ ...eclForm, grossCarryingAmount: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="ui-label text-xs">Estimated Loss Rate (0.015 = 1.5%)</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="ui-input text-sm w-full"
                    placeholder="0.015"
                    value={eclForm.lossRate}
                    onChange={(e) =>
                      setEclForm({ ...eclForm, lossRate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="ui-label text-xs">Methodology</label>
                  <select
                    className="ui-input text-sm w-full"
                    value={eclForm.methodology}
                    onChange={(e) =>
                      setEclForm({ ...eclForm, methodology: e.target.value })
                    }
                    required
                  >
                    <option value="PROVISION_MATRIX">Provision Matrix</option>
                    <option value="PD_LGD_EAD">PD x LGD x EAD Model</option>
                    <option value="DISCOUNTED_CASH_FLOW">DCF Impairment</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEclModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  className="flex items-center gap-1"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  Save ECL Provision
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
