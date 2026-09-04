"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  PageHeader,
  Button,
  Spinner,
  useToast,
  Badge,
  Card,
  DataTable,
} from "@kannan19302/ui";
import {
  LayoutDashboard,
  Plus,
  X,
  Trash2,
  Edit3,
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  BarChart3,
  LineChart,
  PieChart,
  Gauge,
  Layers,
} from "lucide-react";
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
  const toast = useToast();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDashboard, setEditDashboard] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Delete modal confirmation
  const [deleteTarget, setDeleteTarget] = useState<Dashboard | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await client.delete(`/analytics/dashboards/${deleteTarget.id}`);
      toast.success("Dashboard Deleted", `Dashboard "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
      fetchDashboards();
    } catch (err) {
      toast.error(
        "Delete failed",
        err instanceof Error ? err.message : "Error deleting dashboard",
      );
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (d: Dashboard) => {
    setEditDashboard(d.id);
    setForm({ name: d.name, description: d.description || "" });
    setIsModalOpen(true);
  };

  const filteredDashboards = useMemo(() => {
    if (!searchQuery.trim()) return dashboards;
    const q = searchQuery.toLowerCase();
    return dashboards.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)),
    );
  }, [dashboards, searchQuery]);

  const renderWidgetIcon = (type: string) => {
    switch (type) {
      case "LINE_CHART":
        return <LineChart size={14} className={styles.widgetIcon} />;
      case "BAR_CHART":
        return <BarChart3 size={14} className={styles.widgetIcon} />;
      case "PIE_CHART":
        return <PieChart size={14} className={styles.widgetIcon} />;
      case "GAUGE":
        return <Gauge size={14} className={styles.widgetIcon} />;
      default:
        return <Layers size={14} className={styles.widgetIcon} />;
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

  return (
    <div className={styles.container} data-density="compact">
      <PageHeader
        title="Curated Analytics Dashboards"
        description="Organize executive KPI cockpits, departmental performance boards, and custom visualization suites."
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

      {/* Top Search & Filter Bar */}
      <div className={styles.topBar}>
        <div className={styles.searchAndFilters}>
          <div className={styles.searchInputWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search dashboards by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={13} />
            Cards
          </button>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === "table" ? styles.viewToggleBtnActive : ""}`}
            onClick={() => setViewMode("table")}
          >
            <List size={13} />
            Table
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className={styles.dashboardGrid}>
          {filteredDashboards.map((d) => (
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
                    title="Edit Metadata"
                  >
                    <Edit3 size={13} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(d)}
                    title="Delete Dashboard"
                  >
                    <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                  </Button>
                </div>
              </div>

              {d.widgets && d.widgets.length > 0 ? (
                <div className={styles.widgetGrid}>
                  {d.widgets.slice(0, 4).map((w) => (
                    <div key={w.id} className={styles.widgetCard}>
                      {renderWidgetIcon(w.widgetType)}
                      <div style={{ overflow: "hidden" }}>
                        <p className={styles.widgetTitle}>{w.title}</p>
                        <p className={styles.widgetType}>{w.widgetType}</p>
                      </div>
                    </div>
                  ))}
                  {d.widgets.length > 4 && (
                    <div
                      style={{
                        gridColumn: "span 2",
                        textAlign: "center",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      +{d.widgets.length - 4} more widgets
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--color-bg-sunken)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--space-3)",
                    textAlign: "center",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  No widgets pinned yet.
                </div>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.cardDate}>
                  Created {new Date(d.createdAt).toLocaleDateString()}
                </span>
                <Link href="/analytics/builder">
                  <Button size="sm" variant="outline">
                    <ExternalLink size={12} style={{ marginRight: "var(--space-1)" }} />
                    Open in Studio
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <Card style={{ padding: "var(--space-4)" }}>
          <DataTable
            columns={[
              {
                key: "name",
                header: "Dashboard Name",
                render: (d: Dashboard) => (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <LayoutDashboard size={16} style={{ color: "var(--color-brand, var(--color-primary))" }} />
                    <span style={{ fontWeight: "var(--weight-semibold)" }}>{d.name}</span>
                    {d.isDefault && <Badge variant="info">Default</Badge>}
                  </div>
                ),
              },
              {
                key: "description",
                header: "Description",
                render: (d: Dashboard) => (
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>
                    {d.description || "No description provided."}
                  </span>
                ),
              },
              {
                key: "widgets",
                header: "Widgets",
                render: (d: Dashboard) => (
                  <Badge variant="default">{d.widgets?.length || 0} widgets</Badge>
                ),
              },
              {
                key: "createdAt",
                header: "Created Date",
                render: (d: Dashboard) => (
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontVariantNumeric: "tabular-nums lining-nums",
                      color: "var(--color-text-secondary)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (d: Dashboard) => (
                  <div style={{ display: "flex", gap: "var(--space-1)" }}>
                    <Link href="/analytics/builder">
                      <Button size="sm" variant="outline">
                        <ExternalLink size={12} style={{ marginRight: "var(--space-1)" }} />
                        Studio
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(d)}
                      title="Edit Metadata"
                    >
                      <Edit3 size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(d)}
                      title="Delete Dashboard"
                    >
                      <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredDashboards}
            rowKey={(d: Dashboard) => d.id}
          />
        </Card>
      )}

      {filteredDashboards.length === 0 && (
        <div className={styles.emptyState}>
          <LayoutDashboard size={32} style={{ color: "var(--color-text-tertiary)" }} />
          <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
            No dashboards found matching your criteria.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setEditDashboard(null);
              setForm({ name: "", description: "" });
              setIsModalOpen(true);
            }}
          >
            <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
            Create New Dashboard
          </Button>
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editDashboard ? "Edit Dashboard Details" : "Create New Dashboard"}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Dashboard</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
              >
                <X size={16} />
              </Button>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: 0 }}>
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This will permanently remove this dashboard layout and its attached widgets.
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
