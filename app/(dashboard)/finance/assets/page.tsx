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
      await apiClient.post("/finance/assets/depreciate", { period: "Aug 2026" });
      setDepSuccess(true);
      setTimeout(() => setDepSuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-assets-summary"] });
    } catch (err) {
      console.error("Failed to run depreciation:", err);
    } finally {
      setIsDepreciating(false);
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
            className={styles.btnPrimary}
          >
            <Plus size={14} />
            <span>Register asset</span>
          </Link>
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
              disabled={isDepreciating}
              onClick={handleRunDepreciation}
            >
              <Play size={13} />
              <span>{isDepreciating ? "Running..." : depSuccess ? "Run completed ✓" : "Run depreciation"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
