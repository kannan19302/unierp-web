"use client";
/**
 * OCC-02: Workforce Directory
 * Member directory, invitation workflows, department assignments, and authentication status.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Mail,
  Building,
  KeyRound,
  Filter,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  mfaEnabled: boolean;
  lastActive: string;
  joinedDate: string;
}

export default function UsersDirectoryPage() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([
    {
      id: "usr-01",
      name: "Kannan Admin",
      email: "kannan@acme-corp.com",
      department: "Executive",
      role: "Tenant Superadmin",
      status: "ACTIVE",
      mfaEnabled: true,
      lastActive: "Just now",
      joinedDate: "2024-01-15",
    },
    {
      id: "usr-02",
      name: "Sarah Jenkins",
      email: "s.jenkins@acme-corp.com",
      department: "Finance",
      role: "Financial Controller",
      status: "ACTIVE",
      mfaEnabled: true,
      lastActive: "15m ago",
      joinedDate: "2024-03-10",
    },
    {
      id: "usr-03",
      name: "David Chen",
      email: "d.chen@acme-corp.com",
      department: "Operations",
      role: "Operations Lead",
      status: "ACTIVE",
      mfaEnabled: true,
      lastActive: "2h ago",
      joinedDate: "2024-04-20",
    },
    {
      id: "usr-04",
      name: "Elena Rostova",
      email: "e.rostova@acme-corp.com",
      department: "Supply Chain",
      role: "Logistics Manager",
      status: "ACTIVE",
      mfaEnabled: false,
      lastActive: "1d ago",
      joinedDate: "2024-05-12",
    },
    {
      id: "usr-05",
      name: "Marcus Vance",
      email: "m.vance@acme-corp.com",
      department: "Engineering",
      role: "API Integration Specialist",
      status: "INVITED",
      mfaEnabled: false,
      lastActive: "Never",
      joinedDate: "2026-08-20",
    },
  ]);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDepartment, setNewDepartment] = useState("Finance");
  const [newRole, setNewRole] = useState("Staff Member");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept =
      departmentFilter === "ALL" || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newUser: UserRecord = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: newName,
      email: newEmail,
      department: newDepartment,
      role: newRole,
      status: "INVITED",
      mfaEnabled: false,
      lastActive: "Never",
      joinedDate: new Date().toISOString().split("T")[0],
    };

    setUsers([newUser, ...users]);
    setShowInviteModal(false);
    setNewName("");
    setNewEmail("");
  };

  const handleToggleStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id
          ? {
              ...u,
              status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
            }
          : u,
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
            OCC-02 · WORKFORCE
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/roles" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Roles &amp; Permissions
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Workforce Directory</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Manage member accounts, invitation lifecycles, role grants, and authentication posture.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
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
            <UserPlus size={16} /> Invite Member
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Total Members</span>
              <Users size={16} color="#3b82f6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{users.length} Users</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>
              {users.filter((u) => u.status === "ACTIVE").length} Active in directory
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>MFA Enrolled</span>
              <Shield size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
              {users.filter((u) => u.mfaEnabled).length} / {users.length}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>Hardware key &amp; TOTP</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Pending Invites</span>
              <Mail size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
              {users.filter((u) => u.status === "INVITED").length} Pending
            </div>
            <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem" }}>Awaiting signup</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
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
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "0.375rem",
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "0.875rem",
            }}
          >
            <option value="ALL">All Departments</option>
            <option value="Executive">Executive</option>
            <option value="Finance">Finance</option>
            <option value="Operations">Operations</option>
            <option value="Supply Chain">Supply Chain</option>
            <option value="Engineering">Engineering</option>
          </select>
        </div>

        {/* Directory Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Member</th>
                <th style={{ padding: "0.75rem 1rem" }}>Department</th>
                <th style={{ padding: "0.75rem 1rem" }}>Assigned Role</th>
                <th style={{ padding: "0.75rem 1rem" }}>MFA</th>
                <th style={{ padding: "0.75rem 1rem" }}>Last Active</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{u.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#d1d5db" }}>{u.department}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.45rem", borderRadius: "0.25rem", background: "rgba(255,255,255,0.06)", color: "#fbbf24", fontWeight: 600 }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {u.mfaEnabled ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#34d399", fontSize: "0.75rem", fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> Enabled
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#f87171", fontSize: "0.75rem" }}>
                        <XCircle size={14} /> Disabled
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#9ca3af", fontSize: "0.8125rem" }}>{u.lastActive}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: u.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : u.status === "INVITED" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                        color: u.status === "ACTIVE" ? "#34d399" : u.status === "INVITED" ? "#fbbf24" : "#f87171",
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: u.status === "ACTIVE" ? "#f87171" : "#34d399",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
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
            onSubmit={handleInvite}
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
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Invite Workforce Member</h2>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Full Name</label>
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jordan Reed"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Work Email</label>
              <input
                required
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jordan.reed@acme-corp.com"
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
                <option value="Executive">Executive</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Assigned Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              >
                <option value="Staff Member">Staff Member</option>
                <option value="Financial Controller">Financial Controller</option>
                <option value="Operations Lead">Operations Lead</option>
                <option value="Logistics Manager">Logistics Manager</option>
                <option value="Tenant Superadmin">Tenant Superadmin</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                style={{ background: "transparent", border: "1px solid #374151", color: "#9ca3af", padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.5rem 1rem", borderRadius: "0.375rem", fontWeight: 700, cursor: "pointer" }}
              >
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
