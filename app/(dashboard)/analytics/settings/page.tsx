"use client";

import React from "react";
import Link from "next/link";
import { PageHeader, Card } from "@kannan19302/ui";
import {
  ArrowRight,
  BarChart3,
  PieChart,
  FileDown,
  Database,
  BookOpen,
  GitFork,
  TrendingUp,
  Sliders,
  Layers,
} from "lucide-react";
import styles from "./page.module.css";

const SETTINGS_SECTIONS = [
  {
    title: "Report Catalog & Definitions",
    desc: "Create and manage enterprise tabular reports, pivot matrices, and saved queries.",
    href: "/analytics/reports",
    icon: <BarChart3 size={20} />,
  },
  {
    title: "KPI Definitions & Targets",
    desc: "Define organizational key performance indicators, baselines, and quarterly targets.",
    href: "/analytics/kpis",
    icon: <PieChart size={20} />,
  },
  {
    title: "Semantic Metric Dictionary",
    desc: "Manage standardized business calculation formulas, source bindings, and dimensions.",
    href: "/analytics/catalog",
    icon: <BookOpen size={20} />,
  },
  {
    title: "ETL Data Pipelines & Ingestion",
    desc: "Configure replication from multi-tenant PostgreSQL into ClickHouse analytics lakehouse.",
    href: "/analytics/pipelines",
    icon: <Database size={20} />,
  },
  {
    title: "Scheduled Automated Exports",
    desc: "Set up periodic cron report distributions via email, Webhooks, or S3 CSV/PDF.",
    href: "/analytics/exports",
    icon: <FileDown size={20} />,
  },
  {
    title: "Curated Executive Dashboards",
    desc: "Organize custom dashboard boards, default home cockpits, and pinned widgets.",
    href: "/analytics/dashboards",
    icon: <Layers size={20} />,
  },
  {
    title: "Visual Query Studio",
    desc: "Build self-service ad-hoc SQL queries with AI Plain English copilot integration.",
    href: "/analytics/query",
    icon: <GitFork size={20} />,
  },
  {
    title: "Predictive Model Management",
    desc: "Train machine learning models and configure forecasting algorithms and confidence bounds.",
    href: "/analytics/predictive",
    icon: <TrendingUp size={20} />,
  },
];

export default function AnalyticsSettingsPage() {
  return (
    <div className={styles.container} data-density="compact">
      <PageHeader
        title="Analytics & Business Intelligence Settings"
        description="Configure report definitions, semantic metric catalogs, data lakehouse ingestion pipelines, and automated report schedules."
      />

      <div className={styles.grid}>
        {SETTINGS_SECTIONS.map((sec) => (
          <Link key={sec.href} href={sec.href} className={styles.card}>
            <div className={styles.iconWrap}>{sec.icon}</div>
            <div className={styles.cardContent}>
              <p className={styles.cardTitle}>{sec.title}</p>
              <p className={styles.cardDesc}>{sec.desc}</p>
            </div>
            <ArrowRight size={16} className={styles.arrow} />
          </Link>
        ))}
      </div>
    </div>
  );
}
