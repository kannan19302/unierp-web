"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PageHeader,
  Card,
  Button,
  DataTable,
  Badge,
  Spinner,
  useToast,
} from "@kannan19302/ui";
import {
  BookOpen,
  Plus,
  X,
  Trash2,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface BiMetric {
  id: string;
  name: string;
  description: string | null;
  category: string;
  source: string;
  expression: string;
  unit: string | null;
  isActive: boolean;
  dimensions: string[];
}

export default function CatalogPage() {
  const client = useApiClient();
  const toast = useToast();
  const [metrics, setMetrics] = useState<BiMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "FINANCE",
    source: "INVOICE",
    expression: "",
    unit: "",
    dimensionsStr: "",
    isActive: "true",
  });

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const r = await client.get<{ data: BiMetric[]; meta: unknown }>(
        "/analytics/bi-metrics",
      );
      setMetrics(r.data || []);
    } catch (err) {
      toast.error(
        "Failed to load metrics",
        err instanceof Error ? err.message : "Error loading metrics",
      );
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const saveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      toast.error("Validation Error", "Metric name is required.");
      return;
    }

    try {
      setSaving(true);
      await client.post("/analytics/bi-metrics", {
        name: newItem.name.trim(),
        description: newItem.description.trim() || undefined,
        category: newItem.category,
        source: newItem.source,
        expression: newItem.expression.trim(),
        unit: newItem.unit.trim() || undefined,
        dimensions: newItem.dimensionsStr
          ? newItem.dimensionsStr.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        isActive: newItem.isActive === "true",
      });
      toast.success("Metric Saved", `Defined "${newItem.name}" in semantic catalog.`);
      setIsModalOpen(false);
      setNewItem({
        name: "",
        description: "",
        category: "FINANCE",
        source: "INVOICE",
        expression: "",
        unit: "",
        dimensionsStr: "",
        isActive: "true",
      });
      fetchMetrics();
    } catch (err) {
      toast.error(
        "Failed to save metric",
        err instanceof Error ? err.message : "Save error",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMetric = async (id: string, name: string) => {
    try {
      await client.delete(`/analytics/bi-metrics/${id}`);
      toast.success("Metric Deleted", `Removed "${name}" from catalog.`);
      fetchMetrics();
    } catch (err) {
      toast.error(
        "Delete Failed",
        err instanceof Error ? err.message : "Error deleting metric",
      );
    }
  };

  const categories = ["ALL", "FINANCE", "SALES", "HR", "OPERATIONS", "INVENTORY", "CRM"];

  const filteredMetrics = useMemo(() => {
    if (selectedCat === "ALL") return metrics;
    return metrics.filter((m) => m.category === selectedCat);
  }, [metrics, selectedCat]);

  if (loading && metrics.length === 0) {
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
    <RouteGuard permission="analytics.bi-metrics.read">
      <div className={styles.container} data-density="compact">
        <PageHeader
          title="Semantic Metric & Dimension Catalog"
          description="Enterprise business semantic layer defining standardized metric calculation formulas, entity source bindings, and dimension models."
          actions={
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={14} style={{ marginRight: "var(--space-1-5)" }} />
              Add Semantic Metric
            </Button>
          }
        />

        {/* Category Filter Cards */}
        <div className={styles.categoryGrid}>
          {categories.map((cat) => {
            const count =
              cat === "ALL"
                ? metrics.length
                : metrics.filter((m) => m.category === cat).length;
            const isActive = selectedCat === cat;
            return (
              <div
                key={cat}
                className={`${styles.categoryCard} ${isActive ? styles.categoryCardActive : ""}`}
                onClick={() => setSelectedCat(cat)}
              >
                <p className={styles.categoryLabel}>{cat}</p>
                <p className={styles.categoryCount}>{count}</p>
              </div>
            );
          })}
        </div>

        {/* Metrics Data Grid */}
        <Card className={styles.catalogSection}>
          <div className={styles.catalogHeader}>
            <h3 className={styles.catalogTitle}>
              Defined Semantic Metrics ({filteredMetrics.length})
            </h3>
            <Badge variant="info">Category: {selectedCat}</Badge>
          </div>

          {filteredMetrics.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpen size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
              <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
                No metrics defined in category {selectedCat}.
              </p>
              <p style={{ margin: "var(--space-1) 0 var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Define formulas and dimension schemas for standard business metrics.
              </p>
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
                Add Metric
              </Button>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "name",
                  header: "Metric Name",
                  render: (m: BiMetric) => (
                    <div>
                      <span style={{ fontWeight: "var(--weight-semibold)" }}>{m.name}</span>
                      {m.description && (
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: "var(--space-0-5) 0 0 0" }}>
                          {m.description}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  key: "category",
                  header: "Domain",
                  render: (m: BiMetric) => <Badge variant="info">{m.category}</Badge>,
                },
                {
                  key: "source",
                  header: "Entity Source",
                  render: (m: BiMetric) => (
                    <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                      {m.source}
                    </span>
                  ),
                },
                {
                  key: "expression",
                  header: "Calculation Expression",
                  render: (m: BiMetric) => (
                    <code
                      style={{
                        background: "var(--color-bg-sunken)",
                        padding: "var(--space-0-5) var(--space-2)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "var(--text-xs)",
                        color: "var(--color-brand, var(--color-primary))",
                      }}
                    >
                      {m.expression || "—"}
                    </code>
                  ),
                },
                {
                  key: "dimensions",
                  header: "Dimensions",
                  render: (m: BiMetric) => (
                    <div className={styles.dimensionChips}>
                      {m.dimensions?.map((d, i) => (
                        <span key={i} className={styles.dimensionBadge}>
                          {d}
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "unit",
                  header: "Unit",
                  render: (m: BiMetric) => (
                    <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                      {m.unit || "—"}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (m: BiMetric) => (
                    <Badge variant={m.isActive ? "success" : "default"}>
                      {m.isActive ? "Active" : "Inactive"}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (m: BiMetric) => (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMetric(m.id, m.name)}
                    >
                      <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                    </Button>
                  ),
                },
              ]}
              data={filteredMetrics}
              rowKey={(m: BiMetric) => m.id}
            />
          )}
        </Card>

        {/* Add Semantic Metric Modal */}
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Define Semantic BI Metric</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              <form onSubmit={saveMetric} className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Metric Title</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. EBITDA, Customer Acquisition Cost..."
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Description (Optional)</label>
                  <input
                    className={styles.formInput}
                    placeholder="Semantic definition and business formula explanation..."
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Category</label>
                    <select
                      className={styles.formInput}
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem({ ...newItem, category: e.target.value })
                      }
                    >
                      <option value="FINANCE">Finance</option>
                      <option value="SALES">Sales</option>
                      <option value="HR">HR</option>
                      <option value="OPERATIONS">Operations</option>
                      <option value="INVENTORY">Inventory</option>
                      <option value="CRM">CRM</option>
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Entity Source</label>
                    <select
                      className={styles.formInput}
                      value={newItem.source}
                      onChange={(e) =>
                        setNewItem({ ...newItem, source: e.target.value })
                      }
                    >
                      <option value="INVOICE">Invoices & Receivables</option>
                      <option value="SALES_ORDER">Sales Orders</option>
                      <option value="PURCHASE_ORDER">Purchase Orders</option>
                      <option value="PRODUCT">Products & Inventory</option>
                      <option value="EMPLOYEE">Workforce & Payroll</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Calculation Formula / Expression</label>
                  <input
                    className={styles.formInput}
                    style={{ fontFamily: "var(--font-mono, monospace)" }}
                    placeholder="e.g. SUM(totalAmount) - SUM(costOfGoods)"
                    value={newItem.expression}
                    onChange={(e) =>
                      setNewItem({ ...newItem, expression: e.target.value })
                    }
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Unit Symbol</label>
                    <input
                      className={styles.formInput}
                      placeholder="USD, %, units, days"
                      value={newItem.unit}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unit: e.target.value })
                      }
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Dimensions (Comma-separated)</label>
                    <input
                      className={styles.formInput}
                      placeholder="region, channel, quarter"
                      value={newItem.dimensionsStr}
                      onChange={(e) =>
                        setNewItem({ ...newItem, dimensionsStr: e.target.value })
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
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? "Saving..." : "Save Metric Definition"}
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
