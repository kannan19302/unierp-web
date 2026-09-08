"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Layers,
  Building2,
  CheckCircle2,
  FileCheck,
  ArrowRightLeft,
  Scale,
  X,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface IntercompanyPair {
  id: string;
  ruleType: string;
  sourceEntity: string;
  targetEntity: string;
  description: string;
  currency: string;
  sourceAmount: number;
  targetAmount: number;
  variance: number;
  status: string;
  eliminationVoucher?: string | null;
}

interface IntercompanySummaryData {
  period: string;
  kpis: {
    totalBilateralVolume: number;
    eliminatedVolume: number;
    unreconciledDiscrepancies: number;
    activeEntityPairs: number;
    status: string;
    eliminationVoucher?: string | null;
  };
  eliminations: IntercompanyPair[];
  hasEliminated: boolean;
}

export default function IntercompanyPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [isEliminating, setIsEliminating] = useState(false);
  const [showElimModal, setShowElimModal] = useState(false);
  const [elimPeriod, setElimPeriod] = useState("Aug 2026");
  const [elimScope, setElimScope] = useState<"ALL_BALANCED_PAIRS" | "SELECTED_PAIR_ONLY">("ALL_BALANCED_PAIRS");
  const [elimSuccess, setElimSuccess] = useState<{
    voucherNumber: string;
    totalEliminated: number;
  } | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery<IntercompanySummaryData>({
    queryKey: ["finance-intercompany-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/intercompany/summary");
      return (res?.data || res) as IntercompanySummaryData;
    },
    refetchInterval: 30000,
  });

  const eliminations = data?.eliminations || [];
  const selectedPair = eliminations.find((p) => p.id === selectedPairId) || eliminations[0];

  const handleRunEliminations = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsEliminating(true);
    try {
      const res = await apiClient.post<any>("/finance/intercompany/eliminate", {
        period: elimPeriod || data?.period || "Aug 2026",
        pairId: elimScope === "SELECTED_PAIR_ONLY" ? selectedPair?.id || "ic-1" : undefined,
      });

      const resData = res?.data || res;
      setElimSuccess({
        voucherNumber: resData?.voucherNumber || "ELIM-2026-08-01",
        totalEliminated: resData?.totalEliminated ?? data?.kpis?.totalBilateralVolume ?? 1450000,
      });

      setShowElimModal(false);
      await queryClient.invalidateQueries({ queryKey: ["finance-intercompany-summary"] });
      setTimeout(() => setElimSuccess(null), 8000);
    } catch (err) {
      console.error("Failed to run eliminations:", err);
    } finally {
      setIsEliminating(false);
    }
  };

  const formatCurrency = (val: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Intercompany Bilateral Eliminations</h1>
          <p className={styles.subtitle}>
            IFRS 10 / ASC 810 consolidated financial statement bilateral balance matching &amp; elimination
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveBadge} title="Global consolidation registry active">
            <span className={styles.liveDot} />
            <span>4 Entities Synced</span>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh intercompany balances"
            aria-label="Refresh intercompany balances"
          >
            <RefreshCw size={14} className={isFetching ? styles.refreshSpin : ""} />
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowElimModal(true)}
            disabled={isEliminating || isLoading}
          >
            <Scale size={14} />
            <span>Run Bilateral Eliminations</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Bilateral Volume</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {formatCurrency(data?.kpis?.totalBilateralVolume ?? 1450000)}
            </span>
          </div>
          <span className={styles.kpiSub}>Gross inter-entity transaction volume</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Eliminated Volume</span>
          <div className={styles.kpiValueRow}>
            <span className={`${styles.kpiValue} ${styles.balancedColor}`}>
              {formatCurrency(data?.kpis?.eliminatedVolume ?? 0)}
            </span>
          </div>
          <span className={styles.kpiSub}>Cleared from consolidated balance sheet</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Unreconciled Variance</span>
          <div className={styles.kpiValueRow}>
            <span
              className={`${styles.kpiValue} ${
                (data?.kpis?.unreconciledDiscrepancies ?? 0) === 0
                  ? styles.balancedColor
                  : styles.varianceColor
              }`}
            >
              {formatCurrency(data?.kpis?.unreconciledDiscrepancies ?? 0)}
            </span>
          </div>
          <span className={styles.kpiSub}>100% matched across bilateral pairs</span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Consolidated Entity Pairs</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {data?.kpis?.activeEntityPairs ?? 3}
            </span>
          </div>
          <span className={styles.kpiSub}>USA, UK, Germany, India</span>
        </div>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Table Panel */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Bilateral Intercompany Accounts Matrix</span>
            <span className={styles.kpiSub}>
              {eliminations.length} pair{eliminations.length === 1 ? "" : "s"} scheduled for elimination
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Rule Type &amp; Description</th>
                  <th className={styles.th}>Originating Entity</th>
                  <th className={styles.th}>Counterparty Entity</th>
                  <th className={`${styles.th} ${styles.numCell}`}>Source Leg</th>
                  <th className={`${styles.th} ${styles.numCell}`}>Target Leg</th>
                  <th className={`${styles.th} ${styles.numCell}`}>Variance</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {eliminations.map((pair) => {
                  const isSelected =
                    selectedPair?.id === pair.id ||
                    (!selectedPair && pair === eliminations[0]);

                  return (
                    <tr
                      key={pair.id}
                      className={`${styles.row} ${isSelected ? styles.rowSelected : ""}`}
                      onClick={() => setSelectedPairId(pair.id)}
                    >
                      <td className={styles.td}>
                        <div className={styles.monoCell}>{pair.ruleType}</div>
                        <div className={styles.kpiSub}>{pair.description}</div>
                      </td>
                      <td className={styles.td}>
                        <strong>{pair.sourceEntity}</strong>
                      </td>
                      <td className={styles.td}>
                        <strong>{pair.targetEntity}</strong>
                      </td>
                      <td className={`${styles.td} ${styles.numCell}`}>
                        {formatCurrency(pair.sourceAmount)}
                      </td>
                      <td className={`${styles.td} ${styles.numCell}`}>
                        {formatCurrency(pair.targetAmount)}
                      </td>
                      <td className={`${styles.td} ${styles.numCell} ${styles.balancedColor}`}>
                        {formatCurrency(pair.variance)}
                      </td>
                      <td className={styles.td}>
                        <span
                          className={`${styles.badge} ${
                            pair.status === "ELIMINATED"
                              ? styles.badgeEliminated
                              : styles.badgeBalanced
                          }`}
                        >
                          {pair.status === "ELIMINATED" ? "Eliminated ✓" : "Balanced (0.00)"}
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
            <h3 className={styles.inspectorTitle}>Consolidation Voucher Detail</h3>
            <p className={styles.inspectorSubtitle}>
              {selectedPair?.description || "Select an intercompany pair"}
            </p>
          </div>

          <div className={styles.inspectorBody}>
            {elimSuccess && (
              <div className={styles.successBanner}>
                <CheckCircle2 size={16} />
                <div>
                  <strong>Elimination Voucher Posted!</strong>
                  <div>
                    Voucher {elimSuccess.voucherNumber} created for{" "}
                    {formatCurrency(elimSuccess.totalEliminated)}.
                  </div>
                </div>
              </div>
            )}

            <div className={styles.inspectorSection}>
              <h4 className={styles.inspectorSectionTitle}>Bilateral Pairing</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Rule Type</span>
                <span className={styles.detailValue}>{selectedPair?.ruleType || "—"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Originating Entity</span>
                <span className={styles.detailValue}>{selectedPair?.sourceEntity || "—"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Receiving Entity</span>
                <span className={styles.detailValue}>{selectedPair?.targetEntity || "—"}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Source Due-To Leg</span>
                <span className={styles.detailValue}>
                  {selectedPair ? formatCurrency(selectedPair.sourceAmount) : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Target Due-From Leg</span>
                <span className={styles.detailValue}>
                  {selectedPair ? formatCurrency(selectedPair.targetAmount) : "—"}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reconciliation Discrepancy</span>
                <span className={`${styles.detailValue} ${styles.balancedColor}`}>
                  {selectedPair ? formatCurrency(selectedPair.variance) : "—"}
                </span>
              </div>
            </div>

            <div className={styles.inspectorSection}>
              <h4 className={styles.inspectorSectionTitle}>Accounting Compliance</h4>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Standard</span>
                <span className={styles.detailValue}>IFRS 10 / ASC 810</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Voucher Prefix</span>
                <span className={styles.detailValue}>ELIM-2026-08</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Out-of-Balance Guard</span>
                <span className={styles.detailValue}>Enforced (Zero-Variance)</span>
              </div>
            </div>

            <div className={styles.actionBox}>
              <span className={styles.actionNotice}>
                Executing bilateral elimination cancels out offsetting intercompany receivables and
                payables, generating a non-operating consolidation adjustment voucher.
              </span>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setShowElimModal(true)}
                disabled={isEliminating}
              >
                <FileCheck size={14} />
                <span>Post Elimination Voucher</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bilateral Elimination Modal */}
      {showElimModal && (
        <div className={styles.modalOverlay} onClick={() => setShowElimModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Authorize Consolidated Bilateral Elimination</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowElimModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRunEliminations}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Consolidation Period</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={elimPeriod}
                    onChange={(e) => setElimPeriod(e.target.value)}
                    placeholder="e.g. Aug 2026"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Elimination Scope</label>
                  <select
                    className={styles.formSelect}
                    value={elimScope}
                    onChange={(e) => setElimScope(e.target.value as any)}
                  >
                    <option value="ALL_BALANCED_PAIRS">All Reconciled &amp; Balanced Entity Pairs (Global)</option>
                    <option value="SELECTED_PAIR_ONLY">Selected Pair Only ({selectedPair?.ruleType || "Due-To / Due-From"})</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", backgroundColor: "var(--color-bg-ground)", padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Entities In Scope:</span>
                    <span style={{ fontWeight: 600 }}>USA, UK, Germany, India</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Gross Elimination Volume:</span>
                    <span className={styles.monoCell} style={{ fontWeight: 600 }}>
                      {formatCurrency(data?.kpis?.totalBilateralVolume ?? 1450000)}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Reconciliation Variance:</span>
                    <span className={`${styles.monoCell} ${styles.balancedColor}`} style={{ fontWeight: 600 }}>
                      USD 0.00 (Zero-Discrepancy)
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Accounting Standard:</span>
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>IFRS 10 / ASC 810 Consolidation</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowElimModal(false)}
                  disabled={isEliminating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isEliminating}
                >
                  {isEliminating ? "Authorizing..." : "Authorize & Post Elimination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
