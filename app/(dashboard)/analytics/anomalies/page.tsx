"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import {
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AnalyticsAnomaliesPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const toast = useToast();

  const loadAnomalies = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/anomaly-detection-deep/anomalies",
      );
      setAnomalies(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Anomaly Detection entries",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnomalies();
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
        title="AI Automated Metric Anomaly Detection"
        description="Continuous statistical anomaly detection, unexpected traffic spikes, and financial divergence alerts."
      />

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Detected Metric Anomalies
        </h3>
        {anomalies.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No active metric anomalies detected.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Metric" , render: (a: any) => (<>{a.metric}</>) },
                        { key: "col_1", header: "Severity" , render: (a: any) => (<><Badge
                                            variant={a.severity === "CRITICAL" ? "danger" : "warning"}
                                          >
                                            {a.severity}
                                          </Badge></>) },
                        { key: "col_2", header: "Deviation" , render: (a: any) => (<>{a.deviationPercent}</>) },
                        { key: "col_3", header: "Detected At" , render: (a: any) => (<>{new Date(a.detectedAt).toLocaleString()}</>) },
                        { key: "col_4", header: "Status" , render: (a: any) => (<><Badge variant="info">{a.status}</Badge></>) },
                      ];
                              return <DataTable columns={columns} data={anomalies} rowKey={(a: any) => a.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
