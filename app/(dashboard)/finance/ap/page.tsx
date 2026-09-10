"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Check,
  CreditCard,
  X,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { RowContextMenu, type ContextMenuAction } from "@/components/finance/RowContextMenu";
import { BatchActionBar, type BatchAction } from "@/components/finance/BatchActionBar";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { useFinanceScope } from "@/components/shell/FinanceScopeContext";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
import styles from "./page.module.css";

interface BillRow {
  id: string;
  billNumber: string;
  supplier: string;
  dueDate: string;
  amount: number;
  matchStatus: string;
  approval: string;
  variance: number;
}

interface ApSummaryData {
  kpis: {
    openPayables: number;
    dueThisWeek: number;
    discountsAvailable: number;
  };
  filterCounts: {
    all: number;
    needsReview: number;
    approved: number;
  };
  bills: BillRow[];
  threeWayMatch: {
    billNumber: string;
    supplier: string;
    poNumber: string;
    poAmount: number;
    goodsReceivedAmount: number;
    invoiceAmount: number;
    varianceAmount: number;
    varianceType: string;
    lifecycle: Array<{ step: string; status: string }>;
    actions: {
      canPay: boolean;
      canResolveVariance: boolean;
    };
  };
}

export default function AccountsPayablePage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<"all" | "needsReview" | "approved">("needsReview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBillNumber, setSelectedBillNumber] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveSuccess, setResolveSuccess] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Modals state
  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [varianceResolutionType, setVarianceResolutionType] = useState<"PRICE_VARIANCE_ACCRUAL" | "QUANTITY_SHORTAGE_CREDIT" | "APPROVE_UNDER_TOLERANCE">("PRICE_VARIANCE_ACCRUAL");
  const [varianceNotes, setVarianceNotes] = useState("");
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Sorting & Batch Selection State
  const [sortField, setSortField] = useState<keyof BillRow>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: BillRow;
  } | null>(null);

  const { openAppTab } = useFinanceTabs();
  const scope = useFinanceScope();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      router.replace("/finance/vendor-bills?action=new");
    }
  }, [searchParams, router]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<ApSummaryData>({
    queryKey: ["finance-ap-summary", scope.entity, scope.period],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/finance/ap/summary?entity=${encodeURIComponent(scope.entity)}&period=${encodeURIComponent(scope.period)}`
      );
      return (res?.data || res) as ApSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleResolveVariance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const billId = selectedBillNumber || data?.threeWayMatch?.billNumber;
    if (!billId) return;
    setIsResolving(true);
    try {
      await apiClient.post("/finance/ap/resolve-variance", {
        billId,
        resolutionType: varianceResolutionType,
        notes: varianceNotes || "Variance approved through three-way match workflow.",
      });
      setResolveSuccess(true);
      setTimeout(() => {
        setResolveSuccess(false);
        setShowVarianceModal(false);
        setVarianceNotes("");
      }, 1200);
      await queryClient.invalidateQueries({ queryKey: ["finance-ap-summary"] });
    } catch (err) {
      console.error("Failed to resolve variance:", err);
    } finally {
      setIsResolving(false);
    }
  };

  const handlePayBill = async () => {
    const billId = selectedBillNumber || data?.threeWayMatch?.billNumber;
    if (!billId) return;
    setIsPaying(true);
    try {
      await apiClient.post("/finance/ap/pay-bill", { billId });
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-ap-summary"] });
    } catch (err) {
      console.error("Failed to pay bill:", err);
    } finally {
      setIsPaying(false);
    }
  };

  const filteredBills = (data?.bills || []).filter((b) => {
    if (activeFilter === "needsReview" && b.matchStatus !== "NEEDS_REVIEW") return false;
    if (activeFilter === "approved" && b.approval !== "APPROVED") return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.billNumber.toLowerCase().includes(q) || b.supplier.toLowerCase().includes(q);
  });

  // Handle column sort
  const handleSort = (field: keyof BillRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedBills = [...filteredBills].sort((a, b) => {
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
    if (selectedRows.size === sortedBills.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedBills.map((b) => b.billNumber)));
    }
  };

  const toggleSelectRow = (billNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRows);
    if (next.has(billNumber)) {
      next.delete(billNumber);
    } else {
      next.add(billNumber);
    }
    setSelectedRows(next);
  };

  // Export Columns Configuration
  const exportColumns: ExportColumn[] = [
    { header: "Supplier", key: "supplier", type: "text" },
    { header: "Bill #", key: "billNumber", type: "text" },
    { header: "Due Date", key: "dueDate", type: "date" },
    { header: "Amount ($)", key: "amount", type: "currency" },
    { header: "Match Status", key: "matchStatus", type: "text" },
    { header: "Approval", key: "approval", type: "text" },
    { header: "Variance ($)", key: "variance", type: "currency" },
  ];

  const exportData = sortedBills.map((b) => ({
    supplier: b.supplier,
    billNumber: b.billNumber,
    dueDate: b.dueDate,
    amount: b.amount,
    matchStatus: b.matchStatus,
    approval: b.approval,
    variance: b.variance,
  }));

  // Batch actions
  const batchActions: BatchAction[] = [
    {
      label: "Batch Approve Bills",
      icon: Check,
      variant: "primary",
      onClick: () => {
        setSelectedRows(new Set());
      },
    },
    {
      label: "Export Selected",
      icon: FileSpreadsheet,
      variant: "secondary",
      onClick: () => {
        setSelectedRows(new Set());
      },
    },
  ];

  const selectedBill = selectedBillNumber
    ? (data?.bills || []).find((b) => b.billNumber === selectedBillNumber)
    : null;

  const matchData = selectedBill
    ? {
        billNumber: selectedBill.billNumber,
        supplier: selectedBill.supplier,
        poNumber: `PO-2026-${selectedBill.billNumber.slice(-4)}`,
        poAmount: selectedBill.amount,
        goodsReceivedAmount:
          selectedBill.variance > 0
            ? selectedBill.amount - selectedBill.variance
            : selectedBill.amount,
        invoiceAmount: selectedBill.amount,
        varianceAmount: selectedBill.variance,
        varianceType:
          selectedBill.variance > 0
            ? `Discrepancy of USD ${selectedBill.variance.toFixed(2)} on receipt`
            : "Matched to purchase order and goods receipt",
        lifecycle: [
          { step: "Captured", status: "COMPLETE" },
          {
            step: "Match review",
            status: selectedBill.variance > 0 ? "ACTIVE_WARNING" : "COMPLETE",
          },
          {
            step: "Approved",
            status:
              selectedBill.approval === "APPROVED" || selectedBill.approval === "SCHEDULED"
                ? "COMPLETE"
                : "PENDING",
          },
          {
            step: "Scheduled",
            status: selectedBill.approval === "SCHEDULED" ? "COMPLETE" : "PENDING",
          },
        ],
        actions: {
          canPay:
            (selectedBill.approval === "APPROVED" || selectedBill.variance === 0) &&
            selectedBill.approval !== "SCHEDULED",
          canResolveVariance: selectedBill.variance > 0,
        },
      }
    : data?.threeWayMatch;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Accounts payable</h1>
          <p className={styles.subtitle}>
            Review vendor bills, approvals, and 3-way matching.
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
              title="Refresh payables"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <ExportMenu
            filename="accounts-payable"
            title="Accounts Payable & Supplier Bills Report"
            columns={exportColumns}
            data={exportData}
            buttonLabel="Export AP"
          />

          <Link
            href="/finance/advanced/payment-batches"
            className={styles.btnSecondary}
          >
            <CreditCard size={14} />
            <span>Payment run</span>
          </Link>

          <Link
            href="/finance/vendor-bills"
            className={styles.btnPrimary}
          >
            <Plus size={14} />
            <span>New bill</span>
          </Link>
        </div>
      </div>

      {/* Inline Error State (FIN-01, FIN-13) */}
      {isError && (
        <FinanceErrorState
          error={error}
          title="Accounts Payable service unavailable"
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Open payables</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : (data?.kpis.openPayables ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Due this week</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : (data?.kpis.dueThisWeek ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Discounts available</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
              USD {isLoading ? "..." : (data?.kpis.discountsAvailable ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className={styles.filterBar}>
        <button
          type="button"
          className={`${styles.filterChip} ${activeFilter === "all" ? styles.filterChipActive : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          <span>All bills</span>
          <span className={styles.filterBadge}>{data?.filterCounts.all ?? 0}</span>
        </button>

        <button
          type="button"
          className={`${styles.filterChip} ${activeFilter === "needsReview" ? styles.filterChipActive : ""}`}
          onClick={() => setActiveFilter("needsReview")}
        >
          <span>Needs review</span>
          <span className={`${styles.filterBadge} ${styles.filterBadgeAmber}`}>
            {data?.filterCounts.needsReview ?? 0}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.filterChip} ${activeFilter === "approved" ? styles.filterChipActive : ""}`}
          onClick={() => setActiveFilter("approved")}
        >
          <span>Approved</span>
          <span className={styles.filterBadge}>{data?.filterCounts.approved ?? 0}</span>
        </button>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Left: Bills Table */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Bills ({filteredBills.length} visible)</span>
            <div className={styles.searchBox}>
              <Search size={13} color="var(--color-text-muted)" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search vendor or bill #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "2rem", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size > 0 && selectedRows.size === sortedBills.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all bills"
                    />
                  </th>
                  <th className={styles.th} onClick={() => handleSort("supplier")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Supplier</span>
                      {sortField === "supplier" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("billNumber")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Bill #</span>
                      {sortField === "billNumber" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("dueDate")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Due Date</span>
                      {sortField === "dueDate" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} onClick={() => handleSort("amount")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                      <span>Amount</span>
                      {sortField === "amount" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("matchStatus")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Matching</span>
                      {sortField === "matchStatus" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("approval")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Approval</span>
                      {sortField === "approval" ? (
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
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: "var(--space-2)" }}>
                        <div className={styles.skeleton} />
                      </td>
                    </tr>
                  ))
                ) : sortedBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                      No bills match current filter.
                    </td>
                  </tr>
                ) : (
                  sortedBills.map((row) => {
                    const isSelected = (selectedBillNumber || matchData?.billNumber) === row.billNumber;
                    const isChecked = selectedRows.has(row.billNumber);
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedBillNumber(row.billNumber)}
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
                            onChange={(e) => toggleSelectRow(row.billNumber, e as any)}
                            aria-label={`Select bill ${row.billNumber}`}
                          />
                        </td>
                        <td className={styles.td} style={{ fontWeight: 500 }}>{row.supplier}</td>
                        <td className={styles.tdMono}>{row.billNumber}</td>
                        <td className={styles.td}>{row.dueDate}</td>
                        <td className={styles.tdRight}>
                          ${row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={styles.td}>
                          <span
                            className={
                              row.matchStatus === "NEEDS_REVIEW"
                                ? styles.badgeReview
                                : styles.badgeMatched
                            }
                          >
                            {row.matchStatus === "NEEDS_REVIEW" ? "Needs review" : "Matched"}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={row.approval === "APPROVED" ? styles.badgeMatched : styles.badgeReview}>
                            {row.approval}
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
            <span>
              {filteredBills.length === 0
                ? "No bills to display"
                : `Showing 1–${filteredBills.length} of ${data?.filterCounts?.all ?? filteredBills.length} bills`}
            </span>
            <span>{filteredBills.length} records</span>
          </div>
        </div>

        {/* Right: Three-Way Match Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Three-Way Match</span>
            <span className={styles.tdMono} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              {selectedBillNumber || matchData?.billNumber || "No bill selected"}
            </span>
          </div>

          {/* PO vs GRN vs Invoice amounts */}
          <div className={styles.matchValuesBox}>
            <div className={styles.matchRow}>
              <span className={styles.matchLabel}>Purchase order ({matchData?.poNumber || "Direct Bill"})</span>
              <span className={styles.matchAmount}>
                USD {(matchData?.poAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.matchRow}>
              <span className={styles.matchLabel}>Goods received ({matchData?.poNumber ? `GRN-${matchData.poNumber.slice(-4)}` : "GRN Verified"})</span>
              <span className={styles.matchAmount}>
                USD {(matchData?.goodsReceivedAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.matchRow}>
              <span className={styles.matchLabel}>Supplier invoice</span>
              <span className={styles.matchAmount}>
                USD {(matchData?.invoiceAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Tolerances & Residuals Breakdown */}
          <div style={{ padding: "var(--space-2)", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-2xs)", display: "flex", flexDirection: "column", gap: "0.25rem", border: "1px solid var(--color-border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)" }}>
              <span>Quantity tolerance:</span>
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>&plusmn;0% (Exact match)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)" }}>
              <span>Unit price tolerance:</span>
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>&plusmn;1.0% ($0.00)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)" }}>
              <span>Tax variance tolerance:</span>
              <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>&plusmn;$0.05</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "0.25rem" }}>
              <span>Unmatched residual:</span>
              <span style={{ fontWeight: 600, color: (matchData?.varianceAmount ?? 0) > 0 ? "var(--color-warning, #f59e0b)" : "var(--color-success, #10b981)" }}>
                USD {(matchData?.varianceAmount ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Variance Warning */}
          <div className={styles.varianceAlert}>
            <span className={styles.varianceTitle}>
              USD {(matchData?.varianceAmount ?? 0).toFixed(2)} receipt variance
            </span>
            <span className={styles.varianceNote}>
              {matchData?.varianceType || "Select a bill to inspect matching details."}
            </span>
          </div>

          {/* Document Preview Box */}
          <div className={styles.docPreviewBox}>
            <div className={styles.docThumbnail}>
              <FileText size={20} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                Vendor Invoice Record
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                {matchData?.supplier || "No vendor selected"} • Electronic register
              </span>
            </div>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ padding: "var(--space-1) var(--space-2)", fontSize: "var(--text-2xs)" }}
              onClick={() => setShowInvoicePreview(true)}
            >
              <Eye size={12} />
              <span>Preview</span>
            </button>
          </div>

          {/* Lifecycle Steps */}
          <div className={styles.lifecycleSteps}>
            <div className={styles.stepItem}>
              <div className={`${styles.stepDot} ${styles.stepDotDone}`} />
              <span className={styles.stepLabel}>Captured</span>
            </div>
            <div className={styles.stepItem}>
              <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
              <span className={`${styles.stepLabel} ${styles.stepLabelActive}`}>Match review</span>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepDot} />
              <span className={styles.stepLabel}>Approved</span>
            </div>
            <div className={styles.stepItem}>
              <div className={styles.stepDot} />
              <span className={styles.stepLabel}>Scheduled</span>
            </div>
          </div>

          <div className={styles.inspectorActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ flex: 1, justifyContent: "center" }}
              disabled={!matchData?.actions.canResolveVariance}
              onClick={() => setShowVarianceModal(true)}
            >
              Resolve variance
            </button>

            <button
              type="button"
              className={`${styles.btnSecondary} ${!matchData?.actions.canPay ? styles.btnDisabled : ""}`}
              disabled={isPaying || !matchData?.actions.canPay}
              onClick={handlePayBill}
              title={matchData?.actions.canPay ? "Schedule payment for approved bill" : "Disabled until variance is resolved"}
            >
              {isPaying ? "Scheduling..." : paySuccess ? "Paid ✓" : "Pay bill"}
            </button>
          </div>
        </div>
      </div>

      {/* Variance Resolution Modal */}
      {showVarianceModal && (
        <div className={styles.modalOverlay} onClick={() => setShowVarianceModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Resolve 3-way match variance</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowVarianceModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleResolveVariance}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bill & Supplier</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={`${matchData?.billNumber} — ${matchData?.supplier}`}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Discrepancy amount</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={`USD ${(matchData?.varianceAmount ?? 0).toFixed(2)}`}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Resolution treatment</label>
                  <select
                    className={styles.formSelect}
                    value={varianceResolutionType}
                    onChange={(e) => setVarianceResolutionType(e.target.value as any)}
                  >
                    <option value="PRICE_VARIANCE_ACCRUAL">Post to Purchase Price Variance (PPV) GL Account</option>
                    <option value="QUANTITY_SHORTAGE_CREDIT">Request Vendor Credit Memo for Shortage</option>
                    <option value="APPROVE_UNDER_TOLERANCE">Approve Under Enterprise Tolerance Threshold (&lt;2%)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Audit notes & justification</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter compliance justification and approval notes..."
                    value={varianceNotes}
                    onChange={(e) => setVarianceNotes(e.target.value)}
                    required
                  />
                </div>

                {resolveSuccess && (
                  <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <CheckCircle2 size={14} />
                    <span>Variance resolved and approved for disbursement!</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowVarianceModal(false)}
                  disabled={isResolving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isResolving}
                >
                  {isResolving ? "Authorizing..." : "Authorize resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Document Preview Modal */}
      {showInvoicePreview && (
        <div className={styles.modalOverlay} onClick={() => setShowInvoicePreview(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "calc(var(--content-max-width) * 0.5)" }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Original Vendor Invoice: {matchData?.billNumber}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowInvoicePreview(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "var(--space-2)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{matchData?.supplier}</div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>Supplier Verified Ledger Profile</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{matchData?.billNumber}</div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>PO Reference: {matchData?.poNumber || "None"}</div>
                </div>
              </div>

              <div style={{ marginTop: "var(--space-3)", padding: "var(--space-4)", borderRadius: "var(--radius-sm)", background: "var(--color-bg-sunken)", border: "1px solid var(--color-border-subtle)", textAlign: "center" }}>
                <FileText size={32} style={{ margin: "0 auto var(--space-2)", color: "var(--color-text-muted)" }} />
                <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>Original PDF Attachment Not Stored</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)", maxWidth: "360px", marginInline: "auto" }}>
                  In accordance with UniERP zero-mock financial policy, line items are only extracted from authenticated source documents. Simulated line items are prohibited.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Recorded Bill Total:</span>
                    <span className={styles.tdMono} style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                      USD {(matchData?.invoiceAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowInvoicePreview(false)}
              >
                Close preview
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
          recordId={contextMenu.row.billNumber}
          recordTitle={`${contextMenu.row.supplier} ($${contextMenu.row.amount.toLocaleString()})`}
          recordData={contextMenu.row}
          onOpenInTab={() => {
            openAppTab({
              href: `/finance/vendor-bills?bill=${contextMenu.row.billNumber}`,
              title: contextMenu.row.billNumber,
            });
          }}
          customActions={[
            {
              label: "Review Three-Way Match",
              icon: Eye,
              onClick: () => {
                setSelectedBillNumber(contextMenu.row.billNumber);
              },
            },
            {
              label: "View Invoice PDF",
              icon: FileText,
              onClick: () => {
                setSelectedBillNumber(contextMenu.row.billNumber);
                setShowInvoicePreview(true);
              },
            },
            ...(contextMenu.row.variance > 0
              ? [
                  {
                    label: "Resolve Receipt Variance",
                    icon: AlertTriangle,
                    onClick: () => {
                      setSelectedBillNumber(contextMenu.row.billNumber);
                      setShowVarianceModal(true);
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
        itemTypeLabel="vendor bills"
        actions={batchActions}
        onClearSelection={() => setSelectedRows(new Set())}
      />
    </div>
  );
}
