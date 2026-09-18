"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";
import { ACTIVE_OCC_APP_MANIFESTS } from "@/lib/control-center-manifests";

interface PlanTier {
  id: string;
  name: string;
  price: string;
  seats: string;
  storage: string;
  apiLimit: string;
  features: string[];
  isCurrent?: boolean;
}

const TIERS: PlanTier[] = [
  { id: "starter", name: "Growth Starter", price: "$299/mo", seats: "15 Users", storage: "100 GB SSD", apiLimit: "50,000 req/day", features: ["Core Finance & Invoicing", "Sales CRM Pipeline", "Basic Inventory Control", "Standard Email Support"] },
  { id: "scale", name: "Enterprise Scale", price: "$899/mo", seats: "75 Users", storage: "1 TB NVMe", apiLimit: "500,000 req/day", features: ["All ERP Modules (15+ Apps)", "Multi-Warehouse Routing", "Automated Statutory Payroll", "Web Studio & Custom Domains", "24/7 Priority SLA"], isCurrent: true },
  { id: "unlimited", name: "Autonomous Sovereign", price: "$2,499/mo", seats: "Unlimited", storage: "10 TB Dedicated", apiLimit: "Unlimited", features: ["Dedicated Private Database", "Custom Extension Sandbox", "SOC2 / HIPAA Compliance", "Dedicated TAM Engineer", "Full White-Labeling"] },
];

export default function TenantAdminHomePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "subscriptions" | "users" | "domains" | "audit">("overview");

  const [users, setUsers] = useState([
    { id: "u-1", name: "Kannan Admin", email: "saasadmin@unierp.com", role: "Tenant Owner / Superadmin", status: "Active", mfa: "Hardware Key + TOTP", lastActive: "Just now" },
    { id: "u-2", name: "Finance Director", email: "finance@unierp.com", role: "Financial Controller", status: "Active", mfa: "Authenticator App", lastActive: "12m ago" },
    { id: "u-3", name: "Supply Lead", email: "warehouse@unierp.com", role: "Inventory Manager", status: "Active", mfa: "SMS OTP", lastActive: "1h ago" },
    { id: "u-4", name: "HR Manager", email: "hr@unierp.com", role: "HR & Payroll Lead", status: "Active", mfa: "Authenticator App", lastActive: "3h ago" },
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
            PLANE 5 · SAAS OS
          </span>
        </div>

        {/* Tab Controls */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {(["overview", "subscriptions", "users", "domains", "audit"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.375rem",
                border: activeTab === tab ? "1px solid #f59e0b" : "1px solid transparent",
                background: activeTab === tab ? "rgba(245,158,11,0.15)" : "transparent",
                color: activeTab === tab ? "#fbbf24" : "#9ca3af",
                fontSize: "0.8125rem",
                fontWeight: activeTab === tab ? 700 : 500,
                textTransform: "capitalize",
                cursor: "pointer"
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <ThemeQuickToggle />
          <a
            href="http://localhost:3005/oidc/account"
            aria-label="Open Account Center"
            title="Account Center"
            style={{ width: 34, height: 34, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.1)", color: "#fff", textDecoration: "none", fontWeight: 700 }}
          >
            K
          </a>
          <Link href="/login" style={{
            padding: "0.45rem 0.95rem",
            background: "#f59e0b",
            color: "#090d16",
            borderRadius: "0.375rem",
            textDecoration: "none",
            fontSize: "0.8125rem",
            fontWeight: 700
          }}>
            Admin Login
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: "2rem", maxWidth: "1280px", margin: "0 auto", width: "100%", flex: 1 }}>
        {activeTab === "overview" && (
          <div>
            {/* Top Metrics Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>Current Subscription</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fbbf24", margin: "0.35rem 0" }}>Enterprise Scale</div>
                <div style={{ fontSize: "0.75rem", color: "#34d399" }}>● Renews Sep 15, 2026</div>
              </div>

              <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>Active User Seats</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: "0.35rem 0" }}>24 / 75 Seats</div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>51 seats remaining</div>
              </div>

              <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>API & Webhook Traffic</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: "0.35rem 0" }}>142.8k / 500k</div>
                <div style={{ fontSize: "0.75rem", color: "#34d399" }}>99.99% Success Rate</div>
              </div>

              <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>Storage Utilization</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ffffff", margin: "0.35rem 0" }}>184 GB / 1 TB</div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Encrypted S3 & Database</div>
              </div>
            </div>

            <section style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "0.5rem" }}>Organization Control Center applications</h2>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "1.25rem" }}>Open a tenant-scoped administration application. Provider operations are intentionally absent.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.75rem" }}>
                {ACTIVE_OCC_APP_MANIFESTS.map((manifest) => (
                  <Link
                    key={manifest.appId}
                    href={manifest.entryPath}
                    style={{ padding: "0.875rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem", color: "#ffffff", textDecoration: "none" }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 800, marginBottom: "0.2rem" }}>{manifest.appId}</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700 }}>{manifest.navigation[0]?.label ?? manifest.appId}</div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Quick Management Links */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 800, marginBottom: "0.5rem" }}>Connected Multi-Plane Services</h2>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "1.25rem" }}>Manage tenant services across the UniERP ecosystem.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                <a href="http://localhost:4003" target="_blank" rel="noreferrer" style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem", color: "#ffffff", textDecoration: "none" }}>
                  <div style={{ fontWeight: 700, color: "#34d399", marginBottom: "0.25rem" }}>Tenant Apps (ERP) :4003 ↗</div>
                  <div style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>General ledger, inventory, manufacturing, HR, and POS.</div>
                </a>

                <a href="http://localhost:4004" target="_blank" rel="noreferrer" style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem", color: "#ffffff", textDecoration: "none" }}>
                  <div style={{ fontWeight: 700, color: "#10b981", marginBottom: "0.25rem" }}>Tenant Sites & Templates :4004 ↗</div>
                  <div style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>Live multi-tenant website server and site templates.</div>
                </a>

                <a href="http://localhost:4005" target="_blank" rel="noreferrer" style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem", color: "#ffffff", textDecoration: "none" }}>
                  <div style={{ fontWeight: 700, color: "#8b5cf6", marginBottom: "0.25rem" }}>Web Studio (Builder) :4005 ↗</div>
                  <div style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>Visual drag-and-drop website canvas and page builder.</div>
                </a>

                <a href="http://localhost:4007" target="_blank" rel="noreferrer" style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.5rem", color: "#ffffff", textDecoration: "none" }}>
                  <div style={{ fontWeight: 700, color: "#3b82f6", marginBottom: "0.25rem" }}>Marketplace :4007 ↗</div>
                  <div style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>Install core apps, industry verticals, and cloud connectors.</div>
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Subscription Tiers & Licensing</h2>
            <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "2rem" }}>Scale user seats, compute allocation, and module licenses.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {TIERS.map(tier => (
                <div key={tier.id} style={{ background: tier.isCurrent ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)", border: tier.isCurrent ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1.5rem", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{tier.name}</h3>
                    {tier.isCurrent && <span style={{ fontSize: "0.75rem", background: "#f59e0b", color: "#090d16", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>ACTIVE PLAN</span>}
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ffffff", margin: "0.5rem 0 1rem" }}>{tier.price}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "1.25rem" }}>
                    <div>👥 {tier.seats}</div>
                    <div>💾 {tier.storage}</div>
                    <div>⚡ {tier.apiLimit}</div>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem 0", flex: 1 }}>
                    {tier.features.map((f, i) => (
                      <li key={i} style={{ fontSize: "0.8125rem", color: "#d1d5db", marginBottom: "0.4rem" }}>
                        ✓ {f}
                      </li>
                    ))}
                  </ul>
                  <button style={{ width: "100%", padding: "0.625rem", background: tier.isCurrent ? "rgba(255,255,255,0.1)" : "#f59e0b", border: "none", borderRadius: "0.375rem", color: tier.isCurrent ? "#ffffff" : "#090d16", fontWeight: 700, cursor: "pointer" }}>
                    {tier.isCurrent ? "Manage Billing" : "Upgrade Plan"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>User Directory & RBAC</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Manage tenant staff, fine-grained role permissions, and multi-factor authentication.</p>
              </div>
              <button style={{ padding: "0.5rem 1rem", background: "#f59e0b", color: "#090d16", border: "none", borderRadius: "0.375rem", fontWeight: 700, cursor: "pointer" }}>
                + Invite User
              </button>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <th style={{ padding: "1rem 1.25rem", fontSize: "0.75rem", textTransform: "uppercase", color: "#9ca3af", fontWeight: 700 }}>User</th>
                    <th style={{ padding: "1rem 1.25rem", fontSize: "0.75rem", textTransform: "uppercase", color: "#9ca3af", fontWeight: 700 }}>Role Assignment</th>
                    <th style={{ padding: "1rem 1.25rem", fontSize: "0.75rem", textTransform: "uppercase", color: "#9ca3af", fontWeight: 700 }}>MFA Status</th>
                    <th style={{ padding: "1rem 1.25rem", fontSize: "0.75rem", textTransform: "uppercase", color: "#9ca3af", fontWeight: 700 }}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ fontWeight: 700, color: "#ffffff" }}>{u.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", color: "#d1d5db" }}>
                        {u.role}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", fontSize: "0.8125rem", color: "#34d399" }}>
                        🔒 {u.mfa}
                      </td>
                      <td style={{ padding: "1rem 1.25rem", fontSize: "0.8125rem", color: "#9ca3af" }}>
                        {u.lastActive}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(activeTab === "domains" || activeTab === "audit") && (
          <div style={{ padding: "3rem", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {activeTab === "domains" ? "Domain & DNS Router" : "SOC2 / HIPAA Compliance Audit Trail"}
            </h3>
            <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Active and running under Tenant Admin control plane.
            </p>
            <a href="http://localhost:4004/domains" style={{ color: "#f59e0b", fontSize: "0.875rem", fontWeight: 700, textDecoration: "none" }}>
              Open Multi-Tenant Domain Dispatcher →
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ marginTop: "auto", padding: "2rem", borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center", color: "#6b7280", fontSize: "0.8125rem" }}>
        UniERP Tenant Admin Console (SaaS Management) · Operating on Port 4006 (Plane 5)
      </footer>
    </div>
  );
}
