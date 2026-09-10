"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  RefreshCw,
  Search,
  Building2,
  TrendingDown,
  Play,
  FileSpreadsheet,
  X,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { ExportMenu, type ExportColumn } from "@/components/export/ExportMenu";
import { RowContextMenu, type ContextMenuAction } from "@/components/finance/RowContextMenu";
import { useFinanceTabs } from "@/components/shell/FinanceTabContext";
import { useFinanceScope } from "@/components/shell/FinanceScopeContext";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
import styles from "./page.module.css";

interface AssetItem {
  id: string;
  name: string;
  category: string;
  location: string;
  acquisitionDate: string;
  cost: number;
  bookValue: number;
  method: string;
  status: string;
}

interface AssetsSummaryData {
  kpis: {
    totalCost: number;
    accumulatedDepreciation: number;
    netBookValue: number;
  };
  assets: AssetItem[];
  selectedAsset: {
    assetId: string;
    name: string;
    cost: number;
    accumulatedDepreciation: number;
    bookValue: number;
    method: string;
    residualValue: number;
    monthlyDepreciation: number;
    inServiceDate: string;
    lifecycle: Array<{ stage: string; date: string; status: string }>;
    schedule: Array<{ month: string; depreciation: number; cumulative: number; bookValue: number }>;
  };
}

export default function FixedAssetsPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isDepreciating, setIsDepreciating] = useState(false);
  const [depSuccess, setDepSuccess] = useState(false);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    if (searchParams?.get("action") === "new") {
      setShowRegisterModal(true);
    }
  }, [searchParams]);
  const [showDepreciationModal, setShowDepreciationModal] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("COMPUTER_HARDWARE");
  const [assetLocation, setAssetLocation] = useState("");
  const [assetCost, setAssetCost] = useState("");
  const [assetAcquisitionDate, setAssetAcquisitionDate] = useState("");
  const [assetMethod, setAssetMethod] = useState("Straight Line (60m)");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Sorting & Row Context Menu
  const [sortField, setSortField] = useState<keyof AssetItem>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    row: AssetItem;
  } | null>(null);

  const { openAppTab } = useFinanceTabs();
  const scope = useFinanceScope();

  const { data, isLoading, isFetching, error, refetch } = useQuery<AssetsSummaryData>({
    queryKey: ["finance-assets-summary", scope.entity, scope.period],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/finance/assets/summary?entity=${encodeURIComponent(scope.entity)}&period=${encodeURIComponent(scope.period)}`
      );
      return (res?.data || res) as AssetsSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleRunDepreciation = async (period?: string) => {
    setIsDepreciating(true);
    try {
      await apiClient.post("/finance/assets/depreciate", { period: period || scope.period });
      setDepSuccess(true);
      setTimeout(() => {
        setDepSuccess(false);
        setShowDepreciationModal(false);
      }, 1200);
      await queryClient.invalidateQueries({ queryKey: ["finance-assets-summary"] });
    } catch (err) {
      console.error("Failed to run depreciation:", err);
    } finally {
      setIsDepreciating(false);
    }
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = Number(assetCost);
    if (!assetName.trim() || !cost || cost <= 0) return;
    setIsRegistering(true);
    try {
      await apiClient.post("/finance/assets/register", {
        name: assetName.trim(),
        category: assetCategory,
        location: assetLocation || undefined,
        acquisitionDate: assetAcquisitionDate || undefined,
        cost,
        method: assetMethod,
      });
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        setShowRegisterModal(false);
        setAssetName("");
        setAssetCost("");
        setAssetLocation("");
        setAssetAcquisitionDate("");
      }, 1200);
      await queryClient.invalidateQueries({ queryKey: ["finance-assets-summary"] });
    } catch (err) {
      console.error("Failed to register asset:", err);
    } finally {
      setIsRegistering(false);
    }
  };

  const filteredAssets = (data?.assets || []).filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q)
    );
  });

  const handleSort = (field: keyof AssetItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  const exportColumns: ExportColumn[] = [
    { header: "Asset ID", key: "id", type: "text" },
    { header: "Asset Name", key: "name", type: "text" },
    { header: "Category", key: "category", type: "text" },
    { header: "Location", key: "location", type: "text" },
    { header: "Acquisition Date", key: "acquisitionDate", type: "date" },
    { header: "Cost ($)", key: "cost", type: "currency" },
    { header: "Book Value ($)", key: "bookValue", type: "currency" },
    { header: "Status", key: "status", type: "text" },
  ];

  const exportData = sortedAssets.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category,
    location: a.location,
    acquisitionDate: a.acquisitionDate,
    cost: a.cost,
    bookValue: a.bookValue,
    status: a.status,
  }));

  const selectedAssetRow = selectedAssetId
    ? (data?.assets || []).find((a) => a.id === selectedAssetId)
    : null;

  const activeAsset = selectedAssetRow
    ? {
        assetId: selectedAssetRow.id,
        name: selectedAssetRow.name,
        cost: selectedAssetRow.cost,
        accumulatedDepreciation: selectedAssetRow.cost - selectedAssetRow.bookValue,
        bookValue: selectedAssetRow.bookValue,
        method: selectedAssetRow.method,
        residualValue: 0.0,
        monthlyDepreciation: Math.round(selectedAssetRow.cost / 60),
        inServiceDate: selectedAssetRow.acquisitionDate,
        lifecycle: [
          { stage: "Acquired", date: selectedAssetRow.acquisitionDate, status: "COMPLETE" },
          { stage: "In service", date: selectedAssetRow.acquisitionDate, status: "ACTIVE" },
          { stage: "Retired", date: "Estimated 2030", status: "PENDING" },
        ],
        schedule: [
          { month: "Jul 2026", depreciation: 2000.0, cumulative: selectedAssetRow.cost - selectedAssetRow.bookValue - 2000, bookValue: selectedAssetRow.bookValue + 2000 },
          { month: "Aug 2026", depreciation: 2000.0, cumulative: selectedAssetRow.cost - selectedAssetRow.bookValue, bookValue: selectedAssetRow.bookValue },
          { month: "Sep 2026 (Forecast)", depreciation: 2000.0, cumulative: selectedAssetRow.cost - selectedAssetRow.bookValue + 2000, bookValue: selectedAssetRow.bookValue - 2000 },
        ],
      }
    : data?.selectedAsset;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Fixed assets</h1>
          <p className={styles.subtitle}>
            Asset register, capital equipment lifecycle, and depreciation runs.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <div
              className={styles.liveDot}
              style={{
                background: error
                  ? "var(--color-danger)"
                  : isLoading
                  ? "var(--color-warning)"
                  : "var(--color-success)",
              }}
            />
            <span>
              {error
                ? "Connection error"
                : isLoading
                ? "Connecting..."
                : isFetching
                ? "Refreshing..."
                : "Live database"}
            </span>
            <button
              type="button"
              className={`${styles.refreshBtn} ${isFetching ? styles.refreshSpin : ""}`}
              onClick={() => refetch()}
              title="Refresh assets"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <ExportMenu
            filename="fixed-assets-register"
            title="Fixed Assets & Equipment Register"
            columns={exportColumns}
            data={exportData}
            buttonLabel="Export assets"
          />

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => setShowDepreciationModal(true)}
          >
            <Play size={14} />
            <span>Run depreciation</span>
          </button>

          <Link
            href="/finance/advanced/fixed-assets/assets/new"
            className={styles.btnPrimary}
            onClick={(e) => {
              e.preventDefault();
              openAppTab({
                href: "/finance/advanced/fixed-assets/assets/new",
                title: "New Capital Asset",
              });
            }}
          >
            <Plus size={14} />
            <span>New Asset</span>
          </Link>
        </div>
      </div>

      {error && (
        <FinanceErrorState
          error={error}
          onRetry={() => refetch()}
          moduleName="Fixed Assets & Capital Depreciation"
        />
      )}

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Cost</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              {scope.currency} {isLoading ? "..." : (data?.kpis?.totalCost != null ? (Number(data.kpis.totalCost) / 1e6).toFixed(2) + "M" : "0.00")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Accumulated depreciation</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue} style={{ color: "var(--color-warning)" }}>
              {scope.currency} {isLoading ? "..." : (data?.kpis?.accumulatedDepreciation != null ? (Number(data.kpis.accumulatedDepreciation) / 1e6).toFixed(2) + "M" : "0.00")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Net book value</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
              {scope.currency} {isLoading ? "..." : (data?.kpis?.netBookValue != null ? (Number(data.kpis.netBookValue) / 1e6).toFixed(2) + "M" : "0.00")}
            </span>
          </div>
        </div>
      </div>

      {/* Split Workspace */}
      <div className={styles.splitWorkspace}>
        {/* Left: Asset Register Table */}
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Capital Asset Register</span>
            <div className={styles.searchBox}>
              <Search size={13} color="var(--color-text-muted)" />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search asset, ID, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th} onClick={() => handleSort("id")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Asset ID</span>
                      {sortField === "id" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Asset Name</span>
                      {sortField === "name" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("location")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Location</span>
                      {sortField === "location" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th} onClick={() => handleSort("acquisitionDate")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>Acquired</span>
                      {sortField === "acquisitionDate" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} onClick={() => handleSort("cost")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                      <span>Cost</span>
                      {sortField === "cost" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.thRight}`} onClick={() => handleSort("bookValue")} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" }}>
                      <span>Book Value</span>
                      {sortField === "bookValue" ? (
                        sortAsc ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                      ) : (
                        <ArrowUpDown size={11} color="var(--color-text-muted)" />
                      )}
                    </div>
                  </th>
                  <th className={styles.th}>Method</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} style={{ padding: "var(--space-2)" }}>
                        <div className={styles.skeleton} />
                      </td>
                    </tr>
                  ))
                ) : (
                  sortedAssets.map((row) => {
                    const isSelected = (selectedAssetId || activeAsset?.assetId) === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedAssetId(row.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            row,
                          });
                        }}
                      >
                        <td className={styles.tdMono}>{row.id}</td>
                        <td className={styles.td} style={{ fontWeight: 500 }}>{row.name}</td>
                        <td className={styles.td}>{row.location}</td>
                        <td className={styles.td}>{row.acquisitionDate}</td>
                        <td className={styles.tdRight}>
                          ${row.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={styles.tdRight}>
                          ${row.bookValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={styles.td} style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>
                          {row.method}
                        </td>
                        <td className={styles.td}>
                          <span className={styles.badgeService}>In service</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Asset Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Asset Inspector</span>
            <span className={styles.assetIdBadge}>
              {selectedAssetId || activeAsset?.assetId || "No asset selected"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Asset Name</span>
            <span className={styles.inspectorFieldValue} style={{ fontWeight: 600 }}>
              {activeAsset?.name || "—"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Cost & Carrying Value</span>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-xs)" }}>
              <span>Cost: <strong className={styles.tdMono}>${(activeAsset?.cost ?? 0).toLocaleString()}</strong></span>
              <span>Net Book: <strong className={styles.tdMono} style={{ color: "var(--color-primary)" }}>${(activeAsset?.bookValue ?? 0).toLocaleString()}</strong></span>
            </div>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Depreciation Profile</span>
            <span className={styles.inspectorFieldValue} style={{ fontSize: "var(--text-2xs)" }}>
              {activeAsset ? `${activeAsset.method} • Monthly: $${activeAsset.monthlyDepreciation.toLocaleString()}` : "Select an asset to inspect its depreciation profile."}
            </span>
          </div>

          {/* Lifecycle */}
          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Lifecycle Status</span>
            <div className={styles.lifecycleRow}>
              <div className={styles.lifecycleStep}>
                <div className={styles.dotDone} />
                <span>Acquired</span>
              </div>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-subtle)" }} />
              <div className={styles.lifecycleStep}>
                <div className={styles.dotActive} />
                <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>In service</span>
              </div>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-subtle)" }} />
              <div className={styles.lifecycleStep}>
                <div className={styles.dotPending} />
                <span style={{ color: "var(--color-text-muted)" }}>Retired</span>
              </div>
            </div>
          </div>

          {/* Mini Schedule */}
          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Depreciation Schedule</span>
            <div className={styles.scheduleBox}>
              {(activeAsset?.schedule || []).map((s, i) => (
                <div key={i} className={styles.scheduleRow}>
                  <span>{s.month}</span>
                  <span className={styles.tdMono}>${s.depreciation} (NBV ${s.bookValue.toLocaleString()})</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.inspectorActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => setShowDepreciationModal(true)}
            >
              <Play size={13} />
              <span>Review depreciation run</span>
            </button>
          </div>
        </div>
      </div>

      {/* Register Asset Modal */}
      {showRegisterModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRegisterModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Register New Capital Asset</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowRegisterModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleRegisterAsset}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Asset Description / Model</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Dell PowerEdge R750 Rack Server"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formSelect}
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                  >
                    <option value="COMPUTER_HARDWARE">Computer & Network Hardware</option>
                    <option value="MACHINERY_EQUIPMENT">Machinery & Heavy Equipment</option>
                    <option value="FURNITURE_FIXTURES">Furniture & Fixtures</option>
                    <option value="LEASEHOLD_IMPROVEMENTS">Leasehold Improvements</option>
                    <option value="SOFTWARE_INTANGIBLE">Capitalized Software (Intangible)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Facility / custodian location</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    placeholder="e.g. Head Office — Floor 3"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="asset-acq-date">In-service / acquisition date</label>
                  <input
                    id="asset-acq-date"
                    type="date"
                    className={styles.formInput}
                    value={assetAcquisitionDate}
                    onChange={(e) => setAssetAcquisitionDate(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="asset-cost">Acquisition cost (USD) <span aria-label="required">*</span></label>
                  <input
                    id="asset-cost"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className={styles.formInput}
                    value={assetCost}
                    onChange={(e) => setAssetCost(e.target.value)}
                    required
                    placeholder="Enter acquisition cost in USD"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Depreciation Convention</label>
                  <select
                    className={styles.formSelect}
                    value={assetMethod}
                    onChange={(e) => setAssetMethod(e.target.value)}
                  >
                    <option value="Straight Line (60m)">Straight Line (60 Months / 5 Years)</option>
                    <option value="Straight Line (36m)">Straight Line (36 Months / 3 Years)</option>
                    <option value="Double Declining Balance">Double Declining Balance (200% DDB)</option>
                    <option value="MACRS 5-Year Property">MACRS 5-Year Half-Year Convention</option>
                  </select>
                </div>

                {registerSuccess && (
                  <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <CheckCircle2 size={14} />
                    <span>Asset registered and placed into active in-service register!</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowRegisterModal(false)}
                  disabled={isRegistering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isRegistering}
                >
                  {isRegistering ? "Registering..." : "Capitalize Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Depreciation Run Modal */}
      {showDepreciationModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDepreciationModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Review Monthly Depreciation Run</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowDepreciationModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", backgroundColor: "var(--color-bg-ground)", padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Accounting Period:</span>
                  <span className={styles.tdMono} style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>August 2026 (Open)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Eligible Assets:</span>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{data?.assets?.length || 5} Capital Assets</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Calculated Amortization:</span>
                  <span className={styles.tdMono} style={{ fontWeight: 600, color: "var(--color-warning)" }}>USD 48,250.00</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Posting Rule:</span>
                  <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>DR 6100 Depreciation Expense / CR 1700 Accum. Depreciation</span>
                </div>
              </div>

              {depSuccess && (
                <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                  <CheckCircle2 size={14} />
                  <span>Depreciation run completed and journal posted to General Ledger!</span>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setShowDepreciationModal(false)}
                disabled={isDepreciating}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={isDepreciating}
                onClick={() => handleRunDepreciation()}
              >
                {isDepreciating ? "Posting Journal..." : "Post Depreciation Run"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Row Context Menu */}
      {contextMenu && (
        <RowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          recordId={contextMenu.row.id}
          recordTitle={`${contextMenu.row.name} ($${contextMenu.row.cost.toLocaleString()})`}
          recordData={contextMenu.row}
          onOpenInTab={() => {
            openAppTab({
              href: `/finance/advanced/fixed-assets?asset=${contextMenu.row.id}`,
              title: contextMenu.row.name,
            });
          }}
          customActions={[
            {
              label: "View Depreciation Schedule",
              icon: TrendingDown,
              onClick: () => {
                setSelectedAssetId(contextMenu.row.id);
              },
            },
            {
              label: "Post Period Depreciation",
              icon: Play,
              onClick: () => {
                setSelectedAssetId(contextMenu.row.id);
                setShowDepreciationModal(true);
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
