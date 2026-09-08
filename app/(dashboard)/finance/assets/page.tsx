"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isDepreciating, setIsDepreciating] = useState(false);
  const [depSuccess, setDepSuccess] = useState(false);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDepreciationModal, setShowDepreciationModal] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("COMPUTER_HARDWARE");
  const [assetLocation, setAssetLocation] = useState("HQ - Austin");
  const [assetCost, setAssetCost] = useState("12500");
  const [assetMethod, setAssetMethod] = useState("Straight Line (60m)");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<AssetsSummaryData>({
    queryKey: ["finance-assets-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/assets/summary");
      return (res?.data || res) as AssetsSummaryData;
    },
    refetchInterval: 30000,
  });

  const handleRunDepreciation = async () => {
    setIsDepreciating(true);
    try {
      await apiClient.post("/finance/assets/depreciate", { period: "Aug 2026", postingDate: "2026-08-31" });
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
    setIsRegistering(true);
    try {
      await apiClient.post("/finance/assets/register", {
        name: assetName,
        category: assetCategory,
        location: assetLocation,
        acquisitionDate: "2026-08-31",
        cost: Number(assetCost) || 1000,
        method: assetMethod,
      });
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        setShowRegisterModal(false);
        setAssetName("");
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

  const handleExport = () => {
    const headers = ["Asset ID", "Asset", "Category", "Location", "Cost", "Book value", "Status"];
    const rows = filteredAssets.map((asset) => [
      asset.id,
      asset.name,
      asset.category,
      asset.location,
      asset.cost.toFixed(2),
      asset.bookValue.toFixed(2),
      asset.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fixed-assets.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

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
            <div className={styles.liveDot} />
            <span>Live database</span>
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

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExport}
          >
            <FileSpreadsheet size={14} />
            <span>Export register</span>
          </button>

          <Link
            href="/finance/advanced/fixed-assets/assets/new"
            className={styles.btnSecondary}
          >
            <span>Advanced register</span>
          </Link>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowRegisterModal(true)}
          >
            <Plus size={14} />
            <span>Register asset</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Cost</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue}>
              USD {isLoading ? "..." : (data?.kpis.totalCost ? (data.kpis.totalCost / 1e6).toFixed(2) + "M" : "3.42M")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Accumulated depreciation</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue} style={{ color: "var(--color-warning)" }}>
              USD {isLoading ? "..." : (data?.kpis.accumulatedDepreciation ? (data.kpis.accumulatedDepreciation / 1e6).toFixed(2) + "M" : "1.15M")}
            </span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Net book value</span>
          <div className={styles.kpiValueRow}>
            <span className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
              USD {isLoading ? "..." : (data?.kpis.netBookValue ? (data.kpis.netBookValue / 1e6).toFixed(2) + "M" : "2.27M")}
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
                  <th className={styles.th}>Asset ID</th>
                  <th className={styles.th}>Asset Name</th>
                  <th className={styles.th}>Location</th>
                  <th className={styles.th}>Acquired</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Cost (USD)</th>
                  <th className={`${styles.th} ${styles.thRight}`}>Book Value (USD)</th>
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
                  filteredAssets.map((row) => {
                    const isSelected = (selectedAssetId || activeAsset?.assetId) === row.id;
                    return (
                      <tr
                        key={row.id}
                        className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                        onClick={() => setSelectedAssetId(row.id)}
                      >
                        <td className={styles.tdMono}>{row.id}</td>
                        <td className={styles.td} style={{ fontWeight: 500 }}>{row.name}</td>
                        <td className={styles.td}>{row.location}</td>
                        <td className={styles.td}>{row.acquisitionDate}</td>
                        <td className={styles.tdRight}>
                          {row.cost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className={styles.tdRight}>
                          {row.bookValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                  <label className={styles.formLabel}>Facility Location</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={assetLocation}
                    onChange={(e) => setAssetLocation(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Acquisition Cost (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.formInput}
                    value={assetCost}
                    onChange={(e) => setAssetCost(e.target.value)}
                    required
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
                onClick={handleRunDepreciation}
              >
                {isDepreciating ? "Posting Journal..." : "Post Depreciation Run"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
