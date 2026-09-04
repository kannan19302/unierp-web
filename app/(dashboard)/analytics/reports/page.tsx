"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  DataTable,
  PageHeader,
  Button,
  Spinner,
  useToast,
  Badge,
  Card,
} from "@kannan19302/ui";
import {
  FileText,
  Plus,
  Trash2,
  Play,
  Download,
  Search,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface ReportItem {
  id: string;
  name?: string;
  reportName?: string;
  type?: string;
  source?: string;
  category?: string;
  description?: string | null;
  createdAt: string;
  query?: any;
}

interface ReportPreviewData {
  reportId: string;
  reportName: string;
  pivotData?: Array<{
    row: string;
    column: string;
    value: number;
    count: number;
  }>;
}

export default function ReportsPage() {
  const client = useApiClient();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [runningReportId, setRunningReportId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<ReportPreviewData | null>(null);

  // Form state
  const [newReportName, setNewReportName] = useState("");
  const [newCategory, setNewCategory] = useState("FINANCIAL");
  const [newSource, setNewSource] = useState("INVOICE");
  const [newDescription, setNewDescription] = useState("");

  const toast = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      let data: any = await client.get("/analytics/reports").catch(() => null);
      if (!data || (Array.isArray(data) && data.length === 0)) {
        data = await client.get("/analytics/saved-filters").catch(() => []);
      }
      const list = Array.isArray(data) ? data : data?.data || [];
      setReports(list);
    } catch (err) {
      toast.error(
        "Failed to load reports",
        err instanceof Error ? err.message : "Error fetching reports",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName.trim()) {
      toast.error("Validation Error", "Report name is required.");
      return;
    }

    try {
      setCreating(true);
      await client.post("/analytics/reports", {
        name: newReportName.trim(),
        type: newCategory,
        description: newDescription.trim() || undefined,
        query: { source: newSource, groupBy: "Quarter" },
      });
      toast.success(
        "Report Created",
        `Report "${newReportName}" created successfully.`,
      );
      setIsModalOpen(false);
      setNewReportName("");
      setNewDescription("");
      fetchReports();
    } catch (err) {
      toast.error(
        "Failed to create report",
        err instanceof Error ? err.message : "Error creating report",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await client.delete(`/analytics/reports/${id}`).catch(async () => {
        await client.delete(`/analytics/saved-filters/${id}`);
      });
      toast.success("Report Deleted", `Report "${name}" removed successfully.`);
      if (activePreview?.reportId === id) {
        setActivePreview(null);
      }
      fetchReports();
    } catch (err) {
      toast.error(
        "Delete Failed",
        err instanceof Error ? err.message : "Error deleting report",
      );
    }
  };

  const handleRunReport = async (report: ReportItem) => {
    const rId = report.id;
    const rName = report.name || report.reportName || "Report";
    try {
      setRunningReportId(rId);
      const res = await client.post<{ pivotData?: any[] }>(
        `/analytics/reports/${rId}/pivot`,
        {
          rowFields: ["Quarter"],
          colFields: ["Status"],
          aggregations: ["SUM(totalAmount)"],
        },
      );
      setActivePreview({
        reportId: rId,
        reportName: rName,
        pivotData: res.pivotData || [],
      });
      toast.success("Report Generated", `Calculated dynamic matrix for "${rName}".`);
    } catch (err) {
      toast.error(
        "Execution Error",
        err instanceof Error ? err.message : "Failed to run report matrix query",
      );
    } finally {
      setRunningReportId(null);
    }
  };

  const handleExport = async (dataset = "invoices") => {
    try {
      const res = await client.get<{ filename?: string; content?: string }>(
        `/analytics/export/${dataset}`,
      );
      if (res.content) {
        const blob = new Blob([res.content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.filename || `${dataset}-export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Export Complete", `Downloaded ${res.filename || "export.csv"}`);
      }
    } catch (err) {
      toast.error(
        "Export Failed",
        err instanceof Error ? err.message : "Failed to export dataset",
      );
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const name = (r.name || r.reportName || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      const cat = (r.category || r.type || "").toUpperCase();
      const matchesSearch =
        !searchQuery ||
        name.includes(searchQuery.toLowerCase()) ||
        desc.includes(searchQuery.toLowerCase());
      const matchesCat =
        selectedCategory === "ALL" ||
        cat.includes(selectedCategory) ||
        (selectedCategory === "FINANCIAL" && cat.includes("FINANCE"));
      return matchesSearch && matchesCat;
    });
  }, [reports, searchQuery, selectedCategory]);

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
        title="Enterprise Reports & Query Analytics"
        description="Build, execute, and export multi-dimensional tabular and pivot reports across business entities."
        actions={
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("invoices")}
            >
              <Download size={14} style={{ marginRight: "var(--space-1-5)" }} />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus size={14} style={{ marginRight: "var(--space-1-5)" }} />
              New Report
            </Button>
          </div>
        }
      />

      <div className={styles.topBar}>
        <div className={styles.searchAndFilters}>
          <input
            type="text"
            placeholder="Search reports by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.filterChips}>
            {["ALL", "FINANCIAL", "SALES", "INVENTORY", "OPERATIONS"].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`${styles.filterBtn} ${selectedCategory === cat ? styles.filterBtnActive : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Report Preview Drawer / Card */}
      {activePreview && (
        <Card className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h3 className={styles.previewTitle}>
              <Layers size={18} style={{ color: "var(--color-brand, var(--color-primary))" }} />
              Live Execution Preview: {activePreview.reportName}
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setActivePreview(null)}
            >
              <X size={14} />
            </Button>
          </div>

          {activePreview.pivotData && activePreview.pivotData.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: "row",
                  header: "Period / Group",
                  render: (p: any) => (
                    <span style={{ fontWeight: "var(--weight-semibold)" }}>
                      {p.row}
                    </span>
                  ),
                },
                {
                  key: "column",
                  header: "Dimension / Status",
                  render: (p: any) => <Badge variant="info">{p.column}</Badge>,
                },
                {
                  key: "value",
                  header: "Aggregate Value",
                  render: (p: any) => (
                    <span
                      style={{
                        fontFamily: "var(--font-mono, monospace)",
                        fontVariantNumeric: "tabular-nums lining-nums",
                        fontWeight: "var(--weight-bold)",
                      }}
                    >
                      ${Number(p.value).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: "count",
                  header: "Record Count",
                  render: (p: any) => (
                    <span
                      style={{
                        color: "var(--color-text-secondary)",
                        fontFamily: "var(--font-mono, monospace)",
                        fontVariantNumeric: "tabular-nums lining-nums",
                      }}
                    >
                      {p.count} records
                    </span>
                  ),
                },
              ]}
              data={activePreview.pivotData}
              rowKey={(_: any, idx: number) => String(idx)}
            />
          ) : (
            <p className={styles.emptyState}>
              No database records matching this report's dimensions.
            </p>
          )}
        </Card>
      )}

      {/* Reports Catalog Table */}
      <Card className={styles.cardSection}>
        <h3 className={styles.cardTitle}>Report Definitions Catalog</h3>
        {filteredReports.length === 0 ? (
          <p className={styles.emptyState}>
            No reports found matching your criteria. Create a new report above to begin.
          </p>
        ) : (
          <DataTable
            columns={[
              {
                key: "name",
                header: "Report Title",
                render: (r: ReportItem) => (
                  <span style={{ fontWeight: "var(--weight-semibold)" }}>
                    {r.name || r.reportName || "Untitled Report"}
                  </span>
                ),
              },
              {
                key: "category",
                header: "Category",
                render: (r: ReportItem) => (
                  <Badge variant="info">
                    {r.category || r.type || "GENERAL"}
                  </Badge>
                ),
              },
              {
                key: "source",
                header: "Entity Domain",
                render: (r: ReportItem) => (
                  <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                    {r.source || r.query?.source || "TRANSACTIONS"}
                  </span>
                ),
              },
              {
                key: "description",
                header: "Description",
                render: (r: ReportItem) => (
                  <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>
                    {r.description || "System standard report"}
                  </span>
                ),
              },
              {
                key: "createdAt",
                header: "Created Date",
                render: (r: ReportItem) => (
                  <span
                    style={{
                      color: "var(--color-text-secondary)",
                      fontFamily: "var(--font-mono, monospace)",
                      fontVariantNumeric: "tabular-nums lining-nums",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (r: ReportItem) => {
                  const rName = r.name || r.reportName || "Report";
                  return (
                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunReport(r)}
                        disabled={runningReportId === r.id}
                      >
                        <Play
                          size={12}
                          style={{
                            marginRight: "var(--space-1)",
                            animation:
                              runningReportId === r.id
                                ? "spin 1s linear infinite"
                                : undefined,
                          }}
                        />
                        {runningReportId === r.id ? "Running..." : "Run"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(r.id, rName)}
                      >
                        <Trash2
                          size={13}
                          style={{ color: "var(--color-danger)" }}
                        />
                      </Button>
                    </div>
                  );
                },
              },
            ]}
            data={filteredReports}
            rowKey={(r: ReportItem) => r.id}
          />
        )}
      </Card>

      {/* New Report Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Enterprise Report</h3>
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
                <label className={styles.fieldLabel}>Report Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Executive Sales Revenue Matrix..."
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Report Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="FINANCIAL">Financial & Ledger</option>
                  <option value="SALES">Sales & CPQ</option>
                  <option value="INVENTORY">Inventory & Logistics</option>
                  <option value="OPERATIONS">Operations & Tasks</option>
                  <option value="HR">Human Resources</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Source Entity</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className={styles.formInput}
                >
                  <option value="INVOICE">Invoices & Receivables</option>
                  <option value="SALES_ORDER">Sales Orders</option>
                  <option value="PURCHASE_ORDER">Purchase Orders</option>
                  <option value="PRODUCT">Products & Inventory</option>
                  <option value="EMPLOYEE">Staff & Workforce</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.fieldLabel}>Description (Optional)</label>
                <textarea
                  placeholder="Brief description of this report definition..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
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
                <Button type="submit" size="sm" disabled={creating}>
                  {creating ? "Creating..." : "Save Report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
