"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Settings,
  DollarSign,
  Calendar,
  ShieldCheck,
  Zap,
  Link2,
  Database,
} from "lucide-react";
import { SettingsShell, type SettingsItem } from "@kannan19302/ui/shell";
import dynamic from "next/dynamic";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { FinanceDemoDataCard } from "@/components/finance/FinanceDemoDataCard";
import { FinanceSettingsForm } from "@/components/finance/settings/FinanceSettingsForm";
import { Button, Card, Spinner } from "@kannan19302/ui";

const FinancialPeriodsPage = dynamic(() => import("../advanced/financial-periods/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ExchangeRatesPage = dynamic(() => import("../advanced/exchange-rates/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const RecurringInvoicesPage = dynamic(() => import("../advanced/recurring/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const FxRevaluationPage = dynamic(() => import("../advanced/fx-revaluation/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const CurrencyRevaluationPage = dynamic(() => import("../advanced/currency-revaluation/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const CloseTasksPage = dynamic(() => import("../advanced/close-tasks/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});
const ConsolidationPage = dynamic(() => import("../advanced/consolidation/page"), {
  loading: () => <div className="ui-flex-center" style={{ padding: "var(--space-8)" }}><Spinner size="lg" /></div>,
  ssr: false,
});

const SETTINGS_ITEMS: SettingsItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/settings",
    group: "General Accounting",
    keywords: ["summary", "finance", "quickstart", "hub"],
  },
  {
    id: "accounting",
    label: "Accounting Configuration",
    href: "/finance/settings?tab=accounting",
    group: "General Accounting",
    keywords: ["general", "gl", "ledger", "periods", "calendar", "posting"],
  },
  {
    id: "currencies",
    label: "Currencies & Exchange Rates",
    href: "/finance/settings?tab=currencies",
    group: "General Accounting",
    keywords: ["fx", "exchange", "multi-currency", "revaluation", "rates", "forex"],
  },
  {
    id: "fiscal-years",
    label: "Fiscal Years & Close",
    href: "/finance/settings?tab=fiscal-years",
    group: "General Accounting",
    keywords: ["period", "close", "month-end", "year-end", "consolidation", "calendar"],
  },
  {
    id: "approval-rules",
    label: "Approval Rules",
    href: "/finance/settings?tab=approval-rules",
    group: "Rules & Automation",
    keywords: ["approvals", "limits", "authorization", "workflows", "governance"],
  },
  {
    id: "automation",
    label: "Automation & Recurring",
    href: "/finance/settings?tab=automation",
    group: "Rules & Automation",
    keywords: ["recurring", "schedules", "cron", "invoices", "automation"],
  },
  {
    id: "integrations",
    label: "External Integrations",
    href: "/finance/settings?tab=integrations",
    group: "Rules & Automation",
    keywords: ["banks", "integrations", "plaid", "yodlee", "rates", "feeds"],
  },
  {
    id: "demo-data",
    label: "Demo & Seed Data",
    href: "/finance/settings?tab=demo-data",
    group: "Environment",
    keywords: ["seed", "demo", "fixtures", "reset", "sample", "sandbox"],
  },
];

export default function FinanceSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");

  return (
    <SettingsShell
      items={SETTINGS_ITEMS}
      activeId={activeTab}
      searchLabel="Search finance configuration…"
      density="compact"
    >
      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          <div className="ui-flex-between ui-items-center">
            <div>
              <h2 className="ui-heading-md" style={{ marginBottom: "var(--space-1)" }}>
                Finance &amp; Accounting Configuration
              </h2>
              <p className="ui-text-xs-muted">
                Configure accounting standards, multi-currency ledger preferences, fiscal calendars, and automation rules.
              </p>
            </div>
            <div className="ui-flex-row" style={{ gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/settings?tab=currencies")}
              >
                Currencies &amp; FX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/finance/settings?tab=fiscal-years")}
              >
                Fiscal Years
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push("/finance/settings?tab=accounting")}
              >
                Accounting Standards
              </Button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "var(--space-4)",
              gridTemplateColumns: "repeat(auto-fill, minmax(var(--panel-width), 1fr))",
            }}
          >
            <Card
              padding="lg"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                router.push("/finance/settings?tab=accounting");
              }}
            >
              <Settings size={24} className="ui-text-primary" />
              <div>
                <h3 className="ui-heading-sm">Accounting Settings</h3>
                <p className="ui-text-xs-muted">
                  Default currency, numbering sequences, GL posting rules
                </p>
              </div>
            </Card>
            <Card
              padding="lg"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                router.push("/finance/settings?tab=currencies");
              }}
            >
              <DollarSign size={24} className="ui-text-success" />
              <div>
                <h3 className="ui-heading-sm">Currencies</h3>
                <p className="ui-text-xs-muted">
                  Base currency, active exchange rate pairs, revaluation
                </p>
              </div>
            </Card>
            <Card
              padding="lg"
              className="ui-hstack-3"
              style={{ cursor: "pointer" }}
              onClick={() => {
                router.push("/finance/settings?tab=fiscal-years");
              }}
            >
              <Calendar size={24} className="ui-text-warning" />
              <div>
                <h3 className="ui-heading-sm">Fiscal Years</h3>
                <p className="ui-text-xs-muted">
                  Period dates, close management, consolidation books
                </p>
              </div>
            </Card>
          </div>

          <FinanceSettingsForm />

          <FinanceDemoDataCard />
        </div>
      )}

      {activeTab === "demo-data" && (
        <div className="ui-stack-4 ui-animate-in">
          <FinanceDemoDataCard />
        </div>
      )}

      {activeTab === "accounting" && (
        <div className="ui-stack-4 ui-animate-in">
          <FinanceSettingsForm />
        </div>
      )}

      {activeTab === "currencies" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "rates",
                label: "Multi-Currency",
                href: "/finance/settings?tab=currencies&subtab=rates",
              },
              {
                id: "fx",
                label: "FX Revaluation",
                href: "/finance/settings?tab=currencies&subtab=fx",
              },
              {
                id: "reval",
                label: "Currency Revaluation",
                href: "/finance/settings?tab=currencies&subtab=reval",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "fx" ? (
              <FxRevaluationPage />
            ) : subTab === "reval" ? (
              <CurrencyRevaluationPage />
            ) : (
              <ExchangeRatesPage />
            )}
          </div>
        </div>
      )}

      {activeTab === "fiscal-years" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "periods",
                label: "Financial Periods",
                href: "/finance/settings?tab=fiscal-years&subtab=periods",
              },
              {
                id: "close",
                label: "Close Tasks",
                href: "/finance/settings?tab=fiscal-years&subtab=close",
              },
              {
                id: "consolidation",
                label: "Consolidation",
                href: "/finance/settings?tab=fiscal-years&subtab=consolidation",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "close" ? (
              <CloseTasksPage />
            ) : subTab === "consolidation" ? (
              <ConsolidationPage />
            ) : (
              <FinancialPeriodsPage />
            )}
          </div>
        </div>
      )}

      {activeTab === "approval-rules" && (
        <div className="ui-stack-4 ui-animate-in">
          <FinanceSettingsForm />
        </div>
      )}

      {activeTab === "automation" && (
        <div className="ui-stack-4 ui-animate-in">
          <RecurringInvoicesPage />
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="ui-stack-4 ui-animate-in">
          <ExchangeRatesPage />
        </div>
      )}
    </SettingsShell>
  );
}
