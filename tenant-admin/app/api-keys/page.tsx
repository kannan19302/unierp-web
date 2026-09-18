"use client";
/**
 * OCC-12: Developer & API Access
 * Organization API key lifecycle, credential secrets, OAuth applications, and webhook configurations.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  Code,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Globe,
  Lock,
  ExternalLink,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimitReqSec: number;
  createdAt: string;
  lastUsedAt: string;
  status: "ACTIVE" | "REVOKED";
}

export default function ApiKeysManagementPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([
    {
      id: "key-1",
      name: "Production Billing Sync Gateway",
      keyPrefix: "ue_live_8f9a...",
      scopes: ["finance.read", "finance.write", "banking.reconcile"],
      rateLimitReqSec: 50,
      createdAt: "2026-06-10",
      lastUsedAt: "2m ago",
      status: "ACTIVE",
    },
    {
      id: "key-2",
      name: "Shopify E-Commerce Connector",
      keyPrefix: "ue_live_3c1b...",
      scopes: ["inventory.read", "orders.approve", "crm.write"],
      rateLimitReqSec: 20,
      createdAt: "2026-07-01",
      lastUsedAt: "1h ago",
      status: "ACTIVE",
    },
    {
      id: "key-3",
      name: "Staging Pipeline Test Token",
      keyPrefix: "ue_test_90e4...",
      scopes: ["all.read"],
      rateLimitReqSec: 10,
      createdAt: "2026-08-01",
      lastUsedAt: "5d ago",
      status: "ACTIVE",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    const secret = `ue_live_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 18)}`;
    const newRecord: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      name: newKeyName,
      keyPrefix: `${secret.slice(0, 12)}...`,
      scopes: ["finance.read", "inventory.read"],
      rateLimitReqSec: 25,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsedAt: "Never",
      status: "ACTIVE",
    };

    setKeys([newRecord, ...keys]);
    setGeneratedSecret(secret);
  };

  const handleRevoke = (id: string) => {
    setKeys(keys.map((k) => (k.id === id ? { ...k, status: "REVOKED" } : k)));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            OCC-12 · DEVELOPERS
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/apps-extensions" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Apps &amp; Extensions
          </Link>
          <Link href="/audit" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Audit Trail
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Developer &amp; API Access</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Provision programmatic REST API tokens, manage webhook subscribers, and inspect authorization scopes.
            </p>
          </div>
          <button
            onClick={() => {
              setGeneratedSecret(null);
              setShowCreateModal(true);
            }}
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
            <Plus size={16} /> Generate API Key
          </button>
        </div>

        {/* API Keys Table */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Key Name &amp; Prefix</th>
                <th style={{ padding: "0.75rem 1rem" }}>Authorized Scopes</th>
                <th style={{ padding: "0.75rem 1rem" }}>Rate Limit</th>
                <th style={{ padding: "0.75rem 1rem" }}>Last Active</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{k.name}</div>
                    <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#fbbf24" }}>{k.keyPrefix}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {k.scopes.map((s) => (
                        <span key={s} style={{ fontSize: "0.6875rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", background: "rgba(255,255,255,0.06)", color: "#9ca3af", fontFamily: "monospace" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#d1d5db" }}>
                    {k.rateLimitReqSec} req/sec
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#9ca3af", fontSize: "0.8125rem" }}>
                    {k.lastUsedAt}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        background: k.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: k.status === "ACTIVE" ? "#34d399" : "#f87171",
                      }}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    {k.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRevoke(k.id)}
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
                        Revoke Key
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Generate Modal */}
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
          <div
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
            {!generatedSecret ? (
              <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Create New API Key</h2>
                <div>
                  <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Key Description</label>
                  <input
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Warehouse Inventory Poller"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
                  />
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
                    Generate Key
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#34d399" }}>API Key Generated</h2>
                <p style={{ margin: 0, fontSize: "0.8125rem", color: "#9ca3af" }}>
                  Copy your secret key now. You will not be able to view this token again.
                </p>
                <div style={{
                  background: "#030712",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.375rem",
                  padding: "0.75rem",
                  fontFamily: "monospace",
                  fontSize: "0.8125rem",
                  color: "#fbbf24",
                  wordBreak: "break-all",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <span>{generatedSecret}</span>
                  <button
                    onClick={() => copyToClipboard(generatedSecret)}
                    style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}
                  >
                    {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: "#f59e0b", color: "#000", border: "none", padding: "0.5rem 1rem", borderRadius: "0.375rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
