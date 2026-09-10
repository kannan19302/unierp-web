"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  CreditCard,
  FileSpreadsheet,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { RowContextMenu, type ContextMenuAction } from "@/components/finance/RowContextMenu";
import { BatchActionBar, type BatchAction } from "@/components/finance/BatchActionBar";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { useFinanceScope } from "@/components/shell/FinanceScopeContext";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
import styles from "./page.module.css";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customer: string;
  dueDate: string;
  amount: number;
  balance: number;
  status: string;
  daysOverdue: number;
}

interface ArSummaryData {
  kpis: {
    outstanding: number;
    overdue: number;
    collectedThisMonth: number;
    dso: number;
  };
  aging: {
    current: number;
    bucket1_30: number;
    bucket31_60: number;
    bucket61_90: number;
    bucketOver90: number;
  };
  invoices: InvoiceRow[];
  inspector: {
    invoiceNumber: string;
    customer: string;
    amount: number;
    balance: number;
    dueDate: string;
    agingDays: number;
    promisedPaymentDate: string;
    status: string;
    contactPerson: string;
    contactEmail: string;
    recentActivity: Array<{ date: string; text: string }>;
  };
}

export default function AccountsReceivablePage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ACH");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentError, setPaymentError] = useState("");

  // Follow-up modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpAction, setFollowUpAction] = useState<"SEND_DUNNING_NOTICE" | "SCHEDULE_CALL" | "OFFER_PAYMENT_PLAN" | "ESCALATE_DISPUTE" | "DISPUTE_INVESTIGATION">("SEND_DUNNING_NOTICE");
  const [promisedDate, setPromisedDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
  const [followUpSuccess, setFollowUpSuccess] = useState(false);

  // Sorting & Batch Selection State
  const [sortField, setSortField] = useState<keyof InvoiceRow>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: InvoiceRow;
  } | null>(null);

  const { openAppTab } = useFinanceTabs();
  const scope = useFinanceScope();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      router.replace("/finance/invoices?action=new");
    }
  }, [searchParams, router]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<ArSummaryData>({
    queryKey: ["finance-ar-summary", scope.entity, scope.period],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/finance/ar/summary?entity=${encodeURIComponent(scope.entity)}&period=${encodeURIComponent(scope.period)}`
      );
      return (res?.data || res) as ArSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleOpenPaymentModal = (rowOverride?: { balance: number }) => {
    const inspector = rowOverride ?? activeInspector;
    if (!inspector) return;
    setPaymentAmount(inspector.balance > 0 ? inspector.balance.toFixed(2) : "");
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentReference("");
    setPaymentError("");
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceNumber = selectedInvoiceNumber || data?.inspector?.invoiceNumber;
    if (!invoiceNumber) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      setPaymentError("Payment amount must be a positive number.");
      return;
    }
    const targetRow = (data?.invoices || []).find((i) => i.invoiceNumber === invoiceNumber);
    if (!targetRow) return;
    if (amt > targetRow.balance) {
      setPaymentError(`Amount exceeds outstanding balance of USD ${targetRow.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`);
      return;
    }
    if (!paymentDate) {
      setPaymentError("Payment date is required.");
      return;
    }
    setIsRecordingPayment(true);
    setPaymentError("");
    try {
      await apiClient.post("/finance/ar/record-payment", {
        invoiceId: targetRow.id,
        amount: amt,
        paymentMethod,
        reference: paymentReference || undefined,
        paymentDate,
      });
      setPaySuccess(true);
      setShowPaymentModal(false);
      setTimeout(() => setPaySuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-ar-summary"] });
    } catch (err) {
      console.error("Failed to record payment:", err);
      setPaymentError("Payment recording failed. Please try again.");
    } finally {
      setIsRecordingPayment(false);
    }
  };


  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceNumber = selectedInvoiceNumber || data?.inspector?.invoiceNumber;
    if (!invoiceNumber) return;
    const targetRow = (data?.invoices || []).find((i) => i.invoiceNumber === invoiceNumber);
    if (!targetRow) return;

    setIsSubmittingFollowUp(true);
    try {
      await apiClient.post("/finance/ar/follow-up", {
        invoiceId: targetRow.id,
        action: followUpAction,
        promisedPaymentDate: promisedDate,
        notes: followUpNotes || "Follow-up logged by collections specialist.",
      });
      setFollowUpSuccess(true);
      setTimeout(() => {
        setFollowUpSuccess(false);
        setShowFollowUpModal(false);
        setFollowUpNotes("");
      }, 1200);
      await queryClient.invalidateQueries({ queryKey: ["finance-ar-summary"] });
    } catch (err) {
      console.error("Failed to record follow up:", err);
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  // Filter invoices by search and aging bucket
  const bucketFilteredInvoices = (data?.invoices || []).filter((inv) => {
    if (selectedBucket === "current") return inv.daysOverdue <= 0;
    if (selectedBucket === "1_30") return inv.daysOverdue > 0 && inv.daysOverdue <= 30;
    if (selectedBucket === "31_60") return inv.daysOverdue > 30 && inv.daysOverdue <= 60;
    if (selectedBucket === "61_90") return inv.daysOverdue > 60 && inv.daysOverdue <= 90;
    if (selectedBucket === "over90") return inv.daysOverdue > 90;
    return true;
  });

  const filteredInvoices = bucketFilteredInvoices.filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q)
    );
  });

  // Handle column sort
  const handleSort = (field: keyof InvoiceRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
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
    if (selectedRows.size === sortedInvoices.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedInvoices.map((i) => i.invoiceNumber)));
    }
  };

  const toggleSelectRow = (invoiceNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRows);
    if (next.has(invoiceNumber)) {
      next.delete(invoiceNumber);
    } else {
      next.add(invoiceNumber);
    }
    setSelectedRows(next);
  };

  // Export Columns Configuration
  const exportColumns: ExportColumn[] = [
    { header: "Invoice #", key: "invoiceNumber", type: "text" },
    { header: "Customer", key: "customer", type: "text" },
    { header: "Due Date", key: "dueDate", type: "date" },
    { header: "Amount ($)", key: "amount", type: "currency" },
    { header: "Balance ($)", key: "balance", type: "currency" },
    { header: "Overdue Days", key: "daysOverdue", type: "number" },
    { header: "Status", key: "status", type: "text" },
  ];

  const exportData = sortedInvoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    customer: inv.customer,
    dueDate: inv.dueDate,
    amount: inv.amount,
    balance: inv.balance,
    daysOverdue: inv.daysOverdue,
    status: inv.status,
  }));

  // Batch actions
  const batchActions: BatchAction[] = [
    {
      label: "Send Dunning Notices",
      icon: Check,
      variant: "primary",
      onClick: () => {
        setFollowUpSuccess(true);
        setSelectedRows(new Set());
        setTimeout(() => setFollowUpSuccess(false), 4000);
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

  const totalAgingSum = data?.aging
    ? data.aging.current +
      data.aging.bucket1_30 +
      data.aging.bucket31_60 +
      data.aging.bucket61_90 +
      data.aging.bucketOver90
    : 0;

  const getWidthPct = (val?: number) => {
    if (!val || totalAgingSum === 0) return 0;
    return Math.max(2, Math.round((val / totalAgingSum) * 100));
  };

  const selectedInvoice = selectedInvoiceNumber
    ? (data?.invoices || []).find((i) => i.invoiceNumber === selectedInvoiceNumber)
    : null;

  const activeInspector = selectedInvoice
    ? {
        invoiceNumber: selectedInvoice.invoiceNumber,
        customer: selectedInvoice.customer,
        amount: selectedInvoice.amount,
        balance: selectedInvoice.balance,
        dueDate: selectedInvoice.dueDate,
        agingDays: selectedInvoice.daysOverdue,
        promisedPaymentDate: selectedInvoice.balance === 0 ? "Settled" : "",
        status: selectedInvoice.status,
        contactPerson: "Accounts Payable Dept",
        contactEmail: "",
        recentActivity: selectedInvoice.balance === 0
          ? [{ date: selectedInvoice.dueDate, text: "Invoice settled — balance cleared." }]
          : [{ date: selectedInvoice.dueDate, text: `Invoice due. Balance USD ${selectedInvoice.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })} outstanding.` }],
      }
    : data?.inspector;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Accounts receivable</h1>
          <p className={styles.subtitle}>
            Collections workspace, invoice aging analysis, and payment triage.
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
              title="Refresh receivables"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <ExportMenu
            filename="accounts-receivable"
            title="Accounts Receivable & Invoices Report"
            columns={exportColumns}
            data={exportData}
            buttonLabel="Export AR"
          />

          <Link
            href="/finance/advanced/customer-statement"
            className={styles.btnSecondary}
          >
            <FileSpreadsheet size={14} />
            <span>Statements</span>
          </Link>

          <Link
            href="/finance/invoices"
            className={styles.btnPrimary}
          >
            <Plus size={14} />
            <span>New invoice</span>
          </Link>
        </div>
      </div>

      {/* Inline Error State (FIN-01, FIN-13) */}
      {isError && (
        <FinanceErrorState
          error={error}
          title="Accounts Receivable service unavailable"
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      )}

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Outstanding</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : (data?.kpis.outstanding ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Overdue</span>
          <div className={styles.kpiValueRow}>
            <span className={`${styles.kpiValue} ${styles.kpiValueWarning}`}>
              USD {isLoading ? "..." : (data?.kpis.overdue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Collected this month</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : (data?.kpis.collectedThisMonth ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Days sales outstanding (DSO)</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {isLoading ? "..." : `${data?.kpis.dso ?? 0} days`}
            </span>
          </div>
        </div>
      </div>

      {/* Thin Horizontal Aging Band */}
      <div className={styles.agingBandContainer}>
        <div className={styles.agingBandHeader}>
          <span>Receivables aging breakdown</span>
          <span className={styles.tdMono}>Total USD {(totalAgingSum).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>

        <div className={styles.agingBarSegments}>
          <div
            className={`${styles.agingSegment} ${styles.segCurrent}`}
            style={{ width: `${getWidthPct(data?.aging?.current ?? 0)}%`, cursor: "pointer", outline: selectedBucket === "current" ? "2px solid var(--color-primary)" : "none" }}
            title={`Current: $${(data?.aging?.current ?? 0).toLocaleString()} (Click to filter)`}
            onClick={() => setSelectedBucket(selectedBucket === "current" ? null : "current")}
          />
          <div
            className={`${styles.agingSegment} ${styles.seg1_30}`}
            style={{ width: `${getWidthPct(data?.aging?.bucket1_30 ?? 0)}%`, cursor: "pointer", outline: selectedBucket === "1_30" ? "2px solid var(--color-primary)" : "none" }}
            title={`1–30d: $${(data?.aging?.bucket1_30 ?? 0).toLocaleString()} (Click to filter)`}
            onClick={() => setSelectedBucket(selectedBucket === "1_30" ? null : "1_30")}
          />
          <div
            className={`${styles.agingSegment} ${styles.seg31_60}`}
            style={{ width: `${getWidthPct(data?.aging?.bucket31_60 ?? 0)}%`, cursor: "pointer", outline: selectedBucket === "31_60" ? "2px solid var(--color-primary)" : "none" }}
            title={`31–60d: $${(data?.aging?.bucket31_60 ?? 0).toLocaleString()} (Click to filter)`}
            onClick={() => setSelectedBucket(selectedBucket === "31_60" ? null : "31_60")}
          />
          <div
            className={`${styles.agingSegment} ${styles.seg61_90}`}
            style={{ width: `${getWidthPct(data?.aging?.bucket61_90 ?? 0)}%`, cursor: "pointer", outline: selectedBucket === "61_90" ? "2px solid var(--color-primary)" : "none" }}
            title={`61–90d: $${(data?.aging?.bucket61_90 ?? 0).toLocaleString()} (Click to filter)`}
            onClick={() => setSelectedBucket(selectedBucket === "61_90" ? null : "61_90")}
          />
          <div
            className={`${styles.agingSegment} ${styles.segOver90}`}
            style={{ width: `${getWidthPct(data?.aging?.bucketOver90 ?? 0)}%`, cursor: "pointer", outline: selectedBucket === "over90" ? "2px solid var(--color-primary)" : "none" }}
            title={`90+d: $${(data?.aging?.bucketOver90 ?? 0).toLocaleString()} (Click to filter)`}
            onClick={() => setSelectedBucket(selectedBucket === "over90" ? null : "over90")}
          />
        </div>

        <div className={styles.agingLegendRow}>
          <div
            className={styles.agingLegendItem}
            onClick={() => setSelectedBucket(selectedBucket === "current" ? null : "current")}
            style={{ cursor: "pointer", opacity: selectedBucket && selectedBucket !== "current" ? 0.4 : 1 }}
          >
            <div className={`${styles.agingDot} ${styles.segCurrent}`} />
            <span>Current:</span>
            <span className={styles.agingAmount}>${(data?.aging?.current ?? 0).toLocaleString()}</span>
          </div>

          <div
            className={styles.agingLegendItem}
            onClick={() => setSelectedBucket(selectedBucket === "1_30" ? null : "1_30")}
            style={{ cursor: "pointer", opacity: selectedBucket && selectedBucket !== "1_30" ? 0.4 : 1 }}
          >
            <div className={`${styles.agingDot} ${styles.seg1_30}`} />
            <span>1–30d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucket1_30 ?? 0).toLocaleString()}</span>
          </div>

          <div
            className={styles.agingLegendItem}
            onClick={() => setSelectedBucket(selectedBucket === "31_60" ? null : "31_60")}
            style={{ cursor: "pointer", opacity: selectedBucket && selectedBucket !== "31_60" ? 0.4 : 1 }}
          >
            <div className={`${styles.agingDot} ${styles.seg31_60}`} />
            <span>31–60d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucket31_60 ?? 0).toLocaleString()}</span>
          </div>

          <div
            className={styles.agingLegendItem}
            onClick={() => setSelectedBucket(selectedBucket === "61_90" ? null : "61_90")}
            style={{ cursor: "pointer", opacity: selectedBucket && selectedBucket !== "61_90" ? 0.4 : 1 }}
          >
            <div className={`${styles.agingDot} ${styles.seg61_90}`} />
            <span>61–90d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucket61_90 ?? 0).toLocaleString()}</span>
          </div>

          <div
            className={styles.agingLegendItem}
            onClick={() => setSelectedBucket(selectedBucket === "over90" ? null : "over90")}
            style={{ cursor: "pointer", opacity: selectedBucket && selectedBucket !== "over90" ? 0.4 : 1 }}
          >
            <div className={`${styles.agingDot} ${styles.segOver90}`} />
            <span>90+d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucketOver90 ?? 0).toLocaleString()}</span>
          </div>

          {selectedBucket && (
            <button
              type="button"
              onClick={() => setSelectedBucket(null)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                fontSize: "0.75rem",
                color: "var(--color-primary)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <X size={12} />
              <span>Clear filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Left: Invoices Table */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Invoices (8 of 24)</span>
            <div className={styles.searchBox}>
              <Search size={13} color="var(--color-text-muted)" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search invoice or customer..."
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
                      checked={selectedRows.size > 0 && selectedRows.size === sortedInvoices.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all invoices"
                    />
                  </th>
                  <th className={styles.th} onClick={() => handleSort("invoiceNumber")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Invoice #</span>
                      {sortField === "invoiceNumber" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("customer")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Customer</span>
                      {sortField === "customer" ? (
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
                  <th className={`${styles.th} ${styles.thRight}`} onClick={() => handleSort("balance")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                      <span>Balance</span>
                      {sortField === "balance" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Status</span>
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
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: "var(--space-2)" }}>
                        <div className={styles.skeleton} />
                      </td>
                    </tr>
                  ))
                ) : sortedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  sortedInvoices.map((row) => {
                    const isSelected = (selectedInvoiceNumber || activeInspector?.invoiceNumber) === row.invoiceNumber;
                    const isChecked = selectedRows.has(row.invoiceNumber);
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedInvoiceNumber(row.invoiceNumber)}
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
                            onChange={(e) => toggleSelectRow(row.invoiceNumber, e as any)}
                            aria-label={`Select invoice ${row.invoiceNumber}`}
                          />
                        </td>
                        <td className={styles.tdMono}>{row.invoiceNumber}</td>
                        <td className={styles.td}>{row.customer}</td>
                        <td className={styles.td}>{row.dueDate}</td>
                        <td className={styles.tdRight}>
                          ${row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={styles.tdRight}>
                          {row.balance > 0 ? `$${row.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
                        </td>
                        <td className={styles.td}>
                          <span
                            className={
                              row.status === "OVERDUE"
                                ? styles.badgeOverdue
                                : row.status === "PAID"
                                ? styles.badgePaid
                                : styles.badgeSent
                            }
                          >
                            {row.status}
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
            <span>Showing {sortedInvoices.length} of {data?.invoices?.length ?? 0} records</span>
          </div>
        </div>

        {/* Right: Collections Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Collections Inspector</span>
            <span className={styles.inspectorId}>
              {selectedInvoiceNumber || activeInspector?.invoiceNumber || "No invoice selected"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Customer</span>
            <span className={styles.inspectorFieldValue} style={{ fontWeight: 600 }}>
              {activeInspector?.customer || "—"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Balance Outstanding</span>
            <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`} style={{ fontSize: "var(--font-size-base)", fontWeight: 600, color: "var(--color-danger)" }}>
              USD {(activeInspector?.balance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Aging Status</span>
            <span className={styles.inspectorFieldValue} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
              <Clock size={12} color="var(--color-danger)" />
              <span style={{ color: "var(--color-danger)", fontWeight: 600 }}>
                {activeInspector?.agingDays ?? 0} days overdue
              </span>{" "}
              (Due {activeInspector?.dueDate || "—"})
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Promised Payment Date</span>
            <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              {activeInspector?.promisedPaymentDate || "—"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Key Contact</span>
            <span className={styles.inspectorFieldValue} style={{ fontSize: "var(--text-2xs)" }}>
              {activeInspector?.contactPerson || "—"} • {activeInspector?.contactEmail || "—"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Recent Activity Timeline</span>
            <div className={styles.timelineList}>
              {(activeInspector?.recentActivity || []).map((act, i) => (
                <div key={i} className={styles.timelineItem}>
                  <span className={styles.timelineDate}>{act.date}</span>
                  <span className={styles.timelineText}>{act.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.inspectorActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ flex: 1, justifyContent: "center" }}
              disabled={isRecordingPayment || !activeInspector}
              onClick={() => handleOpenPaymentModal()}
            >
              <CreditCard size={13} />
              <span>{paySuccess ? "Recorded ✓" : "Record payment"}</span>
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => {
                setPromisedDate(activeInspector?.promisedPaymentDate || "");
                setFollowUpNotes("");
                setShowFollowUpModal(true);
              }}
              disabled={!activeInspector}
            >
              Review follow-up
            </button>
          </div>
        </div>
      </div>

      {/* Review Follow-Up Modal */}
      {showFollowUpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowFollowUpModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Collections follow-up: {activeInspector?.invoiceNumber}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowFollowUpModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveFollowUp}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Customer</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={activeInspector?.customer || ""}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Action type</label>
                  <select
                    className={styles.formSelect}
                    value={followUpAction}
                    onChange={(e) => setFollowUpAction(e.target.value as any)}
                  >
                    <option value="SEND_DUNNING_NOTICE">Send Dunning Notice (Email)</option>
                    <option value="SCHEDULE_CALL">Schedule Collections Call</option>
                    <option value="OFFER_PAYMENT_PLAN">Offer Restructured Payment Plan</option>
                    <option value="ESCALATE_DISPUTE">Escalate to Legal/Recovery</option>
                    <option value="DISPUTE_INVESTIGATION">Dispute Investigation</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Promised payment date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={promisedDate}
                    onChange={(e) => setPromisedDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Follow-up notes & agreement</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Document conversation notes, payment commitment, contact details..."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    required
                  />
                </div>

                {followUpSuccess && (
                  <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <CheckCircle2 size={14} />
                    <span>Follow-up action logged & timeline updated successfully!</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowFollowUpModal(false)}
                  disabled={isSubmittingFollowUp}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isSubmittingFollowUp}
                >
                  {isSubmittingFollowUp ? "Saving..." : "Record follow-up"}
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
          recordId={contextMenu.row.invoiceNumber}
          recordTitle={`${contextMenu.row.customer} ($${contextMenu.row.balance.toLocaleString()} due)`}
          recordData={contextMenu.row}
          onOpenInTab={() => {
            openAppTab({
              href: `/finance/invoices/${contextMenu.row.id}`,
              title: contextMenu.row.invoiceNumber,
            });
          }}
          customActions={[
            {
              label: "Record Full Payment",
              icon: CreditCard,
              disabled: contextMenu.row.balance <= 0,
              onClick: () => {
                setSelectedInvoiceNumber(contextMenu.row.invoiceNumber);
                handleOpenPaymentModal({ balance: contextMenu.row.balance });
              },
            },
            {
              label: "Send Dunning Notice",
              icon: AlertTriangle,
              onClick: () => {
                setSelectedInvoiceNumber(contextMenu.row.invoiceNumber);
                setShowFollowUpModal(true);
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && activeInspector && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} id="payment-modal-title">
                Record payment — {activeInspector.invoiceNumber}
              </h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowPaymentModal(false)}
                aria-label="Close payment modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmitPayment}>
              <div className={styles.modalBody}>
                <div style={{ marginBottom: "var(--space-3)", padding: "var(--space-2) var(--space-3)", background: "var(--color-surface-raised)", borderRadius: "var(--radius-sm)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  <strong>{activeInspector.customer}</strong> &bull; Invoice {activeInspector.invoiceNumber} &bull; Outstanding:{" "}
                  <strong style={{ color: "var(--color-danger)" }}>USD {activeInspector.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="pay-amount">
                    Amount (USD) <span aria-label="required">*</span>
                  </label>
                  <input
                    id="pay-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={activeInspector.balance}
                    className={styles.formInput}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    placeholder={activeInspector.balance.toFixed(2)}
                    autoFocus
                  />
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                    Enter partial or full amount. Maximum: USD {activeInspector.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}.
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="pay-method">Payment method <span aria-label="required">*</span></label>
                  <select id="pay-method" className={styles.formSelect} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                    <option value="ACH">ACH — Automated Clearing House</option>
                    <option value="WIRE">Wire Transfer</option>
                    <option value="CHECK">Check</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="DIRECT_DEBIT">Direct Debit</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="pay-date">Payment date <span aria-label="required">*</span></label>
                  <input
                    id="pay-date"
                    type="date"
                    className={styles.formInput}
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="pay-ref">Reference / remittance number</label>
                  <input
                    id="pay-ref"
                    type="text"
                    className={styles.formInput}
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Bank reference, cheque number, wire ID..."
                    maxLength={100}
                  />
                </div>

                {paymentError && (
                  <div role="alert" style={{ color: "var(--color-danger)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <AlertTriangle size={13} />
                    <span>{paymentError}</span>
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={() => setShowPaymentModal(false)} disabled={isRecordingPayment}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isRecordingPayment}>
                  {isRecordingPayment ? "Recording..." : "Record payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BatchActionBar
        selectedCount={selectedRows.size}
        itemTypeLabel="invoices"
        actions={batchActions}
        onClearSelection={() => setSelectedRows(new Set())}
      />
    </div>
  );
}
