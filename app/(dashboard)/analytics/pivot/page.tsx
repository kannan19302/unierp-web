"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  useToast,
  Spinner,
} from "@kannan19302/ui";
import {
  Layers,
  RefreshCw,
  Download,
  Filter,
  BarChart2,
  Table as TableIcon,
  Calculator,
  PieChart,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface Report {
  id: string;
  name: string;
  type: string;
}

interface PivotItem {
  row: string;
  column: string;
  value: number;
  count: number;
}

export default function AnalyticsPivotPage() {
  const client = useApiClient();
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [loadingReports, setLoadingReports] = useState(true);

  // Pivot aggregation states
  const [rowFields, setRowFields] = useState<string[]>(["Quarter"]);
  const [colFields, setColFields] = useState<string[]>(["Channel"]);
  const [aggregations, setAggregations] = useState<string[]>([
    "SUM(totalAmount)",
  ]);
  const [pivotData, setPivotData] = useState<PivotItem[]>([]);
  const [pivotLoading, setPivotLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoadingReports(true);
        const data = await client.get<Report[] | { data?: Report[] }>(
          "/analytics/reports",
        );
        const list = Array.isArray(data) ? data : data?.data || [];
        setReports(list);
        if (list.length > 0) {
          setSelectedReportId(list[0]!.id);
        }
      } catch (err) {
        toast.error(
          "Failed to load reports",
          err instanceof Error ? err.message : "Error loading reports",
        );
      } finally {
        setLoadingReports(false);
      }
    };
    loadReports();
  }, []);

  const handleRunPivot = async () => {
    if (!selectedReportId) return;
    try {
      setPivotLoading(true);
      const data = await client.post<{ pivotData?: PivotItem[] }>(
        `/analytics/reports/${selectedReportId}/pivot`,
        { rowFields, colFields, aggregations },
      );
      if (data.pivotData) {
        setPivotData(data.pivotData);
        toast.success(
          "Matrix Calculated",
          `Computed ${data.pivotData.length} multi-dimensional cells.`,
        );
      }
    } catch (err) {
      toast.error(
        "Pivot Calculation Failed",
        err instanceof Error
          ? err.message
          : "Error running pivot aggregation query.",
      );
    } finally {
      setPivotLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReportId) {
      handleRunPivot();
    }
  }, [selectedReportId]);

  const summary = useMemo(() => {
    const totalVal = pivotData.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const totalCount = pivotData.reduce((acc, curr) => acc + (curr.count || 0), 0);
    const avg = totalCount > 0 ? totalVal / totalCount : 0;
    return { totalVal, totalCount, avg };
  }, [pivotData]);

  const exportCSV = () => {
    if (pivotData.length === 0) return;
    const headers = ["Period / Row", "Dimension / Column", "Aggregate Value", "Transaction Count"];
    const rows = pivotData.map((p) => [
      `"${p.row}"`,
      `"${p.column}"`,
      p.value,
      p.count,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pivot-matrix-export.csv`;
    a.click();
    toast.success("CSV Downloaded", "Exported pivot matrix.");
  };

  if (loadingReports) {
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
    <RouteGuard permission="analytics.pivot.read">
      <div className={styles.container} data-density="compact">
        <PageHeader
          title="Multi-Dimensional Pivot Matrix Aggregator"
          description="Synthesize large operational datasets across dynamic intersecting row and column dimensions with sub-second numerical calculations."
          actions={
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {pivotData.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download size={14} style={{ marginRight: "var(--space-1-5)" }} />
                  Export CSV
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleRunPivot}
                disabled={pivotLoading || !selectedReportId}
              >
                <RefreshCw
                  size={14}
                  className={pivotLoading ? "spin-animation" : ""}
                  style={{ marginRight: "var(--space-1-5)" }}
                />
                {pivotLoading ? "Computing Matrix..." : "Recalculate Pivot"}
              </Button>
            </div>
          }
        />

        {/* Configuration Bar */}
        <div className={styles.configCard}>
          <div className={styles.configGrid}>
            <div className={styles.configField}>
              <label className={styles.fieldLabel}>Base Data Report</label>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className={styles.configSelect}
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.configField}>
              <label className={styles.fieldLabel}>Row Grouping Dimension</label>
              <select
                multiple
                value={rowFields}
                onChange={(e) =>
                  setRowFields(
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
                className={styles.configSelect}
                style={{ height: "calc(var(--space-10) * 1.8)" }}
              >
                <option value="Quarter">Quarter Period</option>
                <option value="SalesPerson">Sales Representative</option>
                <option value="Status">Invoice Status</option>
                <option value="Category">Product Category</option>
              </select>
            </div>

            <div className={styles.configField}>
              <label className={styles.fieldLabel}>Column Intersect Dimension</label>
              <select
                multiple
                value={colFields}
                onChange={(e) =>
                  setColFields(
                    Array.from(e.target.selectedOptions).map((o) => o.value),
                  )
                }
                className={styles.configSelect}
                style={{ height: "calc(var(--space-10) * 1.8)" }}
              >
                <option value="Channel">Channel Type (B2B / Direct)</option>
                <option value="Region">Geographic Region</option>
                <option value="PaymentMethod">Payment Gateway</option>
              </select>
            </div>

            <div className={styles.configField}>
              <label className={styles.fieldLabel}>Aggregate Function</label>
              <select
                value={aggregations[0]}
                onChange={(e) => setAggregations([e.target.value])}
                className={styles.configSelect}
              >
                <option value="SUM(totalAmount)">Sum of Total Amount ($)</option>
                <option value="COUNT(id)">Transaction Event Counts</option>
                <option value="AVG(totalAmount)">Average Order Size ($)</option>
                <option value="MAX(totalAmount)">Maximum Peak Transaction ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Metric KPI Bar */}
        {pivotData.length > 0 && (
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <Calculator size={20} style={{ color: "var(--color-brand, var(--color-primary))" }} />
              <div>
                <p className={styles.summaryLabel}>Total Aggregate Volume</p>
                <p className={styles.summaryVal}>
                  ${summary.totalVal.toLocaleString()}
                </p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <Layers size={20} style={{ color: "var(--color-success)" }} />
              <div>
                <p className={styles.summaryLabel}>Intersectional Matrix Cells</p>
                <p className={styles.summaryVal}>{pivotData.length} cells</p>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <BarChart2 size={20} style={{ color: "var(--color-primary)" }} />
              <div>
                <p className={styles.summaryLabel}>Average Value per Record</p>
                <p className={styles.summaryVal}>
                  ${summary.avg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pivot Output Matrix Table */}
        <div className={styles.matrixCard}>
          <div className={styles.matrixHeader}>
            <h3 className={styles.matrixTitle}>
              <TableIcon size={15} style={{ color: "var(--color-primary)" }} />
              Aggregated Pivot Matrix Results
            </h3>
            <Badge variant="info">
              {rowFields.join(", ")} × {colFields.join(", ")}
            </Badge>
          </div>

          {pivotData.length === 0 ? (
            <div className={styles.emptyState}>
              <Layers size={32} style={{ color: "var(--color-text-tertiary)" }} />
              <p style={{ margin: 0, fontWeight: "var(--weight-semibold)" }}>
                No records matching the selected dimension parameters.
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Select a different data report or adjust the row/column groupings above.
              </p>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: "row",
                  header: "Period / Row Group",
                  render: (p: PivotItem) => (
                    <span style={{ fontWeight: "var(--weight-semibold)" }}>
                      {p.row}
                    </span>
                  ),
                },
                {
                  key: "column",
                  header: "Channel / Column Intersect",
                  render: (p: PivotItem) => <Badge variant="default">{p.column}</Badge>,
                },
                {
                  key: "value",
                  header: "Aggregate Sum",
                  render: (p: PivotItem) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontWeight: "var(--weight-bold)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      ${p.value?.toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: "count",
                  header: "Transaction Count",
                  render: (p: PivotItem) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {p.count?.toLocaleString()} events
                    </span>
                  ),
                },
              ]}
              data={pivotData}
              rowKey={(_p: PivotItem, idx: number) => String(idx)}
            />
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
