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
  Database,
  Play,
  GitMerge,
  RefreshCw,
  Plus,
  X,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface PipelineItem {
  id: string;
  pipelineName: string;
  sourceDatasetId?: string;
  targetDatasetId?: string;
  status: string;
  lastRunAt: string | null;
}

export default function AnalyticsPipelinesPage() {
  const client = useApiClient();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
  const [pipelineName, setPipelineName] = useState("");
  const [sourceDs, setSourceDs] = useState("ds-pg-oltp");
  const [targetDs, setTargetDs] = useState("ds-ch-olap");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  const loadPipelines = async () => {
    try {
      setLoading(true);
      const data = await client.get<PipelineItem[] | { data?: PipelineItem[] }>(
        "/analytics/data-pipelines-deep/pipelines",
      );
      setPipelines(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error(
        "Failed to load ETL Data Pipelines",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineName.trim()) {
      toast.error("Validation Error", "Pipeline name is required.");
      return;
    }
    try {
      setCreating(true);
      await client.post("/analytics/data-pipelines-deep/pipelines", {
        pipelineName: pipelineName.trim(),
        sourceDatasetId: sourceDs,
        targetDatasetId: targetDs,
      });
      toast.success(
        "Pipeline Deployed",
        `ETL pipeline "${pipelineName}" initialized successfully.`,
      );
      setPipelineName("");
      setIsModalOpen(false);
      loadPipelines();
    } catch (err) {
      toast.error(
        "Deployment Failed",
        err instanceof Error ? err.message : "Error creating pipeline",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRun = async (id: string, name: string) => {
    try {
      setRunningId(id);
      await client.post(`/analytics/data-pipelines-deep/pipelines/${id}/run`, {});
      toast.success(
        "Sync Triggered",
        `ETL sync task started for "${name}".`,
      );
      loadPipelines();
    } catch (err) {
      toast.error(
        "Execution Failed",
        err instanceof Error ? err.message : "Error running pipeline sync",
      );
    } finally {
      setRunningId(null);
    }
  };

  if (loading && pipelines.length === 0) {
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
        title="Enterprise ETL Data Pipelines & Warehouse Ingestion"
        description="Schedule automated data extraction, continuous schema transformation, and analytical data warehouse ingestion with sub-second health monitors."
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} style={{ marginRight: "var(--space-1-5)" }} />
            Deploy ETL Pipeline
          </Button>
        }
      />

      {/* Pipeline Management Table */}
      <Card className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Active Warehouse Pipelines ({pipelines.length})</h3>
          <Button variant="outline" size="sm" onClick={loadPipelines}>
            <RefreshCw size={13} style={{ marginRight: "var(--space-1)" }} />
            Refresh
          </Button>
        </div>

        {pipelines.length === 0 ? (
          <div className={styles.emptyState}>
            <Database size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
            <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
              No active ETL data pipelines deployed.
            </p>
            <p style={{ margin: "var(--space-1) 0 var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Deploy a pipeline to replicate OLTP operational tables into the OLAP analytics lakehouse.
            </p>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
              Deploy First Pipeline
            </Button>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "pipelineName",
                header: "Pipeline Name",
                render: (p: PipelineItem) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Database size={15} style={{ color: "var(--color-brand, var(--color-primary))" }} />
                    <span style={{ fontWeight: "var(--weight-semibold)" }}>{p.pipelineName}</span>
                  </div>
                ),
              },
              {
                key: "mapping",
                header: "Source → Lakehouse Target",
                render: (p: PipelineItem) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1-5)" }}>
                    <Badge variant="default">{p.sourceDatasetId || "PostgreSQL OLTP"}</Badge>
                    <ArrowRight size={12} style={{ color: "var(--color-text-tertiary)" }} />
                    <Badge variant="info">{p.targetDatasetId || "ClickHouse OLAP"}</Badge>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (p: PipelineItem) => (
                  <Badge variant={p.status === "ACTIVE" || p.status === "SUCCESS" ? "success" : "warning"}>
                    {p.status || "IDLE"}
                  </Badge>
                ),
              },
              {
                key: "lastRunAt",
                header: "Last Sync Completed",
                render: (p: PipelineItem) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontVariantNumeric: "tabular-nums lining-nums",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    {p.lastRunAt ? new Date(p.lastRunAt).toLocaleString() : "Never Synced"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (p: PipelineItem) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRun(p.id, p.pipelineName)}
                    disabled={runningId === p.id}
                  >
                    <Play
                      size={12}
                      style={{
                        marginRight: "var(--space-1)",
                        animation: runningId === p.id ? "spin 1s linear infinite" : undefined,
                      }}
                    />
                    {runningId === p.id ? "Syncing..." : "Trigger Sync"}
                  </Button>
                ),
              },
            ]}
            data={pipelines}
            rowKey={(p: PipelineItem) => p.id}
          />
        )}
      </Card>

      {/* Deploy Pipeline Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Deploy New ETL Pipeline</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleCreate} className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Pipeline Identifier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Postgres to ClickHouse Financials..."
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Source OLTP Engine</label>
                  <select
                    className={styles.formInput}
                    value={sourceDs}
                    onChange={(e) => setSourceDs(e.target.value)}
                  >
                    <option value="ds-pg-oltp">PostgreSQL Multi-Tenant</option>
                    <option value="ds-kafka-events">Kafka Event Stream</option>
                    <option value="ds-s3-logs">S3 Telemetry Parquet</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Target OLAP Lakehouse</label>
                  <select
                    className={styles.formInput}
                    value={targetDs}
                    onChange={(e) => setTargetDs(e.target.value)}
                  >
                    <option value="ds-ch-olap">ClickHouse Analytical Engine</option>
                    <option value="ds-snowflake">Snowflake Data Cloud</option>
                    <option value="ds-bigquery">Google BigQuery</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Deploying..." : "Deploy Pipeline"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
