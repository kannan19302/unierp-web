"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import {
  FileText,
  Users,
  CreditCard,
  RefreshCw,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Receipt,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { FormView, ListView, RouteGuard, useApiClient } from "@kannan19302/framework";
import {
  invoiceResource,
  paymentResource,
  creditNoteResource,
} from "@/modules/finance";
import { customerResource } from "@/modules/crm";
import dynamic from "next/dynamic";
import { Button, Card, Modal, PageHeader, useToast, Spinner } from "@kannan19302/ui";

const ArAgingPage = dynamic(() => import("../advanced/ar-aging/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ArAutomationPage = dynamic(() => import("../advanced/ar-automation/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const CustomerStatementPage = dynamic(() => import("../advanced/customer-statement/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const InvoiceAnalyticsPage = dynamic(() => import("../advanced/invoice-analytics/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const CreditRiskPage = dynamic(() => import("../advanced/credit-risk/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const AccountReconciliationPage = dynamic(() => import("../advanced/account-reconciliation/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const SubscriptionsPage = dynamic(() => import("../advanced/subscriptions/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const RevenueSchedulesPage = dynamic(() => import("../advanced/revenue-schedules/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});

const AR_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/ar",
    icon: BarChart3,
    description: "Accounts Receivable summary",
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/finance/ar?tab=invoices",
    icon: FileText,
    description: "Customer invoices",
  },
  {
    id: "customers",
    label: "Customers",
    href: "/finance/ar?tab=customers",
    icon: Users,
    description: "Customer directory",
  },
  {
    id: "payments",
    label: "Payments",
    href: "/finance/ar?tab=payments",
    icon: CreditCard,
    description: "Incoming payments",
  },
  {
    id: "credit-notes",
    label: "Credit Notes",
    href: "/finance/ar?tab=credit-notes",
    icon: Receipt,
    description: "Customer credit notes and refunds",
  },
  {
    id: "recurring-billing",
    label: "Recurring Billing",
    href: "/finance/ar?tab=recurring-billing",
    icon: RefreshCw,
    description: "Subscription and recurring invoices",
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    href: "/finance/ar?tab=subscriptions",
    icon: RefreshCw,
    description: "Subscription billing and plans",
  },
  {
    id: "revenue-recognition",
    label: "Revenue Recognition",
    href: "/finance/ar?tab=revenue-recognition",
    icon: TrendingUp,
    description: "Deferred revenue schedules",
    advanced: true,
    group: "Advanced AR",
  },
  {
    id: "collections",
    label: "Collections",
    href: "/finance/ar?tab=collections",
    icon: TrendingUp,
    description: "Automated dunning and collections",
    advanced: true,
    group: "Advanced AR",
  },
  {
    id: "aging-analysis",
    label: "Aging Analysis",
    href: "/finance/ar?tab=aging-analysis",
    icon: BarChart3,
    description: "Receivables aging reports",
    advanced: true,
    group: "Advanced AR",
  },
  {
    id: "customer-statements",
    label: "Customer Statements",
    href: "/finance/ar?tab=customer-statements",
    icon: FileSpreadsheet,
    description: "Customer account statements",
    advanced: true,
    group: "Advanced AR",
  },
];

interface ArSummary {
  outstandingAr: number;
  totalInvoices: number;
  overdueAmount: number;
  overdueInvoices: number;
  collectedThisMonth: number;
  collectedLastMonth: number;
}

const EMPTY_AR_SUMMARY: ArSummary = {
  outstandingAr: 0,
  totalInvoices: 0,
  overdueAmount: 0,
  overdueInvoices: 0,
  collectedThisMonth: 0,
  collectedLastMonth: 0,
};

function CreditNotesPanel() {
  const { success } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="ui-stack-4">
      <ListView
        key={refreshKey}
        resource={creditNoteResource}
        onCreate={() => setShowCreate(true)}
      />
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Credit Note"
        size="lg"
      >
        <FormView
          resource={creditNoteResource}
          onSuccess={() => {
            setShowCreate(false);
            success("Credit note created");
            setRefreshKey((k: any) => k + 1);
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}

export default function ARPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const { error: notifyError, success: notifySuccess } = useToast();
  const [summary, setSummary] = useState<ArSummary>(EMPTY_AR_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [invoicesKey, setInvoicesKey] = useState(0);

  useEffect(() => {
    if (authStatus !== "authenticated" || activeTab !== "overview") return;
    let cancelled = false;
    client
      .get<{
        kpis: {
          outstandingAr: number;
          totalInvoices: number;
          overdueInvoices: number;
        };
        charts: {
          cashFlowTrend: Array<{ month: string; inflows: number }>;
          arAgingChart: Array<{ bucket: string; amount: number }>;
        };
      }>("/finance/dashboard")
      .then((res: any) => {
        if (cancelled || !res) return;
        const trend = res.charts?.cashFlowTrend ?? [];
        const overdueAmount = (res.charts?.arAgingChart ?? [])
          .filter((b: any) => b.bucket !== "Current")
          .reduce((sum: any, b: any) => sum + (b.amount || 0), 0);
        setSummary({
          outstandingAr: res.kpis.outstandingAr ?? 0,
          totalInvoices: res.kpis.totalInvoices ?? 0,
          overdueAmount,
          overdueInvoices: res.kpis.overdueInvoices ?? 0,
          collectedThisMonth: trend[trend.length - 1]?.inflows ?? 0,
          collectedLastMonth: trend[trend.length - 2]?.inflows ?? 0,
        });
        setSummaryError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        // Distinct error state — a failed fetch must never render as "$0
        // Outstanding AR", indistinguishable from a genuinely clean book.
        const message =
          err instanceof Error ? err.message : "Failed to load AR summary";
        setSummaryError(message);
        notifyError("Failed to load Accounts Receivable summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus, activeTab, client, notifyError, invoicesKey]);

  const momChange =
    summary.collectedLastMonth > 0
      ? Math.round(
          ((summary.collectedThisMonth - summary.collectedLastMonth) /
            summary.collectedLastMonth) *
            100,
        )
      : null;

  return (
    <RouteGuard permission="finance.invoice.read">
      {/* Centralized Invoice Creation Modal */}
      <Modal
        open={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        title="Create Invoice"
        size="lg"
      >
        <FormView
          resource={invoiceResource}
          onSuccess={() => {
            setShowCreateInvoice(false);
            notifySuccess("Invoice created successfully");
            setInvoicesKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateInvoice(false)}
        />
      </Modal>

      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load AR summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}

          <div className="ui-flex-between ui-items-center">
            <div>
              <h2 className="ui-heading-md">Accounts Receivable Hub</h2>
              <p className="ui-text-xs-muted">
                Invoicing, automated dunning, customer statements, and payment tracking
              </p>
            </div>
            <div className="ui-flex-row" style={{ gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/ar?tab=aging-analysis")}
              >
                Aging Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/ar?tab=payments")}
              >
                Record Payment
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateInvoice(true)}
              >
                <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
                New Invoice
              </Button>
            </div>
          </div>

          <div className="ui-grid-3">
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/ar?tab=invoices")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Outstanding Receivables</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-primary)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.outstandingAr.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  Across {summary.totalInvoices} invoices · Click to view
                </p>
              </div>
            </Card>
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/ar?tab=aging-analysis")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Overdue</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-danger)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.overdueAmount.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  {summary.overdueInvoices} invoices past due · Click for aging
                </p>
              </div>
            </Card>
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/ar?tab=payments")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Collected This Month</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-success)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.collectedThisMonth.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  {momChange === null
                    ? "No data for last month"
                    : `${momChange >= 0 ? "+" : ""}${momChange}% vs last month · Click to view`}
                </p>
              </div>
            </Card>
          </div>
          <Card padding="md">
            <div className="ui-flex-between ui-items-center" style={{ marginBottom: "var(--space-3)" }}>
              <h3 className="ui-heading-sm">Recent Invoices</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/finance/ar?tab=invoices")}
              >
                View all invoices
              </Button>
            </div>
            <ListView
              key={invoicesKey}
              resource={invoiceResource}
              onCreate={() => setShowCreateInvoice(true)}
            />
          </Card>
        </div>
      )}
      {activeTab === "invoices" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader title="Invoices" description="Manage customer invoices" />
          <ListView
            key={invoicesKey}
            resource={invoiceResource}
            onCreate={() => setShowCreateInvoice(true)}
          />
        </div>
      )}
      {activeTab === "customers" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Customers"
            description="Customer directory and account management"
          />
          <ListView resource={customerResource} />
        </div>
      )}
      {activeTab === "payments" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Payments"
            description="Track incoming payments from customers"
          />
          <ListView resource={paymentResource} />
        </div>
      )}
      {activeTab === "credit-notes" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "notes",
                label: "Credit Notes",
                href: "/finance/ar?tab=credit-notes",
              },
              {
                id: "statements",
                label: "Customer Statements",
                href: "/finance/ar?tab=credit-notes&subtab=statements",
              },
              {
                id: "analytics",
                label: "Invoice Analytics",
                href: "/finance/ar?tab=credit-notes&subtab=analytics",
              },
              {
                id: "risk",
                label: "Credit Risk",
                href: "/finance/ar?tab=credit-notes&subtab=risk",
              },
              {
                id: "reconciliation",
                label: "Account Reconciliation",
                href: "/finance/ar?tab=credit-notes&subtab=reconciliation",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "statements" ? (
              <CustomerStatementPage />
            ) : subTab === "analytics" ? (
              <InvoiceAnalyticsPage />
            ) : subTab === "risk" ? (
              <CreditRiskPage />
            ) : subTab === "reconciliation" ? (
              <AccountReconciliationPage />
            ) : (
              <CreditNotesPanel />
            )}
          </div>
        </div>
      )}
      {activeTab === "recurring-billing" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubscriptionsPage />
        </div>
      )}
      {activeTab === "subscriptions" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubscriptionsPage />
        </div>
      )}
      {activeTab === "revenue-recognition" && (
        <div className="ui-stack-4 ui-animate-in">
          <RevenueSchedulesPage />
        </div>
      )}
      {activeTab === "collections" && (
        <div className="ui-stack-4 ui-animate-in">
          <ArAutomationPage />
        </div>
      )}
      {activeTab === "aging-analysis" && (
        <div className="ui-stack-4 ui-animate-in">
          <ArAgingPage />
        </div>
      )}
      {activeTab === "customer-statements" && (
        <div className="ui-stack-4 ui-animate-in">
          <CustomerStatementPage />
        </div>
      )}
    </RouteGuard>
  );
}
