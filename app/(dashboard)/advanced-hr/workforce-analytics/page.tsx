"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { Users, TrendingDown, Clock, Star } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AdvancedHrWorkforceAnalyticsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const toast = useToast();

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/advanced-hr/workforce-analytics-deep/snapshots",
      );
      setSnapshots(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load workforce analytics",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleGenerateSnapshot = async () => {
    try {
      await client.post("/advanced-hr/workforce-analytics-deep/snapshots", {
        reportingPeriod: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}-${new Date().getFullYear()}`,
        headcount: 847,
        attritionRate: 4.2,
        avgTenureYears: 3.8,
        engagementScore: 78.5,
      });
      toast.success(
        "Snapshot Generated",
        "Workforce analytics snapshot captured.",
      );
      loadSnapshots();
    } catch (err) {
      toast.error(
        "Failed to generate snapshot",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading)
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

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Workforce Intelligence & People Analytics Command Center"
        description="Track headcount trends, attrition rates, tenure distribution, and employee engagement scores."
      />
      <div style={{ display: "flex", gap: "16px", margin: "24px 0" }}>
        {[
          {
            label: "Total Headcount",
            value: snapshots[0]?.headcount ?? "—",
            icon: <Users size={20} />,
            color: "var(--color-primary)",
          },
          {
            label: "Attrition Rate",
            value: snapshots[0] ? `${snapshots[0].attritionRate}%` : "—",
            icon: <TrendingDown size={20} />,
            color: "var(--chart-4)",
          },
          {
            label: "Avg Tenure (Yrs)",
            value: snapshots[0]?.avgTenureYears ?? "—",
            icon: <Clock size={20} />,
            color: "var(--chart-3)",
          },
          {
            label: "Engagement Score",
            value: snapshots[0] ? `${snapshots[0].engagementScore}/100` : "—",
            icon: <Star size={20} />,
            color: "var(--chart-9)",
          },
        ].map((kpi: any, i: any) => (
          <Card
            key={i}
            style={{
              flex: 1,
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                background: `${kpi.color}18`,
                borderRadius: "12px",
                padding: "12px",
                color: kpi.color,
              }}
            >
              {kpi.icon}
            </div>
            <div>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  margin: 0,
                }}
              >
                {kpi.label}
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
                {kpi.value}
              </h3>
            </div>
          </Card>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <Button onClick={handleGenerateSnapshot}>Generate Snapshot</Button>
      </div>
      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Historical Snapshots
        </h3>
        {snapshots.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No snapshots. Click Generate to capture current state.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Period" , render: (s: any) => (<>{s.reportingPeriod}</>) },
                        { key: "col_1", header: "Headcount" , render: (s: any) => (<>{s.headcount}</>) },
                        { key: "col_2", header: "Attrition" , render: (s: any) => (<>{s.attritionRate}%
                                        </>) },
                        { key: "col_3", header: "Tenure" , render: (s: any) => (<>{s.avgTenureYears}yrs</>) },
                        { key: "col_4", header: "Engagement" , render: (s: any) => (<>{s.engagementScore}/100</>) },
                      ];
                              return <DataTable columns={columns} data={snapshots} rowKey={(s: any) => s.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
