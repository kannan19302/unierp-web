"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, PageHeader, Spinner, useToast, Badge, DataTable, Button } from "@kannan19302/ui";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface AnomalyItem {
  id: string;
  metric: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  deviationPercent: string;
  detectedAt: string;
  status: string;
}

export default function AnalyticsAnomaliesPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const toast = useToast();

  const loadAnomalies = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      const data = await client.get<AnomalyItem[]>(
        "/analytics/anomaly-detection-deep/anomalies",
      );
      setAnomalies(Array.isArray(data) ? data : []);
      if (isManual) {
        toast.success("Anomalies Refreshed", "Live anomaly scan completed.");
      }
    } catch (err) {
      toast.error(
        "Failed to load Anomaly Detection entries",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
  }, []);

  const criticalCount = useMemo(
    () => anomalies.filter((a) => a.severity === "CRITICAL").length,
    [anomalies],
  );

  const warningCount = useMemo(
    () => anomalies.filter((a) => a.severity === "WARNING").length,
    [anomalies],
  );

  const filteredAnomalies = useMemo(() => {
    if (selectedSeverity === "ALL") return anomalies;
    return anomalies.filter((a) => a.severity === selectedSeverity);
  }, [anomalies, selectedSeverity]);

  if (loading) {
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
    <div className={styles.container} data-density="compact">
      <PageHeader
        title="AI Automated Metric Anomaly Detection"
        description="Continuous statistical anomaly detection, unexpected traffic spikes, and financial divergence alerts."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAnomalies(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={14}
              style={{
                marginRight: "var(--space-1-5)",
                animation: refreshing ? "spin 1s linear infinite" : undefined,
              }}
            />
            Scan Live Metrics
          </Button>
        }
      />

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <AlertOctagon size={18} style={{ color: "var(--color-danger)" }} />
          </div>
          <div>
            <p className={styles.statLabel}>Critical Outliers</p>
            <p className={styles.statValue}>{criticalCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <AlertTriangle size={18} style={{ color: "var(--color-warning)" }} />
          </div>
          <div>
            <p className={styles.statLabel}>Warning Deviations</p>
            <p className={styles.statValue}>{warningCount}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <ShieldCheck size={18} style={{ color: "var(--color-success)" }} />
          </div>
          <div>
            <p className={styles.statLabel}>Algorithm Model</p>
            <p className={styles.statValue} style={{ fontSize: "var(--text-sm)" }}>
              Rolling Z-Score (3σ)
            </p>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <button
          className={`${styles.filterBtn} ${selectedSeverity === "ALL" ? styles.filterBtnActive : ""}`}
          onClick={() => setSelectedSeverity("ALL")}
        >
          All Events ({anomalies.length})
        </button>
        <button
          className={`${styles.filterBtn} ${selectedSeverity === "CRITICAL" ? styles.filterBtnActive : ""}`}
          onClick={() => setSelectedSeverity("CRITICAL")}
        >
          Critical ({criticalCount})
        </button>
        <button
          className={`${styles.filterBtn} ${selectedSeverity === "WARNING" ? styles.filterBtnActive : ""}`}
          onClick={() => setSelectedSeverity("WARNING")}
        >
          Warning ({warningCount})
        </button>
      </div>

      <Card className={styles.cardSection}>
        <h3 className={styles.cardTitle}>Detected Metric Anomalies</h3>
        {filteredAnomalies.length === 0 ? (
          <div className={styles.emptyState}>
            <ShieldCheck size={32} style={{ color: "var(--color-success)" }} />
            <p className={styles.emptyStateTitle}>Zero Outliers Detected</p>
            <p className={styles.emptyStateDesc}>
              All tenant metrics and operational financial transactions are currently performing within expected statistical variance bounds.
            </p>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "metric",
                header: "Observed Metric",
                render: (a: AnomalyItem) => (
                  <span style={{ fontWeight: "var(--weight-semibold)" }}>{a.metric}</span>
                ),
              },
              {
                key: "severity",
                header: "Severity",
                render: (a: AnomalyItem) => (
                  <Badge variant={a.severity === "CRITICAL" ? "danger" : "warning"}>
                    {a.severity}
                  </Badge>
                ),
              },
              {
                key: "deviationPercent",
                header: "Deviation Delta",
                render: (a: AnomalyItem) => (
                  <span
                    style={{
                      color:
                        a.severity === "CRITICAL"
                          ? "var(--color-danger)"
                          : "var(--color-warning)",
                      fontFamily: "var(--font-mono, monospace)",
                      fontWeight: "var(--weight-bold)",
                    }}
                  >
                    {a.deviationPercent}
                  </span>
                ),
              },
              {
                key: "detectedAt",
                header: "Detected Timestamp",
                render: (a: AnomalyItem) => (
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(a.detectedAt).toLocaleString()}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Resolution Status",
                render: (a: AnomalyItem) => <Badge variant="info">{a.status}</Badge>,
              },
            ]}
            data={filteredAnomalies}
            rowKey={(a: AnomalyItem) => a.id}
          />
        )}
      </Card>
    </div>
  );
}
