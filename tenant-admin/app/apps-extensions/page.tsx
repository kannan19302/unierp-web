"use client";
/**
 * OCC-10: App & Extension Management
 * Tenant-scoped application allowlists, marketplace extension installations,
 * permission scope consents, auto-update rings, and configuration.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  Puzzle,
  Download,
  CheckCircle,
  Sliders,
  AlertCircle,
  Trash2,
  ExternalLink,
  Shield,
  Star,
  RefreshCw,
  Power,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface InstalledExtension {
  id: string;
  extensionKey: string;
  name: string;
  description: string;
  publisher: string;
  installedVersion: string;
  latestVersion: string;
  category: string;
  permissionsGranted: string[];
  installedAt: string;
  updateChannel: "stable" | "beta";
  autoUpdate: boolean;
  status: "ACTIVE" | "PAUSED" | "UPDATE_AVAILABLE";
  healthStatus: "OK" | "WARNING" | "ERROR";
}

interface MarketplaceAppListing {
  key: string;
  name: string;
  description: string;
  publisher: string;
  version: string;
  category: string;
  rating: number;
  installCount: number;
  requiredPermissions: string[];
  price: string;
}

export default function AppsExtensionsPage() {
  const [activeTab, setActiveTab] = useState<"installed" | "catalog">("installed");

  const [installed, setInstalled] = useState<InstalledExtension[]>([
    {
      id: "inst-01",
      extensionKey: "ext-stripe-recon",
      name: "Stripe Automated Reconciliation",
      description: "Match payout batches and gateway fees directly into General Ledger entries.",
      publisher: "UniERP Financial Suite",
      installedVersion: "2.1.0",
      latestVersion: "2.1.0",
      category: "Finance",
      permissionsGranted: ["finance.read", "finance.write", "banking.reconcile"],
      installedAt: "60d ago",
      updateChannel: "stable",
      autoUpdate: true,
      status: "ACTIVE",
      healthStatus: "OK",
    },
    {
      id: "inst-02",
      extensionKey: "ext-slack-alerts",
      name: "Slack & Microsoft Teams Notifications",
      description: "Dispatch urgent workflow approval requests and system incident pings to team channels.",
      publisher: "UniERP Connect",
      installedVersion: "1.4.0",
      latestVersion: "1.4.2",
      category: "Communication",
      permissionsGranted: ["notifications.send", "workflow.read"],
      installedAt: "30d ago",
      updateChannel: "stable",
      autoUpdate: false,
      status: "UPDATE_AVAILABLE",
      healthStatus: "OK",
    },
    {
      id: "inst-03",
      extensionKey: "ext-docusign-bridge",
      name: "DocuSign e-Signature Orchestrator",
      description: "Embed e-signatures into procurement POs, customer quotes, and employment contracts.",
      publisher: "Signatures Hub",
      installedVersion: "1.8.0",
      latestVersion: "1.8.0",
      category: "Documents",
      permissionsGranted: ["documents.read", "documents.sign", "procurement.read"],
      installedAt: "10d ago",
      updateChannel: "stable",
      autoUpdate: true,
      status: "ACTIVE",
      healthStatus: "OK",
    },
  ]);

  const [catalog, setCatalog] = useState<MarketplaceAppListing[]>([
    {
      key: "ext-salesforce-sync",
      name: "Salesforce CRM Two-Way Sync",
      description: "Bi-directional customer, contract, and invoice synchronization with automated conflict resolution.",
      publisher: "Enterprise Bridges Ltd",
      version: "3.0.1",
      category: "CRM & Sales",
      rating: 4.7,
      installCount: 890,
      requiredPermissions: ["crm.read", "crm.write", "sales.read", "sales.write"],
      price: "$49/mo",
    },
    {
      key: "ext-fedex-shipping",
      name: "FedEx & DHL Global Logistics",
      description: "Real-time rate calculation, automatic label generation, and warehouse tracking updates.",
      publisher: "Logistics Pro",
      version: "2.0.4",
      category: "Supply Chain",
      rating: 4.6,
      installCount: 1100,
      requiredPermissions: ["inventory.read", "shipping.generate", "orders.read"],
      price: "$19/mo",
    },
  ]);

  const [installingApp, setInstallingApp] = useState<MarketplaceAppListing | null>(null);

  const handleToggle = (id: string) => {
    setInstalled(
      installed.map((e) =>
        e.id === id ? { ...e, status: e.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : e,
      ),
    );
  };

  const handleUpgrade = (id: string) => {
    setInstalled(
      installed.map((e) =>
        e.id === id ? { ...e, installedVersion: e.latestVersion, status: "ACTIVE" } : e,
      ),
    );
  };

  const handleUninstall = (id: string) => {
    const item = installed.find((e) => e.id === id);
    if (!item) return;
    setInstalled(installed.filter((e) => e.id !== id));
  };

  const confirmInstall = (app: MarketplaceAppListing) => {
    const newInstall: InstalledExtension = {
      id: `inst-${Date.now()}`,
      extensionKey: app.key,
      name: app.name,
      description: app.description,
      publisher: app.publisher,
      installedVersion: app.version,
      latestVersion: app.version,
      category: app.category,
      permissionsGranted: app.requiredPermissions,
      installedAt: "Just now",
      updateChannel: "stable",
      autoUpdate: true,
      status: "ACTIVE",
      healthStatus: "OK",
    };

    setInstalled([newInstall, ...installed]);
    setCatalog(catalog.filter((c) => c.key !== app.key));
    setInstallingApp(null);
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
            OCC-10 · EXTENSIONS
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Apps & Extension Management</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Install, configure, and govern certified marketplace integrations, ERP extensions, and webhook bridges.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Installed Apps</span>
              <Puzzle size={16} color="#3b82f6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{installed.length} Installed</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>
              {installed.filter((e) => e.status === "ACTIVE").length} Active in runtime
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Updates Available</span>
              <RefreshCw size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
              {installed.filter((e) => e.status === "UPDATE_AVAILABLE").length} Updates
            </div>
            <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem" }}>Verified compatible</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Marketplace Certified</span>
              <Shield size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>100% Passed</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>Sandboxed &amp; signed</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            onClick={() => setActiveTab("installed")}
            style={{
              background: activeTab === "installed" ? "rgba(245,158,11,0.15)" : "transparent",
              border: activeTab === "installed" ? "1px solid #f59e0b" : "1px solid transparent",
              color: activeTab === "installed" ? "#fbbf24" : "#9ca3af",
              padding: "0.4rem 1rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Installed Applications ({installed.length})
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            style={{
              background: activeTab === "catalog" ? "rgba(245,158,11,0.15)" : "transparent",
              border: activeTab === "catalog" ? "1px solid #f59e0b" : "1px solid transparent",
              color: activeTab === "catalog" ? "#fbbf24" : "#9ca3af",
              padding: "0.4rem 1rem",
              borderRadius: "0.375rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Marketplace Catalog ({catalog.length})
          </button>
        </div>

        {/* Tab 1: Installed */}
        {activeTab === "installed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {installed.map((ext) => (
              <div
                key={ext.id}
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
                <div style={{ maxWidth: "65%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{ext.name}</h3>
                    <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.06)", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", color: "#9ca3af" }}>
                      v{ext.installedVersion}
                    </span>
                    <span style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "0.25rem",
                      background: ext.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : ext.status === "UPDATE_AVAILABLE" ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.15)",
                      color: ext.status === "ACTIVE" ? "#34d399" : ext.status === "UPDATE_AVAILABLE" ? "#fbbf24" : "#9ca3af",
                    }}>
                      {ext.status === "UPDATE_AVAILABLE" ? `Update v${ext.latestVersion} available` : ext.status}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", color: "#9ca3af" }}>{ext.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
                    <span>Publisher: {ext.publisher}</span>
                    <span>·</span>
                    <span>Category: {ext.category}</span>
                    <span>·</span>
                    <span>Scopes: {ext.permissionsGranted.join(", ")}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {ext.status === "UPDATE_AVAILABLE" && (
                    <button
                      onClick={() => handleUpgrade(ext.id)}
                      style={{
                        background: "#f59e0b",
                        color: "#000",
                        border: "none",
                        padding: "0.4rem 0.75rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Upgrade v{ext.latestVersion}
                    </button>
                  )}
                  <button
                    onClick={() => handleToggle(ext.id)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: ext.status === "ACTIVE" ? "#f87171" : "#34d399",
                      padding: "0.4rem 0.75rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <Power size={12} /> {ext.status === "ACTIVE" ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => handleUninstall(ext.id)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#f87171",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.375rem",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                    title="Uninstall"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Catalog */}
        {activeTab === "catalog" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>
            {catalog.map((app) => (
              <div
                key={app.key}
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
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{app.name}</h3>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{app.publisher}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", background: "rgba(245,158,11,0.15)", color: "#fbbf24", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                      {app.price}
                    </span>
                  </div>
                  <p style={{ margin: "0.5rem 0", fontSize: "0.8125rem", color: "#d1d5db" }}>{app.description}</p>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.75rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.15rem", color: "#fbbf24" }}>
                      <Star size={12} fill="#fbbf24" /> {app.rating}
                    </span>
                    <span>·</span>
                    <span>{app.installCount}+ installs</span>
                  </div>
                </div>

                <button
                  onClick={() => setInstallingApp(app)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.35rem",
                    background: "#f59e0b",
                    color: "#000",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                  }}
                >
                  <Download size={14} /> Install &amp; Authorize
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Scope Consent Modal */}
      {installingApp && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            background: "#111827",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.75rem",
            padding: "1.75rem",
            width: "100%",
            maxWidth: "480px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={22} color="#f59e0b" />
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Authorize Scope Permissions</h2>
            </div>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#9ca3af" }}>
              <strong>{installingApp.name}</strong> by {installingApp.publisher} requests the following access:
            </p>

            <div style={{ background: "#1f2937", borderRadius: "0.375rem", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {installingApp.requiredPermissions.map((perm) => (
                <div key={perm} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem" }}>
                  <CheckCircle size={14} color="#10b981" />
                  <span style={{ fontFamily: "monospace", color: "#fbbf24" }}>{perm}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => setInstallingApp(null)}
                style={{ background: "transparent", border: "1px solid #374151", color: "#9ca3af", padding: "0.5rem 1rem", borderRadius: "0.375rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmInstall(installingApp)}
                style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.5rem 1rem", borderRadius: "0.375rem", fontWeight: 700, cursor: "pointer" }}
              >
                Grant &amp; Install
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
