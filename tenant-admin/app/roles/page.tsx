"use client";
/**
 * OCC-03: Access Governance & RBAC
 * Tenant-scoped role definitions, granular permission matrices, and custom role builder.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Key,
  Lock,
  Plus,
  CheckCircle,
  Users,
  Sliders,
  Check,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface RoleDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

const ALL_AVAILABLE_SCOPES = [
  { group: "Finance", permissions: ["finance.read", "finance.write", "finance.approve", "banking.reconcile"] },
  { group: "Sales & CRM", permissions: ["crm.read", "crm.write", "quotes.create", "orders.approve"] },
  { group: "Inventory & Supply", permissions: ["inventory.read", "inventory.manage", "warehouse.transfer", "po.create"] },
  { group: "Administration", permissions: ["admin.users.read", "admin.users.manage", "admin.roles.manage", "admin.settings.update"] },
  { group: "AI & Automations", permissions: ["ai.chat", "ai.admin.manage", "workflow.execute", "workflow.configure"] },
];

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([
    {
      id: "role-1",
      name: "Tenant Superadmin",
      code: "ROLE_SUPERADMIN",
      description: "Unrestricted administrative authority across all organization resources and security policies.",
      isSystem: true,
      memberCount: 1,
      permissions: ALL_AVAILABLE_SCOPES.flatMap((g) => g.permissions),
    },
    {
      id: "role-2",
      name: "Financial Controller",
      code: "ROLE_FINANCE_LEAD",
      description: "Full access to general ledger, fiscal reporting, bank reconciliation, and invoice approvals.",
      isSystem: true,
      memberCount: 2,
      permissions: ["finance.read", "finance.write", "finance.approve", "banking.reconcile", "admin.users.read"],
    },
    {
      id: "role-3",
      name: "Operations Lead",
      code: "ROLE_OPS_LEAD",
      description: "Manages fulfillment pipelines, warehouse transfers, and workflow execution.",
      isSystem: false,
      memberCount: 4,
      permissions: ["inventory.read", "inventory.manage", "warehouse.transfer", "po.create", "workflow.execute"],
    },
    {
      id: "role-4",
      name: "Standard Business User",
      code: "ROLE_STANDARD_USER",
      description: "Read-only visibility into department operational dashboards and assigned tasks.",
      isSystem: true,
      memberCount: 18,
      permissions: ["finance.read", "crm.read", "inventory.read", "ai.chat"],
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "finance.read",
    "crm.read",
  ]);

  const togglePerm = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    const newRole: RoleDefinition = {
      id: `role-${Date.now()}`,
      name: newRoleName,
      code: `ROLE_${newRoleName.toUpperCase().replace(/\s+/g, "_")}`,
      description: newRoleDesc || "Custom organization role.",
      isSystem: false,
      memberCount: 0,
      permissions: selectedPermissions,
    };

    setRoles([...roles, newRole]);
    setShowCreateModal(false);
    setNewRoleName("");
    setNewRoleDesc("");
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
            OCC-03 · RBAC
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/users" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Workforce Directory
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Roles &amp; Permission Governance</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Define role-based access control policies, least-privilege scopes, and custom delegation matrices.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
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
            <Plus size={16} /> Create Custom Role
          </button>
        </div>

        {/* Roles Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
          {roles.map((role) => (
            <div
              key={role.id}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Shield size={18} color="#f59e0b" />
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{role.name}</h3>
                  </div>
                  <span style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.45rem",
                    borderRadius: "0.25rem",
                    background: role.isSystem ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                    color: role.isSystem ? "#60a5fa" : "#34d399",
                  }}>
                    {role.isSystem ? "System Preset" : "Custom"}
                  </span>
                </div>

                <p style={{ margin: "0.25rem 0 0.75rem", fontSize: "0.8125rem", color: "#9ca3af" }}>{role.description}</p>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace", marginBottom: "0.75rem" }}>
                  {role.code}
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600, marginBottom: "0.35rem" }}>
                    Granted Scopes ({role.permissions.length}):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                    {role.permissions.slice(0, 6).map((perm) => (
                      <span
                        key={perm}
                        style={{
                          fontSize: "0.6875rem",
                          padding: "0.1rem 0.35rem",
                          borderRadius: "0.25rem",
                          background: "rgba(255,255,255,0.06)",
                          color: "#fbbf24",
                          fontFamily: "monospace",
                        }}
                      >
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 6 && (
                      <span style={{ fontSize: "0.6875rem", color: "#9ca3af", padding: "0.1rem 0.35rem" }}>
                        +{role.permissions.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", color: "#9ca3af" }}>
                  <Users size={14} /> {role.memberCount} members assigned
                </span>
                <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>Active</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create Role Modal */}
      {showCreateModal && (
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
            onSubmit={handleCreateRole}
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Create Custom Role</h2>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Role Title</label>
              <input
                required
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Regional Procurement Auditor"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Description</label>
              <input
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="What responsibilities does this role encompass?"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.5rem" }}>Permission Scopes</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {ALL_AVAILABLE_SCOPES.map((group) => (
                  <div key={group.group} style={{ background: "rgba(255,255,255,0.02)", padding: "0.75rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "#fbbf24", marginBottom: "0.35rem" }}>{group.group}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35rem" }}>
                      {group.permissions.map((perm) => (
                        <label key={perm} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#d1d5db", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm)}
                            onChange={() => togglePerm(perm)}
                          />
                          <span style={{ fontFamily: "monospace" }}>{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "transparent", border: "1px solid #374151", color: "#9ca3af", padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.5rem 1rem", borderRadius: "0.375rem", fontWeight: 700, cursor: "pointer" }}
              >
                Save Role
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
