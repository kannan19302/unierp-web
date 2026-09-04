"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Spinner,
  useToast,
} from "@kannan19302/ui";
import {
  Activity,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Layers,
  Sparkles,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface KpiValue {
  id: string;
  kpiName: string;
  category: string;
  value: number;
  previousValue: number | null;
  targetValue: number | null;
  unit: string | null;
  recordedAt: string;
}

export default function KpisPage() {
  const client = useApiClient();
  const toast = useToast();
  const [kpis, setKpis] = useState<KpiValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newKpi, setNewKpi] = useState({
    kpiName: "",
    category: "FINANCE",
    value: "",
    previousValue: "",
    targetValue: "",
    unit: "",
  });

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const data = await client.get<KpiValue[] | { data?: KpiValue[] }>(
        "/analytics/kpi-values",
      );
      setKpis(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error(
        "Failed to load KPIs",
        err instanceof Error ? err.message : "Error fetching KPIs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpi.kpiName.trim()) {
      toast.error("Validation Error", "KPI name is required.");
      return;
    }

    try {
      setSubmitting(true);
      await client.post("/analytics/kpi-values", {
        ...newKpi,
        value: parseFloat(newKpi.value),
        previousValue: newKpi.previousValue
          ? parseFloat(newKpi.previousValue)
          : undefined,
        targetValue: newKpi.targetValue
          ? parseFloat(newKpi.targetValue)
          : undefined,
        unit: newKpi.unit || undefined,
      });
      toast.success("KPI Recorded", `Added telemetry entry for "${newKpi.kpiName}".`);
      setIsModalOpen(false);
      setNewKpi({
        kpiName: "",
        category: "FINANCE",
        value: "",
        previousValue: "",
        targetValue: "",
        unit: "",
      });
      fetchKpis();
    } catch (err) {
      toast.error(
        "Save Failed",
        err instanceof Error ? err.message : "Error recording KPI",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const change = (current: number, prev: number | null): number | null => {
    if (prev === null || prev === 0) return null;
    return ((current - prev) / prev) * 100;
  };

  const categories = [
    "ALL",
    "FINANCE",
    "SALES",
    "OPERATIONS",
    "HR",
    "INVENTORY",
    "PROJECTS",
    "MANUFACTURING",
  ];

  const filteredKpis = useMemo(() => {
    if (selectedCategory === "ALL") return kpis;
    return kpis.filter(
      (k) => k.category?.toUpperCase() === selectedCategory.toUpperCase(),
    );
  }, [kpis, selectedCategory]);

  if (loading && kpis.length === 0) {
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
        title="Enterprise Key Performance Indicators"
        description="Continuous scorecards tracking financial velocity, sales pipelines, manufacturing yields, and operational health metrics against quarterly targets."
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} style={{ marginRight: "var(--space-1-5)" }} />
            Record KPI Entry
          </Button>
        }
      />

      {/* Top Filter Bar */}
      <div className={styles.topBar}>
        <div className={styles.categoryChips}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.categoryBtnActive : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          Showing {filteredKpis.length} of {kpis.length} indicators
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {filteredKpis.map((k) => {
          const pct = change(k.value, k.previousValue);
          const hasTarget = k.targetValue !== null && k.targetValue > 0;
          const targetPercent = hasTarget
            ? Math.min(100, Math.round((k.value / (k.targetValue || 1)) * 100))
            : 0;
          const meetingTarget = hasTarget ? k.value >= (k.targetValue || 0) : null;

          return (
            <div key={k.id} className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiName}>{k.kpiName}</span>
                <Badge variant="default">{k.category}</Badge>
              </div>

              <div className={styles.kpiValue}>
                {k.value?.toLocaleString()}
                {k.unit && <span className={styles.kpiUnit}>{k.unit}</span>}
              </div>

              {/* Progress Toward Target */}
              {hasTarget && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${targetPercent}%`,
                        background: meetingTarget
                          ? "var(--color-success)"
                          : "var(--color-brand, var(--color-primary))",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                    <span className={styles.targetBadge}>
                      Target: {k.targetValue?.toLocaleString()}{k.unit}
                    </span>
                    <span style={{ color: meetingTarget ? "var(--color-success)" : "var(--color-text-secondary)" }}>
                      {targetPercent}% met
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.kpiMeta}>
                {pct !== null ? (
                  <span className={pct >= 0 ? styles.upChange : styles.downChange}>
                    {pct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {Math.abs(pct).toFixed(1)}% vs prev
                  </span>
                ) : (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                    Baseline Period
                  </span>
                )}
                <span className={styles.kpiDate}>
                  {new Date(k.recordedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredKpis.length === 0 && (
        <div className={styles.emptyState}>
          <Activity size={32} style={{ color: "var(--color-text-tertiary)", margin: "0 auto var(--space-2) auto" }} />
          <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
            No KPI metrics found for {selectedCategory}.
          </p>
          <p style={{ margin: "var(--space-1) 0 var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Record an indicator entry to populate this operational domain.
          </p>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
            Record KPI Entry
          </Button>
        </div>
      )}

      {/* Record KPI Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record New KPI Observation</h3>
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
                <label className={styles.fieldLabel}>KPI Title</label>
                <input
                  className={styles.formInput}
                  placeholder="e.g. Net ARR Retention Rate..."
                  value={newKpi.kpiName}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, kpiName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Operational Domain</label>
                <select
                  className={styles.formInput}
                  value={newKpi.category}
                  onChange={(e) =>
                    setNewKpi((p) => ({ ...p, category: e.target.value }))
                  }
                >
                  {categories.filter((c) => c !== "ALL").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Observed Value</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={newKpi.value}
                    onChange={(e) =>
                      setNewKpi((p) => ({ ...p, value: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Target Value (Optional)</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    step="any"
                    placeholder="Goal..."
                    value={newKpi.targetValue}
                    onChange={(e) =>
                      setNewKpi((p) => ({ ...p, targetValue: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Previous Period Value</label>
                  <input
                    className={styles.formInput}
                    type="number"
                    step="any"
                    placeholder="Prior value..."
                    value={newKpi.previousValue}
                    onChange={(e) =>
                      setNewKpi((p) => ({
                        ...p,
                        previousValue: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Unit Symbol</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. $, %, hrs, units"
                    value={newKpi.unit}
                    onChange={(e) =>
                      setNewKpi((p) => ({ ...p, unit: e.target.value }))
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
                  {submitting ? "Saving..." : "Record KPI"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
