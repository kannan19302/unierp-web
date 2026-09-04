"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  Spinner,
  useToast,
} from "@kannan19302/ui";
import {
  FileDown,
  Plus,
  X,
  Play,
  Trash2,
  Clock,
  Calendar,
  Layers,
  Send,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface ScheduledExport {
  id: string;
  name: string;
  source: string;
  format: string;
  scheduleType: string;
  scheduleConfig: Record<string, any>;
  recipients: string[];
  lastRunAt: string | null;
  nextRunAt: string | null;
  isActive: boolean;
}

export default function ExportsPage() {
  const client = useApiClient();
  const toast = useToast();
  const [exports, setExports] = useState<ScheduledExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Delete modal confirmation
  const [deleteTarget, setDeleteTarget] = useState<ScheduledExport | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [newExport, setNewExport] = useState({
    name: "",
    source: "PURCHASE_ORDER",
    format: "CSV",
    scheduleType: "WEEKLY",
    scheduleConfig: '{"dayOfWeek": "MONDAY", "time": "08:00"}',
    recipients: "",
  });

  const fetchExports = async () => {
    try {
      setLoading(true);
      const data = await client.get<
        ScheduledExport[] | { data?: ScheduledExport[] }
      >("/analytics/scheduled-exports");
      setExports(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error(
        "Failed to load exports",
        err instanceof Error ? err.message : "Error loading scheduled exports",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExport.name.trim()) {
      toast.error("Validation Error", "Schedule export name is required.");
      return;
    }

    try {
      setSubmitting(true);
      let scheduleConfig = {};
      try {
        scheduleConfig = JSON.parse(newExport.scheduleConfig);
      } catch {
        scheduleConfig = { interval: newExport.scheduleType };
      }
      const recipients = newExport.recipients
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      await client.post("/analytics/scheduled-exports", {
        ...newExport,
        scheduleConfig,
        recipients,
      });

      toast.success(
        "Export Scheduled",
        `Automated export "${newExport.name}" scheduled successfully.`,
      );
      setIsModalOpen(false);
      setNewExport({
        name: "",
        source: "PURCHASE_ORDER",
        format: "CSV",
        scheduleType: "WEEKLY",
        scheduleConfig: '{"dayOfWeek": "MONDAY", "time": "08:00"}',
        recipients: "",
      });
      fetchExports();
    } catch (err) {
      toast.error(
        "Save Failed",
        err instanceof Error ? err.message : "Could not create export schedule",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await client.delete(`/analytics/scheduled-exports/${deleteTarget.id}`);
      toast.success("Schedule Removed", `Export "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchExports();
    } catch (err) {
      toast.error(
        "Delete Failed",
        err instanceof Error ? err.message : "Error deleting scheduled export",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRunNow = async (id: string, name: string) => {
    try {
      setRunningId(id);
      await client.post(`/analytics/scheduled-exports/${id}/run`);
      toast.success("Export Triggered", `Dispatched export job for "${name}".`);
      fetchExports();
    } catch (err) {
      toast.error(
        "Run Failed",
        err instanceof Error ? err.message : "Error triggering export execution",
      );
    } finally {
      setRunningId(null);
    }
  };

  const sources = [
    "PURCHASE_ORDER",
    "SALES_ORDER",
    "INVOICE",
    "PRODUCT",
    "CUSTOMER",
    "VENDOR",
    "EMPLOYEE",
    "PROJECT_TASK",
    "WORK_ORDER",
  ];
  const formats = ["CSV", "PDF", "XLSX", "JSON"];
  const schedules = ["ONCE", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"];

  if (loading && exports.length === 0) {
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
        title="Automated Scheduled Data Exports"
        description="Configure recurrent data extract distributions delivered via email, Webhook, or S3 cloud storage in CSV, XLSX, PDF, or JSON formats."
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} style={{ marginRight: "var(--space-1-5)" }} />
            Schedule Export
          </Button>
        }
      />

      {/* Export Schedule Table */}
      <Card className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            Scheduled Export Distributions ({exports.length})
          </h3>
        </div>

        {exports.length === 0 ? (
          <div className={styles.emptyState}>
            <FileDown size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
            <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
              No automated exports scheduled yet.
            </p>
            <p style={{ margin: "var(--space-1) 0 var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Schedule automated periodic exports to distribute reports to leadership or downstream systems.
            </p>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
              Schedule First Export
            </Button>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "name",
                header: "Schedule Title",
                render: (e: ScheduledExport) => (
                  <span style={{ fontWeight: "var(--weight-semibold)" }}>{e.name}</span>
                ),
              },
              {
                key: "source",
                header: "Source Domain",
                render: (e: ScheduledExport) => (
                  <Badge variant="default">{e.source}</Badge>
                ),
              },
              {
                key: "format",
                header: "Format",
                render: (e: ScheduledExport) => (
                  <Badge variant="info">{e.format}</Badge>
                ),
              },
              {
                key: "scheduleType",
                header: "Frequency",
                render: (e: ScheduledExport) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <Clock size={12} style={{ color: "var(--color-text-tertiary)" }} />
                    <span>{e.scheduleType}</span>
                  </div>
                ),
              },
              {
                key: "recipients",
                header: "Recipients",
                render: (e: ScheduledExport) => (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {e.recipients?.length > 0 ? e.recipients.join(", ") : "System Download"}
                  </span>
                ),
              },
              {
                key: "lastRunAt",
                header: "Last Executed",
                render: (e: ScheduledExport) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontVariantNumeric: "tabular-nums lining-nums",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    {e.lastRunAt ? new Date(e.lastRunAt).toLocaleDateString() : "Never"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (e: ScheduledExport) => (
                  <div style={{ display: "flex", gap: "var(--space-1)" }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunNow(e.id, e.name)}
                      disabled={runningId === e.id}
                      title="Run Export Now"
                    >
                      <Play
                        size={12}
                        style={{
                          marginRight: "var(--space-1)",
                          animation: runningId === e.id ? "spin 1s linear infinite" : undefined,
                        }}
                      />
                      {runningId === e.id ? "Running..." : "Run Now"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(e)}
                      title="Delete Schedule"
                    >
                      <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={exports}
            rowKey={(e: ScheduledExport) => e.id}
          />
        )}
      </Card>

      {/* Schedule Export Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Configure Scheduled Export</h3>
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
                <label className={styles.fieldLabel}>Export Schedule Name</label>
                <input
                  className={styles.formInput}
                  placeholder="e.g. Weekly Executive Financial Ledger CSV..."
                  value={newExport.name}
                  onChange={(e) =>
                    setNewExport((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Entity Source</label>
                  <select
                    className={styles.formInput}
                    value={newExport.source}
                    onChange={(e) =>
                      setNewExport((p) => ({ ...p, source: e.target.value }))
                    }
                  >
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Export Format</label>
                  <select
                    className={styles.formInput}
                    value={newExport.format}
                    onChange={(e) =>
                      setNewExport((p) => ({ ...p, format: e.target.value }))
                    }
                  >
                    {formats.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Cadence Schedule</label>
                  <select
                    className={styles.formInput}
                    value={newExport.scheduleType}
                    onChange={(e) =>
                      setNewExport((p) => ({
                        ...p,
                        scheduleType: e.target.value,
                      }))
                    }
                  >
                    {schedules.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Email Recipients (Comma-sep)</label>
                  <input
                    className={styles.formInput}
                    placeholder="finance@corp.com, exec@corp.com"
                    value={newExport.recipients}
                    onChange={(e) =>
                      setNewExport((p) => ({
                        ...p,
                        recipients: e.target.value,
                      }))
                    }
                  />
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
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Scheduling..." : "Save Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Export Schedule</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
              >
                <X size={16} />
              </Button>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
              Are you sure you want to cancel and delete the scheduled export for <strong>"{deleteTarget.name}"</strong>?
            </p>
            <div className={styles.modalActions}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmDelete}
                disabled={deleting}
                style={{ background: "var(--color-danger)", borderColor: "var(--color-danger)" }}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
