"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Download,
  FileText,
  Building,
  Plus,
  Receipt,
  Calendar,
} from "lucide-react";
import {
  Card,
  Badge,
  Button,
  DataTable,
  type Column,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  period: string;
  amount: string;
  status: "Paid" | "Open" | "Processing" | "Refunded";
  paymentMethod: string;
  issuedAt: string;
  paidAt: string;
}

export default function BillingPaymentsPage() {
  const [invoices] = useState<InvoiceRecord[]>([
    {
      id: "inv-1",
      invoiceNumber: "INV-2026-08-0042",
      period: "Aug 1, 2026 – Aug 31, 2026",
      amount: "$899.00",
      status: "Paid",
      paymentMethod: "Mastercard •••• 4242",
      issuedAt: "2026-08-01",
      paidAt: "2026-08-01 00:05 UTC",
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-2026-07-0038",
      period: "Jul 1, 2026 – Jul 31, 2026",
      amount: "$899.00",
      status: "Paid",
      paymentMethod: "Mastercard •••• 4242",
      issuedAt: "2026-07-01",
      paidAt: "2026-07-01 00:03 UTC",
    },
    {
      id: "inv-3",
      invoiceNumber: "INV-2026-06-0031",
      period: "Jun 1, 2026 – Jun 30, 2026",
      amount: "$899.00",
      status: "Paid",
      paymentMethod: "Mastercard •••• 4242",
      issuedAt: "2026-06-01",
      paidAt: "2026-06-01 00:04 UTC",
    },
  ]);

  const stats: StatCardItem[] = [
    {
      label: "Current Subscription Plan",
      value: "Enterprise Scale ($899/mo)",
      change: 0,
      changeLabel: "Active",
    },
    {
      label: "Default Payment Method",
      value: "Mastercard •••• 4242",
      change: 0,
      changeLabel: "Verified",
    },
    {
      label: "Outstanding Balance",
      value: "$0.00",
    },
    {
      label: "Last Payment Receipt",
      value: "$899.00 (Aug 1, 2026)",
    },
  ];

  const columns: Column<InvoiceRecord>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice Reference",
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: "#f3f4f6", display: "flex", alignItems: "center", gap: 4 }}>
            <Receipt size={14} style={{ color: "#fbbf24" }} /> {row.invoiceNumber}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{row.period}</div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Total Amount",
      render: (row) => <span style={{ fontWeight: 700, color: "#f3f4f6" }}>{row.amount}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge variant={row.status === "Paid" ? "success" : "warning"}>{row.status}</Badge>,
    },
    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (row) => <span style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>{row.paymentMethod}</span>,
    },
    {
      key: "paidAt",
      header: "Settlement Timestamp",
      render: (row) => <span style={{ color: "#9ca3af", fontSize: "0.8125rem" }}>{row.paidAt}</span>,
    },
  ];

  return (
    <div style={{ padding: "1.5rem 2rem", minHeight: "100vh", background: "var(--color-bg-canvas, #090d16)", color: "#f3f4f6" }}>
      {/* Top Banner */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ padding: "0.5rem", borderRadius: "0.5rem", background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f9fafb", margin: 0 }}>
                Billing & Payments
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#9ca3af", margin: 0 }}>
                OCC-07 · View invoices, manage payment methods, billing addresses, and tax exemption certificates
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RotateCw size={14} style={{ marginRight: 6 }} /> Refresh
          </Button>
          <Link href="/subscriptions/plans">
            <Button variant="outline" size="sm">
              <Building size={14} style={{ marginRight: 6 }} /> Upgrade Plan
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch("/api/v1/saas/billing/customer-portal", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ returnUrl: window.location.href }),
                  credentials: "include",
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } else {
                  alert("Customer Portal is available on live Stripe subscription accounts.");
                }
              } catch {
                alert("Customer Portal connection failed.");
              }
            }}
          >
            <CreditCard size={14} style={{ marginRight: 6 }} /> Manage Payment Methods &amp; Invoices
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ marginBottom: "1.5rem" }}>
        <StatCardRow stats={stats} />
      </div>

      {/* Invoices Table */}
      <Card>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#f3f4f6" }}>Invoice History & Receipts</h3>
            <p style={{ fontSize: "0.8125rem", color: "#9ca3af", margin: "0.25rem 0 0" }}>Immutable customer financial records issued by PCC-06 revenue engine</p>
          </div>
          <Badge variant="success">All Invoices Settled</Badge>
        </div>
        <DataTable<InvoiceRecord> columns={columns} data={invoices} rowKey={(i) => i.id} />
      </Card>
    </div>
  );
}
