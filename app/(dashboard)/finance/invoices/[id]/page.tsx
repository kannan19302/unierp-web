"use client";

import styles from "./page.module.css";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Badge, ChangeHistory, DataTable } from "@kannan19302/ui";
import { TransactionWorkspace, type TransactionSummaryItem } from "@kannan19302/ui/shell";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  DollarSign,
  ArrowLeft,
  Building,
  Calendar,
  Clock,
  Printer,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  reference?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes?: string;
  lineItems?: InvoiceLineItem[];
  purchaseOrderId?: string;
}

interface ThreeWayMatchReport {
  purchaseOrderId: string;
  poNumber: string;
  status: "MATCHED" | "DISCREPANCY" | "PENDING";
  overallMatch: boolean;
}

export default function InvoiceDetailPage() {
  const client = useApiClient();
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [matchReport, setMatchReport] = useState<ThreeWayMatchReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "items" | "details" | "payments" | "audit"
  >("items");

  const balanceDue = invoice
    ? Math.max(0, invoice.totalAmount - invoice.paidAmount)
    : 0;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, payRes] = await Promise.all([
        client.get<Invoice>(`/finance/invoices/${invoiceId}`),
        client.get<PaymentRecord[]>(`/finance/invoices/${invoiceId}/payments`),
      ]);

      setInvoice(invRes);
      setPayments(payRes || []);

      if ((invRes as any).purchaseOrderId) {
        try {
          const matchRes = await client.get<ThreeWayMatchReport>(
            `/procurement/purchase-orders/${(invRes as any).purchaseOrderId}/three-way-match`,
          );
          setMatchReport(matchRes);
        } catch {
          setMatchReport(null);
        }
      }
    } catch (err: any) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not load invoice data. Please verify the invoice ID.";
      setError(msg);
      setInvoice(null);
      setPayments([]);
      setMatchReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      loadData();
    }
  }, [invoiceId, client]);

  if (loading) {
    return (
      <div className={styles.spinnerWrap}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className={styles.notFound}>
        <AlertCircle size={48} className={styles.notFoundIcon} />
        <h3 className={styles.notFoundTitle}>Invoice Not Found</h3>
        <Button
          onClick={() => router.push("/finance")}
          className={["ui-btn ui-btn-secondary", styles.notFoundBtn].join(" ")}
        >
          Back to Finance
        </Button>
      </div>
    );
  }

  const getStatusVariant = (
    status: string,
  ):
    | "default"
    | "primary"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | undefined => {
    switch (status) {
      case "PAID":
        return "success";
      case "PARTIALLY_PAID":
        return "warning";
      case "OVERDUE":
        return "danger";
      case "SENT":
        return "info";
      case "DRAFT":
        return "default";
      case "VOID":
        return "default";
      default:
        return "default";
    }
  };

  const getMatchVariant = (
    status: string,
  ):
    | "default"
    | "primary"
    | "danger"
    | "success"
    | "warning"
    | "info"
    | undefined => {
    switch (status) {
      case "MATCHED":
        return "success";
      case "DISCREPANCY":
        return "danger";
      case "PENDING":
        return "warning";
      default:
        return "default";
    }
  };

  const paidPct =
    invoice.totalAmount > 0
      ? Math.round((invoice.paidAmount / invoice.totalAmount) * 100)
      : 0;

  const summaryItems: TransactionSummaryItem[] = [
    { label: "Subtotal", value: `$${Number(invoice.subtotal).toLocaleString()}` },
    { label: "Tax", value: `$${Number(invoice.taxAmount).toLocaleString()}` },
    ...(invoice.discountAmount > 0
      ? [{ label: "Discount", value: `-$${Number(invoice.discountAmount).toLocaleString()}` }]
      : []),
    {
      label: "Total Amount",
      value: `$${Number(invoice.totalAmount).toLocaleString()} ${invoice.currency}`,
      highlight: true,
    },
    {
      label: "Paid Amount",
      value: `$${Number(invoice.paidAmount).toLocaleString()} (${paidPct}%)`,
    },
    {
      label: "Balance Due",
      value: `$${Number(balanceDue).toLocaleString()} ${invoice.currency}`,
      highlight: true,
    },
  ];

  return (
    <RouteGuard permission="finance.invoice.read">
      <TransactionWorkspace
        title="Invoice"
        documentNumber={invoice.invoiceNumber}
        subtitle={invoice.customerName ? `Customer: ${invoice.customerName}` : undefined}
        density="ultra-compact"
        state={{
          label: invoice.status === "PARTIALLY_PAID" ? "Partially Paid" : invoice.status,
          tone: invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : invoice.status === "PARTIALLY_PAID" ? "warning" : "info",
        }}
        validationAlerts={
          error ? (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>Note: {error}</span>
            </div>
          ) : undefined
        }
        headerFields={
          <div className="ui-stack-4">
            <div className={styles.headerRow}>
              <div className={styles.customerInfo}>
                <Building size={20} className="ui-text-muted" />
                <div>
                  <div className="ui-text-xs-muted">Customer</div>
                  <div className={styles.customerName}>
                    {invoice.customerName}
                  </div>
                </div>
              </div>
              <div className={styles.badgeGroup}>
                <Badge variant={getStatusVariant(invoice.status)}>
                  {invoice.status === "PARTIALLY_PAID"
                    ? "Partially Paid"
                    : invoice.status}
                </Badge>
                {matchReport && (
                  <Badge variant={getMatchVariant(matchReport.status)}>
                    3-Way: {matchReport.status}
                  </Badge>
                )}
              </div>
            </div>

            <div className={styles.amountsGrid}>
              <div>
                <div className={styles.amountLabel}>
                  <Calendar size={12} /> Issue Date
                </div>
                <div className={styles.amountValue}>
                  {new Date(invoice.issueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <Calendar size={12} /> Due Date
                </div>
                <div className={styles.amountValue}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <DollarSign size={12} /> Total Amount
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.totalAmount).toLocaleString()}{" "}
                  {invoice.currency}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <DollarSign size={12} /> Subtotal
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.subtotal).toLocaleString()}
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <CheckCircle size={12} /> Paid Amount
                </div>
                <div className={styles.amountValue}>
                  ${Number(invoice.paidAmount).toLocaleString()} ({paidPct}%)
                </div>
              </div>
              <div>
                <div className={styles.amountLabel}>
                  <Clock size={12} /> Balance Due
                </div>
                <div className={styles.balanceDueValue}>
                  ${Number(balanceDue).toLocaleString()} {invoice.currency}
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className={styles.infoListItem}>
                <span className={styles.infoListItemLabel}>Notes</span>
                <span className={styles.notesText}>{invoice.notes}</span>
              </div>
            )}
          </div>
        }
        summaryItems={summaryItems}
        footerActions={
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <Button
              onClick={() => router.push("/finance")}
              variant="secondary"
            >
              <ArrowLeft size={14} style={{ marginRight: "var(--space-1)" }} />
              Back to Finance
            </Button>
            <Button
              onClick={() => window.print()}
              variant="ghost"
            >
              <Printer size={14} style={{ marginRight: "var(--space-1)" }} />
              Print / PDF
            </Button>
          </div>
        }
      >
        <div className="ui-stack-4">
          <div className={styles.tabsRow}>
            <button
              onClick={() => setActiveTab("items")}
              style={{
                fontWeight: activeTab === "items" ? "bold" : "normal",
                color:
                  activeTab === "items"
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                borderBottom:
                  activeTab === "items"
                    ? "2px solid var(--color-primary)"
                    : "none",
              }}
              className={styles.tabBtn}
            >
              <DollarSign size={14} /> Line Items ({invoice.lineItems?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("details")}
              style={{
                fontWeight: activeTab === "details" ? "bold" : "normal",
                color:
                  activeTab === "details"
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                borderBottom:
                  activeTab === "details"
                    ? "2px solid var(--color-primary)"
                    : "none",
              }}
              className={styles.tabBtn}
            >
              <FileText size={14} /> Details
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              style={{
                fontWeight: activeTab === "payments" ? "bold" : "normal",
                color:
                  activeTab === "payments"
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                borderBottom:
                  activeTab === "payments"
                    ? "2px solid var(--color-primary)"
                    : "none",
              }}
              className={styles.tabBtn}
            >
              <DollarSign size={14} /> Payments{" "}
              {payments.length > 0 && `(${payments.length})`}
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              style={{
                fontWeight: activeTab === "audit" ? "bold" : "normal",
                color:
                  activeTab === "audit"
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                borderBottom:
                  activeTab === "audit"
                    ? "2px solid var(--color-primary)"
                    : "none",
              }}
              className={styles.tabBtn}
            >
              <AlertCircle size={14} /> Audit & 3-Way Match
            </button>
          </div>

          {activeTab === "items" && (
            <div className="builder-table-wrapper">
              <DataTable
                columns={[
                  {
                    key: "description",
                    header: "Description",
                    render: (item: any) => <>{item.description}</>,
                  },
                  {
                    key: "quantity",
                    header: "Quantity",
                    render: (item: any) => (
                      <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                        {Number(item.quantity)}
                      </span>
                    ),
                  },
                  {
                    key: "unitPrice",
                    header: "Unit Price",
                    render: (item: any) => (
                      <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                        ${Number(item.unitPrice).toLocaleString()}
                      </span>
                    ),
                  },
                  {
                    key: "totalAmount",
                    header: "Total",
                    render: (item: any) => (
                      <span style={{ fontVariantNumeric: "tabular-nums lining-nums", fontWeight: "bold" }}>
                        ${Number(item.totalAmount).toLocaleString()}
                      </span>
                    ),
                  },
                ]}
                data={invoice.lineItems || []}
                rowKey={(item: any) => item.id}
              />
            </div>
          )}

          {activeTab === "details" && (
            <div className="ui-stack-3">
              <div className={styles.infoCardBody}>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>Invoice #</span>
                  <span className={styles.infoListItemValue}>
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>Customer</span>
                  <span className={styles.infoListItemValue}>
                    {invoice.customerName}
                  </span>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>Issue Date</span>
                  <span className={styles.infoListItemValue}>
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>Due Date</span>
                  <span className={styles.infoListItemValue}>
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>Status</span>
                  <span className={styles.infoListItemValue}>
                    <Badge variant={getStatusVariant(invoice.status)}>
                      {invoice.status === "PARTIALLY_PAID"
                        ? "Partially Paid"
                        : invoice.status}
                    </Badge>
                  </span>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>
                    Total Amount
                  </span>
                  <span className={styles.infoListItemValue}>
                    ${Number(invoice.totalAmount).toLocaleString()}{" "}
                    {invoice.currency}
                  </span>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>
                    Paid Amount
                  </span>
                  <span className={styles.infoListItemValue}>
                    ${Number(invoice.paidAmount).toLocaleString()} ({paidPct}%)
                  </span>
                </div>
                <div className={styles.infoListItem}>
                  <span className={styles.infoListItemLabel}>
                    Balance Due
                  </span>
                  <span className={styles.infoListItemValue}>
                    ${Number(balanceDue).toLocaleString()} {invoice.currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className={styles.paymentsSection}>
              {payments.length === 0 ? (
                <div
                  className="ui-text-xs-muted"
                  style={{ padding: "var(--space-6)", textAlign: "center" }}
                >
                  No payments recorded yet.
                </div>
              ) : (
                payments.map((payment: any) => (
                  <div key={payment.id} className={styles.paymentRow}>
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentDate}>
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </span>
                      <span className={styles.paymentMethod}>
                        {payment.method}
                        {payment.reference ? ` — ${payment.reference}` : ""}
                      </span>
                    </div>
                    <div
                      className={styles.paymentAmount}
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      ${Number(payment.amount).toLocaleString()}{" "}
                      {invoice.currency}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div className="ui-stack-4">
              {matchReport ? (
                <>
                  <div
                    className={styles.matchBanner}
                    style={{
                      background: matchReport.overallMatch
                        ? "var(--color-success-light)"
                        : "var(--color-warning-light)",
                      border: `1px solid ${matchReport.overallMatch ? "var(--color-success)" : "var(--color-warning)"}`,
                      color: matchReport.overallMatch
                        ? "var(--color-success-text)"
                        : "var(--color-warning-text)",
                    }}
                  >
                    {matchReport.overallMatch ? (
                      <CheckCircle size={20} className={styles.matchIcon} />
                    ) : (
                      <AlertCircle size={20} className={styles.matchIcon} />
                    )}
                    <div>
                      <div className={styles.matchTitle}>
                        {matchReport.overallMatch
                          ? "3-Way Match Passed"
                          : "3-Way Match Exception"}
                      </div>
                      <div className={styles.matchDesc}>
                        {matchReport.overallMatch
                          ? "The purchase order, goods receipt, and this invoice match exactly."
                          : "A discrepancy exists between the purchase order, goods receipt, and invoice."}
                      </div>
                    </div>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>
                      Linked PO
                    </span>
                    <span className={styles.infoListItemValue}>
                      {matchReport.poNumber}
                    </span>
                  </div>
                  <div className={styles.infoListItem}>
                    <span className={styles.infoListItemLabel}>
                      Match Status
                    </span>
                    <span className={styles.infoListItemValue}>
                      <Badge variant={getMatchVariant(matchReport.status)}>
                        {matchReport.status}
                      </Badge>
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className="ui-text-xs-muted"
                  style={{ padding: "var(--space-6)", textAlign: "center" }}
                >
                  {invoice.purchaseOrderId
                    ? "3-way match report could not be loaded."
                    : "This invoice is not linked to a purchase order. 3-way match is not applicable."}
                </div>
              )}

              <div style={{ marginTop: "var(--space-4)" }}>
                <ChangeHistory entityType="Invoice" entityId={invoiceId} />
              </div>
            </div>
          )}
        </div>
      </TransactionWorkspace>
    </RouteGuard>
  );
}
