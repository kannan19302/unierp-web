"use client";
/**
 * OCC-08: Consumption & Quotas
 * Tenant resource consumption metrics, meter gauges, quota ceilings, and threshold alerts.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  Gauge,
  Database,
  Globe,
  FileText,
  Bot,
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface QuotaMetric {
  id: string;
  name: string;
  category: string;
  used: number;
  limit: number;
  unit: string;
  warningThreshold: number;
  icon: string;
}

export default function UsageConsumptionPage() {
  const [metrics, setMetrics] = useState<QuotaMetric[]>([
    {
      id: "m-db",
      name: "Dedicated NVMe Storage",
      category: "Infrastructure",
      used: 342,
      limit: 1024,
      unit: "GB",
      warningThreshold: 80,
      icon: "Database",
    },
    {
      id: "m-api",
      name: "API Platform Request Volume",
      category: "API Gateway",
      used: 184200,
      limit: 500000,
      unit: "req/day",
      warningThreshold: 85,
      icon: "Globe",
    },
    {
      id: "m-ai",
      name: "AI Tokens (LLM Copilot)",
      category: "AI Runtime",
      used: 1842300,
      limit: 5000000,
      unit: "tokens/mo",
      warningThreshold: 80,
      icon: "Bot",
    },
    {
      id: "m-ocr",
      name: "Automated OCR Invoices Processed",
      category: "Document AI",
      used: 1240,
      limit: 5000,
      unit: "pages/mo",
      warningThreshold: 90,
      icon: "FileText",
    },
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
            OCC-08 · CONSUMPTION
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/billing" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Billing &amp; Payments
          </Link>
          <Link href="/organization-entitlements" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Entitlements
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Consumption &amp; Quotas</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Monitor operational capacity, throughput limits, and provisioned resource gauges in real-time.
            </p>
          </div>
          <Link
            href="/billing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(245,158,11,0.15)",
              color: "#fbbf24",
              border: "1px solid #f59e0b",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Upgrade Plan Capacity <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Meters Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
          {metrics.map((m) => {
            const pct = Math.round((m.used / m.limit) * 100);
            const isWarning = pct >= m.warningThreshold;

            return (
              <div
                key={m.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>
                        {m.category}
                      </span>
                      <h3 style={{ margin: "0.15rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>{m.name}</h3>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: isWarning ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
                        color: isWarning ? "#fbbf24" : "#34d399",
                      }}
                    >
                      {pct}% Used
                    </span>
                  </div>

                  <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", margin: "0.5rem 0" }}>
                    {m.used.toLocaleString()}{" "}
                    <span style={{ fontSize: "1rem", color: "#9ca3af", fontWeight: 500 }}>
                      / {m.limit.toLocaleString()} {m.unit}
                    </span>
                  </div>

                  <div style={{ height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden", margin: "1rem 0 0.5rem" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: isWarning ? "#f59e0b" : "#3b82f6",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#6b7280", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span>Soft Alert Floor: {m.warningThreshold}%</span>
                  <span style={{ color: "#10b981", fontWeight: 600 }}>● Automated Reset on 1st of Month</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
