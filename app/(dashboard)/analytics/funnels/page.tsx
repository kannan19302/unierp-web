"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  useToast,
  Badge,
  DataTable,
} from "@kannan19302/ui";
import {
  Filter,
  ArrowDown,
  TrendingDown,
  RefreshCw,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface ConversionAuditItem {
  id: string;
  funnelName: string;
  period: string;
  overallDropoff: number;
  calculatedAt: string;
}

export default function AnalyticsFunnelsPage() {
  const client = useApiClient();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [conversions, setConversions] = useState<ConversionAuditItem[]>([]);

  const loadConversions = async () => {
    try {
      setLoading(true);
      const data = await client.get<ConversionAuditItem[] | { data?: ConversionAuditItem[] }>(
        "/analytics/funnel-conversion-deep/conversions",
      );
      setConversions(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error(
        "Failed to load Conversion Funnels",
        err instanceof Error ? err.message : "Error loading funnels",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversions();
  }, []);

  const handleCompute = async () => {
    try {
      setComputing(true);
      await client.post("/analytics/funnel-conversion-deep/compute", {
        funnelName: "Enterprise SaaS Conversion Flow",
      });
      toast.success("Funnel Computed", "Dropoff velocity recalculated across all acquisition stages.");
      loadConversions();
    } catch (err) {
      toast.error(
        "Failed to compute funnel",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setComputing(false);
    }
  };

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

  // Canonical Enterprise Stages
  const stages = [
    { step: "01", name: "Prospect Landing", count: "14,820", drop: "—", retained: "100%" },
    { step: "02", name: "Signup & Workspace", count: "6,410", drop: "-56.7%", retained: "43.3%" },
    { step: "03", name: "Core Module Onboard", count: "3,890", drop: "-39.3%", retained: "26.2%" },
    { step: "04", name: "Enterprise Paid Sub", count: "1,420", drop: "-63.5%", retained: "9.6%" },
  ];

  return (
    <div className={styles.container} data-density="compact">
      <PageHeader
        title="Conversion Funnels & Dropoff Analytics"
        description="Analyze multi-stage acquisition and customer activation funnels, compute cohort retention, and pinpoint conversion leakage."
        actions={
          <Button onClick={handleCompute} disabled={computing} size="sm">
            <RefreshCw
              size={14}
              className={computing ? "spin-animation" : ""}
              style={{ marginRight: "var(--space-1-5)" }}
            />
            {computing ? "Calculating..." : "Compute Funnel Dropoff"}
          </Button>
        }
      />

      {/* Visual Multi-Stage Funnel Flow */}
      <Card className={styles.funnelVisualCard}>
        <div className={styles.funnelHeader}>
          <h3 className={styles.funnelTitle}>Enterprise SaaS Conversion Stages</h3>
          <Badge variant="info">Global Cohort: All Channels</Badge>
        </div>

        <div className={styles.stagesGrid}>
          {stages.map((st) => (
            <div key={st.step} className={styles.stageCard}>
              <div className={styles.stageTopRow}>
                <span className={styles.stageStepNumber}>STAGE {st.step}</span>
                <Badge variant="default">{st.retained} retained</Badge>
              </div>
              <p className={styles.stageName}>{st.name}</p>
              <p className={styles.stageMetric}>{st.count}</p>
              {st.drop !== "—" && (
                <div className={styles.stageDropoff}>
                  <TrendingDown size={13} />
                  <span>{st.drop} stage dropoff</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Historical Calculations Table */}
      <Card className={styles.tableSection}>
        <h3 className={styles.actionTitle} style={{ marginBottom: "var(--space-4)" }}>
          Historical Funnel Audits & Computation Logs
        </h3>
        {conversions.length === 0 ? (
          <div className={styles.emptyState}>
            <Layers size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
            <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
              No historical conversion calculations on file.
            </p>
            <p style={{ margin: "var(--space-1) 0 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Click "Compute Funnel Dropoff" above to run your first acquisition telemetry audit.
            </p>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "funnelName",
                header: "Funnel Pipeline",
                render: (c: ConversionAuditItem) => (
                  <span style={{ fontWeight: "var(--weight-semibold)" }}>
                    {c.funnelName}
                  </span>
                ),
              },
              {
                key: "period",
                header: "Sampling Period",
                render: (c: ConversionAuditItem) => (
                  <Badge variant="default">{c.period}</Badge>
                ),
              },
              {
                key: "overallDropoff",
                header: "Net Dropoff Rate",
                render: (c: ConversionAuditItem) => (
                  <span
                    style={{
                      color: "var(--color-danger)",
                      fontFamily: "var(--font-mono, monospace)",
                      fontVariantNumeric: "tabular-nums lining-nums",
                      fontWeight: "var(--weight-bold)",
                    }}
                  >
                    {Number(c.overallDropoff).toFixed(2)}%
                  </span>
                ),
              },
              {
                key: "calculatedAt",
                header: "Computed Timestamp",
                render: (c: ConversionAuditItem) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontVariantNumeric: "tabular-nums lining-nums",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {new Date(c.calculatedAt).toLocaleString()}
                  </span>
                ),
              },
            ]}
            data={conversions}
            rowKey={(c: ConversionAuditItem) => c.id}
          />
        )}
      </Card>
    </div>
  );
}
