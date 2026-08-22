"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Badge } from "@kannan19302/ui";
import {
  TrendingUp,
  Users,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  PlusCircle,
  FileText,
  BarChart2,
  PieChart,
  Hash,
  Table as TableIcon,
  LayoutDashboard,
  Layers,
  Database,
  Building2,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery } from "../../../src/lib/hooks/useApi";
import { allApplications, KERNEL_APP_IDS } from "@/navigation";
import GridLayout, { useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";
import styles from "./page.module.css";

const DASHBOARD_TABS: SubTab[] = [
  {
    id: "global",
    label: "Global Enterprise Overview",
    href: "/dashboard?subtab=global",
    icon: Building2,
  },
  {
    id: "personal",
    label: "Personal Dashboard",
    href: "/dashboard?subtab=personal",
    icon: LayoutDashboard,
  },
];

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

interface DashboardPayload {
  layout?: unknown;
  widgets?: unknown;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  description,
  icon: Icon,
}: any) => {
  return (
    <Card hover padding="md" className="ui-stack-3">
      <div className="ui-flex-between ui-items-start">
        <span className={styles.metricTitle}>{title}</span>
        <div className={styles.metricIcon}>
          <Icon size={18} />
        </div>
      </div>

      <div>
        <h3 className={styles.metricValue}>{value}</h3>
        <div className={styles.metricChangeRow}>
          <span
            className={`${styles.metricTrend} ${trend === "up" ? styles.metricTrendUp : styles.metricTrendDown}`}
          >
            {trend === "up" ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}
            {change}
          </span>
          <span className="ui-text-caption ui-text-tertiary">
            {description}
          </span>
        </div>
      </div>
    </Card>
  );
};

function DashboardContent() {
  const client = useApiClient();
  const searchParams = useSearchParams();
  const dashboardId = searchParams?.get("dashboardId");
  const router = useRouter();
  const { width, containerRef, mounted } = useContainerWidth();
  const [user, setUser] = useState<{
    firstName: string;
    lastName: string;
    tenantId?: string;
  } | null>(null);

  const [customDashboard, setCustomDashboard] = useState<any>(null);
  const [customLayout, setCustomLayout] = useState<any[]>([]);
  const [customWidgets, setCustomWidgets] = useState<any[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  // Personal Dashboard Grid Layout
  const defaultPersonalLayout = [
    { i: "welcome", x: 0, y: 0, w: 12, h: 2, static: true },
    { i: "kpis", x: 0, y: 2, w: 12, h: 4 },
    { i: "quick-access", x: 0, y: 6, w: 12, h: 8 },
    { i: "activity", x: 0, y: 14, w: 6, h: 6 },
    { i: "approvals", x: 6, y: 14, w: 6, h: 6 },
    { i: "analytics", x: 0, y: 20, w: 12, h: 6 },
  ];
  const [personalLayout, setPersonalLayout] = useState<any[]>(
    defaultPersonalLayout,
  );
  const [isEditingGrid, setIsEditingGrid] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("unerp.personal_dashboard_layout");
    if (saved) {
      try {
        setPersonalLayout(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const onLayoutChange = (layout: Layout) => {
    setPersonalLayout([...layout]);
    localStorage.setItem(
      "unerp.personal_dashboard_layout",
      JSON.stringify(layout),
    );
  };

  // Global enterprise dashboard states
  const activeTab: "global" | "personal" =
    searchParams?.get("subtab") === "personal" ? "personal" : "global";
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

  useEffect(() => {
    let mounted = true;
    client
      .get<{ firstName: string; lastName: string; tenant?: { id: string } }>(
        "/auth/me",
      )
      .then((profile: any) => {
        if (mounted)
          setUser({
            firstName: profile.firstName,
            lastName: profile.lastName,
            tenantId: profile.tenant?.id,
          });
      })
      .catch(() => {
        // RouteGuard and the dashboard layout handle unauthenticated sessions.
      });
      
    client.get<string[]>("/saas/installed-apps")
      .then((apps: any) => {
        if (mounted && Array.isArray(apps)) {
          setInstalledApps(apps);
        }
      })
      .catch(() => {});
      
    return () => {
      mounted = false;
    };
  }, [client]);

  useEffect(() => {
    if (dashboardId) {
      setLoadingCustom(true);
      client
        .get<DashboardPayload>(`/builder/dashboards/${dashboardId}`)
        .then((data: any) => {
          setCustomDashboard(data);
          if (data.layout)
            setCustomLayout(
              typeof data.layout === "string"
                ? JSON.parse(data.layout)
                : data.layout,
            );
          if (data.widgets)
            setCustomWidgets(
              typeof data.widgets === "string"
                ? JSON.parse(data.widgets)
                : data.widgets,
            );
        })
        .catch(console.error)
        .finally(() => setLoadingCustom(false));
    }
  }, [dashboardId, client]);

  useEffect(() => {
    if (activeTab === "global" && !customDashboard) {
      setLoadingGlobal(true);
      client
        .get<Record<string, unknown>>("/builder/dashboards/global-stats")
        .then((data: any) => {
          setGlobalStats(data);
        })
        .catch(console.error)
        .finally(() => setLoadingGlobal(false));
    }
  }, [activeTab, customDashboard, client]);

  // Live data: invoice totals, employee count, stock alerts
  const { data: invoiceData } = useApiQuery<{ total: number; data: any[] }>(
    ["dashboard", "invoices"],
    "/finance/invoices?limit=1",
    { staleTime: 60_000 },
  );
  const { data: employeeData } = useApiQuery<{ total: number }>(
    ["dashboard", "employees"],
    "/hr/employees?limit=1",
    { staleTime: 60_000 },
  );
  const { data: activityData } = useApiQuery<{ data: any[] }>(
    ["dashboard", "activity"],
    "/admin/activity-feed?limit=5",
    { staleTime: 30_000 },
  );

  const invoiceCount = invoiceData?.total ?? 0;
  const employeeCount = employeeData?.total ?? 0;

  const metrics: MetricCardProps[] = [
    {
      title: "Total Revenue",
      value: globalStats?.metrics?.totalRevenue
        ? `$${Number(globalStats.metrics.totalRevenue).toLocaleString()}`
        : invoiceCount > 0
          ? `${invoiceCount} invoices`
          : "$0",
      change: globalStats?.metrics?.revenueChange || "--",
      trend: "up",
      description: "vs last month",
      icon: TrendingUp,
    },
    {
      title: "Active Employees",
      value: String(globalStats?.metrics?.activeEmployees ?? employeeCount),
      change: "--",
      trend: "up",
      description: "current headcount",
      icon: Users,
    },
    {
      title: "Pending Invoices",
      value: String(globalStats?.metrics?.pendingInvoices ?? invoiceCount),
      change: "--",
      trend: "down",
      description: "awaiting payment",
      icon: Clock,
    },
    {
      title: "Stock Alerts",
      value: String(globalStats?.metrics?.stockAlerts ?? 0),
      change: "--",
      trend: "up",
      description: "items low stock",
      icon: AlertCircle,
    },
  ];

  const recentLogs = (activityData?.data || [])
    .slice(0, 5)
    .map((log: any, idx: number) => ({
      id: log.id || String(idx),
      action: log.action || log.description || "Activity",
      user: log.userName || log.userId || "System",
      time: log.createdAt ? new Date(log.createdAt).toLocaleString() : "Recent",
      status: log.status || "SUCCESS",
    }));

  const globalMetrics = globalStats?.metrics || {
    totalRevenue: 0,
    activeEmployees: employeeCount,
    totalCustomApps: 0,
    totalCustomRecords: 0,
    pendingInvoices: invoiceCount,
    stockAlerts: 0,
    totalLeads: 0,
  };

  return (
    <RouteGuard permission="dashboard.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title={
            customDashboard
              ? customDashboard.name
              : activeTab === "global"
                ? "Global Enterprise Dashboard"
                : `Welcome back, ${user ? user.firstName : "Admin"}`
          }
          description={
            customDashboard
              ? customDashboard.description || "Custom Builder Dashboard"
              : activeTab === "global"
                ? "Overview of all custom applications and global company performance metrics."
                : "Here is an overview of your organization's operations today."
          }
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: customDashboard ? customDashboard.name : "Dashboard" },
          ]}
        />

        {!customDashboard && <SubTabBar tabs={DASHBOARD_TABS} />}

        {loadingCustom ? (
          <div className={styles.loading}>Loading dashboard...</div>
        ) : customDashboard ? (
          <div ref={containerRef} className={styles.customDashboard}>
            {mounted && (
              <GridLayout
                className="layout"
                layout={customLayout}
                // @ts-ignore
                cols={12}
                rowHeight={40}
                width={width || 1200}
                isDraggable={false}
                isResizable={false}
                margin={[16, 16]}
              >
                {customLayout.map((l: any) => {
                  const widget = customWidgets.find((w: any) => w.id === l.i);
                  if (!widget) return <div key={l.i}></div>;

                  const typeIcons: Record<string, any> = {
                    kpi: Hash,
                    bar: BarChart2,
                    line: TrendingUp,
                    pie: PieChart,
                    table: TableIcon,
                  };
                  const typeColors: Record<string, string> = {
                    kpi: "var(--color-success)",
                    bar: "var(--color-info)",
                    line: "var(--color-warning)",
                    pie: "var(--color-primary)",
                    table: "var(--color-text-secondary)",
                  };
                  const Icon = typeIcons[widget.type] || LayoutDashboard;
                  const color =
                    typeColors[widget.type] || "var(--color-text-secondary)";

                  return (
                    <div key={l.i} className={styles.widget}>
                      <div className={styles.widgetHeader}>
                        <Icon size={14} color={color} />
                        <span className={styles.widgetTitle}>
                          {widget.title}
                        </span>
                      </div>
                      <div className={styles.widgetContent}>
                        {widget.type === "kpi" && (
                          <span className={styles.widgetKpi}>--</span>
                        )}
                        {widget.type !== "kpi" && (
                          <BarChart2 size={32} opacity={0.5} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </GridLayout>
            )}
          </div>
        ) : activeTab === "global" ? (
          loadingGlobal ? (
            <div className={styles.loading}>
              Loading enterprise performance stats...
            </div>
          ) : (
            <>
              {/* Global enterprise summary cards */}
              <div className={styles.metricsGrid}>
                <MetricCard
                  title="Company Paid Revenue"
                  value={`$${Number(globalMetrics.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  change={`${globalMetrics.pendingInvoices} unpaid`}
                  trend={globalMetrics.totalRevenue > 0 ? "up" : "down"}
                  description="Invoices amount paid"
                  icon={TrendingUp}
                />
                <MetricCard
                  title="Active Workforce"
                  value={String(globalMetrics.activeEmployees || 0)}
                  change="Employees"
                  trend="up"
                  description="Active status records"
                  icon={Users}
                />
                <MetricCard
                  title="CRM Leads"
                  value={String(globalMetrics.totalLeads || 0)}
                  change="Leads"
                  trend="up"
                  description="In CRM sales pipeline"
                  icon={ArrowUpRight}
                />
                <MetricCard
                  title="Low Stock Alerts"
                  value={String(globalMetrics.stockAlerts || 0)}
                  change="Items low stock"
                  trend="down"
                  description="Requires reordering"
                  icon={AlertCircle}
                />
                <MetricCard
                  title="Custom Applications"
                  value={String(globalMetrics.totalCustomApps || 0)}
                  change={`${globalMetrics.totalCustomRecords} submissions`}
                  trend="up"
                  description="Visual Apps Deployed"
                  icon={LayoutDashboard}
                />
              </div>

              {/* Performance charts */}
              <div className={styles.contentGrid}>
                <Card padding="lg">
                  <h3 className={styles.sectionTitle}>
                    Submissions Distribution by Custom App
                  </h3>
                  {!globalStats?.charts?.submissionsByApp ||
                  globalStats.charts.submissionsByApp.length === 0 ? (
                    <div className={styles.emptyChart}>
                      No custom app records submitted yet.
                    </div>
                  ) : (
                    <div className={styles.distribution}>
                      <div className={styles.donut}>
                        <div className={styles.donutCenter}>
                          <span className={styles.donutValue}>
                            {globalMetrics.totalCustomRecords || 0}
                          </span>
                          <span className={styles.donutLabel}>Submissions</span>
                        </div>
                      </div>
                      <div className={styles.legend}>
                        {globalStats.charts.submissionsByApp
                          .slice(0, 4)
                          .map((app: any, idx: number) => {
                            const pct =
                              globalMetrics.totalCustomRecords > 0
                                ? Math.round(
                                    (app.count /
                                      globalMetrics.totalCustomRecords) *
                                      100,
                                  )
                                : 0;
                            return (
                              <div
                                key={app.appName}
                                className={styles.legendItem}
                              >
                                <div
                                  className={`${styles.legendDot} ${styles[`legendDot${idx % 4}`]}`}
                                />
                                <span>
                                  {app.appName} ({pct}%)
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </Card>

                <Card padding="lg">
                  <h3 className={styles.sectionTitle}>
                    Monthly Custom Record Submissions
                  </h3>
                  <div className={styles.monthlyChart}>
                    <div className={styles.bars}>
                      {(globalStats?.charts?.monthlySubmissionsTrend || []).map(
                        (d: any, i: number) => {
                          const maxVal = Math.max(
                            ...(
                              globalStats?.charts?.monthlySubmissionsTrend || []
                            ).map((x: any) => x.count),
                            1,
                          );
                          return (
                            <div key={i} className={styles.barGroup}>
                              <div className={styles.barTooltip}>
                                {d.count} records
                              </div>
                              <div
                                className={styles.bar}
                                style={{
                                  height: `${Math.max(4, (d.count / maxVal) * 90)}%`,
                                }}
                              />
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div className={styles.monthLabels}>
                      {(globalStats?.charts?.monthlySubmissionsTrend || []).map(
                        (d: any, i: number) => (
                          <span key={i} className={styles.monthLabel}>
                            {d.month}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Custom apps catalog */}
              <Card padding="lg">
                <div className={`ui-flex-between ${styles.titleRow}`}>
                  <h3 className={styles.sectionTitleNoMargin}>
                    Custom Applications Workspace
                  </h3>
                  <span
                    className={`ui-badge ui-badge-primary ${styles.appsBadge}`}
                  >
                    {globalStats?.customApps?.length || 0} Apps Deployed
                  </span>
                </div>

                {!globalStats?.customApps ||
                globalStats.customApps.length === 0 ? (
                  <div className={styles.emptyCatalog}>
                    No custom applications have been created yet. Navigate to
                    App Studio to create one!
                  </div>
                ) : (
                  <div className={styles.appsGrid}>
                    {globalStats.customApps.map((app: any) => (
                      <div
                        key={app.id}
                        className={styles.appCard}
                        onClick={() =>
                          router.push(`/builder/erp/apps/${app.id}`)
                        }
                      >
                        <div className="ui-flex-between">
                          <span className={styles.appName}>{app.name}</span>
                          <span
                            className={`${styles.statusBadge} ${app.status === "ACTIVE" || app.status === "Active" ? styles.statusActive : styles.statusPending}`}
                          >
                            {app.status}
                          </span>
                        </div>

                        <div className={styles.appMetrics}>
                          <div>
                            <div className={styles.appMetricValue}>
                              {app.pagesCount}
                            </div>
                            <div className={styles.appMetricLabel}>Pages</div>
                          </div>
                          <div>
                            <div className={styles.appMetricValue}>
                              {app.formsCount}
                            </div>
                            <div className={styles.appMetricLabel}>Forms</div>
                          </div>
                          <div>
                            <div className={styles.appMetricValue}>
                              {app.dataModelsCount}
                            </div>
                            <div className={styles.appMetricLabel}>Models</div>
                          </div>
                          <div>
                            <div
                              className={`${styles.appMetricValue} ${styles.appMetricPrimary}`}
                            >
                              {app.submissionsCount}
                            </div>
                            <div className={styles.appMetricLabel}>Subs</div>
                          </div>
                        </div>

                        <div className={styles.appFooter}>
                          <span>Category: {app.category}</span>
                          <span className={styles.appVersion}>
                            v{app.version}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Submissions Timeline Activity */}
              <Card padding="lg">
                <h3 className={styles.sectionTitle}>
                  Enterprise Activity Timeline (Custom Records)
                </h3>
                {!globalStats?.recentSubmissions ||
                globalStats.recentSubmissions.length === 0 ? (
                  <div className={styles.emptyTimeline}>
                    No recent submissions recorded.
                  </div>
                ) : (
                  <div className="ui-stack-4">
                    {globalStats.recentSubmissions.map((sub: any) => (
                      <div key={sub.id} className={styles.timelineItem}>
                        <div>
                          <div className="ui-hstack-2">
                            <span className="ui-heading-sm">
                              New submission to {sub.schemaName}
                            </span>
                            <span className={styles.timelineBadge}>
                              {sub.appName}
                            </span>
                          </div>
                          <div className={styles.timelineData}>
                            Data: {JSON.stringify(sub.data)}
                          </div>
                        </div>
                        <div className={styles.timelineTime}>
                          {new Date(sub.createdAt).toLocaleString(undefined, {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )
        ) : (
          <div ref={containerRef} className={styles.personalDashboard}>
            <div className="ui-flex-between mb-4">
              <h2 className="ui-heading-md">Personal Workspace</h2>
              <button
                onClick={() => setIsEditingGrid(!isEditingGrid)}
                className={`ui-btn ${isEditingGrid ? "ui-btn-primary" : "ui-btn-ghost"}`}
              >
                {isEditingGrid ? "Done Editing" : "Edit Layout"}
              </button>
            </div>
            {mounted && (
              <GridLayout
                className="layout"
                layout={personalLayout}
                onLayoutChange={onLayoutChange}
                // @ts-ignore
                cols={12}
                rowHeight={40}
                width={width || 1200}
                isDraggable={isEditingGrid}
                isResizable={isEditingGrid}
                margin={[16, 16]}
              >
                <div
                  key="welcome"
                  className={`${styles.widget} flex flex-col justify-center`}
                >
                  <div className="p-6 bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-bg-sunken)] rounded-lg h-full flex flex-col justify-center">
                    <h3 className="ui-heading-lg mb-1">
                      Good morning, {user?.firstName || "Admin"}! 👋
                    </h3>
                    <p className="ui-text-secondary">
                      Here is what's happening with your projects and tasks
                      today.
                    </p>
                  </div>
                </div>

                <div key="kpis" className={styles.widget}>
                  <div className={`h-full ${styles.metricsGrid}`}>
                    {metrics.map((metric: any) => (
                      <MetricCard key={metric.title} {...metric} />
                    ))}
                  </div>
                </div>

                <div key="quick-access" className={styles.widget}>
                  <Card padding="lg" className="h-full overflow-hidden">
                    <h3 className={styles.sectionTitle}>Application Wizard</h3>
                    <div
                      className="grid gap-3 overflow-y-auto"
                      style={{
                        gridTemplateColumns: "repeat(auto-fill, minmax(12.5rem, 1fr))",
                        maxHeight: "calc(100% - 2rem)",
                        paddingRight: "var(--space-2)",
                      }}
                    >
                      {allApplications
                        .filter(
                          (app: any) =>
                            KERNEL_APP_IDS.has(app.id) ||
                            installedApps.includes(app.id)
                        )
                        .map((app: any, index: number) => {
                          const AppIcon = app.icon || LayoutDashboard;
                          return (
                            <button
                              key={app.id}
                              onClick={() => router.push(app.href)}
                              className={`${styles.quickAction} animate-in fade-in slide-in-from-bottom-4`}
                              style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                alignItems: "flex-start", 
                                gap: "var(--space-2)",
                                animationDuration: "500ms",
                                animationDelay: `${index * 50}ms`,
                                animationFillMode: "both"
                              }}
                            >
                              <AppIcon size={24} className="ui-text-primary" />
                              <div>
                                <p className={styles.quickActionTitle}>
                                  {app.name}
                                </p>
                                <p className={styles.quickActionDescription}>
                                  {app.description || "Launch module"}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </Card>
                </div>

                <div key="activity" className={styles.widget}>
                  <Card padding="lg" className="h-full overflow-hidden">
                    <h3 className={styles.sectionTitle}>Recently Accessed</h3>
                    <div className="ui-stack-3">
                      {allApplications
                        .filter(
                          (app: any) =>
                            KERNEL_APP_IDS.has(app.id) ||
                            installedApps.includes(app.id)
                        ).slice(0, 3)
                        .map((app: any) => {
                          const AppIcon = app.icon || LayoutDashboard;
                          return (
                            <button
                              key={`recent-${app.id}`}
                              onClick={() => router.push(app.href)}
                              className={styles.quickAction}
                              style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}
                            >
                              <AppIcon size={18} className="ui-text-primary" />
                              <div style={{ textAlign: "left" }}>
                                <p className={styles.quickActionTitle}>{app.name}</p>
                                <p className={styles.quickActionDescription}>Last accessed recently</p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </Card>
                </div>

                <div key="approvals" className={styles.widget}>
                  <Card padding="lg" className="h-full overflow-hidden">
                    <h3 className={styles.sectionTitle}>Pending Approvals</h3>
                    <div className="ui-stack-4">
                      <div className="flex items-center justify-between p-3 bg-[var(--color-bg-sunken)] rounded-md border border-[var(--color-border)]">
                        <div>
                          <p className="font-medium">PO-2024-001</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            Procurement • $4,500.00
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="ui-btn ui-btn-primary ui-btn-sm">
                            Approve
                          </button>
                          <button className="ui-btn ui-btn-ghost ui-btn-sm">
                            Reject
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[var(--color-bg-sunken)] rounded-md border border-[var(--color-border)]">
                        <div>
                          <p className="font-medium">Time-Off Request</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            HR • Jane Doe (3 days)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button className="ui-btn ui-btn-primary ui-btn-sm">
                            Approve
                          </button>
                          <button className="ui-btn ui-btn-ghost ui-btn-sm">
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div key="analytics" className={styles.widget}>
                  <Card padding="lg" className="h-full overflow-hidden">
                    <h3 className={styles.sectionTitle}>Analytics Preview</h3>
                    <div className="flex items-center justify-center text-[var(--color-text-secondary)]" style={{ height: "12.5rem" }}>
                      <BarChart2 size={48} className="opacity-20 mr-4" />
                      <span>Connect your data sources to view analytics</span>
                    </div>
                  </Card>
                </div>
              </GridLayout>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
