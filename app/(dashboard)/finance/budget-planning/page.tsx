"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  Layers,
  BarChart3,
  Activity,
  GitCompare,
  AlertTriangle,
  Sliders,
  RotateCcw,
  Percent,
} from "lucide-react";
import { SubTabBar } from "@/components/finance/SubTabBar";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { Card, useToast, Button, Badge, StatCardRow } from "@kannan19302/ui";

import BudgetingPage from "../advanced/budgeting/page";
import BudgetScenariosPage from "../advanced/budget-scenarios/page";
import ForecastScenariosPage from "../advanced/forecast-scenarios/page";
import ScenarioComparisonPage from "../advanced/scenario-comparison/page";

const BUDGET_TABS = [
  {
    id: "overview",
    label: "Overview",
    href: "/finance/budget-planning",
    icon: PieChart,
    description: "Budget and planning summary",
  },
  {
    id: "budgets",
    label: "Budgets",
    href: "/finance/budget-planning?tab=budgets",
    icon: PieChart,
    description: "Budget creation and management",
  },
  {
    id: "forecasts",
    label: "Forecasts",
    href: "/finance/budget-planning?tab=forecasts",
    icon: TrendingUp,
    description: "Financial forecasting",
  },
  {
    id: "scenario-planning",
    label: "Scenario Planning",
    href: "/finance/budget-planning?tab=scenario-planning",
    icon: Layers,
    description: "What-if scenario modeling",
  },
  {
    id: "sensitivity",
    label: "Driver Sensitivity",
    href: "/finance/budget-planning?tab=sensitivity",
    icon: Sliders,
    description: "Dynamic macro & operational driver shocks",
    advanced: true,
    group: "Advanced Planning",
  },
  {
    id: "rolling-forecast",
    label: "Rolling Forecast",
    href: "/finance/budget-planning?tab=rolling-forecast",
    icon: Activity,
    description: "Continuous rolling forecasts",
    advanced: true,
    group: "Advanced Planning",
  },
  {
    id: "variance-analysis",
    label: "Variance Analysis",
    href: "/finance/budget-planning?tab=variance-analysis",
    icon: GitCompare,
    description: "Budget vs actual variance",
    advanced: true,
    group: "Advanced Planning",
  },
];

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  activeBudgets: number;
}

const EMPTY_BUDGET_SUMMARY: BudgetSummary = {
  totalBudget: 0,
  totalSpent: 0,
  activeBudgets: 0,
};

export default function BudgetPlanningPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const subTab = searchParams.get("subtab");
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [summary, setSummary] = useState<BudgetSummary>(EMPTY_BUDGET_SUMMARY);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "overview") return;
    let cancelled = false;
    client
      .list<{ amount: number; spentAmount: number; status: string }>(
        "/finance/budgets",
        { pageSize: 500 },
      )
      .then((res: any) => {
        if (cancelled) return;
        const budgets = res.data ?? [];
        const active = budgets.filter((b: any) => b.status === "ACTIVE");
        setSummary({
          totalBudget: budgets.reduce((s: any, b: any) => s + Number(b.amount || 0), 0),
          totalSpent: budgets.reduce(
            (s: any, b: any) => s + Number(b.spentAmount || 0),
            0,
          ),
          activeBudgets: active.length,
        });
        setSummaryError(null);
      })
      .catch((err: any) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Failed to load budget summary";
        setSummaryError(message);
        notifyError("Failed to load Budget & Planning summary", message);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, client, notifyError]);

  // Driver-Based Sensitivity State
  const [revShock, setRevShock] = useState<number>(0); // % (-30% to +30%)
  const [marginBpsShock, setMarginBpsShock] = useState<number>(0); // bps (-500 to +500)
  const [headcountInflation, setHeadcountInflation] = useState<number>(0); // % (-5% to +15%)
  const [interestRateShock, setInterestRateShock] = useState<number>(0); // bps (-200 to +400)
  const [fxShock, setFxShock] = useState<number>(0); // % (-15% to +15%)
  const [activePreset, setActivePreset] = useState<string>("baseline");

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === "baseline") {
      setRevShock(0);
      setMarginBpsShock(0);
      setHeadcountInflation(0);
      setInterestRateShock(0);
      setFxShock(0);
    } else if (preset === "stagflation") {
      setRevShock(-8);
      setMarginBpsShock(-350);
      setHeadcountInflation(8);
      setInterestRateShock(250);
      setFxShock(-5);
    } else if (preset === "expansion") {
      setRevShock(18);
      setMarginBpsShock(150);
      setHeadcountInflation(4);
      setInterestRateShock(50);
      setFxShock(2);
    } else if (preset === "recession") {
      setRevShock(-22);
      setMarginBpsShock(-500);
      setHeadcountInflation(1);
      setInterestRateShock(350);
      setFxShock(-12);
    }
  };

  const variancePct =
    summary.totalBudget > 0
      ? Math.round(
          ((summary.totalSpent - summary.totalBudget) / summary.totalBudget) *
            1000,
        ) / 10
      : 0;

  // Real-time Driver-Based Financial Projections
  const baseRevenue = summary.totalBudget > 0 ? summary.totalBudget * 2.5 : 12500000;
  const shockedRevenue = baseRevenue * (1 + revShock / 100) * (1 + (fxShock * 0.3) / 100);

  const baseGrossMarginPct = 0.62;
  const shockedGrossMarginPct = Math.max(0.1, Math.min(0.9, baseGrossMarginPct + marginBpsShock / 10000));

  const baseCogs = baseRevenue * (1 - baseGrossMarginPct);
  const shockedCogs = shockedRevenue * (1 - shockedGrossMarginPct);

  const baseGrossProfit = baseRevenue - baseCogs;
  const shockedGrossProfit = shockedRevenue - shockedCogs;

  const baseOpex = baseRevenue * 0.4;
  const shockedOpex = baseOpex * (1 + headcountInflation / 100);

  const baseEbitda = baseGrossProfit - baseOpex;
  const shockedEbitda = shockedGrossProfit - shockedOpex;

  const baseDebt = baseRevenue * 0.2;
  const baseInterestRate = 0.055;
  const shockedInterestRate = Math.max(0.01, baseInterestRate + interestRateShock / 10000);

  const baseInterest = baseDebt * baseInterestRate;
  const shockedInterest = baseDebt * shockedInterestRate;

  const baseEbt = baseEbitda - baseInterest;
  const shockedEbt = shockedEbitda - shockedInterest;

  const taxRate = 0.21;
  const baseTaxes = baseEbt > 0 ? baseEbt * taxRate : 0;
  const shockedTaxes = shockedEbt > 0 ? shockedEbt * taxRate : 0;

  const baseNetIncome = baseEbt - baseTaxes;
  const shockedNetIncome = shockedEbt - shockedTaxes;

  return (
    <RouteGuard permission="finance.fpa.read">
      {activeTab === "overview" && (
        <div className="ui-stack-4 ui-animate-in">
          {summaryError && (
            <div className="ui-alert ui-alert-danger">
              <AlertTriangle size={16} />
              Failed to load budget summary — figures below may be stale.{" "}
              {summaryError}
            </div>
          )}
          <div className="ui-grid-3">
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Total Budget</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-primary)", fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  {summary.totalBudget.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="ui-text-xs-muted">
                  Across {summary.activeBudgets} active budgets
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">YTD Variance</p>
                <p
                  className="ui-heading-sm"
                  style={{
                    color:
                      variancePct > 0
                        ? "var(--color-danger)"
                        : "var(--color-success)",
                    fontVariantNumeric: "tabular-nums lining-nums",
                  }}
                >
                  {variancePct > 0 ? "+" : ""}
                  {variancePct}%
                </p>
                <p className="ui-text-xs-muted">
                  {summary.totalSpent.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}{" "}
                  spent
                </p>
              </div>
            </Card>
            <Card padding="md">
              <div className="ui-stack-2">
                <p className="ui-text-xs-muted">Active Budgets</p>
                <p
                  className="ui-heading-sm"
                  style={{ color: "var(--color-success)" }}
                >
                  {summary.activeBudgets}
                </p>
                <p className="ui-text-xs-muted">
                  See Scenario Planning tab for forecasts
                </p>
              </div>
            </Card>
          </div>
          <BudgetingPage />
        </div>
      )}
      {activeTab === "budgets" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "budgeting",
                label: "Budgeting & Planning",
                href: "/finance/budget-planning?tab=budgets&subtab=budgeting",
              },
              {
                id: "scenarios",
                label: "Budget Scenarios",
                href: "/finance/budget-planning?tab=budgets&subtab=scenarios",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "scenarios" ? (
              <BudgetScenariosPage />
            ) : (
              <BudgetingPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "forecasts" && (
        <div className="ui-stack-4 ui-animate-in">
          <ForecastScenariosPage />
        </div>
      )}
      {activeTab === "scenario-planning" && (
        <div className="ui-stack-4 ui-animate-in">
          <SubTabBar
            tabs={[
              {
                id: "scenarios",
                label: "Budget Scenarios",
                href: "/finance/budget-planning?tab=scenario-planning&subtab=scenarios",
              },
              {
                id: "forecast",
                label: "Forecast Scenarios",
                href: "/finance/budget-planning?tab=scenario-planning&subtab=forecast",
              },
              {
                id: "compare",
                label: "Scenario Comparison",
                href: "/finance/budget-planning?tab=scenario-planning&subtab=compare",
              },
            ]}
          />
          <div style={{ marginTop: "var(--space-3)" }}>
            {subTab === "forecast" ? (
              <ForecastScenariosPage />
            ) : subTab === "compare" ? (
              <ScenarioComparisonPage />
            ) : (
              <BudgetScenariosPage />
            )}
          </div>
        </div>
      )}
      {activeTab === "sensitivity" && (
        <div className="ui-stack-4 ui-animate-in">
          {/* Header & Preset Selector */}
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
              <div>
                <h3 className="ui-heading-sm" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <Sliders size={18} style={{ color: "var(--color-primary)" }} />
                  Driver-Based Sensitivity & Macroeconomic Stress Testing
                </h3>
                <p className="ui-text-xs-muted" style={{ marginTop: "var(--space-1)" }}>
                  Simulate real-time revenue, gross margin, wage inflation, interest rates, and foreign exchange impacts against annual P&L baseline.
                </p>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                <span className="ui-text-xs-muted" style={{ fontWeight: "var(--weight-semibold)" }}>
                  Macro Scenarios:
                </span>
                <button
                  type="button"
                  className={`${styles.scenarioChip} ${activePreset === "baseline" ? styles.scenarioChipActive : ""}`}
                  onClick={() => applyPreset("baseline")}
                >
                  Baseline
                </button>
                <button
                  type="button"
                  className={`${styles.scenarioChip} ${activePreset === "stagflation" ? styles.scenarioChipActive : ""}`}
                  onClick={() => applyPreset("stagflation")}
                >
                  Stagflation Stress
                </button>
                <button
                  type="button"
                  className={`${styles.scenarioChip} ${activePreset === "expansion" ? styles.scenarioChipActive : ""}`}
                  onClick={() => applyPreset("expansion")}
                >
                  Expansion Surge
                </button>
                <button
                  type="button"
                  className={`${styles.scenarioChip} ${activePreset === "recession" ? styles.scenarioChipActive : ""}`}
                  onClick={() => applyPreset("recession")}
                >
                  Severe Recession
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset("baseline")}
                >
                  <RotateCcw size={14} style={{ marginRight: "var(--space-1)" }} />
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          {/* Shock Controls Grid */}
          <div className="ui-grid-3">
            <Card padding="md">
              <div className={styles.sliderContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="ui-text-xs-muted" style={{ fontWeight: "var(--weight-medium)" }}>
                    Revenue Growth Shock
                  </span>
                  <Badge variant={revShock > 0 ? "success" : revShock < 0 ? "danger" : "default"}>
                    <span className={styles.tabularNum}>
                      {revShock > 0 ? `+${revShock}%` : `${revShock}%`}
                    </span>
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={revShock}
                  onChange={(e) => {
                    setRevShock(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className={styles.sliderTrack}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }} className="ui-text-xs-muted">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+30%</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.sliderContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="ui-text-xs-muted" style={{ fontWeight: "var(--weight-medium)" }}>
                    Gross Margin Shock (bps)
                  </span>
                  <Badge variant={marginBpsShock > 0 ? "success" : marginBpsShock < 0 ? "danger" : "default"}>
                    <span className={styles.tabularNum}>
                      {marginBpsShock > 0 ? `+${marginBpsShock} bps` : `${marginBpsShock} bps`}
                    </span>
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-500"
                  max="500"
                  step="25"
                  value={marginBpsShock}
                  onChange={(e) => {
                    setMarginBpsShock(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className={styles.sliderTrack}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }} className="ui-text-xs-muted">
                  <span>-500 bps</span>
                  <span>0 bps</span>
                  <span>+500 bps</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.sliderContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="ui-text-xs-muted" style={{ fontWeight: "var(--weight-medium)" }}>
                    OpEx & Wage Inflation
                  </span>
                  <Badge variant={headcountInflation > 5 ? "danger" : headcountInflation > 0 ? "warning" : "success"}>
                    <span className={styles.tabularNum}>
                      {headcountInflation > 0 ? `+${headcountInflation}%` : `${headcountInflation}%`}
                    </span>
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="15"
                  step="1"
                  value={headcountInflation}
                  onChange={(e) => {
                    setHeadcountInflation(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className={styles.sliderTrack}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }} className="ui-text-xs-muted">
                  <span>-5%</span>
                  <span>0%</span>
                  <span>+15%</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.sliderContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="ui-text-xs-muted" style={{ fontWeight: "var(--weight-medium)" }}>
                    Benchmark Interest Rate Shock
                  </span>
                  <Badge variant={interestRateShock > 100 ? "danger" : interestRateShock > 0 ? "warning" : "success"}>
                    <span className={styles.tabularNum}>
                      {interestRateShock > 0 ? `+${interestRateShock} bps` : `${interestRateShock} bps`}
                    </span>
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="400"
                  step="25"
                  value={interestRateShock}
                  onChange={(e) => {
                    setInterestRateShock(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className={styles.sliderTrack}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }} className="ui-text-xs-muted">
                  <span>-200 bps</span>
                  <span>0 bps</span>
                  <span>+400 bps</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.sliderContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="ui-text-xs-muted" style={{ fontWeight: "var(--weight-medium)" }}>
                    FX Rate Fluctuation
                  </span>
                  <Badge variant={fxShock < -5 ? "danger" : fxShock > 5 ? "success" : "default"}>
                    <span className={styles.tabularNum}>
                      {fxShock > 0 ? `+${fxShock}%` : `${fxShock}%`}
                    </span>
                  </Badge>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="15"
                  step="1"
                  value={fxShock}
                  onChange={(e) => {
                    setFxShock(Number(e.target.value));
                    setActivePreset("custom");
                  }}
                  className={styles.sliderTrack}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }} className="ui-text-xs-muted">
                  <span>-15% (Weak)</span>
                  <span>0%</span>
                  <span>+15% (Strong)</span>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.sliderContainer}>
                <span className="ui-text-xs-muted" style={{ fontWeight: "var(--weight-medium)" }}>
                  Shock Sensitivity Summary
                </span>
                <p className="ui-text-xs" style={{ color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  Net P&L shifts propagate automatically across Revenue, COGS elasticity, operating leverage, and debt debt-service coverage.
                </p>
                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                  <Badge variant={shockedNetIncome >= baseNetIncome ? "success" : "danger"}>
                    Net Income Delta: {shockedNetIncome >= baseNetIncome ? "+" : ""}{((shockedNetIncome - baseNetIncome) / Math.abs(baseNetIncome || 1) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Stat Cards */}
          <div style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
            <StatCardRow
              stats={[
                {
                  label: "Simulated Net Revenue",
                  value: `$${Math.round(shockedRevenue).toLocaleString()}`,
                  icon: <TrendingUp size={20} />,
                  color: shockedRevenue >= baseRevenue ? "var(--color-success)" : "var(--color-danger)",
                },
                {
                  label: "Gross Margin %",
                  value: `${(shockedGrossMarginPct * 100).toFixed(1)}%`,
                  icon: <Percent size={20} />,
                  color: shockedGrossMarginPct >= baseGrossMarginPct ? "var(--color-success)" : "var(--color-danger)",
                },
                {
                  label: "Projected EBITDA",
                  value: `$${Math.round(shockedEbitda).toLocaleString()}`,
                  icon: <BarChart3 size={20} />,
                  color: shockedEbitda >= baseEbitda ? "var(--color-success)" : "var(--color-danger)",
                },
                {
                  label: "Projected Net Income",
                  value: `$${Math.round(shockedNetIncome).toLocaleString()}`,
                  icon: <Activity size={20} />,
                  color: shockedNetIncome >= baseNetIncome ? "var(--color-success)" : "var(--color-danger)",
                },
              ]}
            />
          </div>

          {/* Real-time P&L Variance Table */}
          <Card padding="none">
            <div style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 className="ui-heading-xs">Simulated Income Statement (P&L) Impact</h4>
                <p className="ui-text-xs-muted">GAAP/IFRS standard financial statement lines under active driver shocks</p>
              </div>
              <Badge variant="default">
                Base Budget: ${Math.round(baseRevenue).toLocaleString()}
              </Badge>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="ui-table" style={{ width: "100%", fontSize: "var(--text-xs)" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Financial Line Item</th>
                    <th style={{ textAlign: "right" }}>Baseline ($)</th>
                    <th style={{ textAlign: "right" }}>Shocked ($)</th>
                    <th style={{ textAlign: "right" }}>Variance ($)</th>
                    <th style={{ textAlign: "right" }}>Variance (%)</th>
                    <th style={{ textAlign: "center" }}>Impact Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Gross Revenue", base: baseRevenue, shocked: shockedRevenue, higherIsBetter: true },
                    { label: "Cost of Goods Sold (COGS)", base: baseCogs, shocked: shockedCogs, higherIsBetter: false },
                    { label: "Gross Profit", base: baseGrossProfit, shocked: shockedGrossProfit, higherIsBetter: true },
                    { label: "Operating Expenses (OpEx)", base: baseOpex, shocked: shockedOpex, higherIsBetter: false },
                    { label: "Operating Income (EBITDA)", base: baseEbitda, shocked: shockedEbitda, higherIsBetter: true },
                    { label: "Net Interest Expense", base: baseInterest, shocked: shockedInterest, higherIsBetter: false },
                    { label: "Earnings Before Taxes (EBT)", base: baseEbt, shocked: shockedEbt, higherIsBetter: true },
                    { label: "Income Tax Provision (21%)", base: baseTaxes, shocked: shockedTaxes, higherIsBetter: false },
                    { label: "Net Income", base: baseNetIncome, shocked: shockedNetIncome, higherIsBetter: true, bold: true },
                  ].map((row, idx) => {
                    const varianceVal = row.shocked - row.base;
                    const variancePct = row.base !== 0 ? (varianceVal / Math.abs(row.base)) * 100 : 0;
                    const isPositive = row.higherIsBetter ? varianceVal >= 0 : varianceVal <= 0;
                    return (
                      <tr key={idx} style={row.bold ? { fontWeight: "var(--weight-bold)", background: "var(--color-surface-hover)" } : undefined}>
                        <td style={{ textAlign: "left", padding: "var(--space-2) var(--space-4)" }}>{row.label}</td>
                        <td className={styles.tableCellNum} style={{ padding: "var(--space-2) var(--space-4)" }}>
                          ${Math.round(row.base).toLocaleString()}
                        </td>
                        <td className={styles.tableCellNum} style={{ padding: "var(--space-2) var(--space-4)" }}>
                          ${Math.round(row.shocked).toLocaleString()}
                        </td>
                        <td
                          className={styles.tableCellNum}
                          style={{
                            padding: "var(--space-2) var(--space-4)",
                            color: varianceVal === 0 ? "var(--color-text-secondary)" : isPositive ? "var(--color-success)" : "var(--color-danger)",
                          }}
                        >
                          {varianceVal > 0 ? `+$${Math.round(varianceVal).toLocaleString()}` : varianceVal < 0 ? `-$${Math.round(Math.abs(varianceVal)).toLocaleString()}` : "$0"}
                        </td>
                        <td
                          className={styles.tableCellNum}
                          style={{
                            padding: "var(--space-2) var(--space-4)",
                            color: variancePct === 0 ? "var(--color-text-secondary)" : isPositive ? "var(--color-success)" : "var(--color-danger)",
                          }}
                        >
                          {variancePct > 0 ? `+${variancePct.toFixed(1)}%` : `${variancePct.toFixed(1)}%`}
                        </td>
                        <td style={{ textAlign: "center", padding: "var(--space-2) var(--space-4)" }}>
                          <Badge variant={varianceVal === 0 ? "default" : isPositive ? "success" : "danger"}>
                            {varianceVal === 0 ? "Neutral" : isPositive ? "Favorable" : "Unfavorable"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      {activeTab === "rolling-forecast" && (
        <div className="ui-stack-4 ui-animate-in">
          <ForecastScenariosPage />
        </div>
      )}
      {activeTab === "variance-analysis" && (
        <div className="ui-stack-4 ui-animate-in">
          <BudgetingPage />
        </div>
      )}
    </RouteGuard>
  );
}
