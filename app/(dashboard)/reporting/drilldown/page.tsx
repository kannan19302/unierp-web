"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { ZoomIn, BarChart2, TrendingUp, Globe } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function ReportingDrilldownPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState<any[]>([]);
  const [drillResults, setDrillResults] = useState<any>(null);
  const [dimension, setDimension] = useState("REGION");
  const toast = useToast();

  const loadPaths = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/reporting/data-drilldown-deep/paths",
      );
      setPaths(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load drilldown paths",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, []);

  const handleDrilldown = async () => {
    try {
      const res = await client.post<any>(
        "/reporting/data-drilldown-deep/execute",
        {
          dimension,
          filterValue: "ALL",
          metricKey: "REVENUE",
        },
      );
      setDrillResults(res);
      toast.success(
        "Drilldown Complete",
        `${res.results.length} segments returned.`,
      );
    } catch (err) {
      toast.error(
        "Failed to execute drilldown",
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
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Multi-Dimensional Data Drilldown & Pivot Explorer"
        description="Navigate hierarchical business dimensions, pivot revenue metrics, and drill into regional/product segmentation."
      />

      <Card
        style={{
          padding: "var(--space-5)",
          margin: "var(--space-6) 0",
          display: "flex",
          gap: "var(--space-4)",
          alignItems: "flex-end",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Dimension Axis
          </label>
          <select
            value={dimension}
            onChange={(e: any) => setDimension(e.target.value)}
            style={{
              width: "100%",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="REGION">Geographic Region</option>
            <option value="PRODUCT_CATEGORY">Product Category</option>
            <option value="CUSTOMER_SEGMENT">Customer Segment</option>
            <option value="DEPARTMENT">Department</option>
          </select>
        </div>
        <Button onClick={handleDrilldown}>
          <ZoomIn size={14} style={{ marginRight: "6px" }} /> Execute Drilldown
        </Button>
      </Card>

      {drillResults && (
        <Card style={{ padding: "var(--space-6)" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-4)" }}
          >
            Drilldown Results — {drillResults.dimension} /{" "}
            {drillResults.metricKey}
          </h3>
          <>{(() => {
                          const columns = [
                    { key: "col_0", header: "Segment" , render: (r: any) => (<>{r.label}</>) },
                    { key: "col_1", header: "Value" , render: (r: any) => (<>${r.value.toLocaleString()}</>) },
                    { key: "col_2", header: "Growth" , render: (r: any) => (<>{r.growth}</>) },
                  ];
                          return <DataTable columns={columns} data={drillResults.results} rowKey={(r: any, i: number) => String(i)} />;
                      })()}</>
        </Card>
      )}

      <Card style={{ padding: "var(--space-6)", marginTop: "var(--space-5)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Available Drilldown Dimension Paths
        </h3>
        {paths.map((p: any) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-3)",
              padding: "var(--space-3)",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Globe size={16} color="var(--color-primary)" />
            <span style={{ fontWeight: 600 }}>{p.sourceDimension}</span>
            <span style={{ color: "var(--color-text-secondary)" }}>→</span>
            <span>{p.targetDimension}</span>
            <Badge variant="info">Level {p.drilldownLevel}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
