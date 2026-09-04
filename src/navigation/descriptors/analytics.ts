import { registerModule } from "@kannan19302/shared/module-registry";

registerModule({
  slug: "analytics",
  title: "Business Intelligence",
  icon: "PieChart",
  routeSegment: "analytics",
  dashboardRoute: "/analytics",
  settingsRoute: "/analytics/settings",
  nav: [
    {
      label: "Executive Intelligence",
      isHeader: true,
      items: [
        { label: "Executive Cockpit", href: "/analytics", icon: "PieChart" },
        {
          label: "Saved Dashboards",
          href: "/analytics/dashboards",
          icon: "LayoutGrid",
        },
        {
          label: "Dashboard Studio",
          href: "/analytics/builder",
          icon: "LayoutDashboard",
        },
        {
          label: "Executive Reports",
          href: "/analytics/reports",
          icon: "FileText",
        },
        { label: "KPI Scorecards", href: "/analytics/kpis", icon: "Target" },
      ],
    },
    {
      label: "Deep Exploration",
      isHeader: true,
      items: [
        {
          label: "Visual Query Studio",
          href: "/analytics/query",
          icon: "GitFork",
        },
        {
          label: "Pivot Matrix",
          href: "/analytics/pivot",
          icon: "Layers",
        },
        {
          label: "Historical Trends",
          href: "/analytics/trends",
          icon: "TrendingUp",
        },
        {
          label: "Advanced BI Studio",
          href: "/analytics/advanced",
          icon: "BarChart3",
        },
      ],
    },
    {
      label: "AI & Algorithmic Insights",
      isHeader: true,
      items: [
        {
          label: "Smart Insights",
          href: "/analytics/insights",
          icon: "Brain",
        },
        {
          label: "Anomaly Detection",
          href: "/analytics/anomalies",
          icon: "ShieldAlert",
        },
        {
          label: "Conversion Funnels",
          href: "/analytics/funnels",
          icon: "Workflow",
        },
        {
          label: "Predictive Forecasting",
          href: "/analytics/predictive",
          icon: "Activity",
        },
      ],
    },
    {
      label: "Data Ingestion & Delivery",
      isHeader: true,
      items: [
        {
          label: "Live Telemetry",
          href: "/analytics/realtime",
          icon: "Zap",
        },
        {
          label: "Metric Catalog",
          href: "/analytics/catalog",
          icon: "Database",
        },
        {
          label: "Data Pipelines",
          href: "/analytics/pipelines",
          icon: "Network",
        },
        {
          label: "Scheduled Exports",
          href: "/analytics/exports",
          icon: "Download",
        },
        {
          label: "Engine Governance",
          href: "/analytics/settings",
          icon: "Settings",
        },
      ],
    },
  ],
});
