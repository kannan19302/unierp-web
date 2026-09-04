"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  BarChart4,
  RefreshCw,
  LayoutGrid,
  CalendarRange,
  FileDown,
  Search,
  Sparkles,
  Plus,
  X,
  Layers,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface ReportWidget {
  id: string;
  title: string;
  chartType: string;
  queryConfig: string;
}

interface ReportView {
  id: string;
  name: string;
  isScheduled: boolean;
  scheduleCron: string;
  recipientEmails: string;
}

export default function AdvancedReportingPage() {
  const client = useApiClient();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [views, setViews] = useState<ReportView[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"widgets" | "views">("widgets");

  // Create Widget Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newChartType, setNewChartType] = useState("BAR");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [widgetsRes, viewsRes] = await Promise.all([
        client.get<ReportWidget[]>("/reporting/widgets").catch(() => []),
        client.get<ReportView[]>("/reporting/views").catch(() => []),
      ]);
      setWidgets(Array.isArray(widgetsRes) ? widgetsRes : []);
      setViews(Array.isArray(viewsRes) ? viewsRes : []);
    } catch (err) {
      toast.error(
        "Failed to load analytics builder data",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWidget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidgetTitle.trim()) {
      toast.error("Validation Error", "Widget title is required.");
      return;
    }

    try {
      setSubmitting(true);
      await client.post("/reporting/widgets", {
        dashboardId: "main-db",
        title: newWidgetTitle.trim(),
        chartType: newChartType,
        queryConfig: JSON.stringify({ series: "encounters", period: "weekly" }),
        position: JSON.stringify({ x: 0, y: 0, w: 6, h: 4 }),
      });
      toast.success("Widget Created", `Added "${newWidgetTitle}" to repository.`);
      setIsModalOpen(false);
      setNewWidgetTitle("");
      loadData();
    } catch (err) {
      toast.error(
        "Save Failed",
        err instanceof Error ? err.message : "Could not save widget.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWidgets = useMemo(() => {
    if (!searchQuery.trim()) return widgets;
    return widgets.filter((w) =>
      w.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [widgets, searchQuery]);

  if (loading && widgets.length === 0) {
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
    <RouteGuard permission="analytics.reporting.read">
      <div className={styles.container} data-density="compact">
        <PageHeader
          title="Advanced BI Reporting & Matrix Builder"
          description="Configure multi-domain pivot matrix grids, review scheduled distribution pipelines, and manage custom report widgets."
          actions={
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={14} style={{ marginRight: "var(--space-1-5)" }} />
              Add Chart Widget
            </Button>
          }
        />

        {/* Search & Segmented Filter Bar */}
        <div className={styles.topBar}>
          <div className={styles.searchBox}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search widgets by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              size="sm"
              variant={activeTab === "widgets" ? "primary" : "outline"}
              onClick={() => setActiveTab("widgets")}
            >
              <LayoutGrid size={13} style={{ marginRight: "var(--space-1)" }} />
              Dashboard Widgets ({widgets.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "views" ? "primary" : "outline"}
              onClick={() => setActiveTab("views")}
            >
              <FileDown size={13} style={{ marginRight: "var(--space-1)" }} />
              Saved Report Runs ({views.length})
            </Button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className={styles.mainLayout}>
          {activeTab === "widgets" && (
            <div>
              {filteredWidgets.length === 0 ? (
                <div className={styles.emptyState}>
                  <LayoutGrid size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
                  <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
                    No report widgets found.
                  </p>
                  <p style={{ margin: "var(--space-1) 0 var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    Add a chart widget to start composing advanced reporting views.
                  </p>
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>
                    <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
                    Add First Widget
                  </Button>
                </div>
              ) : (
                <div className={styles.widgetsGrid}>
                  {filteredWidgets.map((w) => (
                    <Card key={w.id} className={styles.widgetCard}>
                      <div className={styles.widgetTopRow}>
                        <h4 className={styles.widgetTitle}>{w.title}</h4>
                        <Badge variant="info">{w.chartType}</Badge>
                      </div>

                      <div className={styles.visualPreviewBox}>
                        <svg width="100%" height="45" viewBox="0 0 200 45" preserveAspectRatio="none">
                          <rect x="15" y="15" width="20" height="30" rx="2" fill="var(--color-brand, var(--color-primary))" opacity="0.8" />
                          <rect x="50" y="8" width="20" height="37" rx="2" fill="var(--color-brand, var(--color-primary))" />
                          <rect x="85" y="22" width="20" height="23" rx="2" fill="var(--color-brand, var(--color-primary))" opacity="0.6" />
                          <rect x="120" y="5" width="20" height="40" rx="2" fill="var(--color-brand, var(--color-primary))" />
                          <rect x="155" y="18" width="20" height="27" rx="2" fill="var(--color-brand, var(--color-primary))" opacity="0.75" />
                        </svg>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)" }}>
                          {w.chartType} Series Visualization
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "views" && (
            <Card style={{ padding: "var(--space-4)" }}>
              {views.length === 0 ? (
                <div className={styles.emptyState}>
                  <FileDown size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
                  <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
                    No saved view runs configured.
                  </p>
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: "name",
                      header: "Report View Name",
                      render: (v: ReportView) => (
                        <span style={{ fontWeight: "var(--weight-semibold)" }}>{v.name}</span>
                      ),
                    },
                    {
                      key: "scheduleCron",
                      header: "Cron Cadence",
                      render: (v: ReportView) => (
                        <code style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "var(--text-xs)" }}>
                          {v.scheduleCron}
                        </code>
                      ),
                    },
                    {
                      key: "recipientEmails",
                      header: "Recipients",
                      render: (v: ReportView) => (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {v.recipientEmails}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: () => <Badge variant="success">Active Cron</Badge>,
                    },
                  ]}
                  data={views}
                  rowKey={(v: ReportView) => v.id}
                />
              )}
            </Card>
          )}

          {/* Right Architecture & Guidance Dock */}
          <Card className={styles.sideCard}>
            <h3 className={styles.sideTitle}>
              <Sparkles size={16} style={{ color: "var(--color-brand, var(--color-primary))" }} />
              Consolidated Pivot Engine
            </h3>
            <p className={styles.sideDesc}>
              Advanced reporting pull directly from consolidated general ledgers, sales CPQ, inventory velocity registers, and operational telemetry schemas with sub-second aggregate calculations.
            </p>
          </Card>
        </div>

        {/* Add Chart Widget Modal */}
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Add Report Chart Widget</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              <form onSubmit={handleCreateWidget} className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Widget Title</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. Monthly Encounter Distribution..."
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Chart Type</label>
                  <select
                    className={styles.formInput}
                    value={newChartType}
                    onChange={(e) => setNewChartType(e.target.value)}
                  >
                    <option value="BAR">Bar Chart</option>
                    <option value="LINE">Line Trend</option>
                    <option value="PIE">Donut / Breakdown</option>
                    <option value="AREA">Area Curve</option>
                  </select>
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
                    {submitting ? "Saving..." : "Create Widget"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
