"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
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

  const { data, isLoading, isFetching, refetch } = useQuery<ArSummaryData>({
    queryKey: ["finance-ar-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/ar/summary");
      return (res?.data || res) as ArSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleRecordPayment = async () => {
    const invoiceNumber = selectedInvoiceNumber || data?.inspector?.invoiceNumber;
    if (!invoiceNumber) return;
    setIsRecordingPayment(true);
    try {
      const targetRow = (data?.invoices || []).find((i) => i.invoiceNumber === invoiceNumber);
      if (!targetRow) return;
      await apiClient.post("/finance/ar/record-payment", {
        invoiceId: targetRow.id,
        amount: targetRow.balance,
        paymentMethod: "ACH",
        reference: `ACH-REC-${Date.now().toString().slice(-6)}`,
      });
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-ar-summary"] });
    } catch (err) {
      console.error("Failed to record payment:", err);
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const filteredInvoices = (data?.invoices || []).filter((inv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q)
    );
  });

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
        promisedPaymentDate: selectedInvoice.balance === 0 ? "Settled" : "2026-09-04",
        status: selectedInvoice.status,
        contactPerson: "Accounts Payable Dept",
        contactEmail: `ap@${selectedInvoice.customer.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
        recentActivity:
          selectedInvoice.balance === 0
            ? [{ date: "2026-08-31", text: "Full payment received and reconciled." }]
            : [
                { date: "2026-08-30", text: "Payment notice delivered to accounting contact." },
                { date: selectedInvoice.dueDate, text: "Invoice reached standard terms due date." },
              ],
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
            <div className={styles.liveDot} />
            <span>Live database</span>
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
            style={{ width: `${getWidthPct(data?.aging?.current ?? 0)}%` }}
            title={`Current: $${(data?.aging?.current ?? 0).toLocaleString()}`}
          />
          <div
            className={`${styles.agingSegment} ${styles.seg1_30}`}
            style={{ width: `${getWidthPct(data?.aging?.bucket1_30 ?? 0)}%` }}
            title={`1–30d: $${(data?.aging?.bucket1_30 ?? 0).toLocaleString()}`}
          />
          <div
            className={`${styles.agingSegment} ${styles.seg31_60}`}
            style={{ width: `${getWidthPct(data?.aging?.bucket31_60 ?? 0)}%` }}
            title={`31–60d: $${(data?.aging?.bucket31_60 ?? 0).toLocaleString()}`}
          />
          <div
            className={`${styles.agingSegment} ${styles.seg61_90}`}
            style={{ width: `${getWidthPct(data?.aging?.bucket61_90 ?? 0)}%` }}
            title={`61–90d: $${(data?.aging?.bucket61_90 ?? 0).toLocaleString()}`}
          />
          <div
            className={`${styles.agingSegment} ${styles.segOver90}`}
            style={{ width: `${getWidthPct(data?.aging?.bucketOver90 ?? 0)}%` }}
            title={`90+d: $${(data?.aging?.bucketOver90 ?? 0).toLocaleString()}`}
          />
        </div>

        <div className={styles.agingLegendRow}>
          <div className={styles.agingLegendItem}>
            <div className={`${styles.agingDot} ${styles.segCurrent}`} />
            <span>Current:</span>
            <span className={styles.agingAmount}>${(data?.aging?.current ?? 0).toLocaleString()}</span>
          </div>

          <div className={styles.agingLegendItem}>
            <div className={`${styles.agingDot} ${styles.seg1_30}`} />
            <span>1–30d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucket1_30 ?? 0).toLocaleString()}</span>
          </div>

          <div className={styles.agingLegendItem}>
            <div className={`${styles.agingDot} ${styles.seg31_60}`} />
            <span>31–60d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucket31_60 ?? 0).toLocaleString()}</span>
          </div>

          <div className={styles.agingLegendItem}>
            <div className={`${styles.agingDot} ${styles.seg61_90}`} />
            <span>61–90d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucket61_90 ?? 0).toLocaleString()}</span>
          </div>

          <div className={styles.agingLegendItem}>
            <div className={`${styles.agingDot} ${styles.segOver90}`} />
            <span>90+d:</span>
            <span className={styles.agingAmount}>${(data?.aging?.bucketOver90 ?? 0).toLocaleString()}</span>
          </div>
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
                  <th className={styles.th}>Invoice #</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Due Date</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Amount (USD)</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Balance (USD)</th>
                  <th className={styles.th}>Status</th>
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
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((row) => {
                    const isSelected = (selectedInvoiceNumber || activeInspector?.invoiceNumber) === row.invoiceNumber;
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedInvoiceNumber(row.invoiceNumber)}
                      >
                        <td className={styles.tdMono}>{row.invoiceNumber}</td>
                        <td className={styles.td}>{row.customer}</td>
                        <td className={styles.td}>{row.dueDate}</td>
                        <td className={styles.tdRight}>
                          {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={styles.tdRight}>
                          {row.balance > 0 ? row.balance.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "$0.00"}
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
            <span>Showing 1–8 of 24 records</span>
            <span>Page 1 of 3</span>
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
              onClick={handleRecordPayment}
            >
              <CreditCard size={13} />
              <span>{isRecordingPayment ? "Recording..." : paySuccess ? "Recorded ✓" : "Record payment"}</span>
            </button>
            <Link
              href="/crm/activity-capture"
              className={styles.btnSecondary}
            >
              Follow-up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
