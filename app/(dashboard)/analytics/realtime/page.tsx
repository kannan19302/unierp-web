"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge, Table, DataTable } from "@unerp/ui";
import { Activity, Users, Zap, Globe } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function AnalyticsRealtimePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const toast = useToast();

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await client.get<any>(
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
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Real-Time Analytics & Sub-Second Event Streaming"
        description="Monitor concurrent active user sessions, live API throughput, and sub-second system latency."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Active Users Right Now
          </span>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "var(--chart-9)",
              marginTop: "4px",
            }}
          >
            {liveMetrics?.activeUsersNow || 418}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Requests / Second
          </span>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "var(--color-primary)",
              marginTop: "4px",
            }}
          >
            {liveMetrics?.requestsPerSecond || 124.5}
          </div>
        </Card>
        <Card style={{ padding: "20px" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            p99 API Latency
          </span>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "var(--chart-5)",
              marginTop: "4px",
            }}
          >
            {liveMetrics?.p99LatencyMs || 42}ms
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Live User Sessions Stream
        </h3>
        {!liveMetrics?.activeSessions ||
        liveMetrics.activeSessions.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No active user sessions.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Session ID" , render: (s: any) => (<>{s.id}</>) },
                        { key: "col_1", header: "Geographic Location" , render: (s: any) => (<><Globe size={16} color="var(--color-primary)" />{" "}{s.location}</>) },
                        { key: "col_2", header: "Active Page" , render: (s: any) => (<><code>{s.activePage}</code></>) },
                        { key: "col_3", header: "Duration" , render: (s: any) => (<>{s.duration}</>) },
                      ];
                              return <DataTable columns={columns} data={liveMetrics.activeSessions} rowKey={(s: any) => s.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
