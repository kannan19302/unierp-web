"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import {
  FileText,
  Building2,
  CreditCard,
  Layers,
  ScanSearch,
  ShoppingCart,
  GitCompare,
  AlertTriangle,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { FormView, ListView, RouteGuard, useApiClient } from "@kannan19302/framework";
import {
  debitNoteResource,
  vendorBillPaymentResource,
  vendorBillResource,
} from "@/modules/finance";
import { vendorResource } from "@/modules/crm";
import dynamic from "next/dynamic";
import { Button, Card, Modal, PageHeader, useToast, Spinner } from "@kannan19302/ui";

const PaymentBatchesPage = dynamic(() => import("../advanced/payment-batches/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const PaymentTermsPage = dynamic(() => import("../advanced/payment-terms/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ExpensePoliciesPage = dynamic(() => import("../advanced/expense-policies/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ExpenseReportsPage = dynamic(() => import("../advanced/expense-reports/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const InvoiceCapturePage = dynamic(() => import("../advanced/invoice-capture/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ApAutomationPage = dynamic(() => import("../advanced/ap-automation/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ApMatchRulesPage = dynamic(() => import("../advanced/ap-match-rules/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ExceptionQueuePage = dynamic(() => import("../advanced/exception-queue/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});

const AP_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/ap",
    icon: FileText,
    description: "Accounts Payable summary",
  },
  {
    id: "bills",
    label: "Bills",
    href: "/finance/ap?tab=bills",
    icon: FileText,
    description: "Vendor bills and payable invoices",
  },
  {
    id: "vendors",
    label: "Vendors",
    href: "/finance/ap?tab=vendors",
    icon: Building2,
    description: "Vendor directory",
  },
  {
    id: "debit-notes",
    label: "Debit Notes",
    href: "/finance/ap?tab=debit-notes",
    icon: FileText,
    description: "Vendor debit notes and adjustments",
  },
  {
    id: "payments",
    label: "Payments",
    href: "/finance/ap?tab=payments",
    icon: CreditCard,
    description: "Outgoing payments",
  },
  {
    id: "payment-batches",
    label: "Payment Batches",
    href: "/finance/ap?tab=payment-batches",
    icon: Layers,
    description: "Batch payment processing",
  },
  {
    id: "expense-policies",
    label: "Expense Policies",
    href: "/finance/ap?tab=expense-policies",
    icon: ShieldCheck,
    description: "Expense policies, mileage, per-diem, and corporate cards",
  },
  {
    id: "ai-invoice-capture",
    label: "AI Invoice Capture",
    href: "/finance/ap?tab=ai-invoice-capture",
    icon: ScanSearch,
    description: "AI-powered invoice data extraction",
    advanced: true,
    group: "AP Automation",
  },
  {
    id: "ap-automation",
    label: "AP Automation",
    href: "/finance/ap?tab=ap-automation",
    icon: ShoppingCart,
    description: "Full AP workflow automation",
    advanced: true,
    group: "AP Automation",
  },
  {
    id: "ap-match-rules",
    label: "AP Match Rules",
    href: "/finance/ap?tab=ap-match-rules",
    icon: GitCompare,
    description: "Invoice-to-PO matching rules",
    advanced: true,
    group: "AP Automation",
  },
  {
    id: "exception-queue",
    label: "Exception Queue",
    href: "/finance/ap?tab=exception-queue",
    icon: AlertTriangle,
    description: "AP exceptions and resolution",
    advanced: true,
    group: "AP Automation",
  },
];

function DebitNotesPanel() {
  const { success } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="ui-stack-4">
      <ListView
        key={refreshKey}
        resource={debitNoteResource}
        onCreate={() => setShowCreate(true)}
      />
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Debit Note"
        size="lg"
      >
        <FormView
          resource={debitNoteResource}
          onSuccess={() => {
            setShowCreate(false);
            success("Debit note created");
            setRefreshKey((k: any) => k + 1);
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

interface ApSummary {
  totalOutstanding: number;
  totalBills: number;
  dueThisWeekAmount: number;
  dueThisWeekCount: number;
  processedThisMonthAmount: number;
  processedThisMonthCount: number;
}

const EMPTY_AP_SUMMARY: ApSummary = {
  totalOutstanding: 0,
  totalBills: 0,
  dueThisWeekAmount: 0,
  dueThisWeekCount: 0,
  processedThisMonthAmount: 0,
  processedThisMonthCount: 0,
};

export default function APPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const { success, error: notifySummaryError } = useToast();
  const [summary, setSummary] = useState<ApSummary>(EMPTY_AP_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showCreateBill, setShowCreateBill] = useState(false);
  const [billsKey, setBillsKey] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated" || activeTab !== "overview") return;
    let cancelled = false;
    Promise.all([
      client.get<{ total: number; totalOutstanding: number }>(
        "/finance/vendor-bills/stats",
      ),
      client.list<{
        status: string;
        dueDate: string;
        totalAmount: number;
        paidAmount: number;
      }>("/finance/vendor-bills", { pageSize: 500 }),
    ])
      .then(([stats, billsResult]: any) => {
        if (cancelled) return;
        const bills = Array.isArray(billsResult)
          ? billsResult
          : billsResult?.data ?? [];
        const now = new Date();
        const weekOut = new Date(now.getTime() + 7 * 86400000);
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        let dueThisWeekAmount = 0;
        let dueThisWeekCount = 0;
        let processedThisMonthAmount = 0;
        let processedThisMonthCount = 0;

        for (const b of bills) {
          const due = new Date(b.dueDate);
          if (
            b.status !== "PAID" &&
            b.status !== "VOID" &&
            due >= now &&
            due <= weekOut
          ) {
            dueThisWeekAmount += b.totalAmount - b.paidAmount;
            dueThisWeekCount++;
          }
          if (
            b.status === "PAID" &&
            due.getMonth() === thisMonth &&
            due.getFullYear() === thisYear
          ) {
            processedThisMonthAmount += b.totalAmount;
            processedThisMonthCount++;
          }
        }

        setSummary({
          totalOutstanding: stats?.totalOutstanding ?? 0,
          totalBills: stats?.total ?? 0,
          dueThisWeekAmount,
          dueThisWeekCount,
          processedThisMonthAmount,
          processedThisMonthCount,
        });
        setSummaryError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load AP summary";
        setSummaryError(message);
        notifySummaryError("Failed to load Accounts Payable summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus, activeTab, client, notifySummaryError, billsKey]);

  return (
    <RouteGuard permission="finance.payables.read">
      {/* Centralized Vendor Bill Creation Modal */}
      <Modal
        open={showCreateBill}
        onClose={() => setShowCreateBill(false)}
        title="Create Vendor Bill"
        size="lg"
      >
        <FormView
          resource={vendorBillResource}
          onSuccess={() => {
            setShowCreateBill(false);
            success("Vendor bill created");
            setBillsKey((k: any) => k + 1);
          }}
          onCancel={() => setShowCreateBill(false)}
        />
      </Modal>

      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load AP summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}

          <div className="ui-flex-between ui-items-center">
            <div>
              <h2 className="ui-heading-md">Accounts Payable Hub</h2>
              <p className="ui-text-xs-muted">
                Vendor bills, three-way matching, approval workflows, and payment runs
              </p>
            </div>
            <div className="ui-flex-row" style={{ gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/ap?tab=vendors")}
              >
                Vendors
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/ap?tab=payment-batches")}
              >
                Payment Batches
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateBill(true)}
              >
                <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
                New Bill
              </Button>
            </div>
          </div>

          <div className="ui-grid-3">
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/ap?tab=bills")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Outstanding Payables</p>
                <p
                  className="ui-heading-sm"
                  style={{
                    color: "var(--color-primary)",
                    fontVariantNumeric: "tabular-nums lining-nums",
                  }}
                >
                  {summary.totalOutstanding.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  Across {summary.totalBills} bills · Click to view
                </p>
              </div>
            </Card>
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/ap?tab=bills")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Due This Week</p>
                <p
                  className="ui-heading-sm"
                  style={{
                    color: "var(--color-warning)",
                    fontVariantNumeric: "tabular-nums lining-nums",
                  }}
                >
                  {summary.dueThisWeekAmount.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  {summary.dueThisWeekCount} bills due · Click to schedule
                </p>
              </div>
            </Card>
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/ap?tab=payments")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Processed This Month</p>
                <p
                  className="ui-heading-sm"
                  style={{
                    color: "var(--color-success)",
                    fontVariantNumeric: "tabular-nums lining-nums",
                  }}
                >
                  {summary.processedThisMonthAmount.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  {summary.processedThisMonthCount} bills paid · Click for payments
                </p>
              </div>
            </Card>
          </div>
          <Card padding="md">
            <div className="ui-flex-between ui-items-center" style={{ marginBottom: "var(--space-3)" }}>
              <h3 className="ui-heading-sm">Vendor Bills</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/finance/ap?tab=bills")}
              >
                View all bills
              </Button>
            </div>
            <ListView
              key={`ap-b-${billsKey}`}
              resource={vendorBillResource}
              onCreate={() => setShowCreateBill(true)}
            />
          </Card>
        </div>
      )}
      {activeTab === "bills" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Bills"
            description="Manage vendor bills and accounts payable"
          />
          <ListView
            key={billsKey}
            resource={vendorBillResource}
            onCreate={() => setShowCreateBill(true)}
          />
        </div>
      )}
      {activeTab === "vendors" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Vendors"
            description="Vendor directory and management"
          />
          <ListView resource={vendorResource} />
        </div>
      )}
      {activeTab === "debit-notes" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Debit Notes"
            description="Vendor debit notes and adjustments"
          />
          <DebitNotesPanel />
        </div>
      )}
      {activeTab === "payments" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Payments"
            description="Process outgoing payments to vendors"
          />
          <ListView resource={vendorBillPaymentResource} />
        </div>
      )}
      {activeTab === "payment-batches" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "batches",
                label: "Payment Batches",
                href: "/finance/ap?tab=payment-batches&subtab=batches",
              },
              {
                id: "terms",
                label: "Payment Terms",
                href: "/finance/ap?tab=payment-batches&subtab=terms",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "terms" ? <PaymentTermsPage /> : <PaymentBatchesPage />}
          </div>
        </div>
      )}
      {activeTab === "expense-policies" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "policies",
                label: "Expense Policies",
                href: "/finance/ap?tab=expense-policies&subtab=policies",
              },
              {
                id: "reports",
                label: "Expense Reports",
                href: "/finance/ap?tab=expense-policies&subtab=reports",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "reports" ? (
              <ExpenseReportsPage />
            ) : (
              <ExpensePoliciesPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "ai-invoice-capture" && (
        <div className="ui-stack-4 ui-animate-in">
          <InvoiceCapturePage />
        </div>
      )}
      {activeTab === "ap-automation" && (
        <div className="ui-stack-4 ui-animate-in">
          <ApAutomationPage />
        </div>
      )}
      {activeTab === "ap-match-rules" && (
        <div className="ui-stack-4 ui-animate-in">
          <ApMatchRulesPage />
        </div>
      )}
      {activeTab === "exception-queue" && (
        <div className="ui-stack-4 ui-animate-in">
          <ExceptionQueuePage />
        </div>
      )}
    </RouteGuard>
  );
}
