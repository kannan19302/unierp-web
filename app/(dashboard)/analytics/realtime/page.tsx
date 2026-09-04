"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, DataTable } from "@kannan19302/ui";
import { Globe } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<RealtimeTelemetryData | null>(null);
  const toast = useToast();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await client.get<RealtimeTelemetryData>(
        "/analytics/realtime-stream-deep/live",
      );
      setLiveMetrics(data);
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
    const interval = setInterval(loadMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !liveMetrics) {
    return (
      <div className="ui-flex-center" style={{ height: "60vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const columns = [
    {
      key: "col_0",
      header: "Session ID",
      render: (s: ActiveSession) => <code>{s.id}</code>,
    },
    {
      key: "col_1",
      header: "Geographic Location",
      render: (s: ActiveSession) => (
        <span className={styles.locationCell}>
          <Globe size={16} /> {s.location}
        </span>
      ),
    },
    {
      key: "col_2",
      header: "Active Page",
      render: (s: ActiveSession) => <code>{s.activePage}</code>,
    },
    {
      key: "col_3",
      header: "Duration",
      render: (s: ActiveSession) => <>{s.duration}</>,
    },
  ];

  return (
    <div className={styles.container}>
      <PageHeader
        title="Real-Time Analytics & Sub-Second Event Streaming"
        description="Monitor concurrent active user sessions, live API throughput, and sub-second system latency."
      />

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Active Users Right Now</span>
          <div className={styles.metricValuePrimary}>
            {liveMetrics?.activeUsersNow ?? 0}
          </div>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>Requests / Second</span>
          <div className={styles.metricValueSecondary}>
            {liveMetrics?.requestsPerSecond ?? 0}
          </div>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricTitle}>p99 API Latency</span>
          <div className={styles.metricValueTertiary}>
            {liveMetrics?.p99LatencyMs ?? 0}ms
          </div>
        </div>
      </div>

      <div className={styles.sessionCard}>
        <h3 className={styles.sessionCardTitle}>Live User Sessions Stream</h3>
        {!liveMetrics?.activeSessions ||
        liveMetrics.activeSessions.length === 0 ? (
          <p className={styles.emptyState}>No active user sessions.</p>
        ) : (
          <DataTable
            columns={columns}
            data={liveMetrics.activeSessions}
            rowKey={(s: ActiveSession) => s.id}
          />
        )}
      </div>
    </div>
  );
}
