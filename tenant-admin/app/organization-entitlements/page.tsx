"use client";
/**
 * OCC-09: Organization Entitlements
 * Tenant-scoped entitlement allocation, seat capacity, user license assignments,
 * and auto-provisioning rules by department/role.
 */
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  Users,
  ShieldCheck,
  Zap,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  Sliders,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface EntitlementItem {
  id: string;
  name: string;
  code: string;
  type: "SEAT_BASED" | "FEATURE_FLAG" | "USAGE_QUOTA";
  totalQuota: number | string;
  allocated: number;
  available: number | string;
  unit: string;
}

interface LicenseAllocation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  assignedEntitlements: string[];
  allocatedAt: string;
  lastActiveAt: string;
  status: "ACTIVE" | "INACTIVE" | "RESERVED";
}

interface AssignmentRule {
  id: string;
  name: string;
  targetType: "DEPARTMENT" | "ROLE";
  targetValue: string;
  entitlementCodes: string[];
  priority: number;
  enabled: boolean;
}

export default function OrganizationEntitlementsPage() {
  const [activeTab, setActiveTab] = useState<"summary" | "allocations" | "rules">("summary");
  const [allocations, setAllocations] = useState<LicenseAllocation[]>([
    {
      id: "alc-101",
      userId: "usr-01",
      userName: "Sarah Jenkins",
      userEmail: "s.jenkins@acme-corp.com",
      department: "Finance",
      assignedEntitlements: ["core-erp", "ai-copilot", "advanced-analytics"],
      allocatedAt: new Date(Date.now() - 3600_000 * 24 * 30).toISOString(),
      lastActiveAt: "15m ago",
      status: "ACTIVE",
    },
    {
      id: "alc-102",
      userId: "usr-02",
      userName: "David Chen",
      userEmail: "d.chen@acme-corp.com",
      department: "Operations",
      assignedEntitlements: ["core-erp", "ai-copilot"],
      allocatedAt: new Date(Date.now() - 3600_000 * 24 * 14).toISOString(),
      lastActiveAt: "2h ago",
      status: "ACTIVE",
    },
    {
      id: "alc-103",
      userId: "usr-03",
      userName: "Elena Rostova",
      userEmail: "e.rostova@acme-corp.com",
      department: "Supply Chain",
      assignedEntitlements: ["core-erp"],
      allocatedAt: new Date(Date.now() - 3600_000 * 24 * 45).toISOString(),
      lastActiveAt: "60d ago",
      status: "INACTIVE",
    },
  ]);

  const [entitlements, setEntitlements] = useState<EntitlementItem[]>([
    {
      id: "ent-1",
      name: "Core ERP Standard User",
      code: "core-erp",
      type: "SEAT_BASED",
      totalQuota: 150,
      allocated: 112,
      available: 38,
      unit: "seats",
    },
    {
      id: "ent-2",
      name: "AI Copilot & Autonomous Agents",
      code: "ai-copilot",
      type: "SEAT_BASED",
      totalQuota: 50,
      allocated: 42,
      available: 8,
      unit: "seats",
    },
    {
      id: "ent-3",
      name: "Advanced Financial Analytics",
      code: "advanced-analytics",
      type: "SEAT_BASED",
      totalQuota: 75,
      allocated: 60,
      available: 15,
      unit: "seats",
    },
    {
      id: "ent-4",
      name: "Multi-Entity Consolidation",
      code: "multi-entity",
      type: "FEATURE_FLAG",
      totalQuota: "Unlimited",
      allocated: 1,
      available: "Unlimited",
      unit: "tenant-wide",
    },
    {
      id: "ent-5",
      name: "API Platform & Webhooks",
      code: "api-gateway",
      type: "USAGE_QUOTA",
      totalQuota: 500000,
      allocated: 184200,
      available: 315800,
      unit: "req/mo",
    },
  ]);

  const [rules, setRules] = useState<AssignmentRule[]>([
    {
      id: "rule-1",
      name: "Finance Department Auto-Provisioning",
      targetType: "DEPARTMENT",
      targetValue: "Finance",
      entitlementCodes: ["core-erp", "advanced-analytics"],
      priority: 1,
      enabled: true,
    },
    {
      id: "rule-2",
      name: "Executive Leadership Bundle",
      targetType: "ROLE",
      targetValue: "C-Level",
      entitlementCodes: ["core-erp", "ai-copilot", "advanced-analytics"],
      priority: 2,
      enabled: true,
    },
  ]);

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("Finance");
  const [selectedEntitlements, setSelectedEntitlements] = useState<string[]>(["core-erp"]);

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newAlloc: LicenseAllocation = {
      id: `alc-${Date.now()}`,
      userId: `usr-${Date.now().toString().slice(-4)}`,
      userName: newUserName,
      userEmail: newUserEmail,
      department: newDepartment,
      assignedEntitlements: selectedEntitlements,
      allocatedAt: new Date().toISOString(),
      lastActiveAt: "Just now",
      status: "ACTIVE",
    };

    setAllocations([newAlloc, ...allocations]);
    setShowAllocateModal(false);
    setNewUserName("");
    setNewUserEmail("");
  };

  const handleReclaim = (id: string) => {
    setAllocations(
      allocations.map((a) =>
        a.id === id ? { ...a, status: "INACTIVE", assignedEntitlements: [] } : a,
      ),
    );
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
            OCC-09 · ENTITLEMENTS
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/billing" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Billing
          </Link>
          <Link href="/apps-extensions" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Apps & Extensions
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Organization Entitlements & Licenses</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Manage subscription-granted seat capacity, feature bundles, and member license allocations.
            </p>
          </div>
          <button
            onClick={() => setShowAllocateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#f59e0b",
              color: "#000",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Allocate License
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Plan Edition</span>
              <ShieldCheck size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>Enterprise Plus</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>Active · Annual Contract</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Core Seats Assigned</span>
              <Users size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>112 / 150</div>
            <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem" }}>38 seats available</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>AI Copilot Seats</span>
              <Sparkles size={16} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>42 / 50</div>
            <div style={{ fontSize: "0.75rem", color: "#8b5cf6", marginTop: "0.25rem" }}>8 seats remaining</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Reclaimable (Inactive)</span>
              <RefreshCw size={16} color="#3b82f6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>1 Member</div>
            <div style={{ fontSize: "0.75rem", color: "#3b82f6", marginTop: "0.25rem" }}>Inactive &gt; 30 days</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
          {(["summary", "allocations", "rules"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "rgba(245,158,11,0.15)" : "transparent",
                border: activeTab === tab ? "1px solid #f59e0b" : "1px solid transparent",
                color: activeTab === tab ? "#fbbf24" : "#9ca3af",
                padding: "0.4rem 1rem",
                borderRadius: "0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                textTransform: "capitalize",
                cursor: "pointer",
              }}
            >
              {tab === "summary" ? "Entitlement Catalog" : tab === "allocations" ? `Member Allocations (${allocations.length})` : "Auto-Assignment Rules"}
            </button>
          ))}
        </div>

        {/* Tab 1: Entitlements Catalog */}
        {activeTab === "summary" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>
            {entitlements.map((ent) => (
              <div
                key={ent.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{ent.name}</h3>
                    <span style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.5rem",
                      borderRadius: "0.25rem",
                      background: ent.type === "SEAT_BASED" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                      color: ent.type === "SEAT_BASED" ? "#60a5fa" : "#34d399",
                    }}>
                      {ent.type}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af", fontFamily: "monospace" }}>
                    code: {ent.code}
                  </p>
                </div>

                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#9ca3af" }}>
                    {typeof ent.totalQuota === "number" ? `${ent.allocated} / ${ent.totalQuota} ${ent.unit}` : "Unlimited Grant"}
                  </span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fbbf24" }}>
                    {ent.available} available
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Allocations Table */}
        {activeTab === "allocations" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Member</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Department</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Assigned Entitlements</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Last Active</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{a.userName}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{a.userEmail}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#d1d5db" }}>{a.department}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {a.assignedEntitlements.length === 0 ? (
                          <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>None</span>
                        ) : (
                          a.assignedEntitlements.map((code) => (
                            <span
                              key={code}
                              style={{
                                fontSize: "0.6875rem",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "0.25rem",
                                background: "rgba(245,158,11,0.15)",
                                color: "#fbbf24",
                                fontWeight: 600,
                              }}
                            >
                              {code}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#9ca3af", fontSize: "0.8125rem" }}>{a.lastActiveAt}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "0.25rem",
                          background: a.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                          color: a.status === "ACTIVE" ? "#34d399" : "#f87171",
                        }}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      {a.status === "ACTIVE" && (
                        <button
                          onClick={() => handleReclaim(a.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#f87171",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          Reclaim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Rules */}
        {activeTab === "rules" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {rules.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  padding: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sliders size={18} color="#f59e0b" />
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{r.name}</h3>
                  </div>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: "#9ca3af" }}>
                    When member {r.targetType} matches &quot;{r.targetValue}&quot; → Auto-grant: {r.entitlementCodes.join(", ")}
                  </p>
                </div>
                <span style={{ fontSize: "0.75rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.2rem 0.6rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                  Active (Priority #{r.priority})
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <form
            onSubmit={handleAllocate}
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Allocate Member License</h2>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Full Name</label>
              <input
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Work Email</label>
              <input
                required
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="alex.morgan@company.com"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Department</label>
              <select
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              >
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setShowAllocateModal(false)}
                style={{ background: "transparent", border: "1px solid #374151", color: "#9ca3af", padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.5rem 1rem", borderRadius: "0.375rem", fontWeight: 700, cursor: "pointer" }}
              >
                Grant License
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
