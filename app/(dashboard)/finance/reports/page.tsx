"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Scale,
  PieChart,
  FileText,
} from "lucide-react";

import dynamic from "next/dynamic";
import { RouteGuard } from "@kannan19302/framework";
import { Card, Spinner, Button } from "@kannan19302/ui";

const ReportsPage = dynamic(() => import("../advanced/reports/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const FinancialRatiosPage = dynamic(() => import("../advanced/financial-ratios/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});

const REPORTS_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/reports",
    icon: PieChart,
    description: "Reports overview",
  },
  {
    id: "balance-sheet",
    label: "Balance Sheet",
    href: "/finance/reports?tab=balance-sheet",
    icon: Scale,
    description: "Balance sheet statement",
  },
  {
    id: "profit-loss",
    label: "Profit & Loss",
    href: "/finance/reports?tab=profit-loss",
    icon: TrendingUp,
    description: "Income statement",
  },
  {
    id: "cash-flow",
    label: "Cash Flow",
    href: "/finance/reports?tab=cash-flow",
    icon: Activity,
    description: "Cash flow statement",
  },
  {
    id: "trial-balance",
    label: "Trial Balance",
    href: "/finance/reports?tab=trial-balance",
    icon: BarChart3,
    description: "Trial balance report",
  },
  {
    id: "financial-ratios",
    label: "Financial Ratios",
    href: "/finance/reports?tab=financial-ratios",
    icon: PieChart,
    description: "Key financial ratio analysis",
  },
  {
    id: "custom-reports",
    label: "Custom Reports",
    href: "/finance/reports?tab=custom-reports",
    icon: FileText,
    description: "Custom report builder",
  },
];

export default function FinanceReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  return (
    <RouteGuard permission="finance.report.read">
      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          <div className="ui-flex-between ui-items-center">
            <div>
              <h2 className="ui-heading-md">Financial Reports &amp; Statements Hub</h2>
              <p className="ui-text-xs-muted">
                Standardized GAAP/IFRS financial statements, real-time trial balance, and operational financial ratios
              </p>
            </div>
            <div className="ui-flex-row" style={{ gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/reports?tab=cash-flow")}
              >
                Cash Flow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/reports?tab=financial-ratios")}
              >
                Financial Ratios
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/finance/reports?tab=profit-loss")}
              >
                P&amp;L Statement
              </Button>
            </div>
          </div>

          <div
            className="ui-grid-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            <Card
              padding="md"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                router.push("/finance/reports?tab=balance-sheet");
              }}
            >
              <Scale size={24} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              <div>
                <h3 className="ui-heading-sm">Balance Sheet</h3>
                <p className="ui-text-xs-muted">Assets, Liabilities &amp; Equity</p>
              </div>
            </Card>
            <Card
              padding="md"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                router.push("/finance/reports?tab=profit-loss");
              }}
            >
              <TrendingUp size={24} style={{ color: "var(--color-success)", flexShrink: 0 }} />
              <div>
                <h3 className="ui-heading-sm">Profit &amp; Loss</h3>
                <p className="ui-text-xs-muted">Revenue &amp; Expenses</p>
              </div>
            </Card>
            <Card
              padding="md"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                router.push("/finance/reports?tab=cash-flow");
              }}
            >
              <Activity size={24} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
              <div>
                <h3 className="ui-heading-sm">Cash Flow</h3>
                <p className="ui-text-xs-muted">Operating, Investing &amp; Financing</p>
              </div>
            </Card>
            <Card
              padding="md"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                router.push("/finance/reports?tab=financial-ratios");
              }}
            >
              <BarChart3 size={24} style={{ color: "var(--color-brand)", flexShrink: 0 }} />
              <div>
                <h3 className="ui-heading-sm">Financial Ratios</h3>
                <p className="ui-text-xs-muted">Liquidity, Solvency &amp; Margins</p>
              </div>
            </Card>
          </div>
          <ReportsPage initialReport="pnl" />
        </div>
      )}
      {activeTab === "balance-sheet" && (
        <div className="ui-stack-4 ui-animate-in">
          <ReportsPage initialReport="balance-sheet" />
        </div>
      )}
      {activeTab === "profit-loss" && (
        <div className="ui-stack-4 ui-animate-in">
          <ReportsPage initialReport="pnl" />
        </div>
      )}
      {activeTab === "cash-flow" && (
        <div className="ui-stack-4 ui-animate-in">
          <ReportsPage initialReport="cash-flow" />
        </div>
      )}
      {activeTab === "trial-balance" && (
        <div className="ui-stack-4 ui-animate-in">
          <ReportsPage initialReport="trial-balance" />
        </div>
      )}
      {activeTab === "financial-ratios" && (
        <div className="ui-stack-4 ui-animate-in">
          <FinancialRatiosPage />
        </div>
      )}
      {activeTab === "custom-reports" && (
        <div className="ui-stack-4 ui-animate-in">
          <ReportsPage initialReport="pnl" />
        </div>
      )}
    </RouteGuard>
  );
}
