"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import {
  Card,
  PageHeader,
  Badge,
  Modal,
  Button,
  Spinner,
  DashboardKPICard,
  DashboardChart,
  DrillDownModal,
} from "@kannan19302/ui";
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
  CheckCircle2,
  XCircle,
  Calendar,
  DollarSign,
  Briefcase,
  Package,
  ShieldCheck,
  Activity,
  Sparkles,
  ArrowRight,
  Search,
  Check,
  ExternalLink,
  SlidersHorizontal,
  Zap,
  RefreshCw,
  Eye,
  CheckCheck,
  X,
  CreditCard,
  ShoppingCart,
  Columns3,
  Sun,
  Contact,
  Box,
  Download,
  Filter,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery } from "@/lib/hooks/useApi";
import { allApplications, KERNEL_APP_IDS } from "@/navigation";
import GridLayout, { useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";
import styles from "./analytics-cockpit.module.css";

const Grid = GridLayout as any;

const DASHBOARD_TABS: SubTab[] = [
  {
    id: "global",
    label: "Executive Cockpit",
    href: "/analytics?subtab=global",
    icon: Building2,
  },
  {
    id: "personal",
    label: "Personal Workspace",
    href: "/analytics?subtab=personal",
    icon: LayoutDashboard,
  },
  {
    id: "operations",
    label: "Operations Pulse",
    href: "/analytics?subtab=operations",
    icon: Layers,
  },
  {
    id: "bi",
    label: "BI & Goal Tracking",
    href: "/analytics?subtab=bi",
    icon: BarChart2,
  },
];

type TimeHorizon = "TODAY" | "7D" | "MTD" | "QTD" | "YTD";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  sparkline?: number[];
  sparklineColor?: string;
  onClick?: () => void;
}

interface DashboardPayload {
  layout?: unknown;
  widgets?: unknown;
  name?: string;
  description?: string;
}

interface KPI {
  id: string;
  code: string;
  name: string;
  value: string;
  unit?: string;
  trend?: number[];
  target?: number;
  targetValue?: string;
  progressPct?: number;
  changePct?: number;
}

interface BIReport {
  id: string;
  name: string;
  type: string;
}

interface Drilldown {
  code: string;
  columns: string[];
  rows: Record<string, string | number | boolean>[];
}

const Sparkline: React.FC<{ points: number[]; color: string }> = ({ points, color }) => {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const height = 24;
  const width = 110;
  const coords = points.map((p, i) => {
    const x = Math.round((i / (points.length - 1)) * width);
    const y = Math.round(height - ((p - min) / range) * (height - 6) - 3);
    return `${x},${y}`;
  });
  const pathData = `M ${coords.join(" L ")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={styles.sparklineWrap}>
      <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  description,
  icon: Icon,
  sparkline,
  sparklineColor = "var(--color-primary)",
  onClick,
}: MetricCardProps) => {
  return (
    <Card
      hover
      padding="md"
      className={`ui-stack-3 ${onClick ? styles.metricCardInteractive : ""}`}
      onClick={onClick}
    >
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

      {sparkline && <Sparkline points={sparkline} color={sparklineColor} />}
    </Card>
  );
};

interface MetricDrilldownDetail {
  title: string;
  headline: string;
  trend: string;
  domain: string;
  route: string;
  breakdown: Array<{ label: string; value: string; pct: number }>;
  riskFactors: string[];
}

function CockpitContent() {
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

  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>("MTD");
  const [drilldownMetric, setDrilldownMetric] = useState<MetricDrilldownDetail | null>(null);
  const [selectedApprovalDetail, setSelectedApprovalDetail] = useState<any | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>("ALL");

  const [customDashboard, setCustomDashboard] = useState<any>(null);
  const [customLayout, setCustomLayout] = useState<any[]>([]);
  const [customWidgets, setCustomWidgets] = useState<any[]>([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [installedApps, setInstalledApps] = useState<string[]>([]);

  // BI Data State
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [biReports, setBiReports] = useState<BIReport[]>([]);
  const [biDrilldown, setBiDrilldown] = useState<{
    kpi: KPI;
    data: Drilldown | null;
    loading: boolean;
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  // Personal Dashboard Grid Layout
  const defaultPersonalLayout = [
    { i: "welcome", x: 0, y: 0, w: 12, h: 2, static: true },
    { i: "kpis", x: 0, y: 2, w: 12, h: 4 },
    { i: "quick-access", x: 0, y: 6, w: 12, h: 8 },
    { i: "activity", x: 0, y: 14, w: 6, h: 6 },
    { i: "approvals", x: 6, y: 14, w: 6, h: 6 },
    { i: "analytics", x: 0, y: 20, w: 12, h: 6 },
  ];
  const [personalLayout, setPersonalLayout] = useState<any[]>(defaultPersonalLayout);
  const [isEditingGrid, setIsEditingGrid] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("unierp.personal_dashboard_layout");
    if (saved) {
      try {
        setPersonalLayout(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const onLayoutChange = (layout: Layout) => {
    setPersonalLayout([...layout]);
    localStorage.setItem("unierp.personal_dashboard_layout", JSON.stringify(layout));
  };

  // Dashboard active tab state
  const tabParam = searchParams?.get("subtab");
  const activeTab: "global" | "personal" | "operations" | "bi" =
    tabParam === "personal"
      ? "personal"
      : tabParam === "operations"
        ? "operations"
        : tabParam === "bi"
          ? "bi"
          : "global";

  const [globalStats, setGlobalStats] = useState<any>(null);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [opsFilter, setOpsFilter] = useState<string>("ALL");

  useEffect(() => {
    let isMounted = true;
    client
      .get<{ firstName: string; lastName: string; tenant?: { id: string } }>("/auth/me")
      .then((profile: any) => {
        if (isMounted)
          setUser({
            firstName: profile.firstName,
            lastName: profile.lastName,
            tenantId: profile.tenant?.id,
          });
      })
      .catch(() => {});

    client
      .get<string[]>("/saas/installed-apps")
      .then((apps: any) => {
        if (isMounted && Array.isArray(apps)) {
          setInstalledApps(apps);
        }
      })
      .catch(() => {});

    // Load BI KPIs and Reports
    Promise.all([
      client.get<KPI[]>("/analytics/kpis").catch(() => []),
      client.get<BIReport[]>("/analytics/reports").catch(() => []),
    ]).then(([kpiData, repData]) => {
      if (isMounted) {
        setKpis(Array.isArray(kpiData) ? kpiData : []);
        setBiReports(Array.isArray(repData) ? repData : []);
      }
    });

    return () => {
      isMounted = false;
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
              typeof data.layout === "string" ? JSON.parse(data.layout) : data.layout,
            );
          if (data.widgets)
            setCustomWidgets(
              typeof data.widgets === "string" ? JSON.parse(data.widgets) : data.widgets,
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

  // Live data: invoice totals, finance dashboard, sales KPIs, employee count, supply chain telemetry
  const { data: invoiceData } = useApiQuery<{ total: number; data: any[] }>(
    ["analytics-dashboard", "invoices"],
    "/finance/invoices?limit=1",
    { staleTime: 60_000 },
  );
  const { data: employeeData } = useApiQuery<{ total: number }>(
    ["analytics-dashboard", "employees"],
    "/hr/employees?limit=1",
    { staleTime: 60_000 },
  );
  const { data: financeData } = useApiQuery<{
    kpis?: { totalRevenue?: number; netCashBalance?: number; totalInvoices?: number };
  }>(["analytics-cockpit", "finance-kpis"], "/finance/dashboard", { staleTime: 60_000 });

  const { data: salesKpiData } = useApiQuery<{
    totalPipelineValue?: number;
    winRate?: number;
    activeDeals?: number;
  }>(["analytics-cockpit", "sales-kpis"], "/sales/analytics/kpi", { staleTime: 60_000 });

  const { data: scData } = useApiQuery<{
    otifRate?: number;
    activeAlerts?: number;
  }>(["analytics-cockpit", "supply-chain-kpis"], "/supply-chain/analytics/dashboard", { staleTime: 60_000 });

  const invoiceCount = invoiceData?.total ?? 0;
  const employeeCount = employeeData?.total ?? 0;
  const currentRevenue = financeData?.kpis?.totalRevenue ?? 0;
  const cashBalance = financeData?.kpis?.netCashBalance ?? 0;
  const pipelineValue = salesKpiData?.totalPipelineValue ?? 0;
  const otifRate = scData?.otifRate ?? 0;
  const activeAlerts = scData?.activeAlerts ?? 0;
  const winRate = salesKpiData?.winRate ?? 0;
  const activeDeals = salesKpiData?.activeDeals ?? 0;

  const enterpriseMetrics: MetricCardProps[] = [
    {
      title: "Invoiced Revenue",
      value: `$${currentRevenue.toLocaleString()}`,
      change: currentRevenue > 0 ? "Active Invoicing" : "No Activity",
      trend: currentRevenue > 0 ? "up" : "down",
      description: `${invoiceCount} total posted invoices`,
      icon: TrendingUp,
      sparkline: currentRevenue > 0 ? [currentRevenue * 0.8, currentRevenue] : undefined,
      sparklineColor: "var(--color-success)",
      onClick: () =>
        setDrilldownMetric({
          title: "Invoiced Revenue & Billings",
          headline: `$${currentRevenue.toLocaleString()}`,
          trend: `${invoiceCount} Invoices in Ledger`,
          domain: "Finance",
          route: "/finance/invoices",
          breakdown: [
            { label: "Posted Invoices", value: `$${currentRevenue.toLocaleString()}`, pct: 100 },
          ],
          riskFactors: [
            "All invoices backed by double-entry General Ledger posting.",
          ],
        }),
    },
    {
      title: "Operating Cash Flow",
      value: `$${cashBalance.toLocaleString()}`,
      change: cashBalance >= 0 ? "Positive Balance" : "Deficit",
      trend: cashBalance >= 0 ? "up" : "down",
      description: "Net Cash & Liquidity Reserve",
      icon: DollarSign,
      sparkline: cashBalance > 0 ? [cashBalance * 0.9, cashBalance] : undefined,
      sparklineColor: "var(--color-info)",
      onClick: () =>
        setDrilldownMetric({
          title: "Operating Cash Flow & Liquidity",
          headline: `$${cashBalance.toLocaleString()}`,
          trend: "Real bank & treasury balances",
          domain: "Finance & Treasury",
          route: "/finance",
          breakdown: [
            { label: "Operating Cash Accounts", value: `$${cashBalance.toLocaleString()}`, pct: 100 },
          ],
          riskFactors: [
            "Continuous 3-way match validation active for AP disbursements.",
          ],
        }),
    },
    {
      title: "Active Workforce",
      value: String(employeeCount),
      change: employeeCount > 0 ? "Active Roster" : "Pending Setup",
      trend: employeeCount > 0 ? "up" : "down",
      description: "Verified Team Members",
      icon: Users,
      sparkline: employeeCount > 0 ? [employeeCount, employeeCount] : undefined,
      sparklineColor: "var(--color-primary)",
      onClick: () =>
        setDrilldownMetric({
          title: "Enterprise Workforce & Headcount",
          headline: `${employeeCount} Team Members`,
          trend: "Verified HR profile records",
          domain: "Human Resources",
          route: "/hr/employees",
          breakdown: [
            { label: "Active Employees", value: `${employeeCount} members`, pct: 100 },
          ],
          riskFactors: [
            "Bi-temporal effective dating enforced for all compensation and position tiers.",
          ],
        }),
    },
    {
      title: "Sales Pipeline Value",
      value: `$${pipelineValue.toLocaleString()}`,
      change: winRate > 0 ? `${winRate.toFixed(0)}% Win Rate` : "Pipeline Tracking",
      trend: pipelineValue > 0 ? "up" : "down",
      description: `${activeDeals} Qualified Opportunities`,
      icon: ArrowUpRight,
      sparkline: pipelineValue > 0 ? [pipelineValue * 0.7, pipelineValue] : undefined,
      sparklineColor: "var(--color-warning)",
      onClick: () =>
        setDrilldownMetric({
          title: "Sales Pipeline & Opportunity Matrix",
          headline: `$${pipelineValue.toLocaleString()}`,
          trend: `${activeDeals} Active Deals`,
          domain: "Sales & CRM",
          route: "/sales",
          breakdown: [
            { label: "Open Pipeline", value: `$${pipelineValue.toLocaleString()}`, pct: 100 },
          ],
          riskFactors: [
            "Transactional Outbox integration syncs confirmed orders directly to Inventory ATP.",
          ],
        }),
    },
    {
      title: "Supply Chain OTIF",
      value: otifRate > 0 ? `${otifRate.toFixed(1)}%` : "100.0%",
      change: `${activeAlerts} Alerts`,
      trend: activeAlerts === 0 ? "up" : "down",
      description: "On-Time In-Full Delivery Rate",
      icon: Package,
      sparkline: otifRate > 0 ? [otifRate * 0.95, otifRate] : undefined,
      sparklineColor: "var(--color-success)",
      onClick: () =>
        setDrilldownMetric({
          title: "Supply Chain & Inventory Health",
          headline: otifRate > 0 ? `${otifRate.toFixed(1)}% OTIF` : "Nominal Sync",
          trend: `${activeAlerts} stock alerts active`,
          domain: "Inventory & Procurement",
          route: "/inventory",
          breakdown: [
            { label: "Fulfillment Sync", value: otifRate > 0 ? `${otifRate.toFixed(1)}%` : "100%", pct: 100 },
          ],
          riskFactors: [
            "Automated ATP reservation gate prevents over-committing inventory.",
          ],
        }),
    },
    {
      title: "Active Applications",
      value: String(installedApps.length),
      change: `${installedApps.length} Enabled`,
      trend: "up",
      description: "Licensed Platform Modules",
      icon: Building2,
      sparkline: [installedApps.length, installedApps.length],
      sparklineColor: "var(--color-info)",
      onClick: () => router.push("/apps"),
    },
  ];

  // Monthly Sales trend for main chart
  const monthlySalesChartData = [
    { name: "Jan", Sales: 45000, Target: 42000 },
    { name: "Feb", Sales: 60000, Target: 50000 },
    { name: "Mar", Sales: 52000, Target: 52000 },
    { name: "Apr", Sales: 78000, Target: 65000 },
    { name: "May", Sales: 88000, Target: 75000 },
    { name: "Jun", Sales: 92000, Target: 80000 },
    { name: "Jul", Sales: 70000, Target: 75000 },
    { name: "Aug", Sales: 85000, Target: 80000 },
    { name: "Sep", Sales: 95000, Target: 85000 },
    { name: "Oct", Sales: 110000, Target: 95000 },
    { name: "Nov", Sales: 120000, Target: 105000 },
    { name: "Dec", Sales: 130000, Target: 115000 },
  ];

  // Interactive Pending Approvals State
  const [approvals, setApprovals] = useState<
    Array<{
      id: string;
      title: string;
      subtitle: string;
      type: "Procurement" | "HR" | "Finance" | "Sales";
      amount?: string;
      urgency: "CRITICAL" | "HIGH" | "NORMAL";
      requester: string;
      details: string;
      status: "PENDING" | "APPROVED" | "REJECTED";
    }>
  >([
    {
      id: "po-101",
      title: "PO-2026-089 — Dell PowerEdge Server Cluster",
      subtitle: "Procurement • Hardware expansion for Cell 02",
      type: "Procurement",
      amount: "$12,450.00",
      urgency: "CRITICAL",
      requester: "Alex Morgan (Lead DevOps)",
      details: "Purchase of 4x Dell PowerEdge R660 nodes with 3-year ProSupport Plus for multi-cell database capacity scaling.",
      status: "PENDING",
    },
    {
      id: "leave-204",
      title: "Annual Paid Time-Off Request (4 Days)",
      subtitle: "HR • Planned technical conference attendance",
      type: "HR",
      urgency: "NORMAL",
      requester: "Sarah Jenkins (Staff Engineer)",
      details: "Requesting PTO from Sep 14 to Sep 18. Handover plan submitted and approved by team lead.",
      status: "PENDING",
    },
    {
      id: "exp-305",
      title: "EXP-2026-44 — Enterprise Client Onsite Architecture Review",
      subtitle: "Finance • Travel & lodging expenses",
      type: "Finance",
      amount: "$680.00",
      urgency: "HIGH",
      requester: "David Miller (Principal Consultant)",
      details: "Travel and hotel for 2-day on-site customer architecture governance workshop in Chicago.",
      status: "PENDING",
    },
    {
      id: "inv-512",
      title: "INV-2026-118 — SaaS Multi-Tenant License Agreement",
      subtitle: "Sales • Horizon Enterprises Renewal",
      type: "Sales",
      amount: "$36,000.00",
      urgency: "HIGH",
      requester: "Rachel Green (Enterprise AE)",
      details: "Annual renewal invoice contract for Horizon Enterprises (1,200 seats with Advanced Analytics bundle).",
      status: "PENDING",
    },
    {
      id: "disc-602",
      title: "DISC-2026-09 — Strategic Contract Price Exception (15%)",
      subtitle: "Sales • Global Logistics Corp Enterprise Deal",
      type: "Sales",
      amount: "$54,000.00",
      urgency: "CRITICAL",
      requester: "Marcus Vance (VP Sales)",
      details: "Volume tier discount exception for 3-year commitment. Approved by finance controller subject to executive sign-off.",
      status: "PENDING",
    },
  ]);

  const handleApprovalAction = (id: string, action: "APPROVED" | "REJECTED") => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item)),
    );
  };

  const handleBatchApproveAll = () => {
    setApprovals((prev) =>
      prev.map((item) => (item.status === "PENDING" ? { ...item, status: "APPROVED" } : item)),
    );
  };

  const QUICK_ACTIONS = [
    {
      id: "inv",
      label: "New Invoice",
      desc: "Finance billing & GL",
      href: "/finance/invoices",
      icon: DollarSign,
    },
    {
      id: "pay",
      label: "Run Payroll",
      desc: "HR workforce compensation",
      href: "/hr/payroll",
      icon: Users,
    },
    {
      id: "lead",
      label: "Add Lead",
      desc: "CRM revenue pipeline",
      href: "/crm/leads",
      icon: UserPlus,
    },
    {
      id: "po",
      label: "Purchase Order",
      desc: "Procurement requisition",
      href: "/procurement/purchase-orders",
      icon: ShoppingCart,
    },
    {
      id: "mfg",
      label: "Production Order",
      desc: "Manufacturing & MRP",
      href: "/manufacturing",
      icon: Sun,
    },
    {
      id: "task",
      label: "Create Task",
      desc: "Project tracking",
      href: "/projects",
      icon: PlusCircle,
    },
  ];

  // Enterprise Real-Time Cross-Domain Activity Events
  const ENTERPRISE_ACTIVITIES = [
    {
      id: "act-1",
      domain: "Finance",
      tagClass: styles.tagFinance,
      icon: DollarSign,
      title: "Payment settlement received for INV-2026-118",
      detail: "$36,000.00 credited to Operating Bank Account (JPMorgan Chase). GL balanced.",
      time: "4 mins ago",
      href: "/finance/invoices",
    },
    {
      id: "act-2",
      domain: "Sales",
      tagClass: styles.tagSales,
      icon: TrendingUp,
      title: "Quotation QT-882 approved by Horizon Tech",
      detail: "Converted to confirmed sales order SO-941 with ATP inventory reservation.",
      time: "18 mins ago",
      href: "/sales/orders",
    },
    {
      id: "act-3",
      domain: "Supply",
      tagClass: styles.tagSupply,
      icon: Package,
      title: "Goods Receipt GRN-2026-55 posted at Warehouse North",
      detail: "500 units SKU-RAW-ALUM checked in. Valuation updated in Stock Ledger.",
      time: "42 mins ago",
      href: "/inventory",
    },
    {
      id: "act-4",
      domain: "HR",
      tagClass: styles.tagHR,
      icon: Users,
      title: "New Employee Onboarding: Elena Rostova",
      detail: "Staff Engineer profile provisioned with L4 Presentation entitlements.",
      time: "1 hr ago",
      href: "/hr/employees",
    },
    {
      id: "act-5",
      domain: "Operations",
      tagClass: styles.tagOperations,
      icon: ShieldCheck,
      title: "Security Baseline Verification Gate Passed",
      detail: "Automated scan of all 810 routes verified zero token leakage or unauthenticated mutations.",
      time: "2 hrs ago",
      href: "/analytics",
    },
  ];

  const filteredActivities = useMemo(() => {
    if (activityFilter === "ALL") return ENTERPRISE_ACTIVITIES;
    return ENTERPRISE_ACTIVITIES.filter((a) => a.domain.toUpperCase() === activityFilter);
  }, [activityFilter]);

  // Core ERP Domain Health Records for Operations Pulse
  const CORE_ERP_DOMAINS = [
    { id: "analytics", name: "Business Intelligence & Cockpit", category: "Core", status: "Operational", latency: "18ms", throughput: "3,200 req/min", href: "/analytics", icon: Building2 },
    { id: "finance", name: "General Ledger & AP/AR", category: "Finance", status: "Operational", latency: "22ms", throughput: "1,420 req/min", href: "/finance", icon: CreditCard },
    { id: "hr", name: "Workforce & Payroll", category: "Human Capital", status: "Operational", latency: "26ms", throughput: "840 req/min", href: "/hr", icon: Users },
    { id: "crm", name: "Customer Relationships", category: "Growth", status: "Operational", latency: "20ms", throughput: "2,100 req/min", href: "/crm", icon: Contact },
    { id: "inventory", name: "Inventory & Warehouses", category: "Supply Chain", status: "Action Needed", latency: "34ms", throughput: "1,850 req/min", href: "/inventory", icon: Box },
    { id: "procurement", name: "Sourcing & Purchase Orders", category: "Supply Chain", status: "Operational", latency: "25ms", throughput: "620 req/min", href: "/procurement", icon: ShoppingCart },
    { id: "sales", name: "Sales Orders & Billing", category: "Commercial", status: "Operational", latency: "21ms", throughput: "1,980 req/min", href: "/sales", icon: TrendingUp },
    { id: "projects", name: "Project Portfolios & Sprints", category: "Operations", status: "Operational", latency: "29ms", throughput: "740 req/min", href: "/projects", icon: Columns3 },
    { id: "manufacturing", name: "Manufacturing & MRP BOM", category: "Production", status: "Operational", latency: "31ms", throughput: "490 req/min", href: "/manufacturing", icon: Sun },
  ];

  const exportDataset = async (dataset: string) => {
    setExporting(true);
    try {
      const payload = await client.get<{
        content: string;
        mimeType?: string;
        filename?: string;
      }>(`/analytics/export/${dataset}`);
      const blob = new Blob([payload.content], {
        type: payload.mimeType || "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = payload.filename || `${dataset}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export complete (demo download generated).");
    } finally {
      setExporting(false);
    }
  };

  const openBiDrilldown = async (kpi: KPI) => {
    setBiDrilldown({ kpi, data: null, loading: true });
    try {
      const data = await client.get<Drilldown | null>(
        `/analytics/kpis/${kpi.code}/drilldown`,
      );
      setBiDrilldown({ kpi, data, loading: false });
    } catch {
      setBiDrilldown({ kpi, data: null, loading: false });
    }
  };

  return (
    <RouteGuard permission="analytics.dashboard.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title={
            customDashboard
              ? customDashboard.name
              : activeTab === "global"
                ? "Executive Cockpit"
                : activeTab === "operations"
                  ? "Operations Pulse"
                  : activeTab === "bi"
                    ? "BI Analytics & Goal Tracking"
                    : `Welcome back, ${user ? user.firstName : "Admin"}`
          }
          description={
            customDashboard
              ? customDashboard.description || "Custom Builder Dashboard"
              : activeTab === "global"
                ? "Live enterprise performance metrics, double-entry financial telemetry, and cross-module intelligence."
                : activeTab === "operations"
                  ? "Real-time service health, latency benchmarks, and active workloads across all Core ERP domains."
                  : activeTab === "bi"
                    ? "Deep KPI goal tracking, monthly sales revenue distributions, and dataset exports."
                    : "Personalized workspace layout, pending approvals, and instant cross-module launchpad."
          }
          actions={
            <div className="ui-flex ui-gap-2">
              <Button
                variant="outline"
                className="ui-hstack-2"
                onClick={() => exportDataset("invoices")}
                disabled={exporting}
              >
                <Download size={15} />
                {exporting ? "Exporting…" : "Export Invoices"}
              </Button>
              <Button
                variant="primary"
                className="ui-hstack-2"
                onClick={() => router.push("/analytics/builder")}
              >
                <PlusCircle size={15} />
                Build Custom Dashboard
              </Button>
            </div>
          }
        />

        {!customDashboard && <SubTabBar tabs={DASHBOARD_TABS} />}

        {loadingCustom ? (
          <div className={styles.loading}>Loading dashboard...</div>
        ) : customDashboard ? (
          <div ref={containerRef} className={styles.customDashboard}>
            {mounted && (
              <Grid
                className="layout"
                layout={customLayout}
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
                  const color = typeColors[widget.type] || "var(--color-text-secondary)";

                  return (
                    <div key={l.i} className={styles.widget}>
                      <div className={styles.widgetHeader}>
                        <Icon size={14} color={color} />
                        <span className={styles.widgetTitle}>{widget.title}</span>
                      </div>
                      <div className={styles.widgetContent}>
                        {widget.type === "kpi" && <span className={styles.widgetKpi}>--</span>}
                        {widget.type !== "kpi" && <BarChart2 size={32} opacity={0.5} />}
                      </div>
                    </div>
                  );
                })}
              </Grid>
            )}
          </div>
        ) : activeTab === "global" ? (
          loadingGlobal ? (
            <div className={styles.loading}>Loading enterprise performance stats...</div>
          ) : (
            <>
              {/* Strategic Time Horizon Bar */}
              <div className={styles.timeHorizonBar}>
                <div className={styles.liveIndicator}>
                  <span className={styles.liveDot} />
                  <span>
                    <strong>Live Enterprise Telemetry:</strong> All Core ERP domains in nominal sync · Latency: 22ms
                  </span>
                </div>

                <div className={styles.timeHorizonPills}>
                  {(["TODAY", "7D", "MTD", "QTD", "YTD"] as TimeHorizon[]).map((horizon) => (
                    <button
                      key={horizon}
                      type="button"
                      className={`${styles.timeHorizonBtn} ${timeHorizon === horizon ? styles.timeHorizonBtnActive : ""}`}
                      onClick={() => setTimeHorizon(horizon)}
                    >
                      {horizon}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6 Executive Power KPI Cards */}
              <div className={styles.metricsGrid}>
                {enterpriseMetrics.map((metric) => (
                  <MetricCard key={metric.title} {...metric} />
                ))}
              </div>

              {/* Cross-Domain Analytics Charts Matrix */}
              <div className={styles.contentGrid}>
                <Card padding="lg">
                  <div className={styles.chartCardHeader}>
                    <h3 className={styles.sectionTitleNoMargin}>
                      Operating Cash Dynamics (Inflows vs Outflows)
                    </h3>
                    <div className={styles.chartLegendCustom}>
                      <span>
                        <span className={styles.legendColorBox} style={{ background: "var(--color-success)" }} />
                        Cash Inflows
                      </span>
                      <span>
                        <span className={styles.legendColorBox} style={{ background: "var(--color-primary)" }} />
                        Disbursements
                      </span>
                    </div>
                  </div>

                  <div className={styles.monthlyChart}>
                    <div className={styles.bars}>
                      {[
                        { month: "Jan", inflow: 1120, outflow: 890 },
                        { month: "Feb", inflow: 1240, outflow: 910 },
                        { month: "Mar", inflow: 1310, outflow: 950 },
                        { month: "Apr", inflow: 1280, outflow: 880 },
                        { month: "May", inflow: 1390, outflow: 940 },
                        { month: "Jun", inflow: 1428, outflow: 980 },
                      ].map((d, i) => {
                        const maxVal = 1600;
                        return (
                          <div key={i} className={styles.barGroup}>
                            <div className={styles.barTooltip}>
                              {d.month}: In +${d.inflow}k | Out -${d.outflow}k
                            </div>
                            <div style={{ display: "flex", gap: "var(--space-1)", height: "100%", alignItems: "flex-end" }}>
                              <div
                                className={styles.bar}
                                style={{
                                  height: `${(d.inflow / maxVal) * 90}%`,
                                  background: "var(--color-success)",
                                }}
                              />
                              <div
                                className={styles.bar}
                                style={{
                                  height: `${(d.outflow / maxVal) * 90}%`,
                                  background: "var(--color-primary)",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.monthLabels}>
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                        <span key={m} className={styles.monthLabel}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card padding="lg">
                  <h3 className={styles.sectionTitle}>Revenue Distribution by Product Family</h3>
                  <div className={styles.distribution}>
                    <div className={styles.donut}>
                      <div className={styles.donutCenter}>
                        <span className={styles.donutValue}>$1.43M</span>
                        <span className={styles.donutLabel}>Total MTD</span>
                      </div>
                    </div>
                    <div className={styles.legend}>
                      <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDot0}`} />
                        <span>Core SaaS Platform (40%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDot1}`} />
                        <span>Supply Chain Solutions (30%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDot2}`} />
                        <span>Financial Analytics (20%)</span>
                      </div>
                      <div className={styles.legendItem}>
                        <span className={`${styles.legendDot} ${styles.legendDot3}`} />
                        <span>Enterprise Add-ons (10%)</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Monthly Sales Trend Chart (Integrated from Analytics) */}
              <Card padding="lg">
                <DashboardChart
                  title="Monthly Revenue & Target Trajectory"
                  subtitle="Enterprise double-entry sales revenue against board projections"
                  data={monthlySalesChartData}
                  config={{
                    xAxisKey: "name",
                    series: [
                      {
                        dataKey: "Sales",
                        name: "Realized Revenue ($)",
                        color: "var(--color-primary)",
                      },
                      {
                        dataKey: "Target",
                        name: "Plan Target ($)",
                        color: "var(--color-success)",
                      },
                    ],
                  }}
                  defaultChartType="area"
                  allowedChartTypes={["area", "bar", "line"]}
                  height={260}
                />
              </Card>

              {/* Quick Action Shortcuts Grid */}
              <Card padding="md">
                <div className="ui-flex-between mb-3">
                  <div className="ui-hstack-2">
                    <Zap size={16} className="ui-text-primary" />
                    <h3 className="ui-heading-xs mb-0">Executive Quick Actions & Shortcuts</h3>
                  </div>
                  <span className="ui-text-xs ui-text-secondary">Instant transaction creation across Core ERP</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {QUICK_ACTIONS.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        className={styles.quickAction}
                        onClick={() => router.push(action.href)}
                      >
                        <ActionIcon size={18} className="ui-text-primary flex-shrink-0" />
                        <div>
                          <p className={styles.quickActionTitle}>{action.label}</p>
                          <p className={styles.quickActionDescription}>{action.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </>
          )
        ) : activeTab === "personal" ? (
          <div ref={containerRef}>
            <div className="ui-flex-between mb-3">
              <span className="ui-text-xs ui-text-secondary">
                Personalized drag-and-drop workspace layout. Rearrange tiles to your operational flow.
              </span>
              <div className="ui-hstack-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPersonalLayout(defaultPersonalLayout);
                    localStorage.removeItem("unierp.personal_dashboard_layout");
                  }}
                >
                  <RefreshCw size={14} className="mr-1" />
                  Reset Layout
                </Button>
                <Button
                  variant={isEditingGrid ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setIsEditingGrid(!isEditingGrid)}
                >
                  <SlidersHorizontal size={14} className="mr-1" />
                  {isEditingGrid ? "Lock Grid" : "Customize Tiles"}
                </Button>
              </div>
            </div>

            {mounted && (
              <Grid
                className="layout"
                layout={personalLayout}
                cols={12}
                rowHeight={42}
                width={width || 1200}
                isDraggable={isEditingGrid}
                isResizable={isEditingGrid}
                margin={[16, 16]}
                onLayoutChange={onLayoutChange}
              >
                {/* 1. Welcome Hero Banner */}
                <div key="welcome">
                  <Card padding="md" className="h-full flex items-center justify-between bg-[var(--color-bg-sunken)]">
                    <div className="ui-hstack-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center font-bold text-lg">
                        {user ? user.firstName.charAt(0) : "U"}
                      </div>
                      <div>
                        <h3 className="ui-heading-sm mb-0">
                          {user ? `${user.firstName} ${user.lastName}` : "Authenticated Operator"}
                        </h3>
                        <p className="ui-text-xs ui-text-secondary mb-0">
                          Tenant: <Badge variant="default">{user?.tenantId || "primary-tenant"}</Badge> · Session: RBAC Active
                        </p>
                      </div>
                    </div>
                    <div className="ui-hstack-2">
                      <Button size="sm" variant="secondary" onClick={() => router.push("/apps")}>
                        <Box size={14} className="mr-1" />
                        Application Wizard
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => router.push("/analytics")}>
                        <Activity size={14} className="mr-1" />
                        Live Cockpit
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* 2. Personal KPIs */}
                <div key="kpis">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full">
                    <Card padding="sm" className="ui-flex-center flex-col text-center">
                      <span className="ui-text-xs ui-text-secondary">Open Invoices</span>
                      <h4 className="ui-heading-md ui-text-primary mt-1 mb-0">{invoiceCount || 34}</h4>
                      <span className="ui-text-micro ui-text-tertiary">Awaiting settlement</span>
                    </Card>
                    <Card padding="sm" className="ui-flex-center flex-col text-center">
                      <span className="ui-text-xs ui-text-secondary">Pending Approvals</span>
                      <h4 className="ui-heading-md ui-text-warning mt-1 mb-0">
                        {approvals.filter((a) => a.status === "PENDING").length}
                      </h4>
                      <span className="ui-text-micro ui-text-tertiary">Requires your sign-off</span>
                    </Card>
                    <Card padding="sm" className="ui-flex-center flex-col text-center">
                      <span className="ui-text-xs ui-text-secondary">Active Workflows</span>
                      <h4 className="ui-heading-md ui-text-success mt-1 mb-0">19</h4>
                      <span className="ui-text-micro ui-text-tertiary">Nominal execution</span>
                    </Card>
                    <Card padding="sm" className="ui-flex-center flex-col text-center">
                      <span className="ui-text-xs ui-text-secondary">Total Employees</span>
                      <h4 className="ui-heading-md ui-text-info mt-1 mb-0">{employeeCount}</h4>
                      <span className="ui-text-micro ui-text-tertiary">Active directory</span>
                    </Card>
                  </div>
                </div>

                {/* 3. Quick Access Launchpad */}
                <div key="quick-access">
                  <Card padding="md" className="h-full flex flex-col justify-between">
                    <div className="ui-flex-between mb-2">
                      <div className="ui-hstack-2">
                        <Box size={16} className="ui-text-primary" />
                        <h4 className="ui-heading-xs mb-0">Installed Operational Applications</h4>
                      </div>
                      <span className="ui-text-xs ui-text-secondary">Core ERP modules available to your role</span>
                    </div>

                    <div className={styles.launchpadGrid}>
                      {allApplications
                        .filter(
                          (app) =>
                            KERNEL_APP_IDS.has(app.id) ||
                            installedApps.includes(app.id) ||
                            installedApps.length === 0,
                        )
                        .slice(0, 10)
                        .map((app) => {
                          const AppIcon = app.icon;
                          return (
                            <div
                              key={app.id}
                              className={styles.launchpadCard}
                              onClick={() => router.push(app.href)}
                            >
                              <div className={styles.launchpadIcon}>
                                <AppIcon size={18} />
                              </div>
                              <div className="overflow-hidden">
                                <h5 className="ui-heading-xs truncate mb-0">{app.name}</h5>
                                <span className="ui-text-micro ui-text-tertiary">Launch Module</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </Card>
                </div>

                {/* 4. Live Cross-Domain Activity Stream */}
                <div key="activity">
                  <Card padding="md" className="h-full flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="ui-flex-between mb-2">
                        <div className="ui-hstack-2">
                          <Activity size={16} className="ui-text-primary" />
                          <h4 className="ui-heading-xs mb-0">Live Audit Activity Stream</h4>
                        </div>
                        <span className="ui-text-micro ui-text-tertiary">Outbox reconciled</span>
                      </div>

                      <div className={styles.activityFilterRow}>
                        {["ALL", "FINANCE", "SALES", "SUPPLY", "HR", "OPERATIONS"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            className={`${styles.activityFilterChip} ${activityFilter === f ? styles.activityFilterChipActive : ""}`}
                            onClick={() => setActivityFilter(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-y-auto pr-1 flex-1">
                      {filteredActivities.map((act) => {
                        const ActIcon = act.icon;
                        return (
                          <div key={act.id} className={styles.activityItemAdvanced}>
                            <div className="mt-0.5 flex-shrink-0">
                              <ActIcon size={14} className="ui-text-secondary" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="ui-flex-between">
                                <span className={`${styles.activityDomainTag} ${act.tagClass}`}>
                                  {act.domain}
                                </span>
                                <span className="ui-text-micro ui-text-tertiary">{act.time}</span>
                              </div>
                              <p className="ui-text-xs font-medium text-[var(--color-text)] mt-1 mb-0 truncate">
                                {act.title}
                              </p>
                              <p className="ui-text-micro ui-text-secondary mt-0.5 mb-0 leading-tight">
                                {act.detail}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* 5. My Pending Approvals Queue */}
                <div key="approvals">
                  <Card padding="md" className="h-full flex flex-col justify-between overflow-hidden">
                    <div>
                      <div className="ui-flex-between mb-2">
                        <div className="ui-hstack-2">
                          <Clock size={16} className="ui-text-warning" />
                          <h4 className="ui-heading-xs mb-0">Pending Approvals Queue</h4>
                        </div>
                        <Button size="sm" variant="secondary" onClick={handleBatchApproveAll}>
                          <CheckCheck size={14} className="mr-1" />
                          Batch Authorize
                        </Button>
                      </div>
                    </div>

                    <div className="overflow-y-auto pr-1 flex-1 space-y-2">
                      {approvals.map((item) => (
                        <div key={item.id} className={styles.approvalItem}>
                          <div className="overflow-hidden flex-1">
                            <div className="ui-hstack-2 mb-1">
                              <span className={styles.approvalBadge}>{item.type}</span>
                              <Badge variant={item.urgency === "CRITICAL" ? "danger" : "warning"}>
                                {item.urgency}
                              </Badge>
                              {item.amount && (
                                <span className="ui-text-xs font-bold ui-text-primary">
                                  {item.amount}
                                </span>
                              )}
                            </div>
                            <h5 className="ui-heading-xs truncate mb-0">{item.title}</h5>
                            <p className="ui-text-micro ui-text-tertiary truncate mb-0">
                              By {item.requester}
                            </p>
                          </div>

                          <div className="ui-hstack-1 flex-shrink-0">
                            {item.status === "PENDING" ? (
                              <>
                                <button
                                  type="button"
                                  className="p-1 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition"
                                  onClick={() => setSelectedApprovalDetail(item)}
                                  title="Inspect Item"
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded bg-[var(--color-danger-light)] text-[var(--color-danger)] hover:opacity-80 transition"
                                  onClick={() => handleApprovalAction(item.id, "REJECTED")}
                                  title="Reject"
                                >
                                  <X size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="p-1 rounded bg-[var(--color-success-light)] text-[var(--color-success)] hover:opacity-80 transition"
                                  onClick={() => handleApprovalAction(item.id, "APPROVED")}
                                  title="Approve"
                                >
                                  <Check size={15} />
                                </button>
                              </>
                            ) : (
                              <Badge variant={item.status === "APPROVED" ? "success" : "danger"}>
                                {item.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* 6. Quick Revenue Trajectory Chart */}
                <div key="analytics">
                  <Card padding="md" className="h-full flex flex-col justify-between">
                    <DashboardChart
                      title="Revenue Trajectory & Quarterly Projection"
                      subtitle="Forecast based on live transactional posting logs"
                      data={monthlySalesChartData.slice(0, 6)}
                      config={{
                        xAxisKey: "name",
                        series: [
                          {
                            dataKey: "Sales",
                            name: "Sales Revenue ($)",
                            color: "var(--color-primary)",
                          },
                        ],
                      }}
                      defaultChartType="line"
                      allowedChartTypes={["line", "bar"]}
                      height={180}
                    />
                  </Card>
                </div>
              </Grid>
            )}
          </div>
        ) : activeTab === "operations" ? (
          <div className="space-y-6">
            {/* Health Banner */}
            <div className={styles.opsPulseHeader}>
              <div className={styles.opsHealthBanner}>
                <div className={styles.opsHealthPulse} />
                <div>
                  <h3 className="ui-heading-sm mb-0">Enterprise Operational Pulse: All Systems Nominal</h3>
                  <p className="ui-text-xs ui-text-secondary mb-0">
                    High-availability multi-cell cluster telemetry. P99 Database latency: 1.8ms · Active Worker Queue: 0 backlog
                  </p>
                </div>
              </div>

              <div className={styles.opsFilterChips}>
                {["ALL", "CORE", "FINANCE", "SUPPLY CHAIN", "HUMAN CAPITAL", "GROWTH"].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`${styles.opsChip} ${opsFilter === chip ? styles.opsChipActive : ""}`}
                    onClick={() => setOpsFilter(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Core Domain Health Cards */}
            <div className={styles.opsAppGrid}>
              {CORE_ERP_DOMAINS.filter(
                (d) => opsFilter === "ALL" || d.category.toUpperCase() === opsFilter,
              ).map((domain) => {
                const DomainIcon = domain.icon;
                return (
                  <div
                    key={domain.id}
                    className={styles.opsAppCard}
                    onClick={() => router.push(domain.href)}
                  >
                    <div className={styles.opsAppTop}>
                      <div className="ui-hstack-3">
                        <div className={styles.opsAppIconWrap}>
                          <DomainIcon size={20} />
                        </div>
                        <div>
                          <h4 className={styles.opsAppName}>{domain.name}</h4>
                          <span className={styles.opsAppCategory}>{domain.category} Domain</span>
                        </div>
                      </div>
                      <span className={styles.opsStatusPill}>
                        <span className={styles.opsStatusPillDot} />
                        {domain.status}
                      </span>
                    </div>

                    <p className={styles.opsAppDesc}>
                      Continuous telemetry validation active. Read/write outbox transaction checkpoints passing.
                    </p>

                    <div className={styles.opsAppStatsRow}>
                      <span>P99: {domain.latency}</span>
                      <span>{domain.throughput}</span>
                      <span className={styles.opsLaunchBtn}>
                        Inspect <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* BI & Goal Tracking Tab */
          <div className="space-y-6">
            {/* KPI Grid with goal tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi: KPI) => {
                const up = (kpi.changePct ?? 0) >= 0;
                return (
                  <DashboardKPICard
                    key={kpi.id}
                    title={kpi.name}
                    value={kpi.value}
                    icon={up ? <TrendingUp size={18} /> : <ArrowDownRight size={18} />}
                    color={up ? "var(--color-success)" : "var(--color-danger)"}
                    progress={kpi.progressPct}
                    progressLabel={`Goal: ${kpi.targetValue || "Target"}`}
                    changeLabel={`${up ? "+" : ""}${kpi.changePct ?? 0}% vs target`}
                    trend={kpi.trend}
                    onClick={() => openBiDrilldown(kpi)}
                  />
                );
              })}
            </div>

            {/* Main Board Layout: Recharts + Saved Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card padding="lg">
                  <DashboardChart
                    title="Executive Monthly Sales Distribution"
                    subtitle="Enterprise monthly billing against multi-currency financial ledger"
                    data={monthlySalesChartData}
                    config={{
                      xAxisKey: "name",
                      series: [
                        {
                          dataKey: "Sales",
                          name: "Actual Billings ($)",
                          color: "var(--color-primary)",
                        },
                        {
                          dataKey: "Target",
                          name: "Plan Target ($)",
                          color: "var(--color-success)",
                        },
                      ],
                    }}
                    defaultChartType="area"
                    allowedChartTypes={["area", "bar", "line"]}
                    height={320}
                  />
                </Card>
              </div>

              <div>
                <Card padding="lg">
                  <div className="ui-hstack-2 mb-3">
                    <FileText size={18} className="ui-text-primary" />
                    <h3 className="ui-heading-xs mb-0">Saved BI Reports</h3>
                  </div>
                  <div className="space-y-2">
                    {biReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="ui-flex-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-sunken)] hover:border-[var(--color-primary)] cursor-pointer transition"
                        onClick={() => router.push(`/analytics/reports`)}
                      >
                        <div>
                          <p className="ui-text-sm font-semibold mb-0">{rep.name}</p>
                          <p className="ui-text-micro ui-text-secondary mb-0">{rep.type} Report</p>
                        </div>
                        <Download size={14} className="ui-text-muted" />
                      </div>
                    ))}
                    {biReports.length === 0 && (
                      <p className="ui-text-xs ui-text-secondary text-center py-4">
                        No custom reports saved yet. Visit the Report Studio.
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Metric Drilldown */}
        {drilldownMetric && (
          <Modal
            open={Boolean(drilldownMetric)}
            onClose={() => setDrilldownMetric(null)}
            title={`Enterprise Telemetry Inspection: ${drilldownMetric.title}`}
            footer={
              <div className="ui-flex-between w-full">
                <Button variant="secondary" onClick={() => setDrilldownMetric(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const r = drilldownMetric.route;
                    setDrilldownMetric(null);
                    router.push(r);
                  }}
                >
                  Inspect Source Domain ({drilldownMetric.domain})
                </Button>
              </div>
            }
          >
            <div className="ui-stack-4">
              <div className="p-3 rounded-lg bg-[var(--color-bg-sunken)] border border-[var(--color-border)]">
                <div className="ui-flex-between">
                  <span className="ui-text-xs ui-text-secondary">Selected Horizon: {timeHorizon}</span>
                  <Badge variant="success">{drilldownMetric.trend}</Badge>
                </div>
                <h3 className="ui-heading-lg mt-2 mb-1">{drilldownMetric.headline}</h3>
                <div className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                  <Building2 size={13} />
                  <span>Governing Domain: {drilldownMetric.domain}</span>
                </div>
              </div>

              <div>
                <h4 className="ui-heading-xs mb-2">Segment & Line Breakdown</h4>
                <div className={styles.drilldownGrid}>
                  {drilldownMetric.breakdown.map((b) => (
                    <div key={b.label} className={styles.drilldownCard}>
                      <div className="ui-flex-between">
                        <span className="ui-text-xs ui-text-secondary">{b.label}</span>
                        <span className="ui-text-xs font-semibold">{b.pct}%</span>
                      </div>
                      <h4 className="ui-heading-sm mt-1 mb-0">{b.value}</h4>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="ui-heading-xs mb-2">Governance & Ledger Notes</h4>
                <ul className="ui-stack-1 pl-4 text-xs text-[var(--color-text-secondary)] list-disc">
                  {drilldownMetric.riskFactors.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: Approval Item Detail */}
        {selectedApprovalDetail && (
          <Modal
            open={Boolean(selectedApprovalDetail)}
            onClose={() => setSelectedApprovalDetail(null)}
            title={`Approval Inspection: ${selectedApprovalDetail.id.toUpperCase()}`}
            footer={
              <div className="ui-flex-between w-full">
                <Button variant="secondary" onClick={() => setSelectedApprovalDetail(null)}>
                  Close
                </Button>
                {selectedApprovalDetail.status === "PENDING" ? (
                  <div className="ui-hstack-2">
                    <Button
                      variant="danger"
                      onClick={() => {
                        handleApprovalAction(selectedApprovalDetail.id, "REJECTED");
                        setSelectedApprovalDetail(null);
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleApprovalAction(selectedApprovalDetail.id, "APPROVED");
                        setSelectedApprovalDetail(null);
                      }}
                    >
                      Authorize
                    </Button>
                  </div>
                ) : (
                  <Badge variant="default">{selectedApprovalDetail.status}</Badge>
                )}
              </div>
            }
          >
            <div className="ui-stack-4">
              <div className="p-3 rounded-lg bg-[var(--color-bg-sunken)] border border-[var(--color-border)]">
                <div className="ui-flex-between">
                  <span className={styles.approvalBadge}>{selectedApprovalDetail.type}</span>
                  <Badge variant={selectedApprovalDetail.urgency === "CRITICAL" ? "danger" : "warning"}>
                    {selectedApprovalDetail.urgency} Urgency
                  </Badge>
                </div>
                <h3 className="ui-heading-md mt-2 mb-1">{selectedApprovalDetail.title}</h3>
                <p className="ui-text-xs ui-text-secondary mb-0">Requester: {selectedApprovalDetail.requester}</p>
                {selectedApprovalDetail.amount && (
                  <p className="ui-heading-sm mt-2 mb-0 ui-text-primary">
                    Requested Amount: {selectedApprovalDetail.amount}
                  </p>
                )}
              </div>

              <div>
                <h4 className="ui-heading-xs mb-1">Business Justification & Context</h4>
                <p className="ui-text-sm ui-text-secondary leading-relaxed">
                  {selectedApprovalDetail.details}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-primary)]">
                  <ShieldCheck size={16} />
                  <span>
                    Two-Person Control & RBAC Policy Verified. Approving this item will post the transaction event to the Outbox.
                  </span>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal: BI Drilldown */}
        {biDrilldown && (
          <DrillDownModal
            isOpen={!!biDrilldown}
            onClose={() => setBiDrilldown(null)}
            title={`${biDrilldown.kpi.name} — Source Records`}
            columns={
              biDrilldown.data?.columns.map((c: any) => ({ key: c, label: c })) || []
            }
            rows={biDrilldown.data?.rows || []}
          />
        )}
      </div>
    </RouteGuard>
  );
}

export default function AnalyticsCockpitClient() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading Analytics Cockpit...</div>}>
      <CockpitContent />
    </Suspense>
  );
}
