"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Button,
  Spinner,
  useToast,
  Badge,
  Card,
} from "@kannan19302/ui";
import { LayoutDashboard, Plus, X, Trash2, Edit3 } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: string;
  title: string;
  config: Record<string, any>;
  position: number;
  isVisible: boolean;
}

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  widgets: DashboardWidget[];
}

export default function DashboardsPage() {
  const client = useApiClient();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDashboard, setEditDashboard] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const toast = useToast();

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      const db = await client.get<Dashboard[] | { data?: Dashboard[] }>(
        "/analytics/dashboards",
      );
      const list = Array.isArray(db) ? db : db?.data || [];
      for (const d of list) {
        const w = await client
          .get<DashboardWidget[] | { data?: DashboardWidget[] }>(
            `/analytics/dashboards/${d.id}/widgets`,
          )
          .catch(() => []);
        d.widgets = Array.isArray(w) ? w : (w as any)?.data || [];
      }
      setDashboards(list);
    } catch (err) {
      toast.error(
        "Failed to load Dashboards",
        err instanceof Error ? err.message : "Error fetching dashboards",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Validation Error", "Dashboard name is required.");
      return;
    }

    try {
      setSubmitting(true);
      if (editDashboard) {
        await client.patch(`/analytics/dashboards/${editDashboard}`, form);
        toast.success("Dashboard Updated", `Dashboard "${form.name}" updated.`);
      } else {
        await client.post("/analytics/dashboards", form);
        toast.success("Dashboard Created", `Dashboard "${form.name}" created.`);
      }
      setIsModalOpen(false);
      setEditDashboard(null);
      setForm({ name: "", description: "" });
      fetchDashboards();
    } catch (err) {
      toast.error(
        "Failed to save dashboard",
        err instanceof Error ? err.message : "Save error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await client.delete(`/analytics/dashboards/${id}`);
      toast.success("Dashboard Deleted", `Dashboard "${name}" removed.`);
      fetchDashboards();
    } catch (err) {
      toast.error(
        "Delete failed",
        err instanceof Error ? err.message : "Error deleting dashboard",
      );
    }
  };

  const openEdit = (d: Dashboard) => {
    setEditDashboard(d.id);
    setForm({ name: d.name, description: d.description || "" });
    setIsModalOpen(true);
  };

  const widgetTypeIcons: Record<string, string> = {
    LINE_CHART: "📈",
    BAR_CHART: "📊",
    PIE_CHART: "🥧",
    TABLE: "📋",
    KPI: "🎯",
    GAUGE: "⏱️",
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

  return (
    <div className={styles.container} data-density="compact">
      <PageHeader
        title="Custom Analytics Dashboards"
        description="Design, compose, and organize executive workspace analytics and cross-functional KPI boards."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditDashboard(null);
              setForm({ name: "", description: "" });
              setIsModalOpen(true);
            }}
          >
            <Plus size={14} style={{ marginRight: "var(--space-1-5)" }} />
            New Dashboard
          </Button>
        }
      />

      <div className={styles.dashboardList} style={{ marginTop: "var(--space-6)" }}>
        {dashboards.map((d) => (
          <Card key={d.id} className={styles.dashboardCard}>
            <div className={styles.dashboardHeader}>
              <div>
                <h3 className={styles.dashboardName}>
                  {d.name}
                  {d.isDefault && <Badge variant="info">Default</Badge>}
                </h3>
                {d.description && <p className={styles.desc}>{d.description}</p>}
              </div>
              <div className={styles.cardActions}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(d)}
                >
                  <Edit3 size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(d.id, d.name)}
                >
                  <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
                </Button>
              </div>
            </div>

            {d.widgets && d.widgets.length > 0 ? (
              <div className={styles.widgetGrid}>
                {d.widgets.map((w) => (
                  <div key={w.id} className={styles.widgetCard}>
                    <span className={styles.widgetIcon}>
                      {widgetTypeIcons[w.widgetType] || "📦"}
                    </span>
                    <div>
                      <p className={styles.widgetTitle}>{w.title}</p>
                      <p className={styles.widgetType}>{w.widgetType}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  color: "var(--color-text-tertiary)",
                  fontSize: "var(--text-xs)",
                  marginTop: "var(--space-3)",
                }}
              >
                No widgets attached yet. Configure widgets in Dashboard Builder.
              </p>
            )}
          </Card>
        ))}

        {dashboards.length === 0 && (
          <p className={styles.emptyState}>
            No custom dashboards configured yet. Click "New Dashboard" to create one.
          </p>
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editDashboard ? "Edit Dashboard" : "New Dashboard"}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Dashboard Name</label>
                <input
                  className={styles.formInput}
                  placeholder="e.g. Executive Financial Cockpit..."
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Description (Optional)</label>
                <textarea
                  className={styles.formInput}
                  placeholder="Purpose and audience for this dashboard..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                />
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
                  {submitting
                    ? "Saving..."
                    : editDashboard
                      ? "Update Dashboard"
                      : "Create Dashboard"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
