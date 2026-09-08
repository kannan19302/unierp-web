"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
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

  const { data, isLoading, isFetching, refetch } = useQuery<BankingSummaryData>({
    queryKey: ["finance-banking-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/banking/summary");
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
            <div className={styles.liveDot} />
            <span>Live database</span>
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

          <Link
            href="/finance/advanced/bank-feeds"
            className={styles.btnSecondary}
          >
            <Upload size={14} />
            <span>Import statement</span>
          </Link>
        </div>
      </div>

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
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Description</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Bank Amount</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Ledger Amount</th>
                  <th className={styles.th}>Match Status</th>
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
                  (data?.reconciliationRows || []).map((row) => {
                    const isSelected = (selectedTxId || matchDetail?.bankTransaction.id) === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedTxId(row.id)}
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
    </div>
  );
}
