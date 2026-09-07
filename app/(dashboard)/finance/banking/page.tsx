"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import {
  Wallet,
  GitCompare,
  DollarSign,
  Activity,
  BarChart3,
  TrendingUp,
  CreditCard,
  Download,
  AlertTriangle,
  Plus,
} from "lucide-react";

import { SubTabBar } from "@/components/finance/SubTabBar";
import { ListView, FormView, RouteGuard, useApiClient } from "@kannan19302/framework";
import { bankAccountResource } from "@/modules/finance";
import dynamic from "next/dynamic";
import { Button, Card, Modal, PageHeader, useToast, Spinner } from "@kannan19302/ui";
import * as Charts from "@kannan19302/ui/charts";

interface WaterfallDataPoint {
  label: string;
  value: number;
  isTotal?: boolean;
}

function FallbackWaterfallChart({
  data,
  height = 260,
}: {
  data: WaterfallDataPoint[];
  height?: number;
  showConnectors?: boolean;
}) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <div style={{ height, display: "flex", alignItems: "flex-end", gap: "var(--space-3)", padding: "var(--space-3) 0", overflowX: "auto" }}>
      {data.map((d, i) => {
        const barHeight = Math.max((Math.abs(d.value) / maxAbs) * (height - 60), 4);
        const color = d.isTotal
          ? "var(--color-brand)"
          : d.value >= 0
          ? "var(--color-success)"
          : "var(--color-danger)";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72, flex: 1 }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color, marginBottom: "var(--space-1)" }}>
              {d.value >= 0 ? "+" : ""}{d.value.toLocaleString()}
            </span>
            <div
              style={{
                width: "100%",
                maxWidth: 48,
                height: barHeight,
                background: color,
                borderRadius: "var(--radius-sm)",
                opacity: d.isTotal ? 1 : 0.85,
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)", textAlign: "center" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const WaterfallChart = (Charts as any).WaterfallChart || FallbackWaterfallChart;

const ReconciliationsPage = dynamic(() => import("../advanced/reconciliations/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const BankFeedsPage = dynamic(() => import("../advanced/bank-feeds/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const BankReconPage = dynamic(() => import("../advanced/bank-recon/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const CashPositionPage = dynamic(() => import("../advanced/cash-position/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const CashFlowForecastPage = dynamic(() => import("../advanced/cash-flow-forecast/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ReportsPage = dynamic(() => import("../advanced/reports/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const TreasuryPage = dynamic(() => import("../advanced/treasury/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const CorporateCardsPage = dynamic(() => import("../advanced/corporate-cards/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});

const BANKING_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/banking",
    icon: Activity,
    description: "Banking summary and cash position",
  },
  {
    id: "bank-accounts",
    label: "Bank Accounts",
    href: "/finance/banking?tab=bank-accounts",
    icon: Wallet,
    description: "Manage bank accounts",
  },
  {
    id: "reconciliation",
    label: "Bank Reconciliation",
    href: "/finance/banking?tab=reconciliation",
    icon: GitCompare,
    description: "Reconcile bank statements",
  },
  {
    id: "cash-position",
    label: "Cash Position",
    href: "/finance/banking?tab=cash-position",
    icon: DollarSign,
    description: "Real-time cash position",
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    href: "/finance/banking?tab=cash-flow",
    icon: Activity,
    description: "Cash flow analysis",
  },
  {
    id: "treasury",
    label: "Treasury",
    href: "/finance/banking?tab=treasury",
    icon: BarChart3,
    description: "Treasury operations",
  },
  {
    id: "corporate-cards",
    label: "Corporate Cards",
    href: "/finance/banking?tab=corporate-cards",
    icon: CreditCard,
    description: "Card spend limits and management",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "investments",
    label: "Investments",
    href: "/finance/banking?tab=investments",
    icon: TrendingUp,
    description: "Investment tracking",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "forecasting",
    label: "Forecasting",
    href: "/finance/banking?tab=forecasting",
    icon: TrendingUp,
    description: "Cash flow forecasting",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "payment-gateway",
    label: "Payment Gateway",
    href: "/finance/banking?tab=payment-gateway",
    icon: CreditCard,
    description: "Payment gateway configuration",
    advanced: true,
    group: "Advanced Treasury",
  },
  {
    id: "bank-import-rules",
    label: "Bank Import Rules",
    href: "/finance/banking?tab=bank-import-rules",
    icon: Download,
    description: "Bank statement import rules",
    advanced: true,
    group: "Advanced Treasury",
  },
];

interface BankingSummary {
  totalCash: number;
  accountCount: number;
}

const EMPTY_BANKING_SUMMARY: BankingSummary = { totalCash: 0, accountCount: 0 };

export default function BankingPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const { error: notifyError, success: notifySuccess } = useToast();
  const [summary, setSummary] = useState<BankingSummary>(EMPTY_BANKING_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountKey, setAccountKey] = useState(0);

  const baseCash = summary.totalCash;
  const cashWaterfallData = [
    { label: "Opening Cash", value: baseCash, isTotal: true },
    { label: "Projected Cash", value: baseCash, isTotal: true },
  ];

  useEffect(() => {
    if (authStatus !== "authenticated" || activeTab !== "overview") return;
    let cancelled = false;
    client
      .list<{ balance: number }>("/advanced-finance/bank-accounts", {
        pageSize: 500,
      })
      .then((res: any) => {
        if (cancelled) return;
        const accounts = Array.isArray(res) ? res : (res?.data ?? []);
        setSummary({
          totalCash: accounts.reduce((s: any, a: any) => s + Number(a.balance || 0), 0),
          accountCount: res.total ?? accounts.length,
        });
        setSummaryError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load banking summary";
        setSummaryError(message);
        notifyError("Failed to load Banking summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus, activeTab, client, notifyError, accountKey]);

  return (
    <RouteGuard permission="finance.bank-account.read">
      {/* Centralized Bank Account Creation Modal */}
      <Modal
        open={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        title="New Bank Account"
      >
        <FormView
          resource={bankAccountResource}
          onSuccess={() => {
            setShowCreateAccount(false);
            notifySuccess("Bank account connected successfully");
            setAccountKey((k) => k + 1);
          }}
          onCancel={() => setShowCreateAccount(false)}
        />
      </Modal>

      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load banking summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}

          <div className="ui-flex-between ui-items-center">
            <div>
              <h2 className="ui-heading-md">Banking & Treasury Hub</h2>
              <p className="ui-text-xs-muted">
                Real-time cash balances, multi-bank feeds, auto-reconciliation, and liquidity forecasting
              </p>
            </div>
            <div className="ui-flex-row" style={{ gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/banking?tab=reconciliation")}
              >
                Reconciliation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/banking?tab=cash-position&subtab=forecast")}
              >
                Cash Forecast
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateAccount(true)}
              >
                <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
                Connect Account
              </Button>
            </div>
          </div>

          <div className="ui-grid-2">
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/banking?tab=bank-accounts")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Total Cash Balance</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-primary)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.totalCash.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  Across {summary.accountCount} accounts · Click to view
                </p>
              </div>
            </Card>
            <Card
              padding="md"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/finance/banking?tab=cash-position")}
            >
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">
                  Cash Flow Forecast &amp; Reconciliation
                </p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-success)" }}
                >
                  Active Telemetry
                </p>
                <p className="ui-text-xs-muted">
                  See Cash Position and Bank Reconciliation tabs · Click to open
                </p>
              </div>
            </Card>
          </div>
          <Card padding="md">
            <h3
              className="ui-heading-sm"
              style={{ marginBottom: "var(--space-3)" }}
            >
              Liquidity &amp; Cash Flow Waterfall
            </h3>
            <WaterfallChart
              data={cashWaterfallData}
              height={260}
              showConnectors={true}
            />
          </Card>
          <Card padding="md">
            <div className="ui-flex-between ui-items-center" style={{ marginBottom: "var(--space-3)" }}>
              <h3 className="ui-heading-sm">Bank Accounts</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/finance/banking?tab=bank-accounts")}
              >
                View all accounts
              </Button>
            </div>
            <ListView
              key={`bank-acc-${accountKey}`}
              resource={bankAccountResource}
              onCreate={() => setShowCreateAccount(true)}
            />
          </Card>
        </div>
      )}
      {activeTab === "bank-accounts" && (
        <div className="ui-stack-4 ui-animate-in">
          <PageHeader
            title="Bank Accounts"
            description="Manage bank accounts and opening balances"
          />
          <ListView
            key={`ba-list-${accountKey}`}
            resource={bankAccountResource}
            onCreate={() => setShowCreateAccount(true)}
          />
        </div>
      )}
      {activeTab === "reconciliation" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "recon",
                label: "Bank Reconciliation",
                href: "/finance/banking?tab=reconciliation&subtab=recon",
              },
              {
                id: "feeds",
                label: "Bank Feeds & Connections",
                href: "/finance/banking?tab=reconciliation&subtab=feeds",
              },
              {
                id: "auto",
                label: "Bank Statement Auto-Match",
                href: "/finance/banking?tab=reconciliation&subtab=auto",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "feeds" ? (
              <BankFeedsPage />
            ) : subTab === "auto" ? (
              <BankReconPage />
            ) : (
              <ReconciliationsPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "cash-position" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "position",
                label: "Cash Position",
                href: "/finance/banking?tab=cash-position&subtab=position",
              },
              {
                id: "forecast",
                label: "Cash Flow Forecast",
                href: "/finance/banking?tab=cash-position&subtab=forecast",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "forecast" ? (
              <CashFlowForecastPage />
            ) : (
              <CashPositionPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "cash-flow" && (
        <div className="ui-stack-4 ui-animate-in">
          <CashFlowForecastPage />
        </div>
      )}
      {activeTab === "treasury" && (
        <div className="ui-stack-4 ui-animate-in">
          <TreasuryPage />
        </div>
      )}
      {activeTab === "corporate-cards" && (
        <div className="ui-stack-4 ui-animate-in">
          <CorporateCardsPage />
        </div>
      )}
      {activeTab === "investments" && (
        <div className="ui-stack-4 ui-animate-in">
          <TreasuryPage />
        </div>
      )}
      {activeTab === "forecasting" && (
        <div className="ui-stack-4 ui-animate-in">
          <CashFlowForecastPage />
        </div>
      )}
      {activeTab === "payment-gateway" && (
        <div className="ui-stack-4 ui-animate-in">
          <BankFeedsPage />
        </div>
      )}
      {activeTab === "bank-import-rules" && (
        <div className="ui-stack-4 ui-animate-in">
          <BankReconPage />
        </div>
      )}
    </RouteGuard>
  );
}
