"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Spinner,
  useToast,
} from "@kannan19302/ui";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  RefreshCw,
  ShieldAlert,
  Search,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

type Severity = "critical" | "warning" | "info";

interface Insight {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  detail: string;
  metric?: string;
}

interface InsightResponse {
  generatedAt: string;
  scanned: { invoices: number; products: number };
  insights: Insight[];
}

const SEVERITY_STYLE: Record<
  Severity,
  { color: string; label: string; icon: React.ReactNode }
> = {
  critical: {
    color: "var(--color-danger)",
    label: "Critical Risks",
    icon: <AlertOctagon size={16} />,
  },
  warning: {
    color: "var(--color-warning)",
    label: "Warnings",
    icon: <AlertTriangle size={16} />,
  },
  info: {
    color: "var(--color-brand, var(--color-primary))",
    label: "Observations",
    icon: <Info size={16} />,
  },
};

export default function SmartInsightsPage() {
  const client = useApiClient();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightResponse | null>(null);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  const loadData = async (manual = false) => {
    setLoading(true);
    try {
      const res = await client.get<InsightResponse | null>("/analytics/insights");
      setData(res);
      if (manual) {
        toast.success("Intelligence Rescan Complete", "Updated statistical outlier scan.");
      }
    } catch (err) {
      toast.error(
        "Scan Failed",
        err instanceof Error ? err.message : "Error scanning insights",
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = (id: string, title: string) => {
    setAcknowledgedIds((prev) => new Set([...prev, id]));
    toast.success("Insight Acknowledged", `Marked "${title}" as reviewed.`);
  };

  const insights = (data?.insights ?? []).filter(
    (ins) => !acknowledgedIds.has(ins.id),
  );
  const counts: Record<Severity, number> = {
    critical: insights.filter((i) => i.severity === "critical").length,
    warning: insights.filter((i) => i.severity === "warning").length,
    info: insights.filter((i) => i.severity === "info").length,
  };
  const filtered =
    filter === "all" ? insights : insights.filter((i) => i.severity === filter);

  if (loading && !data) {
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
    <RouteGuard permission="analytics.insights.read">
      <div className={styles.container} data-density="compact">
        <PageHeader
          title="Smart Insights & AI Anomaly Intelligence"
          description="Continuous statistical surveillance across live revenue velocities, receivables aging, and inventory margins to uncover operational risks."
          actions={
            <Button
              size="sm"
              onClick={() => loadData(true)}
              disabled={loading}
            >
              <RefreshCw
                size={14}
                className={loading ? "spin-animation" : ""}
                style={{ marginRight: "var(--space-1-5)" }}
              />
              {loading ? "Scanning Metrics..." : "Re-Scan Telemetry"}
            </Button>
          }
        />

        {/* Severity Summary Matrix */}
        <div className={styles.summaryGrid}>
          {(["critical", "warning", "info"] as Severity[]).map((sev) => {
            const s = SEVERITY_STYLE[sev];
            const active = filter === sev;
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setFilter(active ? "all" : sev)}
                style={{
                  border: `1px solid ${active ? s.color : "var(--color-border)"}`,
                }}
                className={styles.severityBtn}
              >
                <div style={{ color: s.color }} className={styles.severityHeader}>
                  {s.icon} {s.label}
                </div>
                <div className={styles.severityCount}>{counts[sev]}</div>
              </button>
            );
          })}

          <div className={styles.scannedCard}>
            <div className={styles.scannedLabel}>
              <Search size={14} /> Records Evaluated
            </div>
            <div className={styles.scannedValue}>
              {data
                ? `${data.scanned.invoices.toLocaleString()} inv · ${data.scanned.products.toLocaleString()} prod`
                : "—"}
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        {filter !== "all" && (
          <div className={styles.filterBar}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Filtering by: <strong>{filter.toUpperCase()}</strong> ({filtered.length} items)
            </span>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={styles.resetFilterBtn}
            >
              ← Show All Severities
            </button>
          </div>
        )}

        {/* Insights Triage List */}
        <div className={styles.insightsList}>
          {filtered.map((ins) => {
            const s = SEVERITY_STYLE[ins.severity];
            return (
              <div
                key={ins.id}
                style={{ borderLeft: `var(--space-1) solid ${s.color}` }}
                className={styles.insightCard}
              >
                <div style={{ color: s.color, marginTop: "var(--space-0-5)" }}>
                  {s.icon}
                </div>
                <div className={styles.insightContent}>
                  <div className={styles.insightTopRow}>
                    <Badge variant={ins.severity === "critical" ? "danger" : ins.severity === "warning" ? "warning" : "info"}>
                      {ins.category}
                    </Badge>
                    <h3 className={styles.insightTitle}>{ins.title}</h3>
                  </div>
                  <p className={styles.insightDetail}>{ins.detail}</p>
                </div>

                {ins.metric && (
                  <div style={{ color: s.color }} className={styles.insightMetric}>
                    {ins.metric}
                  </div>
                )}

                <div style={{ display: "flex", gap: "var(--space-1-5)", alignSelf: "center" }}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcknowledge(ins.id, ins.title)}
                  >
                    <CheckCircle2 size={13} style={{ marginRight: "var(--space-1)" }} />
                    Acknowledge
                  </Button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              <CheckCircle2 size={32} style={{ color: "var(--color-success)", margin: "0 auto var(--space-2) auto" }} />
              <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
                No active insights for this filter.
              </p>
              <p style={{ margin: "var(--space-1) 0 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                All observed transactions and metric deviations are resolved.
              </p>
            </div>
          )}
        </div>

        {data && (
          <div className={styles.scanFooter}>
            Last live anomaly scan evaluated on {new Date(data.generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
