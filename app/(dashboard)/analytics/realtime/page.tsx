"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Spinner,
  useToast,
  DataTable,
  Button,
  Badge,
} from "@kannan19302/ui";
import { Globe, RefreshCw, Activity, Zap, Users, Radio } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface ActiveSession {
  id: string;
  location: string;
  activePage: string;
  duration: string;
}

interface RealtimeTelemetryData {
  activeUsersNow: number;
  requestsPerSecond: number;
  p99LatencyMs: number;
  activeSessions: ActiveSession[];
  timestamp?: string;
}

export default function AnalyticsRealtimePage() {
  const client = useApiClient();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<RealtimeTelemetryData | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(15000);

  const loadMetrics = async (manual = false) => {
    try {
      if (manual) setLoading(true);
      const data = await client.get<RealtimeTelemetryData>(
        "/analytics/realtime-stream-deep/live",
      );
      setLiveMetrics(data);
      if (manual) {
        toast.success("Telemetry Synced", "Live pulse stream refreshed.");
      }
    } catch (err) {
      toast.error(
        "Failed to load Real-time analytics",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading && !liveMetrics) {
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

  const columns = [
    {
      key: "id",
      header: "Session ID",
      render: (s: ActiveSession) => (
        <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "var(--text-xs)" }}>
          {s.id}
        </code>
      ),
    },
    {
      key: "location",
      header: "Geographic Ingress",
      render: (s: ActiveSession) => (
        <span className={styles.locationCell}>
          <Globe size={14} style={{ color: "var(--color-brand, var(--color-primary))" }} />
          <span>{s.location}</span>
        </span>
      ),
    },
    {
      key: "activePage",
      header: "Active Route Segment",
      render: (s: ActiveSession) => (
        <code
          style={{
            background: "var(--color-bg-sunken)",
            padding: "var(--space-0-5) var(--space-2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--text-xs)",
          }}
        >
          {s.activePage}
        </code>
      ),
    },
    {
      key: "duration",
      header: "Session Dwell Duration",
      render: (s: ActiveSession) => (
        <span
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontVariantNumeric: "tabular-nums lining-nums",
            color: "var(--color-text-secondary)",
            fontSize: "var(--text-xs)",
          }}
        >
          {s.duration}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.container} data-density="compact">
      <PageHeader
        title="Real-Time Analytics & Sub-Second Event Streaming"
        description="Monitor concurrent active user sessions, live API throughput, and sub-second system latency across global edge ingress nodes."
        actions={
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <div className={styles.pulseHeader}>
              <div className={styles.pulseBeacon} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--color-success)" }}>
                LIVE STREAM
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => loadMetrics(true)}>
              <RefreshCw size={13} style={{ marginRight: "var(--space-1)" }} />
              Poll Now
            </Button>
          </div>
        }
      />

      {/* Primary Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Active Users Right Now</span>
          <div className={styles.metricValuePrimary}>
            {liveMetrics?.activeUsersNow?.toLocaleString() ?? 0}
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Global edge sessions
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Requests / Second (RPS)</span>
          <div className={styles.metricValueSecondary}>
            {liveMetrics?.requestsPerSecond?.toLocaleString() ?? 0}
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Aggregated gateway throughput
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>p99 API Latency</span>
          <div className={styles.metricValueTertiary}>
            {liveMetrics?.p99LatencyMs ?? 0}ms
          </div>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Sub-second response SLA
          </span>
        </div>
      </div>

      {/* Active User Sessions Table */}
      <Card className={styles.sessionCard}>
        <div className={styles.sessionCardHeader}>
          <h3 className={styles.sessionCardTitle}>
            <Radio size={16} style={{ color: "var(--color-brand, var(--color-primary))" }} />
            Active User Sessions Stream
          </h3>
          <Badge variant="info">
            {liveMetrics?.activeSessions?.length ?? 0} Connected Sockets
          </Badge>
        </div>

        {!liveMetrics?.activeSessions ||
        liveMetrics.activeSessions.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
            <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
              No active user sessions connected.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={liveMetrics.activeSessions}
            rowKey={(s: ActiveSession) => s.id}
          />
        )}
      </Card>
    </div>
  );
}
