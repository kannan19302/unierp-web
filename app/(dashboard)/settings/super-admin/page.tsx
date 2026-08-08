"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner } from "@kannan19302/ui";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";
import {
  Building,
  Users,
  Activity,
  DollarSign,
  Server,
  Database,
  Cpu,
  Search,
} from "lucide-react";

interface AnalyticsData {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  mrr: number;
}

interface HealthData {
  uptime: string;
  dbLatency: number;
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  status: "healthy" | "degraded" | "down";
}

const MOCK_ANALYTICS: AnalyticsData = {
  totalTenants: 42,
  totalUsers: 1284,
  activeTenants: 38,
  mrr: 24500,
};

const MOCK_HEALTH: HealthData = {
  uptime: "14d 6h 32m",
  dbLatency: 4.2,
  memoryUsage: { rss: 256, heapUsed: 128, heapTotal: 512 },
  status: "healthy",
};

export default function SuperAdminDashboardPage() {
  const client = useApiClient();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cross-tenant search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchJustification, setSearchJustification] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchJustification.trim().length < 10) {
      setSearchError("Please provide a query and a detailed justification (min 10 chars).");
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await client.get<any[]>(`/platform/v1/super-admin/cross-tenant-search?q=${encodeURIComponent(searchQuery)}&justification=${encodeURIComponent(searchJustification)}`);
      setSearchResults(results);
    } catch (err: any) {
      setSearchError(err.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, healthData] = await Promise.all([
        client.get<AnalyticsData | { data: AnalyticsData }>(
          "/super-admin/analytics",
        ),
        client.get<HealthData | { data: HealthData }>("/super-admin/health"),
      ]);
      setAnalytics(
        "data" in analyticsData ? analyticsData.data : analyticsData,
      );
      setHealth("data" in healthData ? healthData.data : healthData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard";
      setError(message);
      setAnalytics(null);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "var(--color-green-600)";
      case "degraded":
        return "var(--color-yellow-600)";
      case "down":
        return "var(--color-red-600)";
      default:
        return "var(--color-gray-500)";
    }
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Super Admin Dashboard"
        description="System overview and health monitoring"
      />

      {error && <div className={`ui-card ${styles.error}`}>{error}</div>}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        {[
          {
            label: "Total Tenants",
            value: analytics?.totalTenants ?? 0,
            icon: Building,
          },
          {
            label: "Total Users",
            value: analytics?.totalUsers ?? 0,
            icon: Users,
          },
          {
            label: "Active Tenants",
            value: analytics?.activeTenants ?? 0,
            icon: Activity,
          },
          {
            label: "MRR",
            value: `$${(analytics?.mrr ?? 0).toLocaleString()}`,
            icon: DollarSign,
          },
        ].map((card) => (
          <Card key={card.label}>
            <div className={styles.kpiCard}>
              <div className={styles.kpiIcon}>
                <card.icon size={20} />
              </div>
              <div>
                <div className={styles.kpiLabel}>{card.label}</div>
                <div className={styles.kpiValue}>{card.value}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* System Health */}
      <Card>
        <div className={styles.healthCard}>
          <div className="ui-flex-between">
            <h3 className={styles.healthTitle}>System Health</h3>
            <span
              className={styles.healthStatus}
              style={{
                color: statusColor(health?.status || ""),
              }}
            >
              {health?.status || "Unknown"}
            </span>
          </div>

          <div className={styles.healthGrid}>
            <div className="ui-card p-3">
              <div className={styles.metricHeader}>
                <Server size={14} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Uptime</span>
              </div>
              <div className={styles.metricValue}>{health?.uptime || "—"}</div>
            </div>

            <div className="ui-card p-3">
              <div className={styles.metricHeader}>
                <Database size={14} className={styles.metricIcon} />
                <span className={styles.metricLabel}>DB Latency</span>
              </div>
              <div className={styles.metricValue}>
                {health?.dbLatency ?? "—"} ms
              </div>
            </div>

            <div className="ui-card p-3">
              <div className={styles.metricHeader}>
                <Cpu size={14} className={styles.metricIcon} />
                <span className={styles.metricLabel}>Memory (RSS)</span>
              </div>
              <div className={styles.metricValue}>
                {health?.memoryUsage?.rss ?? "—"} MB
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Global Support Search */}
      <Card>
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Search size={24} style={{ color: "var(--color-primary)" }} />
            <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Global Support Search (Cross-Tenant)</h3>
          </div>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "20px", fontSize: "0.9rem" }}>
            Search for an invoice, user, or tenant across the entire platform. 
            <strong> All queries are audited and require a justification.</strong>
          </p>

          <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="text"
                placeholder="Search ID, email, or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)" }}
                required
              />
              <input
                type="text"
                placeholder="Justification (e.g., Ticket #1234)"
                value={searchJustification}
                onChange={(e) => setSearchJustification(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--background)" }}
                required
                minLength={10}
              />
              <button
                type="submit"
                disabled={isSearching}
                style={{ padding: "10px 20px", borderRadius: "6px", background: "var(--color-primary)", color: "white", border: "none", cursor: isSearching ? "not-allowed" : "pointer" }}
              >
                {isSearching ? <Spinner size="sm" /> : "Search"}
              </button>
            </div>
            {searchError && <div style={{ color: "#ef4444", fontSize: "0.85rem" }}>{searchError}</div>}
          </form>

          {searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h4 style={{ margin: 0, fontSize: "1rem" }}>Results ({searchResults.length})</h4>
              {searchResults.map((res, i) => (
                <div key={i} style={{ padding: "12px", borderRadius: "6px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{res.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                      {res.type.toUpperCase()} • {res.subtitle}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", background: "var(--background)", padding: "4px 8px", borderRadius: "4px" }}>
                    Tenant: {res.tenantId}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
