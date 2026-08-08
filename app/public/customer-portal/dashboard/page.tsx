"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Spinner, StatusBadge, useToast, DataTable } from "@kannan19302/ui";
import {
  FileText,
  ShoppingCart,
  Receipt,
  Ticket,
  LogOut,
  Check,
  X as XIcon,
  Plus,
  Download,
  CreditCard,
} from "lucide-react";
import {
  portalGet,
  portalPost,
  portalDownload,
  clearPortalToken,
  getPortalToken,
  PortalApiError,
} from "../../../../src/lib/portal-api";

type Tab = "quotations" | "orders" | "invoices" | "cases";

interface Summary {
  customer: { id: string; name: string; email: string | null } | null;
  openCases: number;
  pendingQuotes: number;
  unpaidInvoices: number;
  recentOrders: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  validUntil: string;
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  orderDate: string;
}

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate: string;
}

interface CaseRow {
  id: string;
  caseNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function CustomerPortalDashboardPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [tab, setTab] = useState<Tab>("quotations");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCaseSubject, setNewCaseSubject] = useState("");
  const [newCaseDescription, setNewCaseDescription] = useState("");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!getPortalToken()) {
      router.push("/public/customer-portal/login");
    }
  }, [router]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, q, o, i, c] = await Promise.all([
        portalGet<Summary>("/portal/dashboard"),
        portalGet<Quotation[]>("/portal/quotations"),
        portalGet<SalesOrder[]>("/portal/orders"),
        portalGet<InvoiceRow[]>("/portal/invoices"),
        portalGet<CaseRow[]>("/portal/cases"),
      ]);
      setSummary(s);
      setQuotations(q);
      setOrders(o);
      setInvoices(i);
      setCases(c);
    } catch (e) {
      if (e instanceof PortalApiError && e.statusCode === 401) {
        clearPortalToken();
        router.push("/public/customer-portal/login");
        return;
      }
      toastError(
        e instanceof PortalApiError ? e.message : "Failed to load portal data",
      );
    } finally {
      setLoading(false);
    }
  }, [router, toastError]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleLogout = () => {
    clearPortalToken();
    router.push("/public/customer-portal/login");
  };

  const handleAccept = async (id: string) => {
    try {
      await portalPost(`/portal/quotations/${id}/accept`);
      success("Quotation accepted");
      loadAll();
    } catch (e) {
      toastError(
        e instanceof PortalApiError ? e.message : "Failed to accept quotation",
      );
    }
  };

  const handleReject = async (id: string) => {
    try {
      await portalPost(`/portal/quotations/${id}/reject`, {});
      success("Quotation rejected");
      loadAll();
    } catch (e) {
      toastError(
        e instanceof PortalApiError ? e.message : "Failed to reject quotation",
      );
    }
  };

  const handleDownloadQuotationPdf = async (id: string, number: string) => {
    try {
      await portalDownload(
        `/portal/quotations/${id}/pdf`,
        `quotation-${number}.pdf`,
      );
    } catch (e) {
      toastError(
        e instanceof PortalApiError
          ? e.message
          : "Failed to download quotation PDF",
      );
    }
  };

  const handleDownloadInvoicePdf = async (id: string, number: string) => {
    try {
      await portalDownload(
        `/portal/invoices/${id}/pdf`,
        `invoice-${number}.pdf`,
      );
    } catch (e) {
      toastError(
        e instanceof PortalApiError
          ? e.message
          : "Failed to download invoice PDF",
      );
    }
  };

  const handlePayInvoice = async (id: string) => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    setProcessingPayment(true);
    try {
      const intent = await portalPost<{ intentId: string }>(
        `/portal/invoices/${id}/pay`,
        { amount },
      );
      await portalPost(`/portal/payments/${intent.intentId}/confirm`, {
        simulateDecline: false,
      });
      success("Payment received — thank you!");
      setPayingInvoiceId(null);
      setPayAmount("");
      loadAll();
    } catch (e) {
      toastError(e instanceof PortalApiError ? e.message : "Payment failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreateCase = async () => {
    if (!newCaseSubject.trim()) return;
    try {
      await portalPost("/portal/cases", {
        subject: newCaseSubject,
        description: newCaseDescription,
        priority: "MEDIUM",
      });
      success("Support case submitted");
      setShowNewCase(false);
      setNewCaseSubject("");
      setNewCaseDescription("");
      loadAll();
    } catch (e) {
      toastError(
        e instanceof PortalApiError ? e.message : "Failed to submit case",
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`ui-page ${styles.s2}`}>
      <div className={styles.s3}>
        <div>
          <h2>{summary?.customer?.name ?? "Customer"} Portal</h2>
          <p className={styles.s4}>{summary?.customer?.email}</p>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut size={16} /> Sign out
        </Button>
      </div>

      <div className={styles.s5}>
        <Card className="ui-card">
          <strong>{summary?.pendingQuotes ?? 0}</strong>
          <div className={styles.s4}>Pending quotes</div>
        </Card>
        <Card className="ui-card">
          <strong>{summary?.recentOrders ?? 0}</strong>
          <div className={styles.s4}>Orders</div>
        </Card>
        <Card className="ui-card">
          <strong>{summary?.unpaidInvoices ?? 0}</strong>
          <div className={styles.s4}>Unpaid invoices</div>
        </Card>
        <Card className="ui-card">
          <strong>{summary?.openCases ?? 0}</strong>
          <div className={styles.s4}>Open cases</div>
        </Card>
      </div>

      <div className={styles.s6}>
        <Button
          variant={tab === "quotations" ? "primary" : "secondary"}
          onClick={() => setTab("quotations")}
        >
          <FileText size={14} /> Quotes
        </Button>
        <Button
          variant={tab === "orders" ? "primary" : "secondary"}
          onClick={() => setTab("orders")}
        >
          <ShoppingCart size={14} /> Orders
        </Button>
        <Button
          variant={tab === "invoices" ? "primary" : "secondary"}
          onClick={() => setTab("invoices")}
        >
          <Receipt size={14} /> Invoices
        </Button>
        <Button
          variant={tab === "cases" ? "primary" : "secondary"}
          onClick={() => setTab("cases")}
        >
          <Ticket size={14} /> Support cases
        </Button>
      </div>

      <Card className="ui-card">
        {tab === "quotations" &&
          (quotations.length === 0 ? (
            <p className="ui-empty-state">No quotations yet.</p>
          ) : (
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Number" , render: (q: any) => (<>{q.quotationNumber}</>) },
                        { key: "col_1", header: "Status" , render: (q: any) => (<><StatusBadge status={q.status} /></>) },
                        { key: "col_2", header: "Total" , render: (q: any) => (<>{q.currency}{Number(q.totalAmount).toFixed(2)}</>) },
                        { key: "col_3", header: "Valid until" , render: (q: any) => (<>{new Date(q.validUntil).toLocaleDateString()}</>) },
                        { key: "col_4", header: "Actions" , render: (q: any) => (<><div className={styles.s7}>
                                              {q.status === "SENT" && (
                                                <>
                                                  <Button
                                                    size="sm"
                                                    onClick={() => handleAccept(q.id)}
                                                  >
                                                    <Check size={14} /> Accept
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleReject(q.id)}
                                                  >
                                                    <XIcon size={14} /> Reject
                                                  </Button>
                                                </>
                                              )}
                                              <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                  handleDownloadQuotationPdf(q.id, q.quotationNumber)
                                                }
                                              >
                                                <Download size={14} /> PDF
                                              </Button>
                                            </div></>) },
                      ];
                              return <DataTable columns={columns} data={quotations} rowKey={(q: any) => q.id} />;
                          })()}</>
          ))}

        {tab === "orders" &&
          (orders.length === 0 ? (
            <p className="ui-empty-state">No sales orders yet.</p>
          ) : (
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Number" , render: (o: any) => (<>{o.orderNumber}</>) },
                        { key: "col_1", header: "Status" , render: (o: any) => (<><StatusBadge status={o.status} /></>) },
                        { key: "col_2", header: "Total" , render: (o: any) => (<>{o.currency}{Number(o.totalAmount).toFixed(2)}</>) },
                        { key: "col_3", header: "Order date" , render: (o: any) => (<>{new Date(o.orderDate).toLocaleDateString()}</>) },
                      ];
                              return <DataTable columns={columns} data={orders} rowKey={(o: any) => o.id} />;
                          })()}</>
          ))}

        {tab === "invoices" &&
          (invoices.length === 0 ? (
            <p className="ui-empty-state">No invoices yet.</p>
          ) : (
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Number" , render: (i: any) => (<>{i.invoiceNumber}</>) },
                        { key: "col_1", header: "Status" , render: (i: any) => (<><StatusBadge status={i.status} /></>) },
                        { key: "col_2", header: "Total" , render: (i: any) => (<>{i.currency}{Number(i.totalAmount).toFixed(2)}</>) },
                        { key: "col_3", header: "Paid" , render: (i: any) => (<>{i.currency}{Number(i.paidAmount).toFixed(2)}</>) },
                        { key: "col_4", header: "Due date" , render: (i: any) => (<>{new Date(i.dueDate).toLocaleDateString()}</>) },
                        { key: "col_5", header: "Actions" , render: (i: any) => { const outstanding = Number(i.totalAmount) - Number(i.paidAmount); return (<><div className={styles.s7}>
                                                  {i.status !== "PAID" && outstanding > 0 && (
                                                    <Button
                                                      size="sm"
                                                      onClick={() => {
                                                        setPayingInvoiceId(i.id);
                                                        setPayAmount(outstanding.toFixed(2));
                                                      }}
                                                    >
                                                      <CreditCard size={14} /> Pay Now
                                                    </Button>
                                                  )}
                                                  <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() =>
                                                      handleDownloadInvoicePdf(i.id, i.invoiceNumber)
                                                    }
                                                  >
                                                    <Download size={14} /> PDF
                                                  </Button>
                                                </div></>); } },
                      ];
                              return <DataTable columns={columns} data={invoices}  />;
                          })()}</>
          ))}

        {tab === "cases" && (
          <>
            <div className={styles.s10}>
              <Button size="sm" onClick={() => setShowNewCase((v: any) => !v)}>
                <Plus size={14} /> New case
              </Button>
            </div>
            {showNewCase && (
              <div className={styles.s11}>
                <div className="ui-form-group">
                  <label className="ui-label">Subject</label>
                  <input
                    className="ui-input"
                    value={newCaseSubject}
                    onChange={(e: any) => setNewCaseSubject(e.target.value)}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Description</label>
                  <textarea
                    className="ui-input"
                    rows={3}
                    value={newCaseDescription}
                    onChange={(e: any) => setNewCaseDescription(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateCase}
                  disabled={!newCaseSubject.trim()}
                >
                  Submit
                </Button>
              </div>
            )}
            {cases.length === 0 ? (
              <p className="ui-empty-state">No support cases yet.</p>
            ) : (
              <>{(() => {
                                      const columns = [
                                { key: "col_0", header: "Case #" , render: (c: any) => (<>{c.caseNumber}</>) },
                                { key: "col_1", header: "Subject" , render: (c: any) => (<>{c.subject}</>) },
                                { key: "col_2", header: "Priority" , render: (c: any) => (<>{c.priority}</>) },
                                { key: "col_3", header: "Status" , render: (c: any) => (<><StatusBadge status={c.status} /></>) },
                                { key: "col_4", header: "Opened" , render: (c: any) => (<>{new Date(c.createdAt).toLocaleDateString()}</>) },
                              ];
                                      return <DataTable columns={columns} data={cases} rowKey={(c: any) => c.id} />;
                                  })()}</>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
