"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Check,
  FileSpreadsheet,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface JournalEntryLine {
  id: string;
  entryNumber: string;
  date: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  status: string;
  reference: string;
}

interface GlSummaryData {
  kpis: {
    totalDebits: number;
    totalCredits: number;
    inBalance: boolean;
    unpostedJournals: number;
    activeAccounts: number;
  };
  entries: JournalEntryLine[];
  inspector: {
    selectedEntryNumber: string;
    status: string;
    effectiveDate: string;
    description: string;
    totalAmount: number;
    sourceDocument: string;
    sourceLineage: string;
    approvalStatus: string;
    reviewer: string;
    lines: Array<{ code: string; name: string; debit: number; credit: number }>;
  };
}

export default function GeneralLedgerPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<GlSummaryData>({
    queryKey: ["finance-gl-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/gl/summary");
      return (res?.data || res) as GlSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleApproveAndPost = async () => {
    const entryNumber = selectedEntry || data?.inspector?.selectedEntryNumber;
    if (!entryNumber) return;
    setIsPosting(true);
    try {
      await apiClient.post("/finance/gl/post-journal", { entryNumber });
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-gl-summary"] });
    } catch (err) {
      console.error("Failed to post journal entry:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const filteredEntries = (data?.entries || []).filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.entryNumber.toLowerCase().includes(q) ||
      e.accountName.toLowerCase().includes(q) ||
      e.accountCode.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const headers = ["Entry", "Date", "Account", "Description", "Debit", "Credit", "Status"];
    const rows = filteredEntries.map((entry) => [
      entry.entryNumber,
      entry.date,
      `${entry.accountCode} ${entry.accountName}`,
      entry.description,
      entry.debit.toFixed(2),
      entry.credit.toFixed(2),
      entry.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "general-ledger.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectedRow = selectedEntry
    ? (data?.entries || []).find((e) => e.entryNumber === selectedEntry)
    : null;

  const activeInspectorEntry = selectedRow
    ? {
        selectedEntryNumber: selectedRow.entryNumber,
        status: selectedRow.status,
        effectiveDate: selectedRow.date,
        description: selectedRow.description,
        totalAmount: selectedRow.debit > 0 ? selectedRow.debit : selectedRow.credit,
        sourceDocument: selectedRow.reference,
        sourceLineage: "Billing > Revenue Subledger > General Ledger",
        approvalStatus: selectedRow.status === "POSTED" ? "APPROVED" : "PENDING_APPROVAL",
        reviewer: "Finance Manager (FM)",
        lines: [
          {
            code: selectedRow.accountCode,
            name: selectedRow.accountName,
            debit: selectedRow.debit,
            credit: selectedRow.credit,
          },
        ],
      }
    : data?.inspector;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>General ledger</h1>
          <p className={styles.subtitle}>
            Review account balances, journal entries, and reconciliation status.
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
              title="Refresh ledger"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExport}
          >
            <FileSpreadsheet size={14} />
            <span>Export ledger</span>
          </button>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleApproveAndPost}
          >
            <Plus size={14} />
            <span>Post journal entry</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total debits</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : ((data?.kpis.totalDebits ?? 0) / 1e6).toFixed(2) + "M"}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total credits</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : ((data?.kpis.totalCredits ?? 0) / 1e6).toFixed(2) + "M"}
            </span>
            <span className={styles.kpiBadgeSuccess}>
              <Check size={11} /> In balance
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Unposted journals</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {isLoading ? "..." : (data?.kpis.unpostedJournals ?? 0)}
            </span>
            <span className={styles.kpiBadgeWarning}>Review required</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Active accounts</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {isLoading ? "..." : (data?.kpis.activeAccounts ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Left: Journal Entries Ledger Table */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>General Journal Entries</span>
            <div className={styles.searchBox}>
              <Search size={13} color="var(--color-text-muted)" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Filter entries or accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Entry #</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Account</th>
                  <th className={styles.th}>Description</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Debit (USD)</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Credit (USD)</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Reference</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} style={{ padding: "var(--space-2)" }}>
                        <div className={styles.skeleton} />
                      </td>
                    </tr>
                  ))
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                      No journal entries match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((row) => {
                    const isSelected = (selectedEntry || activeInspectorEntry?.selectedEntryNumber) === row.entryNumber;
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedEntry(row.entryNumber)}
                      >
                        <td className={styles.tdMono}>{row.entryNumber}</td>
                        <td className={styles.td}>{row.date}</td>
                        <td className={styles.td}>
                          <span className={styles.tdMono}>{row.accountCode}</span> {row.accountName}
                        </td>
                        <td className={styles.td}>{row.description}</td>
                        <td className={styles.tdRight}>
                          {row.debit > 0 ? row.debit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                        </td>
                        <td className={styles.tdRight}>
                          {row.credit > 0 ? row.credit.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                        </td>
                        <td className={styles.td}>
                          <span className={row.status === "POSTED" ? styles.badgePosted : styles.badgeDraft}>
                            {row.status}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.tdMono}`} style={{ color: "var(--color-text-muted)" }}>
                          {row.reference}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Journal Entry Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Journal Entry Inspector</span>
            <span className={styles.inspectorId}>
              {selectedEntry || activeInspectorEntry?.selectedEntryNumber || "No entry selected"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Status</span>
            <span className={styles.inspectorFieldValue}>
              <span className={styles.badgeDraft}>
                {activeInspectorEntry?.status || "—"}
              </span>
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Effective Date</span>
            <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`}>
              {activeInspectorEntry?.effectiveDate || "—"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Description / Memo</span>
            <span className={styles.inspectorFieldValue}>
              {activeInspectorEntry?.description || "Select a journal entry to inspect it."}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Total Amount</span>
            <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`} style={{ fontWeight: 600 }}>
              USD {(activeInspectorEntry?.totalAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Debit / Credit Distribution</span>
            <div className={styles.linesContainer}>
              {(activeInspectorEntry?.lines || []).map((line, idx) => (
                <div key={idx} className={styles.lineRow}>
                  <span className={styles.lineAccount}>
                    <span className={styles.tdMono}>{line.code}</span> {line.name}
                  </span>
                  <span className={styles.lineAmount}>
                    {line.debit > 0 ? `DR $${line.debit.toLocaleString()}` : `CR $${line.credit.toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Source Lineage</span>
            <span className={styles.inspectorFieldValue} style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>
              {activeInspectorEntry?.sourceLineage || "—"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Approval Trail</span>
            <span className={styles.inspectorFieldValue} style={{ fontSize: "var(--text-2xs)", color: "var(--color-warning)" }}>
              Pending review by Finance Manager (FM)
            </span>
          </div>

          <div className={styles.inspectorActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ flex: 1, justifyContent: "center" }}
              disabled={isPosting || !activeInspectorEntry || activeInspectorEntry.status === "POSTED"}
              onClick={handleApproveAndPost}
            >
              {isPosting ? "Posting..." : activeInspectorEntry?.status === "POSTED" ? "Posted ✓" : "Approve & post"}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => refetch()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
