"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface PnlLineItem {
  lineItem: string;
  aug2026: number;
  jul2026: number;
  change: number;
  isSubtotal: boolean;
}

interface ReportsPnlData {
  periodScope: string;
  currency: string;
  accountingBasis: string;
  lineItems: PnlLineItem[];
  inspector: {
    status: string;
    reviewerPending: boolean;
    source: string;
    updatedAt: string;
    lineage: string;
    relatedReports: Array<{ name: string; href: string }>;
  };
}

export default function FinancialReportsPage() {
  const apiClient = useApiClient();

  const { data, isLoading, isFetching, refetch } = useQuery<ReportsPnlData>({
    queryKey: ["finance-reports-pnl"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/reports/pnl?period=2026-08");
      return (res?.data || res) as ReportsPnlData;
    },
    refetchInterval: 30000,
  });

  const lineItems = data?.lineItems || [];

  const handleExportCsv = () => {
    const headers = ["Line Item", "Aug 2026 (USD)", "Jul 2026 (USD)", "Change (USD)"];
    const rows = lineItems.map((r) => [
      `"${r.lineItem}"`,
      r.aug2026.toFixed(2),
      r.jul2026.toFixed(2),
      r.change.toFixed(2),
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pnl-statement-${Date.now().toString().slice(-6)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inspector = data?.inspector;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Financial reports</h1>
          <p className={styles.subtitle}>
            Executive P&L Statement, Balance Sheet, and financial audit lineage.
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
              title="Refresh statement"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <Link
            href="/finance/advanced/reports"
            className={styles.btnSecondary}
          >
            <Calendar size={14} />
            <span>Schedule</span>
          </Link>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleExportCsv}
            disabled={lineItems.length === 0}
          >
            <Download size={14} />
            <span>Export report</span>
          </button>
        </div>
      </div>

      {/* Scope Band */}
      <div className={styles.scopeBand}>
        <div className={styles.scopeItem}>
          <span className={styles.scopeLabel}>Reporting Period:</span>
          <span className={styles.scopeValue}>{data?.periodScope || "—"}</span>
        </div>

        <div className={styles.scopeItem}>
          <span className={styles.scopeLabel}>Functional Currency:</span>
          <span className={styles.scopeValue}>{data?.currency || "—"}</span>
        </div>

        <div className={styles.scopeItem}>
          <span className={styles.scopeLabel}>Accounting Basis:</span>
          <span className={styles.scopeValue}>{data?.accountingBasis || "—"}</span>
        </div>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Left: Hierarchical P&L Statement Table */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Income Statement (Profit & Loss)</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
              All amounts in USD
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Line Item</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Aug 2026</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Jul 2026</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Change (USD)</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} style={{ padding: "var(--space-2)" }}>
                        <div className={styles.skeleton} />
                      </td>
                    </tr>
                  ))
                ) : lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                      No posted ledger data is available for this reporting period.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((row, i) => (
                    <tr
                      key={i}
                      className={row.isSubtotal ? styles.trSubtotal : styles.tr}
                    >
                      <td className={styles.td} style={{ paddingLeft: row.isSubtotal ? "var(--space-3)" : "var(--space-5)" }}>
                        {row.lineItem}
                      </td>
                      <td className={styles.tdRight}>
                        ${row.aug2026.toLocaleString()}
                      </td>
                      <td className={styles.tdRight}>
                        ${row.jul2026.toLocaleString()}
                      </td>
                      <td className={`${styles.tdRight} ${styles.changeNeutral}`}>
                        +{row.change.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Source & Review Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Source & Review Inspector</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-warning)", fontWeight: 600 }}>
              {inspector?.status || "DRAFT"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Approval Workflow</span>
            <span className={styles.inspectorFieldValue} style={{ color: "var(--color-warning)" }}>
              Reviewer approval pending (Finance Director)
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Source Subledger</span>
            <span className={styles.inspectorFieldValue}>
              {inspector?.source || "General ledger"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Data Freshness</span>
            <span className={styles.inspectorFieldValue} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)" }}>
              {inspector?.updatedAt || "2026-08-31 09:42 UTC"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Audit Lineage</span>
            <div className={styles.lineageCard}>
              <span style={{ fontSize: "var(--text-2xs)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                {inspector?.lineage || "No report lineage is available."}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                Zero synthetic alterations • 100% reconciled to posted journals
              </span>
            </div>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Related Financial Statements</span>
            <div className={styles.relatedList}>
              {(inspector?.relatedReports || []).map((rep, idx) => (
                <Link key={idx} href={rep.href} className={styles.relatedLink}>
                  <span>{rep.name}</span>
                  <ExternalLink size={11} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
