"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";
import styles from "./page.module.css";

// Sparkline SVG component for KPI cards
function Sparkline({ data, strokeColor = "var(--color-primary, #2563eb)" }: { data: number[]; strokeColor?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 30;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className={styles.sparklineWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.sparklineSvg} preserveAspectRatio="none">
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

export default function FinanceOverviewPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("jan-aug-2026");

  // Trend data points for Jan–Aug 2026
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const revenueTrend = [3.62, 3.78, 3.95, 4.12, 4.28, 4.46, 4.22, 4.82];
  const expenseTrend = [2.31, 2.41, 2.47, 2.56, 2.63, 2.71, 2.68, 2.90];

  // Accounts receivable aging data
  const agingBuckets = [
    { label: "Current (0–30 days)", amount: "682,550", pct: 81, widthPct: 81 },
    { label: "1–30 days", amount: "78,600", pct: 9, widthPct: 15 },
    { label: "31–60 days", amount: "45,300", pct: 5, widthPct: 10 },
    { label: "61–90 days", amount: "22,100", pct: 3, widthPct: 6 },
    { label: "90+ days", amount: "14,350", pct: 2, widthPct: 4 },
  ];

  // Month-end close checklist tasks
  const closeTasks = [
    { task: "Post all recurring journals", owner: "AB", status: "Complete", due: "Aug 31, 2026", done: true },
    { task: "Reconcile bank accounts", owner: "CD", status: "Complete", due: "Aug 31, 2026", done: true },
    { task: "Review and approve AP accruals", owner: "EF", status: "Complete", due: "Aug 31, 2026", done: true },
    { task: "Review and approve AR adjustments", owner: "GH", status: "Complete", due: "Aug 31, 2026", done: true },
    { task: "Validate intercompany balances", owner: "IJ", status: "Complete", due: "Sep 1, 2026", done: true },
    { task: "Review tax provision", owner: "KL", status: "In progress", due: "Sep 2, 2026", done: false },
  ];

  return (
    <div className={styles.pageRoot}>
      {/* 1. Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleGroup}>
          <h1 className={styles.pageTitle}>Finance overview</h1>
          <p className={styles.pageSubtitle}>Monitor performance, exceptions, and close progress.</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.metaInfo}>
            <span>Demo data</span>
            <span className={styles.metaSep}>|</span>
            <span>Updated 09:42 UTC</span>
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

      {/* 2. Top 4 KPI Cards */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Revenue */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Revenue</span>
            <span className={styles.kpiCurrency}>USD</span>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValueGroup}>
              <div className={styles.kpiValue}>4.82M</div>
              <div className={styles.kpiDelta}>
                <span className={styles.deltaPositive}>↑ +14.2%</span>
                <span>vs Jul 2026 (4.22M)</span>
              </div>
            </div>
            <Sparkline data={[4.1, 4.2, 4.35, 4.3, 4.45, 4.22, 4.6, 4.82]} />
          </div>
        </div>

        {/* Card 2: Operating Cash Flow */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Operating cash flow</span>
            <span className={styles.kpiCurrency}>USD</span>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValueGroup}>
              <div className={styles.kpiValue}>1.24M</div>
              <div className={styles.kpiDelta}>
                <span className={styles.deltaPositive}>↑ +5.1%</span>
                <span>vs Jul 2026 (1.18M)</span>
              </div>
            </div>
            <Sparkline data={[1.1, 1.15, 1.12, 1.18, 1.15, 1.18, 1.2, 1.24]} />
          </div>
        </div>

        {/* Card 3: EBITDA Margin */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>EBITDA margin</span>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValueGroup}>
              <div className={styles.kpiValue}>28.4%</div>
              <div className={styles.kpiDelta}>
                <span className={styles.deltaPositive}>↑ +0.8 pp</span>
                <span>vs Jul 2026 (27.6%)</span>
              </div>
            </div>
            <Sparkline data={[26.5, 27.0, 27.2, 27.5, 28.0, 27.6, 28.1, 28.4]} />
          </div>
        </div>

        {/* Card 4: Days Sales Outstanding */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiLabel}>Days sales outstanding (DSO)</span>
          </div>
          <div className={styles.kpiBody}>
            <div className={styles.kpiValueGroup}>
              <div className={styles.kpiValue}>34 days</div>
              <div className={styles.kpiDelta}>
                <span className={styles.deltaPositive}>↓ -2 days</span>
                <span>vs Jul 2026 (36 days)</span>
              </div>
            </div>
            <Sparkline data={[38, 37, 37, 36, 36, 36, 35, 34]} />
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
            {/* SVG Dual-Line Trend Chart */}
            <svg viewBox="0 0 600 200" className={styles.trendSvg}>
              {/* Grid Lines */}
              {[0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0].map((val) => {
                const y = 170 - (val / 6.0) * 150;
                return (
                  <g key={val}>
                    <line x1="45" y1={y} x2="580" y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="38" y={y + 3} textAnchor="end" fontSize="10" fill="var(--color-text-tertiary)" fontFamily="var(--font-mono)">
                      {val === 0 ? "0" : `${val.toFixed(1)}M`}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {months.map((m, i) => {
                const x = 75 + i * 70;
                return (
                  <text key={m} x={x} y="190" textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)" fontFamily="var(--font-sans)">
                    {m}
                  </text>
                );
              })}

              {/* Operating Expenses Line (Orange) */}
              <polyline
                fill="none"
                stroke="var(--chart-2, #ea580c)"
                strokeWidth="2.5"
                points={expenseTrend
                  .map((val, i) => `${75 + i * 70},${(170 - (val / 6.0) * 150).toFixed(1)}`)
                  .join(" ")}
              />
              {expenseTrend.map((val, i) => {
                const x = 75 + i * 70;
                const y = 170 - (val / 6.0) * 150;
                return (
                  <g key={`exp-${i}`}>
                    <circle cx={x} cy={y} r="3.5" fill="var(--chart-2, #ea580c)" />
                    <text x={x} y={y + 14} textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)" fontFamily="var(--font-mono)">
                      {val.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Revenue Line (Blue) */}
              <polyline
                fill="none"
                stroke="var(--color-primary, #2563eb)"
                strokeWidth="2.5"
                points={revenueTrend
                  .map((val, i) => `${75 + i * 70},${(170 - (val / 6.0) * 150).toFixed(1)}`)
                  .join(" ")}
              />
              {revenueTrend.map((val, i) => {
                const x = 75 + i * 70;
                const y = 170 - (val / 6.0) * 150;
                return (
                  <g key={`rev-${i}`}>
                    <circle cx={x} cy={y} r="3.5" fill="var(--color-primary, #2563eb)" />
                    <text x={x} y={y - 8} textAnchor="middle" fontSize="9.5" fill="var(--color-text)" fontWeight="600" fontFamily="var(--font-mono)">
                      {val.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </svg>

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

        {/* Exceptions Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleWrap}>
              <h2 className={styles.cardTitle}>Exceptions</h2>
              <span className={styles.badgeAttention}>3 need attention</span>
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
              <tr>
                <td>
                  <div className={styles.typeCell}>
                    <AlertCircle size={14} className={styles.typeIconDanger} />
                    <span>Overdue receivables</span>
                  </div>
                </td>
                <td>Invoices past due</td>
                <td className={styles.amountCell}>$118,450</td>
                <td className={styles.numCell}>26</td>
                <td className={styles.dateCell}>Aug 2, 2026</td>
                <td>
                  <Link href="/finance/ar" className={styles.actionLink}>
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
                <td>Bank / GL not matched</td>
                <td className={styles.amountCell}>$64,780</td>
                <td className={styles.numCell}>18</td>
                <td className={styles.dateCell}>Aug 28, 2026</td>
                <td>
                  <Link href="/finance/banking" className={styles.actionLink}>
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
                <td>Pending manager approval</td>
                <td className={styles.amountCell}>$154,320</td>
                <td className={styles.numCell}>12</td>
                <td className={styles.dateCell}>Aug 29, 2026</td>
                <td>
                  <Link href="/finance/journal-entries" className={styles.actionLink}>
                    Review
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>

          <Link href="/finance/ap" className={styles.cardFooterLink}>
            View all exceptions
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
              {agingBuckets.map((b) => (
                <tr key={b.label}>
                  <td>{b.label}</td>
                  <td>
                    <div className={styles.agingBarTrack}>
                      <div className={styles.agingBarFill} style={{ width: `${b.widthPct}%` }} />
                    </div>
                  </td>
                  <td className={styles.amountCell} style={{ textAlign: "right" }}>
                    {b.amount}
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
                  842,900
                </td>
                <td className={styles.numCell} style={{ textAlign: "right" }}>
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Month-End Close Progress */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Month-end close progress</h2>
            <div className={styles.progressSummary}>
              <CheckCircle2 size={15} />
              <span>8 of 10 tasks complete</span>
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
              {closeTasks.map((t) => (
                <tr key={t.task}>
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
                    <span className={t.done ? styles.statusComplete : styles.statusInProgress}>
                      {t.status}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{t.due}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Link href="/finance/advanced/close-tasks" className={styles.cardFooterLink}>
            View all tasks
          </Link>
        </div>
      </div>

      {/* 5. Page Footer */}
      <footer className={styles.pageFooter}>
        <span>Demo data • Updated 09:42 UTC by Finance Manager</span>
      </footer>
    </div>
  );
}
