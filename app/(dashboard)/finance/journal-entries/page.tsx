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
  RotateCcw,
  Check,
  FileSpreadsheet,
  Repeat,
  FileText,
  X,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { RowContextMenu, type ContextMenuAction } from "@/components/finance/RowContextMenu";
import { BatchActionBar, type BatchAction } from "@/components/finance/BatchActionBar";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import styles from "./page.module.css";
import { RecurringJournalsTab } from "./RecurringJournalsTab";

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

interface FormLineItem {
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export default function JournalEntriesWorkspacePage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"entries" | "recurring">("entries");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "POSTED" | "DRAFT" | "REVERSED">("ALL");
  const [selectedEntryNumber, setSelectedEntryNumber] = useState<string | null>(null);

  // New Journal Entry Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState(new Date().toISOString().slice(0, 10));
  const [createRef, setCreateRef] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createType, setCreateType] = useState<"STANDARD" | "ADJUSTING" | "CLOSING" | "REVERSING">("STANDARD");
  const [postImmediately, setPostImmediately] = useState(true);
  const [createLines, setCreateLines] = useState<FormLineItem[]>([
    { accountCode: "1010", accountName: "Operating Cash", description: "Voucher debit line", debit: 12500, credit: 0 },
    { accountCode: "4010", accountName: "Subscription Revenue", description: "Voucher credit line", debit: 0, credit: 12500 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reverse Journal Modal State
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseReason, setReverseReason] = useState("Period-end accrual reversal (ASC 250)");
  const [reverseDate, setReverseDate] = useState(new Date().toISOString().slice(0, 10));
  const [isReversing, setIsReversing] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);

  // Direct Approve & Post State
  const [isPosting, setIsPosting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Sorting & Batch Selection State
  const [sortField, setSortField] = useState<keyof JournalEntryLine>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: JournalEntryLine;
  } | null>(null);

  const { openAppTab } = useFinanceTabs();

  const { data, isLoading, isFetching, refetch } = useQuery<GlSummaryData>({
    queryKey: ["finance-gl-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/gl/summary");
      return (res?.data || res) as GlSummaryData;
    },
    refetchInterval: 30000,
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter entries
  const filteredEntries = (data?.entries || []).filter((e) => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.entryNumber.toLowerCase().includes(q) ||
      e.accountName.toLowerCase().includes(q) ||
      e.accountCode.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.reference.toLowerCase().includes(q)
    );
  });

  // Calculate totals for new entry modal
  const totalModalDebit = createLines.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);
  const totalModalCredit = createLines.reduce((acc, curr) => acc + Number(curr.credit || 0), 0);
  const modalDifference = Math.abs(totalModalDebit - totalModalCredit);
  const isModalBalanced = modalDifference < 0.01 && totalModalDebit > 0;

  // Selected row for inspector
  const activeEntryNumber = selectedEntryNumber || data?.inspector?.selectedEntryNumber || "JE-2026-0842";
  const selectedEntries = (data?.entries || []).filter((e) => e.entryNumber === activeEntryNumber);
  const firstSelected = selectedEntries[0];

  const activeInspector = firstSelected
    ? {
        selectedEntryNumber: firstSelected.entryNumber,
        status: firstSelected.status,
        effectiveDate: firstSelected.date,
        description: firstSelected.description,
        totalAmount: selectedEntries.reduce((sum, item) => sum + Math.max(item.debit, item.credit), 0),
        sourceDocument: firstSelected.reference,
        sourceLineage: "Accounting > General Journal > General Ledger",
        approvalStatus: firstSelected.status === "POSTED" ? "APPROVED" : firstSelected.status === "REVERSED" ? "REVERSED" : "PENDING_APPROVAL",
        reviewer: "Finance Controller (FC)",
        lines: selectedEntries.map((item) => ({
          code: item.accountCode,
          name: item.accountName,
          debit: item.debit,
          credit: item.credit,
        })),
      }
    : data?.inspector;

  // Handle Approve and Post
  const handleApproveAndPost = async () => {
    const entryNumber = activeInspector?.selectedEntryNumber;
    if (!entryNumber) return;
    setIsPosting(true);
    try {
      await apiClient.post("/finance/gl/post-journal", { entryNumber });
      showToast(`Journal voucher ${entryNumber} has been approved and posted.`);
      await queryClient.invalidateQueries({ queryKey: ["finance-gl-summary"] });
    } catch (err: any) {
      showToast(err?.message || "Failed to post journal voucher.");
    } finally {
      setIsPosting(false);
    }
  };

  // Handle Reverse Journal Submit
  const handleReverseJournalSubmit = async () => {
    const entryNumber = activeInspector?.selectedEntryNumber;
    if (!entryNumber) return;
    setIsReversing(true);
    setReverseError(null);
    try {
      await apiClient.post("/finance/gl/reverse-journal", {
        entryNumber,
        reason: reverseReason,
        reversalDate: reverseDate,
      });
      setShowReverseModal(false);
      showToast(`Journal ${entryNumber} reversed. Reversal voucher generated.`);
      await queryClient.invalidateQueries({ queryKey: ["finance-gl-summary"] });
    } catch (err: any) {
      setReverseError(err?.message || "Failed to reverse journal voucher.");
    } finally {
      setIsReversing(false);
    }
  };

  // Handle Create Journal Submit
  const handleCreateJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isModalBalanced) {
      setCreateError(`Journal voucher is out of balance by $${modalDifference.toFixed(2)}. Total debits must equal credits.`);
      return;
    }
    setIsSubmitting(true);
    setCreateError(null);
    try {
      await apiClient.post("/finance/gl/create-journal", {
        date: createDate,
        reference: createRef || undefined,
        description: createDescription || "Manual general journal entry",
        journalType: createType,
        postImmediately,
        lines: createLines,
      });
      setShowCreateModal(false);
      showToast(`New journal entry created and ${postImmediately ? "posted to GL" : "saved as draft"}.`);
      await queryClient.invalidateQueries({ queryKey: ["finance-gl-summary"] });
      // Reset form
      setCreateDescription("");
      setCreateRef("");
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create journal voucher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Column Sorting
  const handleSort = (field: keyof JournalEntryLine) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedRows.size === sortedEntries.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedEntries.map((e) => e.entryNumber)));
    }
  };

  const toggleSelectRow = (entryNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRows);
    if (next.has(entryNumber)) {
      next.delete(entryNumber);
    } else {
      next.add(entryNumber);
    }
    setSelectedRows(next);
  };

  // Export Columns Configuration
  const exportColumns: ExportColumn[] = [
    { header: "Voucher #", key: "entryNumber", type: "text" },
    { header: "Date", key: "date", type: "date" },
    { header: "Account Code", key: "accountCode", type: "text" },
    { header: "Account Name", key: "accountName", type: "text" },
    { header: "Description", key: "description", type: "text" },
    { header: "Debit ($)", key: "debit", type: "currency" },
    { header: "Credit ($)", key: "credit", type: "currency" },
    { header: "Status", key: "status", type: "text" },
    { header: "Reference", key: "reference", type: "text" },
  ];

  const exportData = sortedEntries.map((e) => ({
    entryNumber: e.entryNumber,
    date: e.date,
    accountCode: e.accountCode,
    accountName: e.accountName,
    description: e.description,
    debit: e.debit,
    credit: e.credit,
    status: e.status,
    reference: e.reference || "—",
  }));

  // Batch actions
  const batchActions: BatchAction[] = [
    {
      label: "Batch Approve & Post",
      icon: Check,
      variant: "primary",
      onClick: async () => {
        const count = selectedRows.size;
        for (const entryNumber of selectedRows) {
          try {
            await apiClient.post("/finance/gl/post-journal", { entryNumber });
          } catch {}
        }
        showToast(`${count} journal entries processed for approval and posting.`);
        setSelectedRows(new Set());
        await queryClient.invalidateQueries({ queryKey: ["finance-gl-summary"] });
      },
    },
    {
      label: "Export Selected",
      icon: FileSpreadsheet,
      variant: "secondary",
      onClick: () => {
        showToast(`Exporting ${selectedRows.size} selected journal vouchers.`);
      },
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Journal entries</h1>
          <p className={styles.subtitle}>
            Audit, post, and reverse double-entry accounting vouchers and recurring schedules.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <div className={styles.liveDot} />
            <span>Live ledger</span>
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

          <ExportMenu
            filename="journal-entries"
            title="General Journal Entries Report"
            columns={exportColumns}
            data={exportData}
            buttonLabel="Export journals"
          />

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} />
            <span>New journal entry</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={styles.balanceCheckStrip} style={{ borderColor: "var(--color-primary)", backgroundColor: "var(--color-bg-surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <CheckCircle2 size={16} color="var(--color-primary)" />
            <span style={{ fontWeight: 500 }}>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "entries" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("entries")}
        >
          <FileText size={14} />
          <span>Journal Vouchers</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "recurring" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("recurring")}
        >
          <Repeat size={14} />
          <span>Recurring Templates</span>
        </button>
      </div>

      {/* Tab Content: Recurring */}
      {activeTab === "recurring" ? (
        <RecurringJournalsTab />
      ) : (
        <>
          {/* KPI Strip */}
          <div className={styles.kpiStrip}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Total Debits</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  USD {isLoading ? "..." : ((data?.kpis.totalDebits ?? 0) / 1e6).toFixed(2) + "M"}
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Total Credits</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  USD {isLoading ? "..." : ((data?.kpis.totalCredits ?? 0) / 1e6).toFixed(2) + "M"}
                </span>
                <span className={styles.kpiBadgeSuccess}>
                  <Check size={11} /> Balanced
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Pending Review</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {isLoading ? "..." : (data?.kpis.unpostedJournals ?? 0)}
                </span>
                <span className={styles.kpiBadgeWarning}>Action needed</span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Active Accounts</span>
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
                <span className={styles.panelTitle}>
                  General Journal Ledger ({filteredEntries.length} lines)
                </span>
                <div className={styles.filterGroup}>
                  <div className={styles.statusFilter}>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${statusFilter === "ALL" ? styles.statusBtnActive : ""}`}
                      onClick={() => setStatusFilter("ALL")}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${statusFilter === "POSTED" ? styles.statusBtnActive : ""}`}
                      onClick={() => setStatusFilter("POSTED")}
                    >
                      Posted
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${statusFilter === "DRAFT" ? styles.statusBtnActive : ""}`}
                      onClick={() => setStatusFilter("DRAFT")}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      className={`${styles.statusBtn} ${statusFilter === "REVERSED" ? styles.statusBtnActive : ""}`}
                      onClick={() => setStatusFilter("REVERSED")}
                    >
                      Reversed
                    </button>
                  </div>

                  <div className={styles.searchBox}>
                    <Search size={13} color="var(--color-text-secondary)" />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Filter entry #, account, or ref..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: "2rem", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.size > 0 && selectedRows.size === sortedEntries.length}
                          onChange={toggleSelectAll}
                          aria-label="Select all vouchers"
                        />
                      </th>
                      <th onClick={() => handleSort("entryNumber")} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span>Voucher #</span>
                          {sortField === "entryNumber" ? (
                            sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                          ) : (
                            <ArrowUpDown size={11} color="var(--color-text-muted)" />
                          )}
                        </div>
                      </th>
                      <th onClick={() => handleSort("date")} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span>Date</span>
                          {sortField === "date" ? (
                            sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                          ) : (
                            <ArrowUpDown size={11} color="var(--color-text-muted)" />
                          )}
                        </div>
                      </th>
                      <th onClick={() => handleSort("accountCode")} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span>Account</span>
                          {sortField === "accountCode" ? (
                            sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                          ) : (
                            <ArrowUpDown size={11} color="var(--color-text-muted)" />
                          )}
                        </div>
                      </th>
                      <th>Description</th>
                      <th className={styles.textRight} onClick={() => handleSort("debit")} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                          <span>Debit</span>
                          {sortField === "debit" ? (
                            sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                          ) : (
                            <ArrowUpDown size={11} color="var(--color-text-muted)" />
                          )}
                        </div>
                      </th>
                      <th className={styles.textRight} onClick={() => handleSort("credit")} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                          <span>Credit</span>
                          {sortField === "credit" ? (
                            sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                          ) : (
                            <ArrowUpDown size={11} color="var(--color-text-muted)" />
                          )}
                        </div>
                      </th>
                      <th onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span>Status</span>
                          {sortField === "status" ? (
                            sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                          ) : (
                            <ArrowUpDown size={11} color="var(--color-text-muted)" />
                          )}
                        </div>
                      </th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((row, idx) => {
                      const isSelected = row.entryNumber === activeInspector?.selectedEntryNumber;
                      const isChecked = selectedRows.has(row.entryNumber);
                      return (
                        <tr
                          key={`${row.id || row.entryNumber}-${idx}`}
                          className={`${isSelected ? styles.rowSelected : ""} ${isChecked ? styles.rowChecked : ""}`}
                          onClick={() => setSelectedEntryNumber(row.entryNumber)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              row,
                            });
                          }}
                        >
                          <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleSelectRow(row.entryNumber, e as any)}
                              aria-label={`Select voucher ${row.entryNumber}`}
                            />
                          </td>
                          <td className={styles.tdMono}>{row.entryNumber}</td>
                          <td className={styles.tdMono}>{row.date}</td>
                          <td>
                            <span className={styles.tdMono}>{row.accountCode}</span>{" "}
                            <span>{row.accountName}</span>
                          </td>
                          <td style={{ maxWidth: "13.75rem", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row.description}
                          </td>
                          <td className={`${styles.textRight} ${styles.tdMono}`}>
                            {row.debit > 0 ? `$${row.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className={`${styles.textRight} ${styles.tdMono}`}>
                            {row.credit > 0 ? `$${row.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td>
                            {row.status === "POSTED" ? (
                              <span className={styles.badgePosted}>
                                <Check size={10} /> Posted
                              </span>
                            ) : row.status === "REVERSED" ? (
                              <span className={styles.badgeReversed}>
                                <RotateCcw size={10} /> Reversed
                              </span>
                            ) : (
                              <span className={styles.badgeDraft}>Draft</span>
                            )}
                          </td>
                          <td className={styles.tdMono}>{row.reference || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Inspector Panel */}
            <div className={styles.inspectorPanel}>
              <div className={styles.inspectorHeader}>
                <div>
                  <h2 className={styles.inspectorTitle}>Journal Voucher Details</h2>
                  <p className={styles.inspectorSubtitle}>
                    Double-entry distribution & audit lineage
                  </p>
                </div>
                {activeInspector?.status === "POSTED" ? (
                  <span className={styles.badgePosted}>
                    <Check size={10} /> Posted
                  </span>
                ) : activeInspector?.status === "REVERSED" ? (
                  <span className={styles.badgeReversed}>
                    <RotateCcw size={10} /> Reversed
                  </span>
                ) : (
                  <span className={styles.badgeDraft}>Draft Voucher</span>
                )}
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Voucher Number</span>
                <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`} style={{ fontWeight: 600 }}>
                  {activeInspector?.selectedEntryNumber || "—"}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Effective Date</span>
                <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`}>
                  {activeInspector?.effectiveDate || "—"}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Memo / Description</span>
                <span className={styles.inspectorFieldValue}>
                  {activeInspector?.description || "Select a journal entry to inspect."}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Total Amount</span>
                <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`} style={{ fontWeight: 600 }}>
                  USD {(activeInspector?.totalAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Source Document</span>
                <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`}>
                  {activeInspector?.sourceDocument || "Manual Entry"}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Debit / Credit Breakdown</span>
                <div className={styles.linesContainer}>
                  {(activeInspector?.lines || []).map((line, idx) => (
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
                  {activeInspector?.sourceLineage || "Direct Journal Voucher Entry"}
                </span>
              </div>

              <div className={styles.inspectorActions}>
                {activeInspector?.status === "DRAFT" && (
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    style={{ justifyContent: "center" }}
                    disabled={isPosting}
                    onClick={handleApproveAndPost}
                  >
                    {isPosting ? "Posting..." : "Approve & Post to GL"}
                  </button>
                )}

                {activeInspector?.status === "POSTED" && (
                  <button
                    type="button"
                    className={styles.btnDanger}
                    style={{ justifyContent: "center" }}
                    onClick={() => setShowReverseModal(true)}
                  >
                    <RotateCcw size={13} />
                    <span>Reverse Journal Voucher</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{ justifyContent: "center" }}
                  onClick={() => refetch()}
                >
                  <RefreshCw size={13} />
                  <span>Refresh Ledger</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL: New Journal Entry */}
      {showCreateModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Journal Entry</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateJournalSubmit}>
              <div className={styles.modalBody}>
                {createError && (
                  <div className={styles.balanceCheckStrip} style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <AlertCircle size={15} />
                      <span>{createError}</span>
                    </div>
                  </div>
                )}

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Effective Date</label>
                    <input
                      type="date"
                      className={styles.formInput}
                      value={createDate}
                      onChange={(e) => setCreateDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reference / Doc #</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. PO-2026-0981 or INV-ADJ"
                      value={createRef}
                      onChange={(e) => setCreateRef(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Voucher Type</label>
                    <select
                      className={styles.formInput}
                      value={createType}
                      onChange={(e) => setCreateType(e.target.value as any)}
                    >
                      <option value="STANDARD">Standard General Journal</option>
                      <option value="ADJUSTING">Period-End Adjusting Entry</option>
                      <option value="CLOSING">Closing Entry</option>
                      <option value="REVERSING">Auto-Reversing Accrual</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Posting Action</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", height: "100%" }}>
                      <input
                        type="checkbox"
                        id="postImm"
                        checked={postImmediately}
                        onChange={(e) => setPostImmediately(e.target.checked)}
                      />
                      <label htmlFor="postImm" style={{ fontSize: "var(--text-xs)", cursor: "pointer" }}>
                        Post immediately to General Ledger
                      </label>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Memo / Description</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Provide a business rationale for this entry..."
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Line Items Section */}
                <div className={styles.linesSection}>
                  <div className={styles.linesHeader}>
                    <span className={styles.formLabel} style={{ fontWeight: 600 }}>
                      Double-Entry Distribution Lines
                    </span>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ padding: "var(--space-half) var(--space-2)", fontSize: "var(--text-2xs)" }}
                      onClick={() =>
                        setCreateLines([
                          ...createLines,
                          { accountCode: "6010", accountName: "Operating Expense", description: "", debit: 0, credit: 0 },
                        ])
                      }
                    >
                      <Plus size={12} /> Add line
                    </button>
                  </div>

                  <table className={styles.linesTable}>
                    <thead>
                      <tr>
                        <th style={{ width: "25%" }}>Account Code</th>
                        <th style={{ width: "35%" }}>Account Name</th>
                        <th style={{ width: "18%" }}>Debit ($)</th>
                        <th style={{ width: "18%" }}>Credit ($)</th>
                        <th style={{ width: "4%" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {createLines.map((line, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="text"
                              className={styles.formInput}
                              value={line.accountCode}
                              onChange={(e) => {
                                const next = [...createLines];
                                next[idx].accountCode = e.target.value;
                                setCreateLines(next);
                              }}
                              placeholder="e.g. 1010"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className={styles.formInput}
                              value={line.accountName}
                              onChange={(e) => {
                                const next = [...createLines];
                                next[idx].accountName = e.target.value;
                                setCreateLines(next);
                              }}
                              placeholder="Account title"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className={styles.formInput}
                              value={line.debit || ""}
                              onChange={(e) => {
                                const next = [...createLines];
                                next[idx].debit = parseFloat(e.target.value) || 0;
                                setCreateLines(next);
                              }}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              className={styles.formInput}
                              value={line.credit || ""}
                              onChange={(e) => {
                                const next = [...createLines];
                                next[idx].credit = parseFloat(e.target.value) || 0;
                                setCreateLines(next);
                              }}
                              placeholder="0.00"
                            />
                          </td>
                          <td>
                            {createLines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setCreateLines(createLines.filter((_, i) => i !== idx))}
                                style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer" }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Balance Check Strip */}
                  <div className={styles.balanceCheckStrip}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      {isModalBalanced ? (
                        <>
                          <CheckCircle2 size={16} color="var(--color-success)" />
                          <span style={{ color: "var(--color-success)", fontWeight: 500 }}>
                            Voucher is balanced (IAS 1 / US GAAP)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} color="var(--color-warning)" />
                          <span style={{ color: "var(--color-warning)", fontWeight: 500 }}>
                            Out of balance: ${modalDifference.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className={styles.balanceAmounts}>
                      <span>Debits: ${totalModalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      <span>Credits: ${totalModalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isSubmitting || !isModalBalanced}
                >
                  {isSubmitting ? "Submitting..." : postImmediately ? "Post Journal Voucher" : "Save as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reverse Journal Entry */}
      {showReverseModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog} style={{ maxWidth: 520 }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Reverse Journal Voucher</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowReverseModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {reverseError && (
                <div className={styles.balanceCheckStrip} style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <AlertCircle size={15} />
                    <span>{reverseError}</span>
                  </div>
                </div>
              )}

              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                This action will mark journal voucher <strong>{activeInspector?.selectedEntryNumber}</strong> as{" "}
                <span className={styles.badgeReversed}>REVERSED</span> and automatically generate a compensating
                reversal voucher (REV-{activeInspector?.selectedEntryNumber}) reversing all debit and credit lines.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reversal Effective Date</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={reverseDate}
                  onChange={(e) => setReverseDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reversal Reason / Memo</label>
                <textarea
                  className={styles.formInput}
                  rows={3}
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowReverseModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                disabled={isReversing}
                onClick={handleReverseJournalSubmit}
              >
                {isReversing ? "Reversing..." : "Confirm & Post Reversal"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Row Context Menu */}
      {contextMenu && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          recordId={contextMenu.row.entryNumber}
          recordTitle={`${contextMenu.row.accountName} (${contextMenu.row.accountCode})`}
          recordData={contextMenu.row}
          onOpenInTab={() => {
            openAppTab({
              href: `/finance/journal-entries?entry=${contextMenu.row.entryNumber}`,
              title: contextMenu.row.entryNumber,
            });
            setSelectedEntryNumber(contextMenu.row.entryNumber);
          }}
          customActions={[
            ...(contextMenu.row.status === "DRAFT"
              ? [
                  {
                    label: "Approve & Post Voucher",
                    icon: Check,
                    onClick: async () => {
                      try {
                        await apiClient.post("/finance/gl/post-journal", {
                          entryNumber: contextMenu.row.entryNumber,
                        });
                        showToast(`Journal ${contextMenu.row.entryNumber} approved and posted.`);
                        await queryClient.invalidateQueries({ queryKey: ["finance-gl-summary"] });
                      } catch (err: any) {
                        showToast(err?.message || "Failed to post voucher.");
                      }
                    },
                  },
                ]
              : []),
            ...(contextMenu.row.status === "POSTED"
              ? [
                  {
                    label: "Reverse Journal Voucher",
                    icon: RotateCcw,
                    destructive: true,
                    onClick: () => {
                      setSelectedEntryNumber(contextMenu.row.entryNumber);
                      setShowReverseModal(true);
                    },
                  },
                ]
              : []),
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Floating Batch Action Dock */}
      <BatchActionBar
        selectedCount={selectedRows.size}
        itemTypeLabel="journal vouchers"
        actions={batchActions}
        onClearSelection={() => setSelectedRows(new Set())}
      />
    </div>
  );
}
