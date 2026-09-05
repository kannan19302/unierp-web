"use client";

import React, { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Button,
  Spinner,
  useToast,
  Badge,
} from "@kannan19302/ui";
import {
  LayoutDashboard,
  Plus,
  Save,
  Trash2,
  BarChart3,
  LineChart,
  PieChart,
  Gauge,
  RefreshCw,
  GripVertical,
  Check,
  X,
  Sparkles,
  Layers,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface Dashboard {
  id: string;
  name: string;
  description?: string | null;
  layout?: Widget[];
}

interface Widget {
  id: string;
  title: string;
  chartType: "BAR" | "LINE" | "PIE" | "GAUGE";
  source: string;
  width: 1 | 2;
}

const CHART_TYPES: {
  type: Widget["chartType"];
  icon: React.ReactNode;
  label: string;
}[] = [
  { type: "BAR", icon: <BarChart3 size={14} />, label: "Bar Chart" },
  { type: "LINE", icon: <LineChart size={14} />, label: "Line Curve" },
  { type: "PIE", icon: <PieChart size={14} />, label: "Donut / Pie" },
  { type: "GAUGE", icon: <Gauge size={14} />, label: "Target Gauge" },
];

const SOURCES = [
  "Revenue & Collections",
  "Invoices & Receivables",
  "Product Inventory",
  "Staff & Workforce",
  "Purchase Orders",
  "Sales Pipeline",
];

let widgetSeq = 0;
const newWidget = (): Widget => ({
  id: `w-${Date.now()}-${widgetSeq++}`,
  title: "New Metric Widget",
  chartType: "BAR",
  source: "Revenue & Collections",
  width: 1,
});

export default function DashboardBuilderPage() {
  const client = useApiClient();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // New Dashboard Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDesc, setNewDashboardDesc] = useState("");
  const [creatingDashboard, setCreatingDashboard] = useState(false);

  const loadDashboards = async () => {
    try {
      setLoading(true);
      const data = await client.get<Dashboard[] | { data?: Dashboard[] }>(
        "/analytics/dashboards",
      );
      const list: Dashboard[] = Array.isArray(data) ? data : data?.data || [];
      setDashboards(list);
      if (list.length > 0 && !activeId) {
        selectDashboard(list[0]!);
      }
    } catch (err) {
      toast.error(
        "Failed to load dashboards",
        err instanceof Error ? err.message : "Error fetching dashboards",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, []);

  const selectDashboard = (d: Dashboard) => {
    setActiveId(d.id);
    setWidgets(Array.isArray(d.layout) ? d.layout : []);
    setSaved(false);
  };

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDashboardName.trim()) {
      toast.error("Validation Error", "Dashboard name is required.");
      return;
    }

    try {
      setCreatingDashboard(true);
      const d = await client.post<Dashboard>("/analytics/dashboards", {
        name: newDashboardName.trim(),
        description: newDashboardDesc.trim() || undefined,
        layout: [],
      });
      toast.success(
        "Dashboard Created",
        `Created "${newDashboardName.trim()}" successfully.`,
      );
      setDashboards((prev) => [d, ...prev]);
      selectDashboard(d);
      setIsModalOpen(false);
      setNewDashboardName("");
      setNewDashboardDesc("");
    } catch (err) {
      toast.error(
        "Creation Failed",
        err instanceof Error ? err.message : "Could not create dashboard.",
      );
    } finally {
      setCreatingDashboard(false);
    }
  };

  const addWidget = () => {
    setWidgets((prev) => [...prev, newWidget()]);
    setSaved(false);
    toast.success("Widget Added", "New widget added to layout.");
  };

  const updateWidget = (id: string, patch: Partial<Widget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    );
    setSaved(false);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setSaved(false);
  };

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setWidgets((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      if (moved) next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
    setSaved(false);
  };

  const saveLayout = async () => {
    if (!activeId) return;
    setSaving(true);
    try {
      await client.patch(`/analytics/dashboards/${activeId}`, {
        layout: widgets,
      });
      setSaved(true);
      setDashboards((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, layout: widgets } : d)),
      );
      toast.success("Layout Saved", "Dashboard widgets saved successfully.");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      toast.error(
        "Save Failed",
        err instanceof Error ? err.message : "Could not save dashboard layout.",
      );
    } finally {
      setSaving(false);
    }
  };

  const renderVisualPreview = (type: Widget["chartType"]) => {
    switch (type) {
      case "BAR":
        return (
          <svg width="100%" height="70" viewBox="0 0 240 70" preserveAspectRatio="none">
            <rect x="20" y="25" width="22" height="45" rx="3" fill="var(--color-brand, var(--color-primary))" opacity="0.85" />
            <rect x="55" y="15" width="22" height="55" rx="3" fill="var(--color-brand, var(--color-primary))" />
            <rect x="90" y="32" width="22" height="38" rx="3" fill="var(--color-brand, var(--color-primary))" opacity="0.65" />
            <rect x="125" y="10" width="22" height="60" rx="3" fill="var(--color-brand, var(--color-primary))" />
            <rect x="160" y="28" width="22" height="42" rx="3" fill="var(--color-brand, var(--color-primary))" opacity="0.75" />
            <rect x="195" y="20" width="22" height="50" rx="3" fill="var(--color-brand, var(--color-primary))" opacity="0.9" />
          </svg>
        );
      case "LINE":
        return (
          <svg width="100%" height="70" viewBox="0 0 240 70" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand, var(--color-primary))" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-brand, var(--color-primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 10 50 Q 50 15, 90 35 T 170 20 T 230 10 L 230 70 L 10 70 Z" fill="url(#lineGrad)" />
            <path d="M 10 50 Q 50 15, 90 35 T 170 20 T 230 10" fill="none" stroke="var(--color-brand, var(--color-primary))" strokeWidth="2.5" />
            <circle cx="90" cy="35" r="4" fill="var(--color-brand, var(--color-primary))" />
            <circle cx="170" cy="20" r="4" fill="var(--color-brand, var(--color-primary))" />
            <circle cx="230" cy="10" r="4" fill="var(--color-brand, var(--color-primary))" />
          </svg>
        );
      case "PIE":
        return (
          <svg width="70" height="70" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-border)" strokeWidth="5" />
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-brand, var(--color-primary))" strokeWidth="5" strokeDasharray="45 55" strokeDashoffset="25" />
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-success)" strokeWidth="5" strokeDasharray="30 70" strokeDashoffset="80" />
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--color-warning)" strokeWidth="5" strokeDasharray="25 75" strokeDashoffset="50" />
          </svg>
        );
      case "GAUGE":
        return (
          <svg width="120" height="70" viewBox="0 0 120 70">
            <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="var(--color-border)" strokeWidth="8" strokeLinecap="round" />
            <path d="M 15 60 A 45 45 0 0 1 85 22" fill="none" stroke="var(--color-brand, var(--color-primary))" strokeWidth="8" strokeLinecap="round" />
            <circle cx="60" cy="60" r="5" fill="var(--color-text-primary)" />
            <line x1="60" y1="60" x2="80" y2="28" stroke="var(--color-text-primary)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  const activeDashboard = dashboards.find((d) => d.id === activeId);

  return (
    <RouteGuard permission="analytics.dashboard.manage">
      <div className={styles.container} data-density="compact">
        <PageHeader
          title="Interactive Dashboard Layout Studio"
          description="Compose responsive drag-and-drop executive dashboards, arrange dynamic chart widgets, and configure live business telemetry sources."
          actions={
            <div className={styles.headerActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={addWidget}
                disabled={!activeId}
              >
                <Plus size={14} className={styles.btnIcon} />
                Add Widget
              </Button>
              <Button
                size="sm"
                onClick={saveLayout}
                disabled={!activeId || saving}
              >
                {saved ? (
                  <Check size={14} className={styles.btnIcon} />
                ) : (
                  <Save size={14} className={styles.btnIcon} />
                )}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Layout"}
              </Button>
            </div>
          }
        />

        <div className={styles.workspaceLayout}>
          {/* Left Sidebar: Dashboards Registry */}
          <Card className={styles.sidebarCard}>
            <div className={styles.sidebarHeader}>
              <h3 className={styles.sidebarTitle}>Dashboards</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsModalOpen(true)}
                title="Create New Dashboard"
              >
                <Plus size={14} />
              </Button>
            </div>

            <div className={styles.dashboardList}>
              {dashboards.map((d) => {
                const isActive = activeId === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => selectDashboard(d)}
                    className={`${styles.dashboardItem} ${isActive ? styles.dashboardItemActive : ""}`}
                  >
                    <span>{d.name}</span>
                    <Badge variant={isActive ? "info" : "default"}>
                      {(d.layout?.length || 0)} w
                    </Badge>
                  </button>
                );
              })}

              {dashboards.length === 0 && (
                <div className={styles.emptyDashboards}>
                  No dashboards found. Click "+" to create one.
                </div>
              )}
            </div>
          </Card>

          {/* Right Area: Interactive Canvas */}
          <div className={styles.canvasArea}>
            {!activeId && (
              <Card className={styles.canvasEmptyCard}>
                <Layers size={36} className={styles.emptyCanvasIcon} />
                <h4 className={styles.canvasEmptyTitle}>No Dashboard Selected</h4>
                <p className={styles.canvasEmptyDesc}>
                  Select an existing dashboard from the left panel or create a new board to start customizing widgets.
                </p>
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  <Plus size={14} className={styles.btnIcon} />
                  Create Dashboard
                </Button>
              </Card>
            )}

            {activeId && (
              <>
                <div className={styles.boardHeader}>
                  <div className={styles.boardTitleGroup}>
                    <LayoutDashboard size={16} className={styles.boardTitleIcon} />
                    <span className={styles.boardTitleText}>
                      {activeDashboard?.name || "Active Board"}
                    </span>
                    <Badge variant="info">{widgets.length} Widgets Configured</Badge>
                  </div>
                  <span className={styles.dragHint}>
                    Drag grip handle to reorder widgets
                  </span>
                </div>

                <div className={styles.widgetsGrid}>
                  {widgets.map((w, idx) => (
                    <div
                      key={w.id}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(idx)}
                      className={`${styles.widgetCard} ${w.width === 2 ? styles.widgetSpan2 : ""} ${dragIndex === idx ? styles.widgetDragging : ""}`}
                    >
                      <div className={styles.widgetTopBar}>
                        <div className={styles.dragHandle} title="Drag to reorder">
                          <GripVertical size={16} />
                        </div>
                        <input
                          value={w.title}
                          onChange={(e) =>
                            updateWidget(w.id, { title: e.target.value })
                          }
                          className={styles.widgetTitleInput}
                          placeholder="Widget Title..."
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeWidget(w.id)}
                          title="Delete Widget"
                        >
                          <Trash2
                            size={14}
                            className={styles.deleteWidgetIcon}
                          />
                        </Button>
                      </div>

                      {/* Chart Type Picker */}
                      <div className={styles.chartTypeSelector}>
                        {CHART_TYPES.map((ct) => {
                          const isSelected = w.chartType === ct.type;
                          return (
                            <button
                              key={ct.type}
                              type="button"
                              onClick={() =>
                                updateWidget(w.id, { chartType: ct.type })
                              }
                              className={`${styles.typeBtn} ${isSelected ? styles.typeBtnActive : ""}`}
                            >
                              {ct.icon} {ct.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Source & Width Config */}
                      <div className={styles.widgetConfigBar}>
                        <select
                          value={w.source}
                          onChange={(e) =>
                            updateWidget(w.id, { source: e.target.value })
                          }
                          className={styles.sourceSelect}
                        >
                          {SOURCES.map((s) => (
                            <option key={s} value={s}>
                              Entity Source: {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            updateWidget(w.id, { width: w.width === 2 ? 1 : 2 })
                          }
                          className={styles.widthToggleBtn}
                        >
                          {w.width === 2 ? "Span: Full Width" : "Span: Half Width"}
                        </button>
                      </div>

                      {/* Live Visual Chart Preview */}
                      <div className={styles.previewContainer}>
                        {renderVisualPreview(w.chartType)}
                        <div className={styles.previewMeta}>
                          <span>Live Telemetry: {w.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {widgets.length === 0 && (
                    <Card className={styles.emptyWidgetsCard}>
                      <Sparkles
                        size={28}
                        className={styles.emptyWidgetsIcon}
                      />
                      <h4 className={styles.emptyWidgetsTitle}>
                        No Widgets in this Dashboard
                      </h4>
                      <p className={styles.emptyWidgetsDesc}>
                        Click "Add Widget" to place your first telemetry chart.
                      </p>
                      <Button size="sm" onClick={addWidget}>
                        <Plus size={14} className={styles.btnIconSm} />
                        Add First Widget
                      </Button>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Create Dashboard Modal */}
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Create New Dashboard</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              <form onSubmit={handleCreateDashboard} className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Dashboard Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Executive Financial Pulse 2026..."
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Target domain, cadence, or audience for this board..."
                    value={newDashboardDesc}
                    onChange={(e) => setNewDashboardDesc(e.target.value)}
                    className={styles.formInput}
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
                  <Button
                    type="submit"
                    size="sm"
                    disabled={creatingDashboard}
                  >
                    {creatingDashboard ? "Creating..." : "Create Dashboard"}
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
