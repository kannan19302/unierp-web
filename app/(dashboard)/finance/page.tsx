"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@kannan19302/framework";
import {
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Database,
  ArrowRight,
} from "lucide-react";
import styles from "./page.module.css";

interface DashboardTelemetry {
  kpis: {
    totalRevenueYtd: number;
    totalRevenue: number;
    outstandingAr: number;
    pendingAp: number;
    netCashBalance: number;
    totalInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    paymentRate: number;
    bankAccounts: number;
    revenue?: {
      value: number;
      currency: string;
      deltaPct: number;
      priorValue: number;
      priorLabel: string;
      sparkline: number[];
    };
    operatingCashFlow?: {
      value: number;
      currency: string;
      deltaPct: number;
      priorValue: number;
      priorLabel: string;
      sparkline: number[];
    };
    ebitdaMargin?: {
      value: number;
      deltaPp: number;
      priorValue: number;
      priorLabel: string;
      sparkline: number[];
    };
    dso?: {
      value: number;
      deltaDays: number;
      priorValue: number;
      priorLabel: string;
      sparkline: number[];
    };
  };
  charts: {
    revenueTrend: Array<{
      month: string;
      revenue: number;
      expenses: number;
      invoices: number;
    }>;
    statusDistribution: Array<{ name: string; value: number; amount: number }>;
    arAgingChart: Array<{ bucket: string; amount: number }>;
    arAgingSummary?: {
      total: number;
      currency: string;
      buckets: Array<{
        bucket: string;
        label: string;
        amount: number;
        pct: number;
        widthPct: number;
        count: number;
      }>;
    };
  };
  exceptions?: {
    totalAttentionCount: number;
    overdueReceivables: {
      count: number;
      impact: number;
      oldest: string | null;
      details: string;
      actionUrl: string;
    };
    unmatchedTransactions: {
      count: number;
      impact: number;
      oldest: string | null;
      details: string;
      actionUrl: string;
    };
    pendingJournals: {
      count: number;
      impact: number;
      oldest: string | null;
      details: string;
      actionUrl: string;
    };
  };
  monthEndClose?: {
    periodName: string;
    tasksCompleted: number;
    tasksTotal: number;
    tasks: Array<{
      id: string;
      task: string;
      owner: string;
      status: string;
      due: string;
      done: boolean;
    }>;
  };
}

// Sparkline SVG component for KPI cards
function Sparkline({
  data,
  strokeColor = "var(--color-primary)",
}: {
  data?: number[];
  strokeColor?: string;
}) {
  if (!data || data.length < 2) {
    return <div className={styles.sparklineWrap} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || (max === 0 ? 1 : Math.abs(max) * 0.1);
  const width = 80;
  const height = 30;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className={styles.sparklineWrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.sparklineSvg}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

// Formatting helpers
function fmtCompact(val: number): string {
  if (Math.abs(val) >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(val) >= 1_000) {
    return `${(val / 1_000).toFixed(1)}k`;
  }
  return val.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtAmount(val: number): string {
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function FinanceOverviewPage() {
  const router = useRouter();
  const client = useApiClient();
  const [period, setPeriod] = useState("jan-aug-2026");

  // Fetch real-time dashboard data with periodic 30s background polling
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useQuery<DashboardTelemetry>({
      queryKey: ["finance", "dashboard", period],
      queryFn: async () => {
        const res = await client.get<DashboardTelemetry>("/finance/dashboard");
        return res;
      },
      refetchInterval: 30000,
      staleTime: 15000,
    });

  // Relative updated timestamp
  const updatedTimeStr = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "Just now";

  // Check if data has zero financial records
  const hasZeroData =
    !isLoading &&
    !isError &&
    data &&
    (data.kpis?.totalInvoices === 0 || !data.kpis?.totalInvoices) &&
    (data.kpis?.totalRevenue === 0 || !data.kpis?.totalRevenue);

  // 1. Sparkline arrays and metric numbers
  const revKpi = data?.kpis?.revenue;
  const cfKpi = data?.kpis?.operatingCashFlow;
  const ebitdaKpi = data?.kpis?.ebitdaMargin;
  const dsoKpi = data?.kpis?.dso;

  // 2. Trend dataset & scaling
  const trendData = data?.charts?.revenueTrend || [];
  const trendMonths =
    trendData.length > 0
      ? trendData.map((d) => d.month)
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const revValues =
    trendData.length > 0
      ? trendData.map((d) => d.revenue / 1_000_000)
      : [0, 0, 0, 0, 0, 0, 0, 0];
  const expValues =
    trendData.length > 0
      ? trendData.map((d) => d.expenses / 1_000_000)
      : [0, 0, 0, 0, 0, 0, 0, 0];

  const maxTrendVal = Math.max(...revValues, ...expValues, 1.0);
  const chartMaxY = Math.ceil(maxTrendVal * 1.25);
  const gridSteps = [
    0,
    Number(((chartMaxY / 5) * 1).toFixed(1)),
    Number(((chartMaxY / 5) * 2).toFixed(1)),
    Number(((chartMaxY / 5) * 3).toFixed(1)),
    Number(((chartMaxY / 5) * 4).toFixed(1)),
    chartMaxY,
  ];

  // 3. AR aging buckets
  const agingBuckets = data?.charts?.arAgingSummary?.buckets || [
    { label: "Current (0–30 days)", bucket: "CURRENT", amount: 0, pct: 0, widthPct: 0, count: 0 },
    { label: "1–30 days", bucket: "1_30", amount: 0, pct: 0, widthPct: 0, count: 0 },
    { label: "31–60 days", bucket: "31_60", amount: 0, pct: 0, widthPct: 0, count: 0 },
    { label: "61–90 days", bucket: "61_90", amount: 0, pct: 0, widthPct: 0, count: 0 },
    { label: "90+ days", bucket: "OVER_90", amount: 0, pct: 0, widthPct: 0, count: 0 },
  ];
  const totalArAmount = data?.charts?.arAgingSummary?.total || 0;

  // 4. Exceptions feed
  const exceptions = data?.exceptions;
  const overdueExc = exceptions?.overdueReceivables || {
    count: 0,
    impact: 0,
    oldest: null,
    details: "Invoices past due",
    actionUrl: "/finance/ar",
  };
  const unmatchedExc = exceptions?.unmatchedTransactions || {
    count: 0,
    impact: 0,
    oldest: null,
    details: "Bank / GL not matched",
    actionUrl: "/finance/banking",
  };
  const pendingJournalsExc = exceptions?.pendingJournals || {
    count: 0,
    impact: 0,
    oldest: null,
    details: "Pending manager approval",
    actionUrl: "/finance/gl",
  };
  const attentionCount = exceptions?.totalAttentionCount || 0;

  // 5. Month-end close checklist
  const closeSection = data?.monthEndClose;
  const closeTasks = closeSection?.tasks || [];
  const tasksCompleted = closeSection?.tasksCompleted || 0;
  const tasksTotal = closeSection?.tasksTotal || 0;

  return (
    <div className={styles.pageRoot}>
      {/* 1. Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>Finance overview</h1>
          <p className={styles.pageSubtitle}>
            Monitor performance, exceptions, and close progress.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.metaInfo}>
            <span>{data ? "Live database" : "No finance data"}</span>
            <span className={styles.metaSep}>|</span>
            <span>Updated {updatedTimeStr}</span>
            <span className={styles.metaSep}>|</span>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={() => refetch()}
              title="Refresh real-time telemetry"
              aria-label="Refresh telemetry data"
            >
              <RefreshCw
                size={13}
                className={isFetching ? styles.refreshSpin : undefined}
                aria-hidden="true"
              />
            </button>
            <span className={styles.metaSep}>|</span>
            <Link href="/finance/reports" className={styles.viewSourceLink}>
              <span>View source</span>
              <ExternalLink size={12} aria-hidden />
            </Link>
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => router.push("/finance/advanced/close-tasks")}
          >
            Review close
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {isError && (
        <div className={styles.banner} role="alert">
          <div className={styles.bannerContent}>
            <AlertCircle size={20} className={styles.typeIconDanger} />
            <div>
              <h3 className={styles.bannerTitle}>Unable to connect to live finance telemetry</h3>
              <p className={styles.bannerDesc}>
                {error instanceof Error ? error.message : "The backend service is currently unreachable."}
              </p>
            </div>
          </div>
          <button type="button" className={styles.btnSecondary} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Zero Data Onboarding Banner */}
      {hasZeroData && (
        <div className={styles.banner}>
          <div className={styles.bannerContent}>
            <Database size={20} className={styles.typeIconWarning} />
            <div>
              <h3 className={styles.bannerTitle}>No financial transactions recorded yet</h3>
              <p className={styles.bannerDesc}>
                Create the first invoice or import real opening data to begin reporting.
              </p>
            </div>
          </div>
          <div className={styles.bannerActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => router.push("/finance/invoices")}
            >
              Create invoice
            </button>
          </div>
        </div>
      )}

      {/* 2. Top 4 KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Revenue */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Revenue</span>
            <span className={styles.kpiCurrency}>USD</span>
          </div>
          <div className={styles.kpiBody}>
            {isLoading ? (
              <div>
                <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
                <div className={`${styles.skeleton} ${styles.skeletonText}`} />
              </div>
            ) : (
              <div className={styles.kpiValueGroup}>
                <div className={styles.kpiValue}>
                  {revKpi ? fmtCompact(revKpi.value) : "0.00"}
                </div>
                <div className={styles.kpiDelta}>
                  <span
                    className={
                      (revKpi?.deltaPct ?? 0) >= 0
                        ? styles.deltaPositive
                        : styles.deltaNegative
                    }
                  >
                    {(revKpi?.deltaPct ?? 0) >= 0 ? "↑ +" : "↓ "}
                    {revKpi?.deltaPct ?? 0}%
                  </span>
                  <span>
                    vs {revKpi?.priorLabel || "prior month"} ({fmtCompact(revKpi?.priorValue ?? 0)})
                  </span>
                </div>
              </div>
            )}
            <Sparkline data={revKpi?.sparkline} />
          </div>
        </div>

        {/* Card 2: Operating Cash Flow */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Operating cash flow</span>
            <span className={styles.kpiCurrency}>USD</span>
          </div>
          <div className={styles.kpiBody}>
            {isLoading ? (
              <div>
                <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
                <div className={`${styles.skeleton} ${styles.skeletonText}`} />
              </div>
            ) : (
              <div className={styles.kpiValueGroup}>
                <div className={styles.kpiValue}>
                  {cfKpi ? fmtCompact(cfKpi.value) : "0.00"}
                </div>
                <div className={styles.kpiDelta}>
                  <span
                    className={
                      (cfKpi?.deltaPct ?? 0) >= 0
                        ? styles.deltaPositive
                        : styles.deltaNegative
                    }
                  >
                    {(cfKpi?.deltaPct ?? 0) >= 0 ? "↑ +" : "↓ "}
                    {cfKpi?.deltaPct ?? 0}%
                  </span>
                  <span>
                    vs {cfKpi?.priorLabel || "prior month"} ({fmtCompact(cfKpi?.priorValue ?? 0)})
                  </span>
                </div>
              </div>
            )}
            <Sparkline data={cfKpi?.sparkline} />
          </div>
        </div>

        {/* Card 3: EBITDA Margin */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>EBITDA margin</span>
          </div>
          <div className={styles.kpiBody}>
            {isLoading ? (
              <div>
                <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
                <div className={`${styles.skeleton} ${styles.skeletonText}`} />
              </div>
            ) : (
              <div className={styles.kpiValueGroup}>
                <div className={styles.kpiValue}>
                  {ebitdaKpi ? `${ebitdaKpi.value}%` : "0.0%"}
                </div>
                <div className={styles.kpiDelta}>
                  <span
                    className={
                      (ebitdaKpi?.deltaPp ?? 0) >= 0
                        ? styles.deltaPositive
                        : styles.deltaNegative
                    }
                  >
                    {(ebitdaKpi?.deltaPp ?? 0) >= 0 ? "↑ +" : "↓ "}
                    {ebitdaKpi?.deltaPp ?? 0} pp
                  </span>
                  <span>
                    vs {ebitdaKpi?.priorLabel || "prior month"} ({ebitdaKpi?.priorValue ?? 0}%)
                  </span>
                </div>
              </div>
            )}
            <Sparkline data={ebitdaKpi?.sparkline} />
          </div>
        </div>

        {/* Card 4: Days Sales Outstanding */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Days sales outstanding (DSO)</span>
          </div>
          <div className={styles.kpiBody}>
            {isLoading ? (
              <div>
                <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
                <div className={`${styles.skeleton} ${styles.skeletonText}`} />
              </div>
            ) : (
              <div className={styles.kpiValueGroup}>
                <div className={styles.kpiValue}>
                  {dsoKpi ? `${dsoKpi.value} days` : "0 days"}
                </div>
                <div className={styles.kpiDelta}>
                  <span
                    className={
                      (dsoKpi?.deltaDays ?? 0) <= 0
                        ? styles.deltaPositive
                        : styles.deltaNegative
                    }
                  >
                    {(dsoKpi?.deltaDays ?? 0) <= 0 ? "↓ " : "↑ +"}
                    {dsoKpi?.deltaDays ?? 0} days
                  </span>
                  <span>
                    vs {dsoKpi?.priorLabel || "prior month"} ({dsoKpi?.priorValue ?? 0} days)
                  </span>
                </div>
              </div>
            )}
            <Sparkline data={dsoKpi?.sparkline} />
          </div>
        </div>
      </div>

      {/* 3. Mid Grid: Trend (60%) + Exceptions (40%) */}
      <div className={styles.midGrid}>
        {/* Trend Chart Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Revenue and operating expenses trend</h2>
            <div className={styles.cardControls}>
              <select
                className={styles.selectPeriod}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                aria-label="Select reporting period"
              >
                <option value="jan-aug-2026">Jan–Aug 2026</option>
                <option value="q1-q2-2026">Q1–Q2 2026</option>
                <option value="fy-2025">FY 2025</option>
              </select>
              <Link href="/finance/reports" className={styles.linkButton}>
                View report
              </Link>
            </div>
          </div>

          <div className={styles.chartContainer}>
            <p className={styles.chartSubtitle}>USD millions</p>

            {isLoading ? (
              <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
            ) : (
              <svg
                viewBox="0 0 600 200"
                className={styles.trendSvg}
                role="img"
                aria-label="Monthly Revenue and Expenses dual line chart"
              >
                {/* Grid Lines */}
                {gridSteps.map((val, i) => {
                  const y = 170 - (val / (chartMaxY || 1)) * 150;
                  return (
                    <g key={`grid-line-${val}-${i}`}>
                      <line
                        x1="45"
                        y1={y}
                        x2="580"
                        y2={y}
                        stroke="var(--color-border)"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <text
                        x="38"
                        y={y + 3}
                        textAnchor="end"
                        fontSize="10"
                        fill="var(--color-text-tertiary)"
                        fontFamily="var(--font-mono)"
                      >
                        {val === 0 ? "0" : `${val.toFixed(1)}M`}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Month Labels */}
                {trendMonths.map((m, i) => {
                  const x = 75 + i * 70;
                  return (
                    <text
                      key={`month-label-${m}-${i}`}
                      x={x}
                      y="190"
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--color-text-secondary)"
                      fontFamily="var(--font-sans)"
                    >
                      {m}
                    </text>
                  );
                })}

                {/* Operating Expenses Line (Orange) */}
                <polyline
                  fill="none"
                  stroke="var(--chart-2)"
                  strokeWidth="2.5"
                  points={expValues
                    .map(
                      (val, i) =>
                        `${75 + i * 70},${(170 - (val / (chartMaxY || 1)) * 150).toFixed(1)}`,
                    )
                    .join(" ")}
                />
                {expValues.map((val, i) => {
                  const x = 75 + i * 70;
                  const y = 170 - (val / (chartMaxY || 1)) * 150;
                  return (
                    <g key={`exp-${i}`}>
                      <circle cx={x} cy={y} r="3.5" fill="var(--chart-2)" />
                      <text
                        x={x}
                        y={y + 14}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill="var(--color-text-secondary)"
                        fontFamily="var(--font-mono)"
                      >
                        {val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Revenue Line (Blue) */}
                <polyline
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  points={revValues
                    .map(
                      (val, i) =>
                        `${75 + i * 70},${(170 - (val / (chartMaxY || 1)) * 150).toFixed(1)}`,
                    )
                    .join(" ")}
                />
                {revValues.map((val, i) => {
                  const x = 75 + i * 70;
                  const y = 170 - (val / (chartMaxY || 1)) * 150;
                  return (
                    <g key={`rev-${i}`}>
                      <circle cx={x} cy={y} r="3.5" fill="var(--color-primary)" />
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="9.5"
                        fill="var(--color-text)"
                        fontWeight="600"
                        fontFamily="var(--font-mono)"
                      >
                        {val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Legend */}
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDotRevenue} />
                <span>Revenue</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDotExpenses} />
                <span>Operating expenses</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exceptions Triage Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <h2 className={styles.cardTitle}>Exceptions</h2>
              <span className={styles.badgeAttention}>
                {attentionCount} need attention
              </span>
            </div>
          </div>

          <table className={styles.dataTable} aria-label="Financial Exceptions">
            <thead>
              <tr>
                <th>Type</th>
                <th>Details</th>
                <th>Impact (USD)</th>
                <th>Count</th>
                <th>Oldest</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                  </td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td>
                      <div className={styles.typeCell}>
                        <AlertCircle size={14} className={styles.typeIconDanger} />
                        <span>Overdue receivables</span>
                      </div>
                    </td>
                    <td>{overdueExc.details}</td>
                    <td className={styles.amountCell}>
                      ${fmtAmount(overdueExc.impact)}
                    </td>
                    <td className={styles.numCell}>{overdueExc.count}</td>
                    <td className={styles.dateCell}>{overdueExc.oldest || "—"}</td>
                    <td>
                      <Link href={overdueExc.actionUrl} className={styles.actionLink}>
                        Review
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className={styles.typeCell}>
                        <AlertTriangle size={14} className={styles.typeIconWarning} />
                        <span>Unmatched transactions</span>
                      </div>
                    </td>
                    <td>{unmatchedExc.details}</td>
                    <td className={styles.amountCell}>
                      ${fmtAmount(unmatchedExc.impact)}
                    </td>
                    <td className={styles.numCell}>{unmatchedExc.count}</td>
                    <td className={styles.dateCell}>{unmatchedExc.oldest || "—"}</td>
                    <td>
                      <Link href={unmatchedExc.actionUrl} className={styles.actionLink}>
                        Review
                      </Link>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className={styles.typeCell}>
                        <Clock size={14} className={styles.typeIconNeutral} />
                        <span>Journals awaiting approval</span>
                      </div>
                    </td>
                    <td>{pendingJournalsExc.details}</td>
                    <td className={styles.amountCell}>
                      ${fmtAmount(pendingJournalsExc.impact)}
                    </td>
                    <td className={styles.numCell}>{pendingJournalsExc.count}</td>
                    <td className={styles.dateCell}>
                      {pendingJournalsExc.oldest || "—"}
                    </td>
                    <td>
                      <Link
                        href={pendingJournalsExc.actionUrl}
                        className={styles.actionLink}
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <Link href="/finance/invoices?status=OVERDUE" className={styles.cardFooterLink}>
            <span>View all exceptions</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* 4. Bottom Grid: AR Aging (50%) + Month-End Close Progress (50%) */}
      <div className={styles.bottomGrid}>
        {/* Accounts Receivable Aging */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <h2 className={styles.cardTitle}>Accounts receivable aging</h2>
            </div>
            <span className={styles.kpiCurrency}>USD</span>
          </div>

          <table className={styles.dataTable} aria-label="Accounts Receivable Aging">
            <thead>
              <tr>
                <th>Aging bucket</th>
                <th style={{ width: "9rem" }} />
                <th style={{ textAlign: "right" }}>Outstanding</th>
                <th style={{ textAlign: "right" }}>% of total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                  </td>
                </tr>
              ) : (
                <>
                  {agingBuckets.map((b) => (
                    <tr key={b.bucket}>
                      <td>{b.label}</td>
                      <td>
                        <div className={styles.agingBarTrack}>
                          <div
                            className={styles.agingBarFill}
                            style={{ width: `${b.widthPct}%` }}
                          />
                        </div>
                      </td>
                      <td className={styles.amountCell} style={{ textAlign: "right" }}>
                        {fmtAmount(b.amount)}
                      </td>
                      <td className={styles.numCell} style={{ textAlign: "right" }}>
                        {b.pct}%
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td>Total</td>
                    <td />
                    <td className={styles.amountCell} style={{ textAlign: "right" }}>
                      {fmtAmount(totalArAmount)}
                    </td>
                    <td className={styles.numCell} style={{ textAlign: "right" }}>
                      100%
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Month-End Close Progress */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Month-end close progress</h2>
            <div className={styles.progressSummary}>
              <CheckCircle2 size={15} />
              <span>
                {tasksCompleted} of {tasksTotal} tasks complete
              </span>
            </div>
          </div>

          <table className={styles.dataTable} aria-label="Month-End Close Checklist">
            <thead>
              <tr>
                <th>Recent tasks</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Due date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonRow}`} />
                  </td>
                </tr>
              ) : closeTasks.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-4)" }}>
                    <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>
                      No active close checklist tasks for this period.
                    </span>
                  </td>
                </tr>
              ) : (
                closeTasks.map((t) => (
                  <tr key={t.id || t.task}>
                    <td>
                      <div className={styles.typeCell}>
                        {t.done ? (
                          <CheckCircle2 size={14} className={styles.checkCircleDone} />
                        ) : (
                          <Clock size={14} className={styles.checkCirclePending} />
                        )}
                        <span>{t.task}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.avatarBadge}>{t.owner}</span>
                    </td>
                    <td>
                      <span
                        className={
                          t.done ? styles.statusComplete : styles.statusInProgress
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{t.due}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <Link href="/finance/advanced/close-tasks" className={styles.cardFooterLink}>
            <span>View all tasks</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* 5. Page Footer */}
      <footer className={styles.pageFooter}>
        <span>
          {data ? "Live database" : "No finance data"} • Updated {updatedTimeStr}
        </span>
      </footer>
    </div>
  );
}
