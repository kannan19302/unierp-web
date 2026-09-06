"use client";

import styles from "./page.module.css";
import React, { useEffect, useState } from "react";
import { PageHeader, Card, KPICard, DashboardChart, Button } from "@kannan19302/ui";
import { useApiClient } from "@kannan19302/framework";
import {
  DollarSign,
  TrendingUp,
  Landmark,
  Wallet,
  ShieldAlert,
  Flame,
  RotateCcw,
  Sliders,
} from "lucide-react";

interface CashAccount {
  name: string;
  bankName: string;
  balance: number;
  currency: string;
  type: string;
}

interface DailyFlow {
  date: string;
  inflows: number;
  outflows: number;
}

interface CashPosition {
  totalCash: number;
  operatingCash: number;
  reserves: number;
  netChangeToday: number;
  accounts: CashAccount[];
  dailyFlows: DailyFlow[];
}

type StressScenario = "BASELINE" | "MILD" | "SEVERE" | "EXTREME";

const SCENARIOS: Record<
  StressScenario,
  {
    name: string;
    inflowMultiplier: number;
    outflowMultiplier: number;
    description: string;
    badgeClass: string;
  }
> = {
  BASELINE: {
    name: "Baseline (Actuals)",
    inflowMultiplier: 1.0,
    outflowMultiplier: 1.0,
    description: "Live unadjusted bank balances and ledger flows",
    badgeClass: "ui-badge-gray",
  },
  MILD: {
    name: "Mild Stress (-10% Inflows, +5% Outflows)",
    inflowMultiplier: 0.9,
    outflowMultiplier: 1.05,
    description: "AR collection delay (15-day DSO slippage) and supplier inflation",
    badgeClass: "ui-badge-yellow",
  },
  SEVERE: {
    name: "Severe Shock (-25% Inflows, +15% Outflows)",
    inflowMultiplier: 0.75,
    outflowMultiplier: 1.15,
    description: "Supply chain freeze, key account default, expedited vendor prepayment demands",
    badgeClass: "ui-badge-red",
  },
  EXTREME: {
    name: "Extreme Crisis (-40% Inflows, +25% Outflows)",
    inflowMultiplier: 0.6,
    outflowMultiplier: 1.25,
    description: "Credit line contraction, market downturn, immediate debt service covenant demand",
    badgeClass: "ui-badge-red",
  },
};

const EMPTY: CashPosition = {
  totalCash: 0,
  operatingCash: 0,
  reserves: 0,
  netChangeToday: 0,
  accounts: [],
  dailyFlows: [],
};

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CashPositionPage() {
  const client = useApiClient();
  const [data, setData] = useState<CashPosition>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState<StressScenario>("BASELINE");

  useEffect(() => {
    client
      .get<{ success: boolean; data: CashPosition }>(
        "/finance/reports/cash-position",
      )
      .then((res: any) => setData(res?.data ?? EMPTY))
      .catch(() => setData(EMPTY))
      .finally(() => setLoading(false));
  }, [client]);

  const activeScenario = SCENARIOS[scenario];
  const isStressed = scenario !== "BASELINE";

  const totalInflows = (data.dailyFlows || []).reduce((s, f) => s + Number(f.inflows || 0), 0);
  const totalOutflows = (data.dailyFlows || []).reduce((s, f) => s + Number(f.outflows || 0), 0);
  const stressedInflowLoss = totalInflows * (1 - activeScenario.inflowMultiplier);
  const stressedOutflowSpike = totalOutflows * (activeScenario.outflowMultiplier - 1);
  const totalStressImpact = stressedInflowLoss + stressedOutflowSpike;

  const displayOperatingCash = Math.max(0, data.operatingCash - totalStressImpact);
  const displayTotalCash = Math.max(0, data.totalCash - totalStressImpact);

  const stressedDailyFlows = (data.dailyFlows || []).map((flow) => ({
    ...flow,
    inflows: flow.inflows * activeScenario.inflowMultiplier,
    outflows: flow.outflows * activeScenario.outflowMultiplier,
  }));

  const avgDailyOutflows =
    (data.dailyFlows || []).length > 0
      ? (totalOutflows * activeScenario.outflowMultiplier) / data.dailyFlows.length
      : 0;
  const runwayDays =
    avgDailyOutflows > 0 ? Math.floor(displayTotalCash / avgDailyOutflows) : 999;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Cash Position & Liquidity Stress-Testing"
        description="Real-time multi-bank liquidity monitoring with forward sensitivity shocks and cash runway stress-testing."
      />

      {/* Stress-Testing Scenario Controls */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-[var(--color-brand)]" />
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                Liquidity Stress Scenario:
              </span>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {activeScenario.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(Object.keys(SCENARIOS) as StressScenario[]).map((key) => (
              <button
                key={key}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  scenario === key
                    ? "bg-[var(--color-brand)] text-white border-[var(--color-brand)] font-semibold"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
                }`}
                onClick={() => setScenario(key)}
              >
                {key === "BASELINE" ? "Baseline" : key === "MILD" ? "Mild Stress" : key === "SEVERE" ? "Severe Shock" : "Extreme Crisis"}
              </button>
            ))}
            {isStressed && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setScenario("BASELINE")}
                title="Reset to Baseline"
              >
                <RotateCcw size={12} />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stressed Shock Impact Banner */}
      {isStressed && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-yellow-600 dark:text-yellow-400" />
            <div>
              <span className="text-xs text-[var(--color-text-secondary)]">Stress Protocol</span>
              <p className="font-semibold text-xs text-[var(--color-text-primary)]">
                {activeScenario.name}
              </p>
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-secondary)]">Inflow Haircut</span>
            <p
              className="font-semibold text-xs text-red-600"
              style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
            >
              -${stressedInflowLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <span className="text-xs text-[var(--color-text-secondary)]">Outflow Acceleration</span>
            <p
              className="font-semibold text-xs text-red-600"
              style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
            >
              +${stressedOutflowSpike.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={16} className={runwayDays < 30 ? "text-red-500" : "text-yellow-500"} />
            <div>
              <span className="text-xs text-[var(--color-text-secondary)]">Stress Runway</span>
              <p
                className={`font-bold text-xs ${runwayDays < 30 ? "text-red-600" : "text-[var(--color-text-primary)]"}`}
                style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
              >
                {runwayDays} days of liquidity
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.s1}>
        <KPICard
          title={isStressed ? "Stressed Total Cash" : "Total Cash"}
          value={loading ? "—" : fmtCurrency(displayTotalCash)}
          icon={<DollarSign size={20} />}
          color={isStressed ? "var(--color-warning)" : "var(--color-primary)"}
        />
        <KPICard
          title={isStressed ? "Stressed Operating Cash" : "Operating Cash"}
          value={loading ? "—" : fmtCurrency(displayOperatingCash)}
          icon={<Wallet size={20} />}
          color={isStressed ? "var(--color-warning)" : "var(--color-success)"}
        />
        <KPICard
          title="Reserves"
          value={loading ? "—" : fmtCurrency(data.reserves)}
          icon={<Landmark size={20} />}
          color="var(--color-info)"
        />
        <KPICard
          title="Net Change (Today)"
          value={
            loading
              ? "—"
              : `${data.netChangeToday >= 0 ? "+" : ""}${fmtCurrency(data.netChangeToday)}`
          }
          icon={<TrendingUp size={20} />}
          color={
            data.netChangeToday >= 0
              ? "var(--color-success)"
              : "var(--color-danger)"
          }
        />
      </div>

      <div className="ui-grid-2">
        <DashboardChart
          title={isStressed ? "Stressed Daily Cash Flow" : "Daily Cash Flow"}
          subtitle={
            isStressed
              ? `Scenario: ${activeScenario.name}`
              : "Inflows vs outflows, last 7 days"
          }
          data={stressedDailyFlows as unknown as Record<string, unknown>[]}
          config={{
            xAxisKey: "date",
            series: [
              {
                dataKey: "inflows",
                name: "Inflows",
                color: "var(--color-success)",
              },
              {
                dataKey: "outflows",
                name: "Outflows",
                color: "var(--color-danger)",
              },
            ],
          }}
          defaultChartType="bar"
          allowedChartTypes={["bar", "area", "line"]}
          height={280}
        />

        <Card>
          <div className="p-4 ui-stack-3">
            <h3 className={styles.s2}>Account Balances</h3>
            {data.accounts.length === 0 && !loading && (
              <p className="ui-text-xs-muted">No bank accounts on file yet.</p>
            )}
            {data.accounts.map((acc: any) => (
              <div key={acc.name} className={styles.s3}>
                <div>
                  <div className="ui-heading-sm">
                    {acc.bankName} — {acc.name}
                  </div>
                  <div className="ui-text-xs-tertiary">
                    {acc.type} · {acc.currency}
                  </div>
                </div>
                <span
                  className="ui-heading-sm font-bold"
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {fmtCurrency(acc.balance)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
