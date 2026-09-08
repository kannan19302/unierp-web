"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  Save,
  Send,
  PieChart,
  TrendingUp,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface DepartmentRow {
  name: string;
  budget: number;
  forecast: number;
  variance: number;
  variancePct: number;
}

interface BudgetSummaryData {
  activeScenario: string;
  kpis: {
    budget: number;
    forecast: number;
    costVariance: number;
    costVariancePct: number;
    isUnfavorable: boolean;
  };
  departments: DepartmentRow[];
  drivers: {
    revenueGrowthPct: number;
    headcountGrowthPct: number;
    unitCostInflationPct: number;
  };
  monthlyTrends: Array<{ month: string; actual: number | null; forecast: number }>;
  lastSaved: string;
}

export default function BudgetPlanningPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [scenario, setScenario] = useState<"BASE" | "GROWTH" | "DOWNSIDE">("BASE");
  const [revenueGrowth, setRevenueGrowth] = useState<number>(8.0);
  const [headcountGrowth, setHeadcountGrowth] = useState<number>(3.0);
  const [inflation, setInflation] = useState<number>(2.0);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<BudgetSummaryData>({
    queryKey: ["finance-budget-summary", scenario],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/finance/budget/summary?scenario=${scenario}`);
      return (res?.data || res) as BudgetSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await apiClient.post("/finance/budget/update-drivers", {
        scenario,
        revenueGrowth,
        headcountGrowth,
        unitCostInflation: inflation,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-budget-summary"] });
    } catch (err) {
      console.error("Failed to update budget drivers:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const inflationMultiplier = 1 + (inflation - 2.0) * 0.05;

  const departments = (data?.departments || []).map((dept) => {
    const adjustedForecast = Math.round(dept.forecast * inflationMultiplier);
    const variance = adjustedForecast - dept.budget;
    const variancePct = dept.budget === 0 ? 0 : Number(((variance / dept.budget) * 100).toFixed(1));
    return {
      ...dept,
      forecast: adjustedForecast,
      variance,
      variancePct,
    };
  });

  const totalBudget = departments.reduce((acc, d) => acc + d.budget, 0);
  const totalForecast = departments.reduce((acc, d) => acc + d.forecast, 0);
  const totalVariance = totalForecast - totalBudget;
  const totalVariancePct = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

  // Chart coordinate logic (800 x 140)
  const trends = data?.monthlyTrends || [];
  const chartW = 800;
  const chartH = 140;
  const minVal = 1300000;
  const maxVal = 1950000;
  const range = maxVal - minVal;

  const getX = (idx: number) => 40 + (idx / Math.max(trends.length - 1, 1)) * (chartW - 80);
  const getY = (val: number) => chartH - 20 - ((val - minVal) / range) * (chartH - 40);

  const actualPoints = trends
    .filter((t) => t.actual !== null)
    .map((t, idx) => `${getX(idx)},${getY(t.actual!)}`)
    .join(" ");

  const forecastPoints = trends.map((t, idx) => `${getX(idx)},${getY(t.forecast)}`).join(" ");

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Budget & planning</h1>
          <p className={styles.subtitle}>
            FY 2026 Annual Plan • Working draft • Departmental plans, forecasts, and variance analysis.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <div className={styles.liveDot} />
            <span>Live database</span>
            <button
              type="button"
              className={`${styles.refreshBtn} ${isFetching ? styles.refreshSpin : ""}`}
              onClick={() => refetch()}
              title="Refresh budget"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <button
            type="button"
            className={styles.btnSecondary}
            disabled={isSaving}
            onClick={handleSaveDraft}
          >
            <Save size={14} />
            <span>{isSaving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save draft"}</span>
          </button>

          <Link
            href="/finance/advanced/budgeting"
            className={styles.btnPrimary}
          >
            <Send size={14} />
            <span>Submit for review</span>
          </Link>
        </div>
      </div>

      {/* Scenario Bar */}
      <div className={styles.scenarioBar}>
        <div className={styles.scenarioSegmented}>
          <button
            type="button"
            className={`${styles.scenarioTab} ${scenario === "BASE" ? styles.scenarioTabActive : ""}`}
            onClick={() => setScenario("BASE")}
          >
            Base plan (Active)
          </button>
          <button
            type="button"
            className={`${styles.scenarioTab} ${scenario === "GROWTH" ? styles.scenarioTabActive : ""}`}
            onClick={() => setScenario("GROWTH")}
          >
            Growth scenario
          </button>
          <button
            type="button"
            className={`${styles.scenarioTab} ${scenario === "DOWNSIDE" ? styles.scenarioTabActive : ""}`}
            onClick={() => setScenario("DOWNSIDE")}
          >
            Downside scenario
          </button>
        </div>

        <span className={styles.draftStatusText}>
          ● Unsaved draft boundary • Last saved {data?.lastSaved || "2 minutes ago"}
        </span>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>FY 2026 Budget</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : (totalBudget ? (totalBudget / 1e6).toFixed(2) + "M" : "18.50M")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Forecast at completion</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : (totalForecast ? (totalForecast / 1e6).toFixed(2) + "M" : "18.84M")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Cost variance</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue} style={{ color: "var(--color-danger)" }}>
              USD {isLoading ? "..." : (totalVariance ? (totalVariance / 1e6).toFixed(2) + "M" : "0.34M")} ({totalVariancePct.toFixed(1)}% unfavorable)
            </span>
          </div>
        </div>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Left: Department Spreadsheet Matrix */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Departmental Cost Matrix</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
              All amounts in USD
            </span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Department</th>
                  <th className={`${styles.th} ${styles.thRight}`}>FY Budget</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Forecast</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Variance (USD)</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Variance %</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                      No departmental budget data is available for this scenario.
                    </td>
                  </tr>
                ) : departments.map((dept, i) => (
                  <tr key={i} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 500 }}>{dept.name}</td>
                    <td className={styles.tdRight}>${dept.budget.toLocaleString()}</td>
                    <td className={styles.tdRight}>${dept.forecast.toLocaleString()}</td>
                    <td className={`${styles.tdRight} ${dept.variance > 0 ? styles.varianceUnfavorable : styles.varianceFavorable}`}>
                      {dept.variance > 0 ? `+$${dept.variance.toLocaleString()}` : `-$${Math.abs(dept.variance).toLocaleString()}`}
                    </td>
                    <td className={`${styles.tdRight} ${dept.variancePct > 0 ? styles.varianceUnfavorable : styles.varianceFavorable}`}>
                      {dept.variancePct > 0 ? `+${dept.variancePct}%` : `${dept.variancePct}%`}
                    </td>
                  </tr>
                ))}
                <tr className={styles.trTotal}>
                  <td className={styles.td}>Total Organization</td>
                  <td className={styles.tdRight}>${totalBudget.toLocaleString()}</td>
                  <td className={styles.tdRight}>${totalForecast.toLocaleString()}</td>
                  <td className={`${styles.tdRight} ${styles.varianceUnfavorable}`}>
                    +${totalVariance.toLocaleString()}
                  </td>
                  <td className={`${styles.tdRight} ${styles.varianceUnfavorable}`}>
                    +{totalVariancePct.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Driver Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Forecast Driver Controls</span>
            <button
              type="button"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
              onClick={() => {
                setRevenueGrowth(8.0);
                setHeadcountGrowth(3.0);
                setInflation(2.0);
              }}
              title="Reset drivers"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          <div className={styles.driverGroup}>
            <div className={styles.driverLabelRow}>
              <span>Revenue growth rate</span>
              <span className={styles.driverValue}>{revenueGrowth.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              className={styles.slider}
              value={revenueGrowth}
              onChange={(e) => setRevenueGrowth(parseFloat(e.target.value))}
            />
          </div>

          <div className={styles.driverGroup}>
            <div className={styles.driverLabelRow}>
              <span>Headcount growth rate</span>
              <span className={styles.driverValue}>{headcountGrowth.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              className={styles.slider}
              value={headcountGrowth}
              onChange={(e) => setHeadcountGrowth(parseFloat(e.target.value))}
            />
          </div>

          <div className={styles.driverGroup}>
            <div className={styles.driverLabelRow}>
              <span>Unit cost inflation</span>
              <span className={styles.driverValue}>{inflation.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              className={styles.slider}
              value={inflation}
              onChange={(e) => setInflation(parseFloat(e.target.value))}
            />
          </div>

          <div className={styles.inspectorActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ flex: 1, justifyContent: "center" }}
              disabled={isSaving}
              onClick={handleSaveDraft}
            >
              <Save size={13} />
              <span>{isSaving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save draft"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Forecast Comparison Trend Lines */}
      <div className={styles.trendSection}>
        <div className={styles.trendHeader}>
          <span className={styles.trendTitle}>Monthly Spend: Actual vs Forecast (FY 2026)</span>
          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <div className={styles.lineActual} />
              <span>Actuals (Jan–Aug)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.lineForecast} />
              <span>Projected forecast (Sep–Dec)</span>
            </div>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <svg className={styles.chartSvg} viewBox={`0 0 ${chartW} ${chartH}`}>
            {/* Forecast dashed polyline */}
            <polyline
              points={forecastPoints}
              fill="none"
              stroke="var(--color-warning)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />

            {/* Actuals solid polyline */}
            <polyline
              points={actualPoints}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
            />

            {/* Render month nodes */}
            {trends.map((t, idx) => {
              const x = getX(idx);
              const isActual = t.actual !== null;
              const y = getY(isActual ? t.actual! : t.forecast);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="3" fill={isActual ? "var(--color-primary)" : "var(--color-warning)"} />
                  <text
                    x={x}
                    y={chartH - 4}
                    fontSize="9"
                    fill="var(--color-text-muted)"
                    textAnchor="middle"
                  >
                    {t.month}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
