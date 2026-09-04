"use client";

import React, { useState } from "react";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  DataTable,
  useToast,
} from "@kannan19302/ui";
import {
  GitFork,
  Play,
  Download,
  Filter,
  Table as TableIcon,
  BarChart3,
  Plus,
  Trash2,
  ArrowRight,
  Sparkles,
  Loader2,
  Database,
  Layers,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface QueryField {
  table: string;
  column: string;
  alias: string;
}

interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, string | number>[];
}

interface AskDataResponse {
  answer: string;
  query: {
    entity: string;
    aggregations?: Array<{ field: string; fn: string }>;
  } | null;
  data: Record<string, unknown>[];
}

const AVAILABLE_TABLES = [
  {
    name: "invoices",
    label: "Invoices & Receivables",
    columns: [
      "id",
      "invoiceNumber",
      "totalAmount",
      "status",
      "createdAt",
      "dueDate",
    ],
  },
  {
    name: "employees",
    label: "Staff & Workforce",
    columns: [
      "id",
      "firstName",
      "lastName",
      "email",
      "department",
      "hireDate",
      "salary",
    ],
  },
  {
    name: "products",
    label: "Inventory & Catalog",
    columns: ["id", "name", "sku", "price", "stockLevel", "category"],
  },
  {
    name: "customers",
    label: "Customer Directory",
    columns: ["id", "name", "email", "phone", "city", "totalOrders"],
  },
  {
    name: "purchase_orders",
    label: "Purchase Orders",
    columns: [
      "id",
      "poNumber",
      "vendorId",
      "totalAmount",
      "status",
      "orderDate",
    ],
  },
  {
    name: "sales_orders",
    label: "Sales Orders",
    columns: [
      "id",
      "orderNumber",
      "customerId",
      "totalAmount",
      "status",
      "orderDate",
    ],
  },
];

const OPERATORS = [
  "=",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
  "LIKE",
  "IN",
  "IS NULL",
  "IS NOT NULL",
];

const AGGREGATIONS = ["None", "COUNT", "SUM", "AVG", "MIN", "MAX"];

export default function VisualQueryBuilderPage() {
  const client = useApiClient();
  const toast = useToast();
  const [selectedFields, setSelectedFields] = useState<QueryField[]>([]);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [orderBy, setOrderBy] = useState("");
  const [limit, setLimit] = useState(50);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [activeAggregation, setActiveAggregation] = useState<
    Record<string, string>
  >({});
  const [isRunning, setIsRunning] = useState(false);
  const [joins, setJoins] = useState<
    { fromTable: string; toTable: string; fromCol: string; toCol: string }[]
  >([]);

  // AI Copilot state
  const [nlQuestion, setNlQuestion] = useState("");
  const [nlAsking, setNlAsking] = useState(false);
  const [nlResult, setNlResult] = useState<AskDataResponse | null>(null);
  const [nlError, setNlError] = useState("");

  const askInPlainEnglish = async () => {
    if (!nlQuestion.trim()) return;
    setNlAsking(true);
    setNlError("");
    setNlResult(null);
    try {
      const data = await client.post<AskDataResponse>("/ai/ask", {
        question: nlQuestion.trim(),
      });
      setNlResult(data);
      toast.success("AI Query Generated", "Copilot analyzed your query.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not reach the AI copilot.";
      setNlError(msg);
      toast.error("AI Copilot Error", msg);
    } finally {
      setNlAsking(false);
    }
  };

  const addField = (table: string, column: string) => {
    const alias = `${table}.${column}`;
    if (selectedFields.some((f) => f.alias === alias)) return;
    setSelectedFields((prev) => [...prev, { table, column, alias }]);
  };

  const removeField = (alias: string) => {
    setSelectedFields((prev) => prev.filter((f) => f.alias !== alias));
  };

  const addFilter = () => {
    setFilters((prev) => [...prev, { field: "", operator: "=", value: "" }]);
  };

  const removeFilter = (idx: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateFilter = (idx: number, key: keyof FilterRule, val: string) => {
    setFilters((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [key]: val } : f)),
    );
  };

  const addJoin = () => {
    setJoins((prev) => [
      ...prev,
      { fromTable: "", toTable: "", fromCol: "id", toCol: "id" },
    ]);
  };

  const removeJoin = (idx: number) => {
    setJoins((prev) => prev.filter((_, i) => i !== idx));
  };

  const runQuery = async () => {
    if (selectedFields.length === 0) {
      toast.error("Validation Error", "Select at least one field to query.");
      return;
    }
    setIsRunning(true);
    try {
      const data = await client.post<{
        fields?: string[];
        rows?: Record<string, string | number>[];
      }>("/analytics/query/visual", {
        selectFields: selectedFields.map((f) => f.column),
        filterGroups: filters,
        groupBy,
        orderBy,
        limit,
        joins,
        aggregations: activeAggregation,
      });
      const columns = data.fields || selectedFields.map((f) => f.alias);
      const rows = Array.isArray(data.rows) ? data.rows : [];
      setResults({ columns, rows });
      toast.success(
        "Query Executed",
        `Retrieved ${rows.length} row(s) matching criteria.`,
      );
    } catch (err: any) {
      toast.error(
        "Query Execution Failed",
        err?.message || "Failed to execute query.",
      );
      setResults(null);
    } finally {
      setIsRunning(false);
    }
  };

  const exportCSV = () => {
    if (!results) return;
    const header = results.columns.join(",");
    const rows = results.rows
      .map((r) => results.columns.map((c) => r[c] ?? "").join(","))
      .join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_results.csv";
    a.click();
    toast.success("CSV Exported", "Downloaded query results.");
  };

  return (
    <RouteGuard permission="analytics.query.read">
      <div className={styles.container} data-density="compact">
        <PageHeader
          title="Visual Query Studio & Semantic Builder"
          description="Construct multi-entity SQL queries with point-and-click fields, relational joins, grouped aggregates, and an AI natural language copilot."
          actions={
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                size="sm"
                onClick={runQuery}
                disabled={selectedFields.length === 0 || isRunning}
              >
                <Play size={14} style={{ marginRight: "var(--space-1-5)" }} />
                {isRunning ? "Executing..." : "Execute Query"}
              </Button>
              {results && (
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download size={14} style={{ marginRight: "var(--space-1-5)" }} />
                  Export CSV
                </Button>
              )}
            </div>
          }
        />

        {/* AI Natural Language Copilot */}
        <div className={styles.copilotCard}>
          <div className={styles.copilotHeader}>
            <Sparkles size={16} style={{ color: "var(--color-brand, var(--color-primary))" }} />
            Ask in Plain English (AI Copilot)
          </div>
          <div className={styles.copilotInputRow}>
            <input
              value={nlQuestion}
              onChange={(e) => setNlQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") askInPlainEnglish();
              }}
              placeholder="e.g. What's our total invoiced revenue grouped by status this quarter?"
              className={styles.copilotInput}
            />
            <Button
              size="sm"
              onClick={askInPlainEnglish}
              disabled={nlAsking || !nlQuestion.trim()}
            >
              {nlAsking ? (
                <Loader2 size={14} className="spin-animation" style={{ marginRight: "var(--space-1-5)" }} />
              ) : (
                <Sparkles size={14} style={{ marginRight: "var(--space-1-5)" }} />
              )}
              {nlAsking ? "Analyzing..." : "Ask Copilot"}
            </Button>
          </div>

          {nlResult && (
            <div className={styles.copilotAnswerBox}>
              <p className={styles.copilotAnswerText}>{nlResult.answer}</p>
              {nlResult.query && (
                <p className={styles.copilotQueryMeta}>
                  Entity: <strong>{nlResult.query.entity}</strong>
                  {nlResult.query.aggregations?.length
                    ? ` (${nlResult.query.aggregations.map((a) => `${a.fn}(${a.field})`).join(", ")})`
                    : ""}{" "}
                  — {nlResult.data.length} row(s) returned.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 2-Column Studio: Left Explorer, Right Query Canvas */}
        <div className={styles.studioLayout}>
          {/* Schema Explorer */}
          <div className={styles.schemaCard}>
            <h3 className={styles.schemaTitle}>Available Entity Tables</h3>
            {AVAILABLE_TABLES.map((t) => (
              <div key={t.name} className={styles.tableBlock}>
                <div className={styles.tableName}>
                  <Database size={13} style={{ color: "var(--color-brand, var(--color-primary))" }} />
                  <span>{t.label}</span>
                </div>
                <div className={styles.columnList}>
                  {t.columns.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => addField(t.name, col)}
                      className={styles.columnBtn}
                      title={`Add ${t.name}.${col}`}
                    >
                      <span>{col}</span>
                      <Plus size={12} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pipeline Canvas */}
          <div className={styles.pipelineCanvas}>
            {/* SELECT Fields Section */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <Layers size={15} style={{ color: "var(--color-primary)" }} />
                  SELECT Fields & Aggregates ({selectedFields.length})
                </h3>
              </div>

              {selectedFields.length === 0 ? (
                <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-xs)", margin: 0 }}>
                  Click columns from the entity schema table on the left to add them to your query.
                </p>
              ) : (
                <div className={styles.fieldPillsContainer}>
                  {selectedFields.map((f) => (
                    <div key={f.alias} className={styles.fieldPill}>
                      <span>{f.alias}</span>
                      <select
                        value={activeAggregation[f.alias] || "None"}
                        onChange={(e) =>
                          setActiveAggregation((prev) => ({
                            ...prev,
                            [f.alias]: e.target.value,
                          }))
                        }
                        className={styles.pillSelect}
                      >
                        {AGGREGATIONS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeField(f.alias)}
                        style={{ padding: 0 }}
                      >
                        <Trash2 size={12} style={{ color: "var(--color-danger)" }} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Relational JOINs */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <GitFork size={15} style={{ color: "var(--color-primary)" }} />
                  Relational JOINs ({joins.length})
                </h3>
                <Button size="sm" variant="outline" onClick={addJoin}>
                  <Plus size={12} style={{ marginRight: "var(--space-1)" }} />
                  Add Join
                </Button>
              </div>

              {joins.length === 0 ? (
                <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-xs)", margin: 0 }}>
                  No joins configured. Single-table query mode active.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {joins.map((j, idx) => (
                    <div key={idx} className={styles.clauseRow}>
                      <select
                        value={j.fromTable}
                        onChange={(e) => {
                          const nj = [...joins];
                          nj[idx] = { ...nj[idx]!, fromTable: e.target.value };
                          setJoins(nj);
                        }}
                        className={styles.clauseSelect}
                      >
                        <option value="">Source Table...</option>
                        {AVAILABLE_TABLES.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <ArrowRight size={14} style={{ color: "var(--color-text-tertiary)" }} />
                      <select
                        value={j.toTable}
                        onChange={(e) => {
                          const nj = [...joins];
                          nj[idx] = { ...nj[idx]!, toTable: e.target.value };
                          setJoins(nj);
                        }}
                        className={styles.clauseSelect}
                      >
                        <option value="">Join Table...</option>
                        {AVAILABLE_TABLES.map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                        ON
                      </span>
                      <input
                        value={j.fromCol}
                        onChange={(e) => {
                          const nj = [...joins];
                          nj[idx] = { ...nj[idx]!, fromCol: e.target.value };
                          setJoins(nj);
                        }}
                        placeholder="from_col"
                        className={styles.clauseInput}
                      />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                        =
                      </span>
                      <input
                        value={j.toCol}
                        onChange={(e) => {
                          const nj = [...joins];
                          nj[idx] = { ...nj[idx]!, toCol: e.target.value };
                          setJoins(nj);
                        }}
                        placeholder="to_col"
                        className={styles.clauseInput}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeJoin(idx)}
                      >
                        <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* WHERE Filters */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <Filter size={15} style={{ color: "var(--color-primary)" }} />
                  WHERE Filters ({filters.length})
                </h3>
                <Button size="sm" variant="outline" onClick={addFilter}>
                  <Plus size={12} style={{ marginRight: "var(--space-1)" }} />
                  Add Filter
                </Button>
              </div>

              {filters.length === 0 ? (
                <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-xs)", margin: 0 }}>
                  No filter conditions applied. Query will evaluate all rows.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {filters.map((f, idx) => (
                    <div key={idx} className={styles.clauseRow}>
                      <select
                        value={f.field}
                        onChange={(e) => updateFilter(idx, "field", e.target.value)}
                        className={styles.clauseSelect}
                      >
                        <option value="">Select Field...</option>
                        {selectedFields.map((sf) => (
                          <option key={sf.alias} value={sf.alias}>
                            {sf.alias}
                          </option>
                        ))}
                      </select>
                      <select
                        value={f.operator}
                        onChange={(e) => updateFilter(idx, "operator", e.target.value)}
                        className={styles.clauseSelect}
                      >
                        {OPERATORS.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <input
                        value={f.value}
                        onChange={(e) => updateFilter(idx, "value", e.target.value)}
                        placeholder="Filter value..."
                        className={styles.clauseInput}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFilter(idx)}
                      >
                        <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Group By, Order By, Limit */}
            <div className={styles.clausesGrid}>
              <div className={styles.clauseBox}>
                <label className={styles.clauseLabel}>GROUP BY</label>
                <select
                  multiple
                  value={groupBy}
                  onChange={(e) =>
                    setGroupBy(
                      Array.from(e.target.selectedOptions, (o) => o.value),
                    )
                  }
                  className={styles.clauseSelect}
                  style={{ height: "calc(var(--space-12) * 1.5)" }}
                >
                  {selectedFields.map((f) => (
                    <option key={f.alias} value={f.alias}>
                      {f.alias}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.clauseBox}>
                <label className={styles.clauseLabel}>ORDER BY</label>
                <select
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                  className={styles.clauseSelect}
                >
                  <option value="">Default Ordering</option>
                  {selectedFields.map((f) => (
                    <option key={f.alias + " ASC"} value={f.alias + " ASC"}>
                      {f.alias} ↑ (Ascending)
                    </option>
                  ))}
                  {selectedFields.map((f) => (
                    <option key={f.alias + " DESC"} value={f.alias + " DESC"}>
                      {f.alias} ↓ (Descending)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.clauseBox}>
                <label className={styles.clauseLabel}>LIMIT</label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  min={1}
                  max={1000}
                  className={styles.clauseInput}
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontVariantNumeric: "tabular-nums lining-nums",
                  }}
                />
              </div>
            </div>

            {/* Query Results Workspace */}
            {results && (
              <div className={styles.resultsCard}>
                <div className={styles.resultsHeader}>
                  <h3 className={styles.resultsTitle}>
                    Execution Results ({results.rows.length} rows)
                  </h3>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <Button
                      size="sm"
                      variant={viewMode === "table" ? "primary" : "outline"}
                      onClick={() => setViewMode("table")}
                    >
                      <TableIcon size={12} style={{ marginRight: "var(--space-1)" }} />
                      Table
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "chart" ? "primary" : "outline"}
                      onClick={() => setViewMode("chart")}
                    >
                      <BarChart3 size={12} style={{ marginRight: "var(--space-1)" }} />
                      Chart View
                    </Button>
                  </div>
                </div>

                {viewMode === "table" ? (
                  <DataTable
                    columns={results.columns.map((c) => ({
                      key: c,
                      header: c,
                      render: (row: any) => (
                        <span
                          style={{
                            fontFamily:
                              typeof row[c] === "number"
                                ? "var(--font-mono, monospace)"
                                : undefined,
                            fontVariantNumeric: "tabular-nums lining-nums",
                          }}
                        >
                          {String(row[c] ?? "—")}
                        </span>
                      ),
                    }))}
                    data={results.rows}
                    rowKey={(_row: any, i: number) => String(i)}
                  />
                ) : (
                  <div className={styles.chartContainer}>
                    {results.rows.slice(0, 12).map((row, i) => {
                      const numCol = results.columns.find(
                        (c) => typeof row[c] === "number",
                      );
                      const val = numCol ? (row[numCol] as number) : 10;
                      const maxVal = Math.max(
                        ...results.rows.map((r) => {
                          const nc = results.columns.find(
                            (c) => typeof r[c] === "number",
                          );
                          return nc ? (r[nc] as number) : 10;
                        }),
                        1,
                      );
                      const heightPercent = Math.max(10, Math.min(100, (val / maxVal) * 100));
                      return (
                        <div key={i} className={styles.chartBarItem}>
                          <span className={styles.barValue}>
                            {typeof val === "number" ? val.toLocaleString() : val}
                          </span>
                          <div
                            className={styles.barPillar}
                            style={{
                              height: `${heightPercent}%`,
                              background: "var(--color-brand, var(--color-primary))",
                              opacity: 0.7 + (i % 4) * 0.1,
                            }}
                          />
                          <span className={styles.barLabel}>
                            {String(
                              (results.columns[0] ? row[results.columns[0]] : null) ??
                                `#${i + 1}`,
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
