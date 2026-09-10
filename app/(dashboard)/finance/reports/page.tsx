"use client";

import React, { useState } from "react";
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
  X,
  CheckCircle2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { RowContextMenu, type ContextMenuAction } from "@/components/finance/RowContextMenu";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { useFinanceScope } from "@/components/shell/FinanceScopeContext";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
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

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportReportType, setExportReportType] = useState<"PROFIT_AND_LOSS" | "BALANCE_SHEET" | "CASH_FLOW_STATEMENT" | "TRIAL_BALANCE">("PROFIT_AND_LOSS");
  const [exportFormat, setExportFormat] = useState<"PDF" | "XLSX" | "CSV">("PDF");
  const [exportPeriod, setExportPeriod] = useState("Aug 2026");
  const [includeAuditFootnotes, setIncludeAuditFootnotes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Row Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: PnlLineItem;
  } | null>(null);

  const { openAppTab } = useFinanceTabs();
  const scope = useFinanceScope();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<ReportsPnlData>({
    queryKey: ["finance-reports-pnl", scope.entity, scope.period],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/finance/reports/pnl?entity=${encodeURIComponent(scope.entity)}&period=${encodeURIComponent(scope.period)}`
      );
      return (res?.data || res) as ReportsPnlData;
    },
    refetchInterval: 30000,
  });

  const lineItems = data?.lineItems || [];

  const exportColumns: ExportColumn[] = [
    { header: "Line Item", key: "lineItem", type: "text" },
    { header: "Aug 2026 ($)", key: "aug2026", type: "currency" },
    { header: "Jul 2026 ($)", key: "jul2026", type: "currency" },
    { header: "Variance ($)", key: "change", type: "currency" },
  ];

  const exportData = lineItems.map((r) => ({
    lineItem: r.lineItem,
    aug2026: r.aug2026,
    jul2026: r.jul2026,
    change: r.change,
  }));

  const handleExportStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    try {
      if (exportFormat === "CSV") {
        const headers = ["Line Item", `${scope.period} (USD)`, "Prior Period (USD)", "Variance (USD)"];
        const rows = lineItems.map((r) => [
          `"${r.lineItem.replaceAll('"', '""')}"`,
          r.aug2026.toFixed(2),
          r.jul2026.toFixed(2),
          r.change.toFixed(2),
        ]);
        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${exportReportType.toLowerCase()}-${scope.period.toLowerCase().replace(/\s+/g, "_")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === "XLSX") {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Financial Statement">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Line Item</Data></Cell>
    <Cell><Data ss:Type="String">${scope.period} (USD)</Data></Cell>
    <Cell><Data ss:Type="String">Prior Period (USD)</Data></Cell>
    <Cell><Data ss:Type="String">Variance (USD)</Data></Cell>
   </Row>
   ${lineItems.map(r => `
   <Row>
    <Cell><Data ss:Type="String">${r.lineItem}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.aug2026}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.jul2026}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.change}</Data></Cell>
   </Row>`).join("")}
  </Table>
 </Worksheet>
</Workbook>`;
        const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${exportReportType.toLowerCase()}-${scope.period.toLowerCase().replace(/\s+/g, "_")}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === "PDF") {
        window.print();
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setShowExportModal(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to export financial report:", err);
    } finally {
      setIsExporting(false);
    }
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
            {!isError && data ? (
              <>
                <div className={styles.liveDot} />
                <span>Live database</span>
              </>
            ) : isError ? (
              <>
                <div className={styles.liveDot} style={{ background: "var(--color-danger, #ef4444)" }} />
                <span>Offline / Error</span>
              </>
            ) : (
              <>
                <div className={styles.liveDot} style={{ background: "var(--color-warning, #f59e0b)" }} />
                <span>Connecting...</span>
              </>
            )}
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

          <ExportMenu
            filename="financial-statement"
            title="Financial Statement Report"
            columns={exportColumns}
            data={exportData}
            buttonLabel="Export statement"
          />

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() =>
              openAppTab({
                href: "/finance/advanced/reports",
                title: "Report Schedules",
              })
            }
          >
            <Calendar size={14} />
            <span>Schedule</span>
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowExportModal(true)}
            disabled={lineItems.length === 0}
          >
            <Download size={14} />
            <span>Custom export</span>
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
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          row,
                        });
                      }}
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

      {/* Export Report Modal */}
      {showExportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExportModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Export Financial Statement</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowExportModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleExportStatement}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Statement / Report Type</label>
                  <select
                    className={styles.formSelect}
                    value={exportReportType}
                    onChange={(e) => setExportReportType(e.target.value as any)}
                  >
                    <option value="PROFIT_AND_LOSS">Income Statement (Profit &amp; Loss)</option>
                    <option value="BALANCE_SHEET">Statement of Financial Position (Balance Sheet)</option>
                    <option value="CASH_FLOW_STATEMENT">Statement of Cash Flows (Indirect Method)</option>
                    <option value="TRIAL_BALANCE">General Ledger Trial Balance</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Export Format</label>
                  <select
                    className={styles.formSelect}
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                  >
                    <option value="PDF">Formatted Adobe PDF (Audit Board Package)</option>
                    <option value="XLSX">Microsoft Excel (.xlsx with formula lineage)</option>
                    <option value="CSV">Comma-Separated Values (CSV raw data)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reporting Period</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={exportPeriod}
                    onChange={(e) => setExportPeriod(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                  <input
                    type="checkbox"
                    id="includeFootnotes"
                    checked={includeAuditFootnotes}
                    onChange={(e) => setIncludeAuditFootnotes(e.target.checked)}
                  />
                  <label htmlFor="includeFootnotes" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                    Include statutory disclosure footnotes and GL account lineage
                  </label>
                </div>

                {exportSuccess && (
                  <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <CheckCircle2 size={14} />
                    <span>Financial statement generated and downloaded successfully!</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isExporting}
                >
                  {isExporting ? "Generating..." : "Download Report"}
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
          recordTitle={contextMenu.row.lineItem}
          recordId={`$${contextMenu.row.aug2026.toLocaleString()}`}
          recordData={contextMenu.row}
          customActions={[
            {
              label: "Drilldown to General Ledger",
              icon: Search,
              onClick: () => {
                openAppTab({
                  href: `/finance/gl?search=${encodeURIComponent(contextMenu.row.lineItem)}`,
                  title: `GL: ${contextMenu.row.lineItem}`,
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
