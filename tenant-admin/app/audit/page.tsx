"use client";
/**
 * OCC-14: Audit & Regulatory Controls
 * Immutable tenant audit trails, security event inspection, and compliance evidence exports.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Shield,
  Download,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  User,
  Key,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface AuditEvent {
  id: string;
  actor: string;
  actorEmail: string;
  action: string;
  category: "AUTH" | "ACCESS_CHANGE" | "DATA_MUTATION" | "CONFIG_UPDATE" | "EXPORT";
  targetResource: string;
  ipAddress: string;
  timestamp: string;
  status: "SUCCESS" | "DENIED" | "FLAGGED";
}

export default function AuditTrailPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [events] = useState<AuditEvent[]>([
    {
      id: "evt-901",
      actor: "Kannan Admin",
      actorEmail: "kannan@acme-corp.com",
      action: "role.grant",
      category: "ACCESS_CHANGE",
      targetResource: "user:usr-02 (Financial Controller)",
      ipAddress: "192.168.1.104",
      timestamp: "2026-08-25 10:14:22 UTC",
      status: "SUCCESS",
    },
    {
      id: "evt-902",
      actor: "Sarah Jenkins",
      actorEmail: "s.jenkins@acme-corp.com",
      action: "invoice.post",
      category: "DATA_MUTATION",
      targetResource: "invoice:INV-2026-08-0042 ($899.00)",
      ipAddress: "192.168.1.142",
      timestamp: "2026-08-25 09:42:10 UTC",
      status: "SUCCESS",
    },
    {
      id: "evt-903",
      actor: "Unknown / External",
      actorEmail: "attacker@unknown-net.org",
      action: "auth.login_attempt",
      category: "AUTH",
      targetResource: "login:kannan@acme-corp.com",
      ipAddress: "45.142.12.89",
      timestamp: "2026-08-25 08:30:15 UTC",
      status: "DENIED",
    },
    {
      id: "evt-904",
      actor: "David Chen",
      actorEmail: "d.chen@acme-corp.com",
      action: "extension.install",
      category: "CONFIG_UPDATE",
      targetResource: "extension:ext-stripe-recon",
      ipAddress: "192.168.1.115",
      timestamp: "2026-08-24 16:20:00 UTC",
      status: "SUCCESS",
    },
    {
      id: "evt-905",
      actor: "Kannan Admin",
      actorEmail: "kannan@acme-corp.com",
      action: "compliance.export",
      category: "EXPORT",
      targetResource: "report:soc2-evidence-bundle.zip",
      ipAddress: "192.168.1.104",
      timestamp: "2026-08-24 14:05:12 UTC",
      status: "SUCCESS",
    },
  ]);

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.actor.toLowerCase().includes(search.toLowerCase()) ||
      ev.action.toLowerCase().includes(search.toLowerCase()) ||
      ev.targetResource.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || ev.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const exportCSV = () => {
    const header = "Timestamp,Actor,Email,Action,Category,Target,IP,Status\n";
    const rows = filteredEvents
      .map(
        (e) =>
          `"${e.timestamp}","${e.actor}","${e.actorEmail}","${e.action}","${e.category}","${e.targetResource}","${e.ipAddress}","${e.status}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

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
            OCC-14 · AUDIT
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/roles" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Roles &amp; Governance
          </Link>
          <Link href="/settings/security" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Security Settings
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Audit &amp; Regulatory Controls</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Immutable cryptographic audit records, forensic event trails, and compliance evidence exports.
            </p>
          </div>
          <button
            onClick={exportCSV}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#10b981",
              color: "#000",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <Download size={16} /> Export Evidence CSV
          </button>
        </div>

        {/* Filter Row */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail by actor, action, or target resource..."
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                borderRadius: "0.375rem",
                background: "#111827",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: "0.875rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "0.875rem",
            }}
          >
            <option value="ALL">All Event Categories</option>
            <option value="AUTH">Authentication</option>
            <option value="ACCESS_CHANGE">Access &amp; Roles</option>
            <option value="DATA_MUTATION">Data Mutation</option>
            <option value="CONFIG_UPDATE">Configuration</option>
            <option value="EXPORT">Data Export</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Timestamp (UTC)</th>
                <th style={{ padding: "0.75rem 1rem" }}>Actor</th>
                <th style={{ padding: "0.75rem 1rem" }}>Action / Scope</th>
                <th style={{ padding: "0.75rem 1rem" }}>Target Resource</th>
                <th style={{ padding: "0.75rem 1rem" }}>Source IP</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>
                    {e.timestamp}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{e.actor}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{e.actorEmail}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.45rem", borderRadius: "0.25rem", background: "rgba(255,255,255,0.06)", color: "#fbbf24", fontFamily: "monospace", fontWeight: 600 }}>
                      {e.action}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#d1d5db", fontSize: "0.8125rem" }}>
                    {e.targetResource}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>
                    {e.ipAddress}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: e.status === "SUCCESS" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: e.status === "SUCCESS" ? "#34d399" : "#f87171",
                      }}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
