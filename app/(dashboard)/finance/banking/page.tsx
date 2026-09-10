"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  TrendingUp,
  FileSpreadsheet,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { RowContextMenu, type ContextMenuAction } from "@/components/finance/RowContextMenu";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { useFinanceScope } from "@/components/shell/FinanceScopeContext";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
import styles from "./page.module.css";

interface BankAccountItem {
  id: string;
  name: string;
  numberMask: string;
  balance: number;
  currency: string;
  status: string;
  lastSync: string;
}

interface ReconciliationItem {
  id: string;
  date: string;
  desc: string;
  bankAmount: number;
  ledgerAmount: number;
  diff: number;
  status: string;
  matchConfidence: number;
}

interface ForecastPoint {
  week: string;
  actual: number | null;
  forecast: number;
  upper: number;
  lower: number;
}

interface BankingSummaryData {
  accounts: BankAccountItem[];
  reconciliationRows: ReconciliationItem[];
  selectedMatch: {
    bankTransaction: { id: string; date: string; desc: string; amount: number };
    ledgerRecord: { ref: string; customer: string; amount: number };
    difference: number;
    matchedSourceCount: number;
    isReconciled?: boolean;
  };
  cashForecast: ForecastPoint[];
}

export default function BankingTreasuryPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchSuccess, setMatchSuccess] = useState(false);

  // Import Statement Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importAccountId, setImportAccountId] = useState("");
  const [importFormat, setImportFormat] = useState<"OFX" | "QIF" | "CSV" | "CAMT_053">("CSV");
  const [importFilename, setImportFilename] = useState("");
  const [importStatementDate, setImportStatementDate] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Sorting & Row Context Menu
  const [sortField, setSortField] = useState<keyof ReconciliationItem>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: ReconciliationItem;
  } | null>(null);

  const { openAppTab } = useFinanceTabs();
  const scope = useFinanceScope();

  const searchParams = useSearchParams();

  // Support ?action=new deep-linking from global header and command palette
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new" || action === "import") {
      setShowImportModal(true);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching, error, refetch } = useQuery<BankingSummaryData>({
    queryKey: ["finance-banking-summary", scope.entity, scope.period],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/finance/banking/summary?entity=${encodeURIComponent(scope.entity)}&period=${encodeURIComponent(scope.period)}`
      );
      return (res?.data || res) as BankingSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleConfirmMatch = async () => {
    const txId = selectedTxId || data?.selectedMatch?.bankTransaction.id;
    if (!txId) return;
    setIsMatching(true);
    try {
      await apiClient.post("/finance/banking/reconcile", { transactionId: txId });
      setMatchSuccess(true);
      setTimeout(() => setMatchSuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-banking-summary"] });
    } catch (err) {
      console.error("Failed to reconcile bank transaction:", err);
    } finally {
      setIsMatching(false);
    }
  };

  const handleImportStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importAccountId) return;
    setIsImporting(true);
    try {
      await apiClient.post("/finance/banking/import-statement", {
        accountId: importAccountId,
        format: importFormat,
        statementDate: importStatementDate || undefined,
        filename: importFilename || undefined,
      });
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        setShowImportModal(false);
      }, 1200);
      await queryClient.invalidateQueries({ queryKey: ["finance-banking-summary"] });
    } catch (err) {
      console.error("Failed to import bank statement:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSort = (field: keyof ReconciliationItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedReconRows = [...(data?.reconciliationRows || [])].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const exportColumns: ExportColumn[] = [
    { header: "Date", key: "date", type: "date" },
    { header: "Description", key: "desc", type: "text" },
    { header: "Bank Amount ($)", key: "bankAmount", type: "currency" },
    { header: "Ledger Amount ($)", key: "ledgerAmount", type: "currency" },
    { header: "Difference ($)", key: "diff", type: "currency" },
    { header: "Confidence (%)", key: "matchConfidence", type: "number" },
    { header: "Status", key: "status", type: "text" },
  ];

  const exportData = sortedReconRows.map((r) => ({
    date: r.date,
    desc: r.desc,
    bankAmount: r.bankAmount,
    ledgerAmount: r.ledgerAmount,
    diff: r.diff,
    matchConfidence: r.matchConfidence,
    status: r.status,
  }));

  const accounts = data?.accounts || [];

  const forecast = data?.cashForecast || [];

  // SVG coordinates for forecast chart (width 800, height 140)
  const chartW = 800;
  const chartH = 140;
  const minVal = 4600000;
  const maxVal = 7000000;
  const range = maxVal - minVal;

  const getX = (idx: number) => 40 + (idx / Math.max(forecast.length - 1, 1)) * (chartW - 80);
  const getY = (val: number) => chartH - 20 - ((val - minVal) / range) * (chartH - 40);

  // Confidence polygon points
  const upperPoints = forecast.map((p, idx) => `${getX(idx)},${getY(p.upper)}`).join(" ");
  const lowerPoints = [...forecast].reverse().map((p, idx) => {
    const revIdx = forecast.length - 1 - idx;
    return `${getX(revIdx)},${getY(p.lower)}`;
  }).join(" ");
  const confidencePolygon = `${upperPoints} ${lowerPoints}`;

  // Forecast polyline
  const forecastPolyline = forecast.map((p, idx) => `${getX(idx)},${getY(p.forecast)}`).join(" ");

  const selectedRow = selectedTxId
    ? (data?.reconciliationRows || []).find((r) => r.id === selectedTxId)
    : null;

  const matchDetail = data?.selectedMatch;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Banking & treasury</h1>
          <p className={styles.subtitle}>
            Bank account reconciliations, feeds, and 13-week cash forecasting.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <div
              className={styles.liveDot}
              style={{
                background: error
                  ? "var(--color-danger)"
                  : isLoading
                  ? "var(--color-warning)"
                  : "var(--color-success)",
              }}
            />
            <span>
              {error
                ? "Connection error"
                : isLoading
                ? "Connecting..."
                : isFetching
                ? "Refreshing..."
                : "Live database"}
            </span>
            <button
              type="button"
              className={`${styles.refreshBtn} ${isFetching ? styles.refreshSpin : ""}`}
              onClick={() => refetch()}
              title="Refresh banking"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <ExportMenu
            filename="bank-reconciliations"
            title="Bank Account Reconciliations Report"
            columns={exportColumns}
            data={exportData}
            buttonLabel="Export banking"
          />

          <Link
            href="/finance/advanced/bank-feeds"
            className={styles.btnSecondary}
            onClick={(e) => {
              e.preventDefault();
              openAppTab({
                href: "/finance/advanced/bank-feeds",
                title: "Bank Feeds",
              });
            }}
          >
            <span>Import statement</span>
          </Link>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              setImportAccountId(accounts[0]?.id || "");
              setImportFilename("");
              setImportStatementDate("");
              setShowImportModal(true);
            }}
          >
            <Upload size={14} />
            <span>Quick upload</span>
          </button>
        </div>
      </div>

      {error && (
        <FinanceErrorState
          error={error}
          onRetry={() => refetch()}
          moduleName="Banking & Treasury Reconciliations"
        />
      )}

      {/* 3 Bank Account Cards */}
      <div className={styles.accountsRow}>
        {accounts.length === 0 ? (
          <div style={{ padding: "var(--space-4)", color: "var(--color-text-muted)" }}>
            No bank accounts are connected. Use Bank feeds to connect an account.
          </div>
        ) : accounts.map((acc) => (
          <div key={acc.id} className={styles.accountCard}>
            <div className={styles.accountCardHeader}>
              <span className={styles.accountName}>{acc.name}</span>
              <span className={styles.accountMask}>{acc.numberMask}</span>
            </div>

            <div className={styles.accountBalance}>
              USD {acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>

            <div className={styles.accountMeta}>
              <span className={acc.status === "LIVE" ? styles.statusLive : styles.statusDelayed}>
                <Clock size={11} /> {acc.lastSync}
              </span>
              <span>{acc.currency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Left: Bank Reconciliation Grid */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Bank Feed Reconciliation (5 of 124)</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
              As of 31 Aug 2026
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Date</span>
                      {sortField === "date" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("desc")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Description</span>
                      {sortField === "desc" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} onClick={() => handleSort("bankAmount")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                      <span>Bank Amount</span>
                      {sortField === "bankAmount" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} onClick={() => handleSort("ledgerAmount")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                      <span>Ledger Amount</span>
                      {sortField === "ledgerAmount" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Match Status</span>
                      {sortField === "status" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} style={{ padding: "var(--space-2)" }}>
                        <div className={styles.skeleton} />
                      </td>
                    </tr>
                  ))
                ) : (
                  sortedReconRows.map((row) => {
                    const isSelected = (selectedTxId || matchDetail?.bankTransaction.id) === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedTxId(row.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            row,
                          });
                        }}
                      >
                        <td className={styles.td}>{row.date}</td>
                        <td className={styles.td}>{row.desc}</td>
                        <td className={styles.tdRight}>
                          ${row.bankAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={styles.tdRight}>
                          {row.ledgerAmount !== 0 ? `$${row.ledgerAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
                        </td>
                        <td className={styles.td}>
                          <span
                            className={
                              row.status === "MATCHED"
                                ? styles.badgeReconciled
                                : row.status === "NEEDS_ENTRY"
                                ? styles.badgeNeedsEntry
                                : styles.badgeMatch
                            }
                          >
                            {row.status === "MATCHED"
                              ? "Matched ✓"
                              : row.status === "NEEDS_ENTRY"
                              ? "Needs entry"
                              : "Suggested match"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <span>Showing 1–5 of 124 transactions</span>
            <span>5 per page</span>
          </div>
        </div>

        {/* Right: Matching Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Match Inspector</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>Auto-triage</span>
          </div>

          <div className={styles.diffBox}>
            <span className={styles.diffLabel}>Difference</span>
            <span className={styles.diffAmount}>USD 0.00</span>
          </div>

          <div className={styles.matchedSourcesBox}>
            <div className={styles.sourceItem}>
              <div className={styles.sourceHeader}>
                <span>Bank Transaction</span>
                <span className={styles.tdMono}>31 Aug 2026</span>
              </div>
              <div className={styles.sourceDetail}>
                {matchDetail?.bankTransaction.desc || "Customer wire transfer - Northstar Labs"}
              </div>
              <div className={styles.tdMono} style={{ fontWeight: 600 }}>
                +$12,500.00
              </div>
            </div>

            <div style={{ height: "1px", backgroundColor: "var(--color-border-subtle)" }} />

            <div className={styles.sourceItem}>
              <div className={styles.sourceHeader}>
                <span>Matched Ledger Entry</span>
                <span className={styles.tdMono}>{matchDetail?.ledgerRecord.ref || "INV-DEMO-004"}</span>
              </div>
              <div className={styles.sourceDetail}>
                {matchDetail?.ledgerRecord.customer || "Northstar Labs"}
              </div>
              <div className={styles.tdMono} style={{ fontWeight: 600 }}>
                +$12,500.00
              </div>
            </div>
          </div>

          {(() => {
            const isAlreadyReconciled =
              matchSuccess ||
              (selectedRow ? selectedRow.status === "MATCHED" : data?.selectedMatch?.isReconciled);
            return (
              <button
                type="button"
                className={styles.btnPrimary}
                style={{ width: "100%", justifyContent: "center" }}
                disabled={isMatching || isAlreadyReconciled}
                onClick={handleConfirmMatch}
              >
                <Check size={14} />
                <span>{isMatching ? "Confirming..." : isAlreadyReconciled ? "Matched ✓" : "Confirm match"}</span>
              </button>
            );
          })()}
        </div>
      </div>

      {/* Bottom: 13-Week Cash Forecast Chart */}
      <div className={styles.forecastSection}>
        <div className={styles.forecastHeader}>
          <div>
            <span className={styles.forecastTitle}>13-Week Cash Forecast (Sep–Nov 2026)</span>
            <span className={styles.forecastSubtitle}> • Baseline actual through 31 Aug; predictive liquidity model</span>
          </div>

          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <div className={styles.boxConfidence} />
              <span>Confidence interval (P10–P90)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.lineForecast} />
              <span>Projected cash</span>
            </div>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <svg className={styles.chartSvg} viewBox={`0 0 ${chartW} ${chartH}`}>
            {/* Shaded uncertainty envelope */}
            <polygon points={confidencePolygon} fill="rgba(37, 99, 235, 0.08)" stroke="none" />

            {/* Upper bound outline */}
            <polyline
              points={upperPoints}
              fill="none"
              stroke="rgba(37, 99, 235, 0.25)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />

            {/* Lower bound outline */}
            <polyline
              points={lowerPoints}
              fill="none"
              stroke="rgba(37, 99, 235, 0.25)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />

            {/* Forecast polyline */}
            <polyline
              points={forecastPolyline}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />

            {/* Points & week labels */}
            {forecast.map((pt, idx) => {
              const x = getX(idx);
              const y = getY(pt.forecast);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="3" fill="var(--color-primary)" />
                  <text
                    x={x}
                    y={chartH - 4}
                    fontSize="9"
                    fill="var(--color-text-muted)"
                    textAnchor="middle"
                  >
                    {pt.week.slice(0, 3)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Import Statement Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Import Electronic Bank Statement</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowImportModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleImportStatement}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Bank Account</label>
                  <select
                    className={styles.formSelect}
                    value={importAccountId}
                    onChange={(e) => setImportAccountId(e.target.value)}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.numberMask}) — {acc.currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Statement format</label>
                  <select
                    className={styles.formSelect}
                    value={importFormat}
                    onChange={(e) => setImportFormat(e.target.value as any)}
                  >
                    <option value="CSV">Comma Separated Values (CSV / Excel)</option>
                    <option value="OFX">Open Financial Exchange (OFX / QFX)</option>
                    <option value="QIF">Quicken Interchange Format (QIF)</option>
                    <option value="CAMT_053">ISO 20022 XML (CAMT.053 Enterprise)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>File specification</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={importFilename}
                    onChange={(e) => setImportFilename(e.target.value)}
                    placeholder="Enter statement file identifier..."
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="import-cutoff-date">Statement cut-off date</label>
                  <input
                    id="import-cutoff-date"
                    type="date"
                    className={styles.formInput}
                    value={importStatementDate}
                    onChange={(e) => setImportStatementDate(e.target.value)}
                  />
                </div>

                {importSuccess && (
                  <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <CheckCircle2 size={14} />
                    <span>Statement ingested and staged for automated reconciliation!</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowImportModal(false)}
                  disabled={isImporting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isImporting}
                >
                  {isImporting ? "Processing feed..." : "Ingest & Reconcile"}
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
          recordId={contextMenu.row.id}
          recordTitle={`${contextMenu.row.desc} ($${contextMenu.row.bankAmount.toLocaleString()})`}
          recordData={contextMenu.row}
          onOpenInTab={() => {
            openAppTab({
              href: `/finance/advanced/bank-recon?tx=${contextMenu.row.id}`,
              title: "Bank Recon",
            });
          }}
          customActions={[
            {
              label: "Confirm Match & Reconcile",
              icon: Check,
              onClick: () => {
                setSelectedTxId(contextMenu.row.id);
                handleConfirmMatch();
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
