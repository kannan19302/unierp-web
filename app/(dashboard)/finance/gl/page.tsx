"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  X,
  Trash2,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { useFinanceScope } from "@/components/shell/FinanceScopeContext";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
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
  } | null;
}

interface FormLineItem {
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export default function GeneralLedgerPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const scope = useFinanceScope();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // New Journal Entry Modal State — clean blank lines by default (FIN-08)
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (searchParams?.get("action") === "new") {
      setShowCreateModal(true);
    }
  }, [searchParams]);
  const [createDate, setCreateDate] = useState(new Date().toISOString().slice(0, 10));
  const [createRef, setCreateRef] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [postImmediately, setPostImmediately] = useState(false);
  const [createLines, setCreateLines] = useState<FormLineItem[]>([
    { accountCode: "", accountName: "", description: "", debit: 0, credit: 0 },
    { accountCode: "", accountName: "", description: "", debit: 0, credit: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<GlSummaryData>({
    queryKey: ["finance-gl-summary", scope.entity, scope.period],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/finance/gl/summary?entity=${encodeURIComponent(scope.entity)}&period=${encodeURIComponent(scope.period)}`
      );
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

  const totalModalDebit = createLines.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);
  const totalModalCredit = createLines.reduce((acc, curr) => acc + Number(curr.credit || 0), 0);
  const modalDifference = Math.abs(totalModalDebit - totalModalCredit);
  const isModalBalanced = modalDifference < 0.01 && totalModalDebit > 0;

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
        description: createDescription || "Manual general ledger journal voucher",
        postImmediately,
        lines: createLines,
      });
      setShowCreateModal(false);
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-gl-summary"] });
      setCreateDescription("");
      setCreateRef("");
    } catch (err: any) {
      setCreateError(err?.message || "Failed to post journal voucher.");
    } finally {
      setIsSubmitting(false);
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

  const exportColumns: ExportColumn[] = [
    { key: "entryNumber", header: "Entry #", type: "text" },
    { key: "date", header: "Date", type: "date" },
    { key: "account", header: "Account", type: "text" },
    { key: "description", header: "Description / Memo", type: "text" },
    { key: "debit", header: "Debit ($)", type: "currency" },
    { key: "credit", header: "Credit ($)", type: "currency" },
    { key: "status", header: "Status", type: "text" },
    { key: "reference", header: "Reference", type: "text" },
  ];

  const exportRows = filteredEntries.map((entry) => ({
    entryNumber: entry.entryNumber,
    date: entry.date,
    account: `${entry.accountCode} ${entry.accountName}`,
    description: entry.description,
    debit: Number(entry.debit || 0).toFixed(2),
    credit: Number(entry.credit || 0).toFixed(2),
    status: entry.status,
    reference: entry.reference || "N/A",
  }));

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
            {!isError && data ? (
              <>
                <div className={styles.liveDot} />
                <span>Live database</span>
              </>
            ) : isError ? (
              <>
                <div className={styles.liveDot} style={{ background: "var(--color-danger, #ef4444)" }} />
                <span>Connection error</span>
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
              title="Refresh ledger"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <ExportMenu
            filename="general-ledger"
            title="General Ledger Report"
            columns={exportColumns}
            data={exportRows}
            buttonLabel="Export ledger"
          />

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={14} />
            <span>Create journal entry</span>
          </button>
        </div>
      </div>

      {/* Inline Error State for service or query failure (FIN-01, FIN-13) */}
      {isError && (
        <FinanceErrorState
          error={error}
          title="General Ledger service unavailable"
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total debits</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {isLoading
                ? "..."
                : isError
                ? "Unavailable"
                : `USD ${Number(data?.kpis.totalDebits ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total credits</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {isLoading
                ? "..."
                : isError
                ? "Unavailable"
                : `USD ${Number(data?.kpis.totalCredits ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            {!isError && data && data.kpis.inBalance && (data.kpis.totalDebits ?? 0) > 0 && (
              <span className={styles.kpiBadgeSuccess}>
                <Check size={11} /> In balance
              </span>
            )}
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Unposted journals</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {isLoading ? "..." : isError ? "Unavailable" : (data?.kpis.unpostedJournals ?? 0)}
            </span>
            {!isError && data && (data.kpis.unpostedJournals ?? 0) > 0 && (
              <span className={styles.kpiBadgeWarning}>Review required</span>
            )}
            {!isError && data && (data.kpis.unpostedJournals ?? 0) === 0 && (
              <span className={styles.kpiBadgeSuccess}>Up to date</span>
            )}
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

      {/* MODAL: Create & Post Journal Entry */}
      {showCreateModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h2 className={styles.panelTitle} style={{ fontSize: "var(--text-base)" }}>Create & Post Journal Entry</h2>
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
                    <label className={styles.formLabel}>Reference / Voucher #</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. JE-2026-0845 or ADJ-001"
                      value={createRef}
                      onChange={(e) => setCreateRef(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description / Memo</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter journal description..."
                    value={createDescription}
                    onChange={(e) => setCreateDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Line Items Section */}
                <div className={styles.linesSection}>
                  <div className={styles.linesHeader}>
                    <span className={styles.formLabel} style={{ fontWeight: 600 }}>
                      General Ledger Distribution Lines
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
                              placeholder="1010"
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
                            In balance (IAS 1 / US GAAP)
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
                  {isSubmitting ? "Posting..." : "Post to General Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
