"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Modal } from "@kannan19302/ui";
import { PageHeader, StatCardRow, type StatCardItem } from "@kannan19302/ui/layout";
import { Button } from "@kannan19302/ui/primitives";
import { FormView, ListView, RouteGuard, useResourceList } from "@kannan19302/framework";
import { invoiceResource } from "@/modules/finance";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { Plus, FileText, BarChart3, AlertCircle, CheckCircle2 } from "lucide-react";
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

  const statItems: StatCardItem[] = useMemo(() => [
    {
      label: "Total Invoiced",
      value: `$${metrics.totalInvoiced.toLocaleString()}`,
      changeLabel: `${metrics.count} total invoices`,
      icon: <FileText size={16} strokeWidth={1.75} />,
      color: "var(--color-neutral-muted)",
      loading: isLoading,
    },
    {
      label: "Open Receivables",
      value: `$${metrics.outstanding.toLocaleString()}`,
      changeLabel: "Outstanding balance",
      icon: <BarChart3 size={16} strokeWidth={1.75} />,
      color: "var(--color-primary)",
      loading: isLoading,
    },
    {
      label: "Overdue Invoices",
      value: metrics.overdueCount,
      changeLabel: metrics.overdueCount > 0 ? "Requires action" : "All current",
      icon: <AlertCircle size={16} strokeWidth={1.75} />,
      color: metrics.overdueCount > 0 ? "var(--color-danger)" : "var(--color-success)",
      loading: isLoading,
    },
    {
      label: "Collections Rate",
      value: metrics.totalInvoiced > 0
        ? `${Math.round((metrics.totalPaid / metrics.totalInvoiced) * 100)}%`
        : "N/A",
      changeLabel: "Settled volume",
      icon: <CheckCircle2 size={16} strokeWidth={1.75} />,
      color: "var(--color-success)",
      loading: isLoading,
    },
  ], [metrics, isLoading]);

  return (
    <RouteGuard permission="finance.invoice.read">
      <div className={styles.container}>
        {/* Strata 2.0 PageHeader */}
        <PageHeader
          title="Invoices Workbench"
          description="Issue customer invoices, track collections, monitor DSO, and manage billing lifecycles"
          actions={
            <div className={styles.headerActions}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<BarChart3 size={13} strokeWidth={1.75} />}
                asChild
              >
                <Link
                  href="/finance/ar"
                  onClick={(e) => {
                    e.preventDefault();
                    openAppTab({ href: "/finance/ar", title: "Accounts Receivable" });
                  }}
                >
                  AR Aging Hub
                </Link>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileText size={13} strokeWidth={1.75} />}
                asChild
              >
                <Link
                  href="/finance/advanced/customer-statement"
                  onClick={(e) => {
                    e.preventDefault();
                    openAppTab({
                      href: "/finance/advanced/customer-statement",
                      title: "Customer Statements",
                    });
                  }}
                >
                  Statements
                </Link>
              </Button>

              <ExportMenu
                filename="customer-invoices-register"
                title="Customer Invoices Register"
                columns={exportColumns}
                data={exportData}
                buttonLabel="Export Invoices"
              />

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} strokeWidth={2} />}
                onClick={() => setShowCreate(true)}
              >
                New Invoice
              </Button>
            </div>
          }
        />

        {/* Canonical Strata StatCardRow */}
        <StatCardRow stats={statItems} columns={4} />

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
