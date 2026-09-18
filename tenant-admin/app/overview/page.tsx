"use client";
/**
 * OCC-22: Organization Intelligence
 * Executive dashboard, operational health telemetry, cross-app metrics, and enterprise activity.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Building,
  Zap,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

export default function OverviewIntelligencePage() {
  const [metrics] = useState({
    monthlyRunRate: "$142,500",
    activeWorkforce: 112,
    aiTasksCompleted: 2840,
    systemHealth: "100.0%",
  });

  const [activeModules] = useState([
    { name: "Financial Ledger & Invoicing", status: "Healthy", latency: "14ms", version: "v2.4.0" },
    { name: "Workforce & Statutory Payroll", status: "Healthy", latency: "18ms", version: "v2.1.2" },
    { name: "Inventory & Warehouse Routing", status: "Healthy", latency: "22ms", version: "v2.0.4" },
    { name: "Autonomous AI Copilot Engine", status: "Healthy", latency: "380ms", version: "v3.0.0" },
    { name: "Marketplace Extensions Bridge", status: "Healthy", latency: "31ms", version: "v1.8.0" },
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "#090d16", color: "#f3f4f6", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,17,23,0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <BrandMark compact size="md" />
          <span style={{
            fontSize: "1.125rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            UniERP Tenant Admin
          </span>
          <span style={{ fontSize: "0.75rem", background: "rgba(245,158,11,0.15)", color: "#fbbf24", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>
            OCC-22 · INTELLIGENCE
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/billing" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Billing
          </Link>
          <Link href="/organization-entitlements" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Entitlements
          </Link>
          <Link href="/ai-governance" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            AI Governance
          </Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeQuickToggle />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {/* Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Organization Intelligence &amp; Overview</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Real-time enterprise visibility across billing run-rate, active workforce, AI copilot workloads, and system SLAs.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Monthly Volume</span>
              <DollarSign size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{metrics.monthlyRunRate}</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>+12.4% vs last month</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Active Workforce</span>
              <Users size={16} color="#3b82f6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{metrics.activeWorkforce} Members</div>
            <div style={{ fontSize: "0.75rem", color: "#3b82f6", marginTop: "0.25rem" }}>Across 5 departments</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>AI Tasks Executed</span>
              <Sparkles size={16} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{metrics.aiTasksCompleted} Tasks</div>
            <div style={{ fontSize: "0.75rem", color: "#8b5cf6", marginTop: "0.25rem" }}>Avg response: 420ms</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Uptime SLA</span>
              <ShieldCheck size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{metrics.systemHealth}</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>0 incidents in 30 days</div>
          </div>
        </div>

        {/* Active Modules Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 700 }}>ERP Application &amp; Microservice Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {activeModules.map((mod) => (
              <div
                key={mod.name}
                style={{
                  padding: "0.75rem 1rem",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "0.375rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#fff" }}>{mod.name}</span>
                  <span style={{ marginLeft: "0.75rem", fontSize: "0.75rem", color: "#9ca3af" }}>{mod.version}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Latency: {mod.latency}</span>
                  <span style={{ fontSize: "0.75rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                    ● {mod.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
