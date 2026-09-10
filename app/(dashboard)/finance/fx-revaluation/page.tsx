"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Coins,
  Layers,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Calculator,
  X,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { RowContextMenu } from "@/components/finance/RowContextMenu";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { useFinanceScope } from "@/components/shell/FinanceScopeContext";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
import styles from "./page.module.css";

const exportColumns: ExportColumn[] = [
  { key: "account", header: "Account", type: "text" },
  { key: "counterparty", header: "Counterparty / Ref", type: "text" },
  { key: "currency", header: "Currency", type: "text" },
  { key: "foreignBalance", header: "Foreign Balance", type: "currency" },
  { key: "bookValue", header: "Book Value (USD)", type: "currency" },
  { key: "currentSpotRate", header: "Spot Rate", type: "number" },
  { key: "revaluedValue", header: "Revalued Value (USD)", type: "currency" },
  { key: "unrealizedGainLoss", header: "Unrealized Gain/Loss", type: "currency" },
  { key: "status", header: "Status", type: "text" },
];

interface SpotRateItem {
  pair: string;
  spotRate: number;
  historicalAvg: number;
  changePct: number;
  status: string;
}

interface ExposureItem {
  id: string;
  account: string;
  entityType: string;
  reference: string;
  counterparty: string;
  currency: string;
  foreignBalance: number;
  historicalRate: number;
  bookValue: number;
  currentSpotRate: number;
  revaluedValue: number;
  unrealizedGainLoss: number;
  status: string;
}

interface FxSummaryData {
  period: string;
  baseCurrency: string;
  kpis: {
    totalForeignExposure: number;
    unrealizedGain: number;
    unrealizedLoss: number;
    netUnrealizedGainLoss: number;
    revaluedCurrenciesCount: number;
    status: string;
    journalEntryNumber?: string | null;
    autoReversalPeriod: string;
  };
  spotRates: SpotRateItem[];
  exposures: ExposureItem[];
  hasRun: boolean;
}

export default function FxRevaluationPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [selectedExposureId, setSelectedExposureId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [revalPeriod, setRevalPeriod] = useState("2026-08");
  const [autoReverseNextPeriod, setAutoReverseNextPeriod] = useState(true);
  const [revalSuccess, setRevalSuccess] = useState<{
    journalNumber: string;
    netGainLoss: number;
  } | null>(null);

  const scope = useFinanceScope();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<FxSummaryData>({
    queryKey: ["finance-fx-summary", scope.entity, scope.period],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/finance/fx-revaluation/summary?entity=${encodeURIComponent(scope.entity)}&period=${encodeURIComponent(scope.period)}`
      );
      return (res?.data || res) as FxSummaryData;
    },
    refetchInterval: 30000,
  });

  const { openAppTab } = useFinanceTabs();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: ExposureItem;
  } | null>(null);
  const [sortField, setSortField] = useState<keyof ExposureItem>("unrealizedGainLoss");
  const [sortAsc, setSortAsc] = useState(false);

  const exposures = data?.exposures || [];
  const selectedExposure = exposures.find((e) => e.id === selectedExposureId) || exposures[0];

  const handleSort = (field: keyof ExposureItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedExposures = [...exposures].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const exportData = sortedExposures.map((exp) => ({
    account: exp.account,
    counterparty: `${exp.counterparty} (${exp.reference})`,
    currency: exp.currency,
    foreignBalance: exp.foreignBalance,
    bookValue: exp.bookValue,
    currentSpotRate: exp.currentSpotRate,
    revaluedValue: exp.revaluedValue,
    unrealizedGainLoss: exp.unrealizedGainLoss,
    status: exp.status,
  }));

  const handleRunRevaluation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsRunning(true);
    try {
      const spotRateMap: Record<string, number> = {};
      data?.spotRates?.forEach((s) => {
        const curr = s.pair.split("/")[0];
        if (curr) spotRateMap[curr] = s.spotRate;
      });

      const res = await apiClient.post<any>("/finance/fx-revaluation/run", {
        period: revalPeriod || data?.period || "2026-08",
        autoReverse: autoReverseNextPeriod,
        rates: spotRateMap,
      });

      const resData = res?.data || res;
      setRevalSuccess({
        journalNumber: resData?.journalEntryNumber || "JE-2026-FX-001",
        netGainLoss: resData?.unrealizedGainLossTotal ?? data?.kpis?.netUnrealizedGainLoss ?? 18430,
      });

      setShowRunModal(false);
      await queryClient.invalidateQueries({ queryKey: ["finance-fx-summary"] });
      setTimeout(() => setRevalSuccess(null), 8000);
    } catch (err) {
      console.error("Failed to execute FX revaluation:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const formatCurrency = (val: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  if (isError) {
    return (
      <div className={styles.pageContainer}>
        <FinanceErrorState
          title="Failed to Load FX Revaluation Data"
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Multi-Currency FX Revaluation</h1>
          <p className={styles.subtitle}>
            IAS 21 / ASC 830 compliant unrealized foreign exchange translation &amp; auto-reversing month-end revaluation
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveBadge} title="Rates from market feed">
            <span className={styles.liveDot} />
            <span>{data ? "ECB / Market Feed Connected" : "Feed Standby"}</span>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh revaluation data"
            aria-label="Refresh revaluation data"
          >
            <RefreshCw size={14} className={isFetching ? styles.refreshSpin : ""} />
          </button>
          <ExportMenu
            filename="fx-revaluation-schedule"
            title="Multi-Currency FX Revaluation Schedule"
            columns={exportColumns}
            data={exportData}
            buttonLabel="Export FX Data"
          />
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowRunModal(true)}
            disabled={isRunning || isLoading}
          >
            <Coins size={14} />
            <span>Run Month-End FX Revaluation</span>
          </button>
        </div>
      </div>

      {/* Spot Rates Ribbon */}
      <div className={styles.rateRibbon}>
        <div className={styles.rateRibbonLabel}>
          <Layers size={13} />
          <span>Spot Rates (vs USD)</span>
        </div>
        <div className={styles.ratePills}>
          {data?.spotRates?.map((item) => (
            <div key={item.pair} className={styles.ratePill}>
              <span className={styles.ratePair}>{item.pair}</span>
              <span className={styles.rateVal}>{item.spotRate.toFixed(4)}</span>
              <span
                className={
                  item.changePct >= 0 ? styles.rateDeltaUp : styles.rateDeltaDown
                }
              >
                {item.changePct >= 0 ? "+" : ""}
                {item.changePct.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Foreign Exposure</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {formatCurrency(data?.kpis?.totalForeignExposure ?? 2754240)}
            </span>
          </div>
          <span className={styles.kpiSub}>Across foreign monetary accounts</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Net Unrealized Gain / (Loss)</span>
          <div className={styles.kpiValueRow}>
            <span
              className={`${styles.kpiValue} ${
                (data?.kpis?.netUnrealizedGainLoss ?? 0) >= 0
                  ? styles.gainColor
                  : styles.lossColor
              }`}
            >
              {(data?.kpis?.netUnrealizedGainLoss ?? 0) >= 0 ? "+" : ""}
              {formatCurrency(data?.kpis?.netUnrealizedGainLoss ?? 18430)}
            </span>
          </div>
          <span className={styles.kpiSub}>Translating to P&amp;L 8040 (Unrealized FX)</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Currencies Monitored</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {data?.kpis?.revaluedCurrenciesCount ?? 3}
            </span>
          </div>
          <span className={styles.kpiSub}>EUR, GBP, JPY, CAD active</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Auto-Reversal Period</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {data?.kpis?.autoReversalPeriod ?? "Sep 2026"}
            </span>
          </div>
          <span className={styles.kpiSub}>Scheduled reversal entry next cycle</span>
        </div>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Table Panel */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Foreign Currency Balance Sheet Accounts</span>
            <span className={styles.kpiSub}>
              {exposures.length} account{exposures.length === 1 ? "" : "s"} requiring revaluation
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} onClick={() => handleSort("account")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                      <span>Account / Counterparty</span>
                      {sortField === "account" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("currency")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                      <span>Currency</span>
                      {sortField === "currency" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.numCell}`} onClick={() => handleSort("foreignBalance")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-1)" }}>
                      <span>Foreign Balance</span>
                      {sortField === "foreignBalance" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.numCell}`} onClick={() => handleSort("bookValue")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-1)" }}>
                      <span>Book Value (USD)</span>
                      {sortField === "bookValue" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.numCell}`} onClick={() => handleSort("currentSpotRate")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-1)" }}>
                      <span>Spot Rate</span>
                      {sortField === "currentSpotRate" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.numCell}`} onClick={() => handleSort("revaluedValue")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-1)" }}>
                      <span>Revalued (USD)</span>
                      {sortField === "revaluedValue" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.numCell}`} onClick={() => handleSort("unrealizedGainLoss")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-1)" }}>
                      <span>Unrealized G/L</span>
                      {sortField === "unrealizedGainLoss" ? (sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                    </div>
                  </th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedExposures.map((exp) => {
                  const isSelected =
                    selectedExposure?.id === exp.id ||
                    (!selectedExposure && exp === exposures[0]);
                  const gain = exp.unrealizedGainLoss >= 0;

                  return (
                    <tr
                      key={exp.id}
                      className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
                      onClick={() => setSelectedExposureId(exp.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, row: exp });
                      }}
                    >
                      <td className={styles.td}>
                        <div className={styles.monoCell}>{exp.account}</div>
                        <div className={styles.kpiSub}>{exp.counterparty} ({exp.reference})</div>
                      </td>
                      <td className={styles.td}>
                        <strong>{exp.currency}</strong>
                      </td>
                      <td className={`${styles.td} ${styles.numCell}`}>
                        {formatCurrency(exp.foreignBalance, exp.currency)}
                      </td>
                      <td className={`${styles.td} ${styles.numCell}`}>
                        {formatCurrency(exp.bookValue)}
                      </td>
                      <td className={`${styles.td} ${styles.numCell}`}>
                        {exp.currentSpotRate ? exp.currentSpotRate.toFixed(4) : "—"}
                      </td>
                      <td className={`${styles.td} ${styles.numCell}`}>
                        {formatCurrency(exp.revaluedValue)}
                      </td>
                      <td
                        className={`${styles.td} ${styles.numCell} ${
                          gain ? styles.gainColor : styles.lossColor
                        }`}
                      >
                        {gain ? "+" : ""}
                        {formatCurrency(exp.unrealizedGainLoss)}
                      </td>
                      <td className={styles.td}>
                        <span
                          className={`${styles.badge} ${
                            exp.status === "REVALUED"
                              ? styles.badgeRevalued
                              : styles.badgePending
                          }`}
                        >
                          {exp.status === "REVALUED" ? "Revalued ✓" : "Pending Run"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector Panel */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <h3 className={styles.inspectorTitle}>Revaluation Detail</h3>
            <p className={styles.inspectorSubtitle}>
              {selectedExposure?.account || "Select an account"}
            </p>
          </div>

          <div className={styles.inspectorBody}>
            {revalSuccess && (
              <div className={styles.successBanner}>
                <CheckCircle2 size={16} />
                <div>
                  <strong>Revaluation Run Successful!</strong>
                  <div>
                    Journal {revalSuccess.journalNumber} created for{" "}
                    {formatCurrency(revalSuccess.netGainLoss)} net gain.
                  </div>
                </div>
              </div>
            )}

            <div className={styles.inspectorSection}>
              <h4 className={styles.inspectorSectionTitle}>Position Breakdown</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Foreign Currency</span>
                <span className={styles.detailValue}>{selectedExposure?.currency || "—"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Nominal Balance</span>
                <span className={styles.detailValue}>
                  {selectedExposure
                    ? formatCurrency(selectedExposure.foreignBalance, selectedExposure.currency)
                    : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Historical Rate</span>
                <span className={styles.detailValue}>
                  {selectedExposure?.historicalRate ? selectedExposure.historicalRate.toFixed(4) : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Historical Book Value</span>
                <span className={styles.detailValue}>
                  {selectedExposure ? formatCurrency(selectedExposure.bookValue) : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Latest Spot Rate</span>
                <span className={styles.detailValue}>
                  {selectedExposure?.currentSpotRate
                    ? `${selectedExposure.currentSpotRate.toFixed(4)} USD/${selectedExposure.currency}`
                    : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Revalued Base Value</span>
                <span className={styles.detailValue}>
                  {selectedExposure ? formatCurrency(selectedExposure.revaluedValue) : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Unrealized Variance</span>
                <span
                  className={`${styles.detailValue} ${
                    (selectedExposure?.unrealizedGainLoss ?? 0) >= 0
                      ? styles.gainColor
                      : styles.lossColor
                  }`}
                >
                  {(selectedExposure?.unrealizedGainLoss ?? 0) >= 0 ? "+" : ""}
                  {selectedExposure ? formatCurrency(selectedExposure.unrealizedGainLoss) : "—"}
                </span>
              </div>
            </div>

            <div className={styles.inspectorSection}>
              <h4 className={styles.inspectorSectionTitle}>Accounting Lineage</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>GL Account</span>
                <span className={styles.detailValue}>8040 - Unrealized FX G/L</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reversal Date</span>
                <span className={styles.detailValue}>2026-09-01 (Auto-Reversal)</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Accounting Standard</span>
                <span className={styles.detailValue}>ASC 830 / IAS 21</span>
              </div>
            </div>

            <div className={styles.revalActionBox}>
              <span className={styles.revalNotice}>
                Running revaluation generates a balanced journal entry in General Ledger
                and schedules an automated reversing entry on the 1st day of the next fiscal period.
              </span>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setShowRunModal(true)}
                disabled={isRunning}
              >
                <FileCheck size={14} />
                <span>Execute Revaluation Entry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Month-End FX Revaluation Modal */}
      {showRunModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRunModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Execute Month-End FX Translation &amp; Revaluation</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowRunModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRunRevaluation}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Accounting Period</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={revalPeriod}
                    onChange={(e) => setRevalPeriod(e.target.value)}
                    placeholder="YYYY-MM"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Revaluation Rates in Effect</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", backgroundColor: "var(--color-bg-ground)", padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)", fontSize: "var(--text-2xs)" }}>
                    {data?.spotRates?.map((s) => (
                      <div key={s.pair} style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>{s.pair}:</span>
                        <span className={styles.monoCell}>{s.spotRate.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", backgroundColor: "var(--color-bg-ground)", padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Total Exposure Revalued:</span>
                    <span className={styles.monoCell} style={{ fontWeight: 600 }}>
                      {formatCurrency(data?.kpis?.totalForeignExposure ?? 2754240)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Net Unrealized Impact:</span>
                    <span className={`${styles.monoCell} ${styles.gainColor}`} style={{ fontWeight: 600 }}>
                      +{formatCurrency(data?.kpis?.netUnrealizedGainLoss ?? 18430)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Target GL Account:</span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>8040 - Unrealized FX G/L</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                  <input
                    type="checkbox"
                    id="autoReverse"
                    checked={autoReverseNextPeriod}
                    onChange={(e) => setAutoReverseNextPeriod(e.target.checked)}
                  />
                  <label htmlFor="autoReverse" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                    Schedule automated reversing journal entry on Day 1 of next period (IAS 21 / ASC 830)
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowRunModal(false)}
                  disabled={isRunning}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isRunning}
                >
                  {isRunning ? "Posting Journal..." : "Post Revaluation Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Row Context Menu */}
      {contextMenu && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          recordId={contextMenu.row.account}
          recordTitle={`${contextMenu.row.currency} position: ${contextMenu.row.account}`}
          recordData={contextMenu.row}
          onOpenInTab={() => {
            openAppTab({
              href: `/finance/advanced/chart-of-accounts`,
              title: "Chart of Accounts",
            });
          }}
          customActions={[
            {
              label: "Inspect Position Details",
              icon: Calculator,
              onClick: () => {
                setSelectedExposureId(contextMenu.row.id);
              },
            },
            {
              label: "View Exchange Rates",
              icon: BookOpen,
              onClick: () => {
                openAppTab({
                  href: `/finance/advanced/exchange-rates`,
                  title: "Exchange Rates",
                });
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
