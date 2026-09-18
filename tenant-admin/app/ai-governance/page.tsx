"use client";
/**
 * OCC-21: AI Governance & Agent Operations
 * Tenant-scoped model allowlists, AI agent definitions, tool bindings,
 * RAG knowledge grounding, token budget ceilings, and evaluation benchmarks.
 */
import React, { useState } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  Bot,
  Database,
  ShieldCheck,
  Zap,
  Plus,
  Play,
  Sliders,
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity,
  Cpu,
  Power,
} from "lucide-react";
import { BrandMark } from "@kannan19302/ui/components";
import { ThemeQuickToggle } from "@kannan19302/ui/theme";

interface TenantAiAgent {
  id: string;
  name: string;
  code: string;
  description: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  toolsBound: string[];
  knowledgeSourcesBound: string[];
  allowedRoles: string[];
  status: "ACTIVE" | "PAUSED" | "EVALUATING";
  totalInvocations: number;
  avgLatencyMs: number;
}

interface TenantKnowledgeSource {
  id: string;
  name: string;
  type: string;
  documentCount: number;
  totalChunks: number;
  embeddingModel: string;
  lastSyncedAt: string;
  syncStatus: string;
}

interface TenantAiEvaluation {
  id: string;
  agentId: string;
  agentName: string;
  testCasesTotal: number;
  testCasesPassed: number;
  accuracyScore: number;
  safetyScore: number;
  latencyP95Ms: number;
  ranAt: string;
  status: "PASSED" | "FAILED" | "WARNING";
}

export default function AiGovernancePage() {
  const [activeTab, setActiveTab] = useState<"agents" | "knowledge" | "evaluations" | "budget">("agents");

  const [agents, setAgents] = useState<TenantAiAgent[]>([
    {
      id: "agt-01",
      name: "Financial Statement & Audit Copilot",
      code: "fin-audit-copilot",
      description: "Analyzes balance sheets, flags variance anomalies, and prepares GAAP/IFRS notes.",
      model: "llama3.3:70b",
      temperature: 0.1,
      systemPrompt: "You are a senior financial auditor assistant. Verify arithmetic accuracy and cite GL accounts.",
      toolsBound: ["query_general_ledger", "reconcile_bank_statement", "fetch_tax_rules"],
      knowledgeSourcesBound: ["ks-01", "ks-02"],
      allowedRoles: ["FINANCE_ADMIN", "ACCOUNTANT", "CFO"],
      status: "ACTIVE",
      totalInvocations: 1240,
      avgLatencyMs: 420,
    },
    {
      id: "agt-02",
      name: "Procurement Vendor RFP Evaluator",
      code: "procure-evaluator",
      description: "Scores supplier bids against contractual SLA criteria, warranty terms, and pricing matrices.",
      model: "mistral-large:2407",
      temperature: 0.2,
      systemPrompt: "You evaluate vendor proposals strictly against procurement guidelines and matrix scorecards.",
      toolsBound: ["read_vendor_quote", "compare_item_pricing", "draft_vendor_clarification"],
      knowledgeSourcesBound: ["ks-03"],
      allowedRoles: ["PROCUREMENT_MANAGER", "BUYER"],
      status: "ACTIVE",
      totalInvocations: 680,
      avgLatencyMs: 650,
    },
    {
      id: "agt-03",
      name: "Inventory Demand & Replenishment Advisor",
      code: "inventory-replenish-advisor",
      description: "Forecasts safety stock requirements based on seasonal lead times and historical sales velocity.",
      model: "qwen2.5:72b",
      temperature: 0.2,
      systemPrompt: "You analyze SKU stock movement, warehouse capacity constraints, and suggest PO reorder points.",
      toolsBound: ["get_stock_levels", "get_sales_velocity", "create_draft_purchase_order"],
      knowledgeSourcesBound: ["ks-02"],
      allowedRoles: ["WAREHOUSE_MANAGER", "OPERATIONS_LEAD"],
      status: "ACTIVE",
      totalInvocations: 920,
      avgLatencyMs: 380,
    },
  ]);

  const [knowledgeSources, setKnowledgeSources] = useState<TenantKnowledgeSource[]>([
    {
      id: "ks-01",
      name: "Corporate Accounting Policies & Chart of Accounts",
      type: "Policy Manual",
      documentCount: 14,
      totalChunks: 1840,
      embeddingModel: "bge-large-en-v1.5",
      lastSyncedAt: "12h ago",
      syncStatus: "READY",
    },
    {
      id: "ks-02",
      name: "ERP Enterprise Data Dictionary & GL Schemas",
      type: "Database Schema",
      documentCount: 8,
      totalChunks: 1220,
      embeddingModel: "bge-large-en-v1.5",
      lastSyncedAt: "6h ago",
      syncStatus: "READY",
    },
    {
      id: "ks-03",
      name: "Standard Procurement Terms & Supplier Code of Conduct",
      type: "Document Bundle",
      documentCount: 5,
      totalChunks: 740,
      embeddingModel: "bge-large-en-v1.5",
      lastSyncedAt: "24h ago",
      syncStatus: "READY",
    },
  ]);

  const [evaluations, setEvaluations] = useState<TenantAiEvaluation[]>([
    {
      id: "eval-101",
      agentId: "agt-01",
      agentName: "Financial Statement & Audit Copilot",
      testCasesTotal: 50,
      testCasesPassed: 49,
      accuracyScore: 98.0,
      safetyScore: 100.0,
      latencyP95Ms: 510,
      ranAt: "24h ago",
      status: "PASSED",
    },
    {
      id: "eval-102",
      agentId: "agt-02",
      agentName: "Procurement Vendor RFP Evaluator",
      testCasesTotal: 30,
      testCasesPassed: 29,
      accuracyScore: 96.6,
      safetyScore: 100.0,
      latencyP95Ms: 720,
      ranAt: "48h ago",
      status: "PASSED",
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDesc, setNewAgentDesc] = useState("");
  const [newAgentModel, setNewAgentModel] = useState("llama3.3:70b");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");

  const handleToggleAgent = (id: string) => {
    setAgents(
      agents.map((a) =>
        a.id === id ? { ...a, status: a.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : a,
      ),
    );
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName) return;

    const newAgent: TenantAiAgent = {
      id: `agt-${Date.now()}`,
      name: newAgentName,
      code: newAgentName.toLowerCase().replace(/\s+/g, "-"),
      description: newAgentDesc || "Custom AI Copilot Assistant",
      model: newAgentModel,
      temperature: 0.2,
      systemPrompt: newAgentPrompt || "You are an enterprise AI assistant for UniERP.",
      toolsBound: ["query_general_ledger"],
      knowledgeSourcesBound: ["ks-01"],
      allowedRoles: ["ADMIN"],
      status: "ACTIVE",
      totalInvocations: 0,
      avgLatencyMs: 0,
    };

    setAgents([newAgent, ...agents]);
    setShowCreateModal(false);
    setNewAgentName("");
    setNewAgentDesc("");
    setNewAgentPrompt("");
  };

  const handleRunEval = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const newEval: TenantAiEvaluation = {
      id: `eval-${Date.now()}`,
      agentId: agent.id,
      agentName: agent.name,
      testCasesTotal: 40,
      testCasesPassed: 39,
      accuracyScore: 97.5,
      safetyScore: 100.0,
      latencyP95Ms: 440,
      ranAt: "Just now",
      status: "PASSED",
    };

    setEvaluations([newEval, ...evaluations]);
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
            OCC-21 · AI GOVERNANCE
          </span>
        </div>

        <nav style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Link href="/" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            ← Home
          </Link>
          <Link href="/organization-entitlements" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Entitlements
          </Link>
          <Link href="/apps-extensions" style={{ padding: "0.4rem 0.85rem", color: "#9ca3af", textDecoration: "none", fontSize: "0.8125rem" }}>
            Apps &amp; Extensions
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
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>AI Governance &amp; Agent Operations</h1>
            <p style={{ margin: "0.25rem 0 0", color: "#9ca3af", fontSize: "0.875rem" }}>
              Configure autonomous copilot agents, tool permissions, RAG grounding, and token spend ceilings.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#8b5cf6",
              color: "#fff",
              border: "none",
              borderRadius: "0.375rem",
              padding: "0.5rem 1rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Create AI Agent
          </button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Active AI Agents</span>
              <Bot size={16} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>{agents.filter((a) => a.status === "ACTIVE").length} / {agents.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#8b5cf6", marginTop: "0.25rem" }}>4 models available</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Grounding Knowledge</span>
              <Database size={16} color="#3b82f6" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>3,800 Chunks</div>
            <div style={{ fontSize: "0.75rem", color: "#3b82f6", marginTop: "0.25rem" }}>{knowledgeSources.length} sources indexed</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Safety &amp; Accuracy</span>
              <ShieldCheck size={16} color="#10b981" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>98.0% Pass</div>
            <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "0.25rem" }}>0 guardrail breaches</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
              <span>Monthly Budget</span>
              <Zap size={16} color="#f59e0b" />
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>1.8M / 5.0M</div>
            <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.25rem" }}>$36.85 / $100.00 spent</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
          {(["agents", "knowledge", "evaluations", "budget"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? "rgba(139,92,246,0.15)" : "transparent",
                border: activeTab === tab ? "1px solid #8b5cf6" : "1px solid transparent",
                color: activeTab === tab ? "#c4b5fd" : "#9ca3af",
                padding: "0.4rem 1rem",
                borderRadius: "0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tab === "agents" ? `AI Agents (${agents.length})` : tab === "knowledge" ? `Knowledge Sources (${knowledgeSources.length})` : tab === "evaluations" ? `Benchmarks (${evaluations.length})` : "Token Budget & Limits"}
            </button>
          ))}
        </div>

        {/* Tab 1: AI Agents */}
        {activeTab === "agents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {agents.map((agent) => (
              <div
                key={agent.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0.5rem",
                  padding: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ maxWidth: "70%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <Bot size={18} color="#8b5cf6" />
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{agent.name}</h3>
                    <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.06)", padding: "0.15rem 0.4rem", borderRadius: "0.25rem", color: "#c4b5fd" }}>
                      {agent.model}
                    </span>
                    <span style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "0.25rem",
                      background: agent.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                      color: agent.status === "ACTIVE" ? "#34d399" : "#9ca3af",
                    }}>
                      {agent.status}
                    </span>
                  </div>
                  <p style={{ margin: "0.25rem 0 0.5rem", fontSize: "0.8125rem", color: "#9ca3af" }}>{agent.description}</p>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic", marginBottom: "0.5rem" }}>
                    System Prompt: &quot;{agent.systemPrompt}&quot;
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.75rem", color: "#9ca3af" }}>
                    <span>Tools: {agent.toolsBound.join(", ")}</span>
                    <span>·</span>
                    <span>Roles: {agent.allowedRoles.join(", ")}</span>
                    <span>·</span>
                    <span>Invocations: {agent.totalInvocations}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleRunEval(agent.id)}
                    style={{
                      background: "rgba(139,92,246,0.15)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      color: "#c4b5fd",
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
                    <Play size={12} /> Run Benchmark
                  </button>
                  <button
                    onClick={() => handleToggleAgent(agent.id)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: agent.status === "ACTIVE" ? "#f87171" : "#34d399",
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
                    <Power size={12} /> {agent.status === "ACTIVE" ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Knowledge Sources */}
        {activeTab === "knowledge" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>
            {knowledgeSources.map((ks) => (
              <div
                key={ks.id}
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
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{ks.name}</h3>
                    <span style={{ fontSize: "0.6875rem", background: "rgba(59,130,246,0.15)", color: "#60a5fa", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                      {ks.type}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#9ca3af", marginTop: "0.5rem" }}>
                    <div>Chunks Indexed: <strong style={{ color: "#fff" }}>{ks.totalChunks} vectors</strong></div>
                    <div>Embedding Model: {ks.embeddingModel}</div>
                  </div>
                </div>

                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#6b7280" }}>
                  <span>Synced {ks.lastSyncedAt}</span>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>● {ks.syncStatus}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Evaluations */}
        {activeTab === "evaluations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {evaluations.map((ev) => (
              <div
                key={ev.id}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{ev.agentName}</h3>
                    <span style={{ fontSize: "0.75rem", background: "rgba(16,185,129,0.15)", color: "#34d399", padding: "0.15rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>
                      {ev.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.8125rem", color: "#9ca3af" }}>
                    Passed {ev.testCasesPassed} of {ev.testCasesTotal} benchmark test cases · {ev.ranAt}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", textAlign: "right" }}>
                  <div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#34d399" }}>{ev.accuracyScore}%</div>
                    <div style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>Accuracy</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#60a5fa" }}>{ev.safetyScore}%</div>
                    <div style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>Safety Floor</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "#fbbf24" }}>{ev.latencyP95Ms}ms</div>
                    <div style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>p95 Latency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Budget */}
        {activeTab === "budget" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5rem", padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 700 }}>Monthly AI Consumption &amp; Spend Guardrails</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                  <span>Monthly Token Usage</span>
                  <strong>1,842,300 / 5,000,000 Tokens (36.8%)</strong>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "36.8%", background: "#8b5cf6" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                  <span>Cost Ceiling</span>
                  <strong>$36.85 / $100.00 USD</strong>
                </div>
                <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "36.8%", background: "#10b981" }} />
                </div>
              </div>

              <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8125rem", color: "#9ca3af" }}>
                <div style={{ fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>Hard Limit Policy</div>
                Requests exceeding the 5,000,000 monthly token ceiling are automatically paused with an admin notification until next billing cycle.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Agent Modal */}
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
            onSubmit={handleCreateAgent}
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "520px",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Create Autonomous AI Copilot</h2>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Agent Name</label>
              <input
                required
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="e.g. Warehouse Replenishment Assistant"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Description</label>
              <input
                value={newAgentDesc}
                onChange={(e) => setNewAgentDesc(e.target.value)}
                placeholder="What business capability does this agent fulfill?"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>Allowed AI Model (from PCC)</label>
              <select
                value={newAgentModel}
                onChange={(e) => setNewAgentModel(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", background: "#1f2937", border: "1px solid #374151", color: "#fff", boxSizing: "border-box" }}
              >
                <option value="llama3.3:70b">Llama 3.3 (70B Instruct) - Ollama Local / Fast</option>
                <option value="mistral-large:2407">Mistral Large 2 (123B) - Mistral AI / High Accuracy</option>
                <option value="qwen2.5:72b">Qwen 2.5 (72B Instruct) - Multilingual</option>
                <option value="deepseek-r1:70b">DeepSeek R1 (70B) - Deliberate Reasoning</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", color: "#9ca3af", marginBottom: "0.25rem" }}>System Instruction Prompt</label>
              <textarea
                rows={3}
                value={newAgentPrompt}
                onChange={(e) => setNewAgentPrompt(e.target.value)}
                placeholder="Define role boundaries, output JSON schema, and strict grounding instructions..."
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
                style={{ background: "#8b5cf6", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.375rem", fontWeight: 700, cursor: "pointer" }}
              >
                Publish Agent
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
