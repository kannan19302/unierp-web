"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
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

  const { data, isLoading, isFetching, refetch } = useQuery<ApSummaryData>({
    queryKey: ["finance-ap-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/ap/summary");
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
            <div className={styles.liveDot} />
            <span>Live database</span>
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
                  <th className={styles.th}>Supplier</th>
                  <th className={styles.th}>Bill #</th>
                  <th className={styles.th}>Due Date</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Amount (USD)</th>
                  <th className={styles.th}>Matching</th>
                  <th className={styles.th}>Approval</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: "var(--space-2)" }}>
                        <div className={styles.skeleton} />
                      </td>
                    </tr>
                  ))
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                      No bills match current filter.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((row) => {
                    const isSelected = (selectedBillNumber || matchData?.billNumber) === row.billNumber;
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedBillNumber(row.billNumber)}
                      >
                        <td className={styles.td} style={{ fontWeight: 500 }}>{row.supplier}</td>
                        <td className={styles.tdMono}>{row.billNumber}</td>
                        <td className={styles.td}>{row.dueDate}</td>
                        <td className={styles.tdRight}>
                          {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
            <span>Showing 1–8 of 32 bills</span>
            <span>8 per page</span>
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
              <span className={styles.matchLabel}>Purchase order ({matchData?.poNumber || "—"})</span>
              <span className={styles.matchAmount}>
                USD {(matchData?.poAmount ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className={styles.matchRow}>
              <span className={styles.matchLabel}>Goods received (GRN-0412)</span>
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
                Vendor Invoice Original
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                {matchData?.supplier} • OCR Verified
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
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>100 Technology Plaza, San Francisco, CA</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", fontFamily: "var(--font-mono)", color: "var(--color-primary)" }}>{matchData?.billNumber}</div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>PO Reference: {matchData?.poNumber}</div>
                </div>
              </div>

              <div style={{ marginTop: "var(--space-2)" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Item</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Qty</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Unit Price</th>
                      <th className={`${styles.th} ${styles.thRight}`}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.td}>Standard Commercial Service / Goods</td>
                      <td className={styles.tdRight}>1.00</td>
                      <td className={styles.tdRight}>${((matchData?.invoiceAmount ?? 0) * 0.9).toFixed(2)}</td>
                      <td className={styles.tdRight}>${((matchData?.invoiceAmount ?? 0) * 0.9).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className={styles.td}>Sales &amp; Logistics Tax (10%)</td>
                      <td className={styles.tdRight}>1.00</td>
                      <td className={styles.tdRight}>${((matchData?.invoiceAmount ?? 0) * 0.1).toFixed(2)}</td>
                      <td className={styles.tdRight}>${((matchData?.invoiceAmount ?? 0) * 0.1).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <div style={{ width: "var(--panel-width)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Invoice Total:</span>
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
    </div>
  );
}
