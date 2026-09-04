"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  DataTable,
  Badge,
  Spinner,
  useToast,
} from "@kannan19302/ui";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Layers,
  BarChart3,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface TrendResult {
  id: string;
  kpiName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  previousValue: number | null;
  changePercent: number | null;
  metadata: Record<string, unknown> | null;
}

export default function TrendsPage() {
  const client = useApiClient();
  const toast = useToast();
  const [trends, setTrends] = useState<TrendResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [groupBy, setGroupBy] = useState("MONTH");

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const r = await client.get<{ data: TrendResult[]; meta: unknown }>(
        `/analytics/trends?groupBy=${groupBy}`,
      );
      setTrends(r.data || []);
    } catch (err) {
      toast.error(
        "Failed to load trends",
        err instanceof Error ? err.message : "Error loading trends",
      );
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [groupBy]);

  const computeTrends = async () => {
    try {
      setComputing(true);
      await client.post("/analytics/trends", { groupBy });
      toast.success(
        "Trends Computed",
        `Calculated period-over-period delta series for ${groupBy.toLowerCase()} interval.`,
      );
      fetchTrends();
    } catch (err) {
      toast.error(
        "Computation Failed",
        err instanceof Error ? err.message : "Error computing trends",
      );
    } finally {
      setComputing(false);
    }
  };

  if (loading && trends.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(var(--space-12) * 5)",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <RouteGuard permission="analytics.trends.read">
      <div className={styles.container} data-density="compact">
        <PageHeader
          title="Period-over-Period Trend Analysis"
          description="Track longitudinal business performance velocity, evaluate period-over-period trajectory, and calculate statistical variances across time intervals."
          actions={
            <Button onClick={computeTrends} disabled={computing} size="sm">
              <RefreshCw
                size={14}
                className={computing ? "spin-animation" : ""}
                style={{ marginRight: "var(--space-1-5)" }}
              />
              {computing ? "Computing..." : "Compute Trends"}
            </Button>
          }
        />

        {/* Group Interval Controls */}
        <div className={styles.controlsCard}>
          <div className={styles.filterGroup}>
            <Calendar size={15} style={{ color: "var(--color-brand, var(--color-primary))" }} />
            <label className={styles.filterLabel}>Aggregation Cadence:</label>
            <select
              className={styles.selectInput}
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="DAY">Daily Cadence</option>
              <option value="WEEK">Weekly Cadence</option>
              <option value="MONTH">Monthly Cadence</option>
              <option value="QUARTER">Quarterly Cadence</option>
              <option value="YEAR">Annual Cadence</option>
            </select>
          </div>
          <Badge variant="info">Cadence: {groupBy}</Badge>
        </div>

        {/* Trend Results Table */}
        <Card className={styles.tableSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Calculated Longitudinal Trends ({trends.length})</h3>
          </div>

          {trends.length === 0 ? (
            <div className={styles.emptyState}>
              <TrendingUp size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
              <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
                No trend computations recorded for {groupBy}.
              </p>
              <p style={{ margin: "var(--space-1) 0 var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Click "Compute Trends" to calculate delta metrics across this time horizon.
              </p>
              <Button size="sm" onClick={computeTrends}>
                <RefreshCw size={13} style={{ marginRight: "var(--space-1)" }} />
                Calculate Trends
              </Button>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "kpiName",
                  header: "Telemetry Metric",
                  render: (t: TrendResult) => (
                    <span style={{ fontWeight: "var(--weight-semibold)" }}>{t.kpiName}</span>
                  ),
                },
                {
                  key: "period",
                  header: "Sampling Period",
                  render: (t: TrendResult) => (
                    <div>
                      <Badge variant="default">{t.period}</Badge>
                      <span
                        style={{
                          marginLeft: "var(--space-2)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-secondary)",
                          fontFamily: "var(--font-mono, monospace)",
                          fontVariantNumeric: "tabular-nums lining-nums",
                        }}
                      >
                        {new Date(t.periodStart).toLocaleDateString()} – {new Date(t.periodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "value",
                  header: "Current Value",
                  render: (t: TrendResult) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontWeight: "var(--weight-bold)",
                      }}
                    >
                      {typeof t.value === "number" ? t.value.toLocaleString() : t.value}
                    </span>
                  ),
                },
                {
                  key: "previousValue",
                  header: "Previous Value",
                  render: (t: TrendResult) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {t.previousValue !== null ? t.previousValue.toLocaleString() : "—"}
                    </span>
                  ),
                },
                {
                  key: "changePercent",
                  header: "Period Delta",
                  render: (t: TrendResult) => {
                    if (t.changePercent === null) return <span>—</span>;
                    const isPositive = t.changePercent >= 0;
                    return (
                      <span className={isPositive ? styles.upChange : styles.downChange}>
                        {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {isPositive ? "+" : ""}
                        {t.changePercent.toFixed(1)}%
                      </span>
                    );
                  },
                },
              ]}
              data={trends}
              rowKey={(t: TrendResult) => t.id}
            />
          )}
        </Card>
      </div>
    </RouteGuard>
  );
}
