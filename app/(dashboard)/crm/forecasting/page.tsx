"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast, Button, Input, ListPageTemplate, type ListColumn, DataTable } from "@kannan19302/ui";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Users,
  Clock,
  Award,
} from "lucide-react";
import { apiGet } from "../_components/api";
import styles from "./page.module.css";

interface Forecast {
  bestCase: number;
  commit: number;
  worstCase: number;
  pipelineDeals: number;
}
interface RepPerformance {
  id: string;
  name: string;
  dealsWon: number;
  revenue: number;
  avgDealSize: number;
  avgCycleTimeDays: number;
}
interface RepForecast {
  userId: string;
  name: string;
  pipelineAmount: number;
  weightedAmount: number;
  openDeals: number;
}
interface FunnelStage {
  label: string;
  value: number;
  percentage: number;
}
interface SalesTarget {
  id: string;
  name: string;
  period: string;
  target: number;
  achieved: number;
}

export default function ForecastingPage() {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [reps, setReps] = useState<RepPerformance[]>([]);
  const [repForecasts, setRepForecasts] = useState<RepForecast[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [sortField, setSortField] = useState<keyof RepPerformance>("revenue");
  const [sortAsc, setSortAsc] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [quotas, setQuotas] = useState<any[]>([]);
  const [newQuota, setNewQuota] = useState({
    userId: "",
    period: "",
    amount: "",
  });
  const [submittingQuota, setSubmittingQuota] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [fc, rp, fn, tg, rf, snaps, qts] = await Promise.all([
        apiGet<Forecast>("/crm/analytics/forecast"),
        apiGet<RepPerformance[]>("/crm/analytics/rep-performance"),
        apiGet<FunnelStage[]>("/crm/analytics/conversion-funnel"),
        apiGet<SalesTarget[]>("/crm/targets"),
        apiGet<RepForecast[]>("/crm/analytics/forecast-by-rep"),
        apiGet<any[]>("/crm/expansion/forecast-snapshots"),
        apiGet<any[]>("/crm/expansion/quotas"),
      ]);
      setForecast(
        fc || { bestCase: 0, commit: 0, worstCase: 0, pipelineDeals: 0 },
      );
      setReps(Array.isArray(rp) ? rp : []);
      setFunnel(Array.isArray(fn) ? fn : []);
      setTargets(Array.isArray(tg) ? tg : []);
      setRepForecasts(Array.isArray(rf) ? rf : []);
      setSnapshots(Array.isArray(snaps) ? snaps : []);
      setQuotas(Array.isArray(qts) ? qts : []);
    } catch (err) {
      toast.error(
        "Could not load forecasting data",
        err instanceof Error ? err.message : "Please try again.",
      );
      setForecast({ bestCase: 0, commit: 0, worstCase: 0, pipelineDeals: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [toast]);

  const handleCreateQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuota.userId || !newQuota.period || !newQuota.amount) {
      toast.error("Validation Error", "All fields are required.");
      return;
    }
    setSubmittingQuota(true);
    try {
      // Import apiPost from components helper dynamically or use it directly
      const { apiPost } = await import("../_components/api");
      await apiPost("/crm/expansion/quotas", {
        userId: newQuota.userId,
        period: newQuota.period,
        amount: parseFloat(newQuota.amount),
      });
      toast.success("Success", "Quota created successfully.");
      setNewQuota({ userId: "", period: "", amount: "" });
      loadData();
    } catch (err) {
      toast.error(
        "Error creating quota",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSubmittingQuota(false);
    }
  };

  const handleFreezeSnapshot = async (id: string) => {
    try {
      const { apiPut } = await import("../_components/api");
      await apiPut(`/crm/expansion/forecast-snapshots/${id}/freeze`, {});
      toast.success("Success", "Snapshot frozen.");
      loadData();
    } catch (err) {
      toast.error(
        "Error freezing snapshot",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const handleAdjustForecast = async (id: string, amount: number) => {
    try {
      const { apiPut } = await import("../_components/api");
      await apiPut(`/crm/expansion/forecast-snapshots/${id}/adjust`, {
        amount,
      });
      toast.success("Success", "Forecast override applied.");
      loadData();
    } catch (err) {
      toast.error(
        "Error adjusting forecast",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const fmtCurrency = (v: number) =>
    `$${v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "K" : v.toLocaleString()}`;

  const toggleSort = (field: keyof RepPerformance) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };
  const sortedReps = [...reps].sort((a, b) => {
    const av = a[sortField],
      bv = b[sortField];
    const cmp =
      typeof av === "number"
        ? (av as number) - (bv as number)
        : String(av).localeCompare(String(bv));
    return sortAsc ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: keyof RepPerformance }) =>
    sortField === field ? (
      sortAsc ? (
        <ArrowUp size={12} />
      ) : (
        <ArrowDown size={12} />
      )
    ) : null;

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  const kpis = [
    {
      label: "Best Case",
      value: fmtCurrency(forecast!.bestCase),
      icon: <TrendingUp size={20} />,
      color: "var(--color-success)",
    },
    {
      label: "Commit",
      value: fmtCurrency(forecast!.commit),
      icon: <Target size={20} />,
      color: "var(--color-primary)",
    },
    {
      label: "Worst Case",
      value: fmtCurrency(forecast!.worstCase),
      icon: <TrendingDown size={20} />,
      color: "var(--color-warning)",
    },
    {
      label: "Pipeline Deals",
      value: String(forecast!.pipelineDeals),
      icon: <BarChart3 size={20} />,
      color: "var(--color-info)",
    },
  ];

  const funnelColors = [
    "var(--color-primary)",
    "var(--color-info)",
    "var(--color-warning)",
    "var(--color-success)",
  ];

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Sales Forecasting"
        description="Pipeline forecasts, rep performance, and conversion analytics"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "CRM", href: "/crm" },
          { label: "Forecasting" },
        ]}
      />

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {kpis.map((k) => (
          <Card key={k.label}>
            <div className="p-5 ui-hstack-4">
              <div
                className={styles.kpiIcon}
                style={{ background: k.color + "18", color: k.color }}
              >
                {k.icon}
              </div>
              <div>
                <div className={styles.kpiLabel}>{k.label}</div>
                <div className={styles.kpiValue}>{k.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="ui-grid-2 ui-gap-6">
        {/* Conversion Funnel */}
        <Card>
          <div className="p-6">
            <h3 className={styles.sectionTitle}>Conversion Funnel</h3>
            <div className="ui-stack-3">
              {funnel.map((stage, idx) => {
                const widthPct = Math.max(stage.percentage, 15);
                return (
                  <div key={stage.label}>
                    <div className={styles.stageHeader}>
                      <span className={styles.stageLabel}>{stage.label}</span>
                      <span className="ui-text-muted">
                        {stage.value.toLocaleString()} ({stage.percentage}%)
                      </span>
                    </div>
                    <div className={styles.funnelTrack}>
                      <div
                        className={styles.funnelValue}
                        style={{
                          width: `${widthPct}%`,
                          background: funnelColors[idx],
                        }}
                      >
                        {stage.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Sales Targets */}
        <Card>
          <div className="p-6">
            <h3 className={`${styles.sectionTitle} ${styles.titleWithIcon}`}>
              <Target size={18} /> Sales Targets
            </h3>
            <div className="ui-stack-4">
              {targets.map((t) => {
                const pct = Math.min(
                  Math.round((t.achieved / t.target) * 100),
                  100,
                );
                return (
                  <div key={t.id}>
                    <div className={styles.stageHeader}>
                      <span className={styles.stageLabel}>{t.name}</span>
                      <Badge variant="default">{t.period}</Badge>
                    </div>
                    <div className="ui-hstack-2">
                      <div className={styles.targetTrack}>
                        <div
                          className={styles.targetValue}
                          style={{
                            width: `${pct}%`,
                            background:
                              pct >= 80
                                ? "var(--color-success)"
                                : pct >= 50
                                  ? "var(--color-warning)"
                                  : "var(--color-danger)",
                          }}
                        />
                      </div>
                      <span className={styles.targetPercentage}>{pct}%</span>
                    </div>
                    <div className={styles.targetDescription}>
                      {typeof t.achieved === "number" && t.achieved >= 1000
                        ? fmtCurrency(t.achieved)
                        : t.achieved}{" "}
                      /{" "}
                      {typeof t.target === "number" && t.target >= 1000
                        ? fmtCurrency(t.target)
                        : t.target}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline-Weighted Forecast by Rep */}
      <Card>
        <div className="p-6">
          <h3 className={`${styles.sectionTitle} ${styles.titleWithIcon}`}>
            <BarChart3 size={18} /> Pipeline-Weighted Forecast by Rep
          </h3>
          {repForecasts.length === 0 ? (
            <div className={styles.emptyMessage}>
              No open pipeline assigned to reps.
            </div>
          ) : (
            <ListPageTemplate
              columns={
                [
                  { key: "name", header: "Rep" },
                  { key: "openDeals", header: "Open Deals" },
                  {
                    key: "pipelineAmount",
                    header: "Pipeline Amount",
                    render: (v: any) => fmtCurrency(Number(v)),
                  },
                  {
                    key: "weightedAmount",
                    header: "Weighted Forecast",
                    render: (v: any) => (
                      <span className="font-semibold">
                        {fmtCurrency(Number(v))}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={repForecasts as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No forecasts"
              emptyDescription="No open pipeline assigned to reps."
            />
          )}
        </div>
      </Card>

      {/* Rep Leaderboard */}
      <Card>
        <div className="p-6">
          <h3 className={`${styles.sectionTitle} ${styles.titleWithIcon}`}>
            <Award size={18} /> Rep Leaderboard
          </h3>
          <>{(() => {
                          const columns = [
                    { key: "col_0", header: "{col.label}<SortIcon field={col.key} />" , render: (rep: any) => (<>{idx === 0 && (
                                        <Award size={14} className="ui-text-warning" />
                                      )}{rep.name}</>) },
                    { key: "col_1", header: "Col 1" , render: (rep: any) => (<>{rep.dealsWon}</>) },
                    { key: "col_2", header: "Col 2" , render: (rep: any) => (<>{fmtCurrency(rep.revenue)}</>) },
                    { key: "col_3", header: "Col 3" , render: (rep: any) => (<>{fmtCurrency(rep.avgDealSize)}</>) },
                    { key: "col_4", header: "Col 4" , render: (rep: any) => (<><Clock size={12} className="ui-text-muted" />{" "}{rep.avgCycleTimeDays}d
                                    </>) },
                  ];
                          return <DataTable columns={columns} data={sortedReps} rowKey={(rep: any) => rep.id} />;
                      })()}</>
        </div>
      </Card>

      {/* Forecast Snapshots / Overrides */}
      <Card>
        <div className="p-6">
          <h3 className={styles.sectionTitle}>
            Forecast Snapshots & Adjustments
          </h3>
          {snapshots.length === 0 ? (
            <div className={styles.emptyMessage}>
              No forecast snapshots created yet.
            </div>
          ) : (
            <>{(() => {
                                  const columns = [
                            { key: "col_0", header: "Snapshot Name" , render: (snap: any) => (<>{snap.name}</>) },
                            { key: "col_1", header: "Quota" , render: (snap: any) => (<>{fmtCurrency(Number(snap.quotaAmount))}</>) },
                            { key: "col_2", header: "Pipeline" , render: (snap: any) => (<>{fmtCurrency(Number(snap.pipelineAmount))}</>) },
                            { key: "col_3", header: "Won" , render: (snap: any) => (<>{fmtCurrency(Number(snap.wonAmount))}</>) },
                            { key: "col_4", header: "Override Forecast" , render: (snap: any) => (<>{snap.status === "FROZEN" ? (
                                                  <span>{fmtCurrency(Number(snap.forecastAmount))}</span>
                                                ) : (
                                                  <div className="ui-flex-end ui-gap-2">
                                                    <Input
                                                      type="number"
                                                      defaultValue={snap.forecastAmount}
                                                      onBlur={(e) =>
                                                        handleAdjustForecast(
                                                          snap.id,
                                                          parseFloat(e.target.value),
                                                        )
                                                      }
                                                      className={styles.forecastInput}
                                                    />
                                                  </div>
                                                )}</>) },
                            { key: "col_5", header: "Status" , render: (snap: any) => (<><Badge
                                                  variant={
                                                    snap.status === "FROZEN" ? "default" : "success"
                                                  }
                                                >
                                                  {snap.status}
                                                </Badge></>) },
                            { key: "col_6", header: "Actions" , render: (snap: any) => (<>{snap.status !== "FROZEN" && (
                                                  <Button
                                                    size="sm"
                                                    onClick={() => handleFreezeSnapshot(snap.id)}
                                                  >
                                                    Freeze
                                                  </Button>
                                                )}</>) },
                          ];
                                  return <DataTable columns={columns} data={snapshots} rowKey={(snap: any) => snap.id} />;
                              })()}</>
          )}
        </div>
      </Card>

      {/* Quota Management */}
      <div className="ui-grid-2 ui-gap-6">
        <Card>
          <div className="p-6">
            <h3 className={styles.sectionTitle}>Assign Sales Quota</h3>
            <form onSubmit={handleCreateQuota} className="ui-stack-4">
              <div>
                <label className={styles.formLabel}>User ID</label>
                <Input
                  type="text"
                  placeholder="e.g. usr-123"
                  value={newQuota.userId}
                  onChange={(e) =>
                    setNewQuota({ ...newQuota, userId: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className={styles.formLabel}>Period</label>
                <Input
                  type="text"
                  placeholder="e.g. Q3 2026"
                  value={newQuota.period}
                  onChange={(e) =>
                    setNewQuota({ ...newQuota, period: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className={styles.formLabel}>Amount ($)</label>
                <Input
                  type="number"
                  placeholder="e.g. 100000"
                  value={newQuota.amount}
                  onChange={(e) =>
                    setNewQuota({ ...newQuota, amount: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={submittingQuota}>
                {submittingQuota ? "Saving..." : "Assign Quota"}
              </Button>
            </form>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className={styles.sectionTitle}>Current Quotas</h3>
            {quotas.length === 0 ? (
              <div className={styles.emptyMessage}>No quotas assigned yet.</div>
            ) : (
              <ListPageTemplate
                columns={
                  [
                    { key: "userId", header: "User ID" },
                    { key: "period", header: "Period" },
                    {
                      key: "amount",
                      header: "Amount",
                      render: (v: any) => (
                        <span className="font-semibold">
                          {fmtCurrency(Number(v))}
                        </span>
                      ),
                    },
                  ] as ListColumn[]
                }
                data={quotas as unknown as Record<string, unknown>[]}
                loading={false}
                emptyTitle="No quotas"
                emptyDescription="No quotas assigned yet."
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
