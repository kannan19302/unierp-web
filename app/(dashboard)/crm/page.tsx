"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Target,
  Handshake,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Building2,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { PageHeader, Button, Card, DashboardChart, Spinner, KPICard } from "@kannan19302/ui";
import { RouteGuard, ListView } from "@kannan19302/framework";

interface DashboardData {
  kpis: {
    totalLeads: number;
    totalOpportunities: number;
    totalCustomers: number;
    pipelineValue: number;
  };
}

const PAGES = [
  { id: "executive-overview", label: "Executive Overview", icon: BarChart3 },
  { id: "pipeline-analytics", label: "Pipeline Analytics", icon: TrendingUp },
  { id: "customer-health", label: "Customer Health", icon: Users },
  { id: "forecast", label: "Forecast & Revenue", icon: DollarSign },
  { id: "activity-stream", label: "Activity Stream", icon: Activity },
];

function KPICardGroup({ data }: { data: DashboardData }) {
  const kpis = data?.kpis;
  return (
    <div className="ui-grid-4" style={{ marginBottom: "var(--space-4)" }}>
      <KPICard
        icon={<UserPlus className="w-5 h-5 text-primary" />}
        value={kpis?.totalLeads ?? 0}
        title="Total Leads"
      />
      <KPICard
        icon={<Target className="w-5 h-5 text-primary" />}
        value={kpis?.totalOpportunities ?? 0}
        title="Opportunities"
      />
      <KPICard
        icon={<Building2 className="w-5 h-5 text-primary" />}
        value={kpis?.totalCustomers ?? 0}
        title="Customers"
      />
      <KPICard
        icon={<DollarSign className="w-5 h-5 text-primary" />}
        value={`$${(kpis?.pipelineValue ?? 0).toLocaleString()}`}
        title="Pipeline Value"
      />
    </div>
  );
}

function NavCard({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="ui-card"
      style={{
        padding: "var(--space-4)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Icon size={24} />
      <span className="ui-heading-sm">{label}</span>
    </Link>
  );
}

export default function CrmPage() {
  const searchParams = useSearchParams();
  const activePage = searchParams.get("page") || "executive-overview";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
      const res = await fetch(`${baseUrl}/crm/dashboard`, {
        credentials: "include",
      });
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const currentPageIdx = PAGES.findIndex((p: any) => p.id === activePage);
  const prevPage = currentPageIdx > 0 ? PAGES[currentPageIdx - 1] : null;
  const nextPage =
    currentPageIdx < PAGES.length - 1 ? PAGES[currentPageIdx + 1] : null;

  return (
    <RouteGuard permission="crm.read">
      <div className="ui-card mb-4">
        <PageHeader
          title={
            <div className="flex items-center gap-2 text-[var(--color-warning)]">
              <div className="p-2 bg-[var(--color-warning-light)] rounded-lg">
                <Target size={20} />
              </div>
              <span className="text-[var(--color-text)]">
                Customer Relationship Management
              </span>
            </div>
          }
          description="Manage leads, opportunities, and customer relationships."
        />
      </div>
      <div style={{ position: "relative" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "var(--space-8)",
            }}
          >
            <Spinner />
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--space-4)",
              }}
            >
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                {PAGES.map((p: any) => (
                  <Link
                    key={p.id}
                    href={
                      p.id === "executive-overview"
                        ? "/crm"
                        : `/crm?page=${p.id}`
                    }
                    className="ui-btn"
                    style={{
                      background:
                        activePage === p.id
                          ? "var(--color-primary)"
                          : "transparent",
                      color:
                        activePage === p.id
                          ? "var(--color-text-inverse)"
                          : "inherit",
                      border: "1px solid var(--color-border)",
                      padding: "var(--space-1) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "var(--text-sm)",
                      textDecoration: "none",
                    }}
                  >
                    <p.icon size={14} style={{ marginRight: 4 }} />
                    {p.label}
                  </Link>
                ))}
              </div>
              <button
                onClick={fetchDashboard}
                className="ui-btn"
                style={{ padding: "var(--space-1) var(--space-3)" }}
              >
                <RefreshCw size={14} style={{ marginRight: 4 }} />
                Refresh
              </button>
            </div>

            {data && <KPICardGroup data={data} />}

            {/* Page Navigation Arrows */}
            {prevPage && (
              <Link
                href={
                  prevPage.id === "executive-overview"
                    ? "/crm"
                    : `/crm?page=${prevPage.id}`
                }
                style={{
                  position: "absolute",
                  left: -48,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "var(--color-warning)",
                  color: "var(--color-text)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  zIndex: 10,
                }}
              >
                <ChevronLeft size={20} />
              </Link>
            )}
            {nextPage && (
              <Link
                href={`/crm?page=${nextPage.id}`}
                style={{
                  position: "absolute",
                  right: -48,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "var(--color-warning)",
                  color: "var(--color-text)",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  zIndex: 10,
                }}
              >
                <ChevronRight size={20} />
              </Link>
            )}
          </>
        )}
      </div>
    </RouteGuard>
  );
}
