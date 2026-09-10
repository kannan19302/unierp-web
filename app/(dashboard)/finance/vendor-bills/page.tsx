"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Modal } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard, useResourceList } from "@kannan19302/framework";
import { vendorBillResource } from "@/modules/finance";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { Plus, BarChart3, Bot, FileText } from "lucide-react";
import styles from "./page.module.css";

interface VendorBillRecord {
  id: string;
  billNumber: string;
  vendorName?: string;
  vendorId?: string;
  dueDate: string;
  totalAmount: number;
  paidAmount?: number;
  status: string;
  currency?: string;
}

const exportColumns: ExportColumn[] = [
  { key: "billNumber", header: "Bill #", type: "text" },
  { key: "vendorName", header: "Vendor Name", type: "text" },
  { key: "dueDate", header: "Due Date", type: "date" },
  { key: "totalAmount", header: "Total Amount", type: "currency" },
  { key: "paidAmount", header: "Paid Amount", type: "currency" },
  { key: "balance", header: "Balance Due", type: "currency" },
  { key: "status", header: "Status", type: "text" },
];

export default function VendorBillsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { openAppTab } = useFinanceTabs();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setShowCreate(true);
    }
  }, [searchParams]);

  // Query vendor bills list to compute metrics & enable multi-format export suite
  const { data: listResult, isLoading } = useResourceList<VendorBillRecord>(vendorBillResource, {
    pageSize: 250,
  });

  const bills = listResult?.data || [];

  // Metrics computation
  const metrics = useMemo(() => {
    let totalPayables = 0;
    let approvedAmount = 0;
    let pendingCount = 0;

    for (const b of bills) {
      const amt = Number(b.totalAmount) || 0;
      totalPayables += amt;
      if (b.status === "APPROVED") {
        approvedAmount += amt;
      } else if (b.status === "DRAFT" || b.status === "PENDING_APPROVAL") {
        pendingCount += 1;
      }
    }

    return {
      totalPayables,
      approvedAmount,
      pendingCount,
      count: bills.length,
    };
  }, [bills]);

  // Export data mapper
  const exportData = useMemo(() => {
    return bills.map((b) => ({
      billNumber: b.billNumber,
      vendorName: b.vendorName || b.vendorId || "Supplier",
      dueDate: b.dueDate,
      totalAmount: Number(b.totalAmount) || 0,
      paidAmount: Number(b.paidAmount) || 0,
      balance: Math.max(0, (Number(b.totalAmount) || 0) - (Number(b.paidAmount) || 0)),
      status: b.status,
    }));
  }, [bills]);

  return (
    <RouteGuard permission="finance.payables.read">
      <div className={styles.container}>
        {/* Strata 2.0 Header */}
        <div className={styles.workbenchHeader}>
          <div>
            <h1 className={styles.headerTitle}>Vendor Bills Workbench</h1>
            <p className={styles.headerDesc}>
              Capture supplier invoices, run 3-way matching, authorize payments, and manage cash disbursements
            </p>
          </div>

          <div className={styles.headerActions}>
            <Link
              href="/finance/ap"
              className={styles.btnSecondary}
              onClick={(e) => {
                e.preventDefault();
                openAppTab({ href: "/finance/ap", title: "Accounts Payable" });
              }}
            >
              <BarChart3 size={13} />
              <span>AP Aging Hub</span>
            </Link>

            <Link
              href="/finance/advanced/ap-automation"
              className={styles.btnSecondary}
              onClick={(e) => {
                e.preventDefault();
                openAppTab({
                  href: "/finance/advanced/ap-automation",
                  title: "AP Automation",
                });
              }}
            >
              <Bot size={13} />
              <span>OCR Automation</span>
            </Link>

            <ExportMenu
              filename="vendor-bills-register"
              title="Supplier Bills Register"
              columns={exportColumns}
              data={exportData}
              buttonLabel="Export Bills"
            />

            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} />
              <span>New Vendor Bill</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Payables</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>
                {isLoading ? "..." : `$${metrics.totalPayables.toLocaleString()}`}
              </span>
              <span className={styles.kpiSubtext}>{metrics.count} bills</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Approved for Payment</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
                {isLoading ? "..." : `$${metrics.approvedAmount.toLocaleString()}`}
              </span>
              <span className={styles.kpiSubtext}>Ready to disburse</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Pending Review</span>
            <div className={styles.kpiValueRow}>
              <span
                className={styles.kpiValue}
                style={{ color: metrics.pendingCount > 0 ? "var(--color-warning)" : "inherit" }}
              >
                {isLoading ? "..." : metrics.pendingCount}
              </span>
              <span className={styles.kpiSubtext}>Needs 3-way match</span>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Active Suppliers</span>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
                {isLoading ? "..." : metrics.count > 0 ? `${metrics.count} Active` : "0"}
              </span>
              <span className={styles.kpiSubtext}>Disbursement scope</span>
            </div>
          </div>
        </div>

        {/* Resource-backed High-Density ListView */}
        <div className={styles.listWrapper}>
          <ListView
            resource={vendorBillResource}
          />
        </div>

        {/* Create Vendor Bill Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Vendor Bill">
          <FormView
            resource={vendorBillResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
