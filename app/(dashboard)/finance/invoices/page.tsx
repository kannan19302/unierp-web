"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Modal } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard, useResourceList } from "@kannan19302/framework";
import { invoiceResource } from "@/modules/finance";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { Plus, FileSpreadsheet, FileText, BarChart3 } from "lucide-react";
import styles from "./page.module.css";

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  customerId?: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  currency?: string;
  notes?: string;
}

const exportColumns: ExportColumn[] = [
  { key: "invoiceNumber", header: "Invoice #", type: "text" },
  { key: "customerName", header: "Customer Name", type: "text" },
  { key: "issueDate", header: "Issue Date", type: "date" },
  { key: "dueDate", header: "Due Date", type: "date" },
  { key: "totalAmount", header: "Total Amount", type: "currency" },
  { key: "paidAmount", header: "Paid Amount", type: "currency" },
  { key: "balance", header: "Balance Due", type: "currency" },
  { key: "status", header: "Status", type: "text" },
];

export default function InvoicesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { openAppTab } = useFinanceTabs();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowCreate(true);
    }
  }, [searchParams]);

  // Query invoices list to compute metrics & enable multi-format export suite
  const { data: listResult, isLoading } = useResourceList<InvoiceRecord>(invoiceResource, {
    pageSize: 250,
  });

  const invoices = listResult?.data || [];

  // Metrics computation
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    const now = new Date().getTime();

    for (const inv of invoices) {
      const total = Number(inv.totalAmount) || 0;
      const paid = Number(inv.paidAmount) || 0;
      totalInvoiced += total;
      totalPaid += paid;

      const due = new Date(inv.dueDate).getTime();
      if (inv.status !== "PAID" && due < now) {
        overdueCount += 1;
      }
    }

    const outstanding = Math.max(0, totalInvoiced - totalPaid);

    return {
      totalInvoiced,
      totalPaid,
      outstanding,
      overdueCount,
      count: invoices.length,
    };
  }, [invoices]);

  // Export data mapper
  const exportData = useMemo(() => {
    return invoices.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName || inv.customerId || "Customer",
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      totalAmount: Number(inv.totalAmount) || 0,
      paidAmount: Number(inv.paidAmount) || 0,
      balance: Math.max(0, (Number(inv.totalAmount) || 0) - (Number(inv.paidAmount) || 0)),
      status: inv.status,
    }));
  }, [invoices]);

  return (
    <RouteGuard permission="finance.invoice.read">
      <div className={styles.container}>
        {/* Strata 2.0 Header */}
        <div className={styles.workbenchHeader}>
          <div>
            <h1 className={styles.headerTitle}>Invoices Workbench</h1>
            <p className={styles.headerDesc}>
              Issue customer invoices, track collections, monitor DSO, and manage billing lifecycles
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link
              href="/finance/ar"
              className={styles.btnSecondary}
              onClick={(e) => {
                e.preventDefault();
                openAppTab({ href: "/finance/ar", title: "Accounts Receivable" });
              }}
            >
              <BarChart3 size={13} />
              <span>AR Aging Hub</span>
            </Link>

            <Link
              href="/finance/advanced/customer-statement"
              className={styles.btnSecondary}
              onClick={(e) => {
                e.preventDefault();
                openAppTab({
                  href: "/finance/advanced/customer-statement",
                  title: "Customer Statements",
                });
              }}
            >
              <FileText size={13} />
              <span>Statements</span>
            </Link>

            <ExportMenu
              filename="customer-invoices-register"
              title="Customer Invoices Register"
              columns={exportColumns}
              data={exportData}
              buttonLabel="Export Invoices"
            />

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} />
              <span>New Invoice</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Invoiced</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>
                {isLoading ? "..." : `$${metrics.totalInvoiced.toLocaleString()}`}
              </span>
              <span className={styles.kpiSubtext}>{metrics.count} total</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Open Receivables</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
                {isLoading ? "..." : `$${metrics.outstanding.toLocaleString()}`}
              </span>
              <span className={styles.kpiSubtext}>Outstanding</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Overdue Invoices</span>
            <div className={styles.kpiValueRow}>
              <span
                className={styles.kpiValue}
                style={{ color: metrics.overdueCount > 0 ? "var(--color-danger)" : "inherit" }}
              >
                {isLoading ? "..." : metrics.overdueCount}
              </span>
              <span className={styles.kpiSubtext}>Needs action</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Collections Rate</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
                {isLoading
                  ? "..."
                  : metrics.totalInvoiced > 0
                  ? `${Math.round((metrics.totalPaid / metrics.totalInvoiced) * 100)}%`
                  : "N/A"}
              </span>
              <span className={styles.kpiSubtext}>Settled</span>
            </div>
          </div>
        </div>

        {/* Resource-backed High-Density ListView */}
        <div className={styles.listWrapper}>
          <ListView
            resource={invoiceResource}
            onRowClick={(row: { id: string; invoiceNumber?: string }) => {
              openAppTab({
                href: `/finance/invoices/${row.id}`,
                title: row.invoiceNumber || "Invoice Detail",
              });
            }}
          />
        </div>

        {/* Create Invoice Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Customer Invoice">
          <FormView
            resource={invoiceResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
