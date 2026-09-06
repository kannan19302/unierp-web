"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import {
  PageHeader,
  Card,
  Button,
  Badge,
  StatCardRow,
  ListPageTemplate,
  type ListColumn,
} from "@kannan19302/ui";
import { ListView, RouteGuard } from "@kannan19302/framework";
import { financeAuditResource } from "@/modules/finance-audit";
import { apiGet } from "@/lib/api";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Users,
  Lock,
  Scale,
  FileText,
  Eye,
} from "lucide-react";

interface SoxSummary {
  overallHealthScore: number;
  activeRulesCount: number;
  totalConflicts: number;
  criticalConflicts: number;
  highConflicts: number;
  transactionViolationsCount: number;
  makerCheckerComplianceRate: number;
  auditTrailIntegrity: "VERIFIED" | "DEGRADED";
  lastAuditRun: string;
}

interface SoxRule {
  ruleId: string;
  name: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  toxicPermissions: [string, string];
  riskDescription: string;
  mitigatingControl: string;
}

interface SoxUserConflict {
  ruleId: string;
  ruleName: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  userId: string;
  userName: string;
  userEmail: string;
  assignedRoles: string[];
  conflictingPermissions: [string, string];
  mitigationStatus: string;
  mitigationNotes?: string;
}

interface SoxViolation {
  id: string;
  entityType: string;
  entityRef: string;
  actorId: string;
  actorName: string;
  actionCreated: string;
  actionExecuted: string;
  timestamp: string;
  amount: number;
  violationDescription: string;
}

export default function FinanceAuditTrailPage() {
  const [activeTab, setActiveTab] = useState<
    "audit-logs" | "sod-matrix" | "conflicts" | "invariants"
  >("audit-logs");

  const [summary, setSummary] = useState<SoxSummary | null>(null);
  const [rules, setRules] = useState<SoxRule[]>([]);
  const [conflicts, setConflicts] = useState<SoxUserConflict[]>([]);
  const [violations, setViolations] = useState<SoxViolation[]>([]);
  const [scanning, setScanning] = useState(false);

  const loadSoxData = useCallback(async () => {
    setScanning(true);
    try {
      const [sum, rls, cfl, viol] = await Promise.all([
        apiGet<SoxSummary>("/advanced-finance/sox/summary").catch(() => null),
        apiGet<SoxRule[]>("/advanced-finance/sox/rules").catch(() => []),
        apiGet<SoxUserConflict[]>("/advanced-finance/sox/conflicts").catch(() => []),
        apiGet<SoxViolation[]>("/advanced-finance/sox/violations").catch(() => []),
      ]);

      if (sum) setSummary(sum);
      if (Array.isArray(rls)) setRules(rls);
      if (Array.isArray(cfl)) setConflicts(cfl);
      if (Array.isArray(viol)) setViolations(viol);
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    loadSoxData();
  }, [loadSoxData]);

  return (
    <RouteGuard permission="finance.audit.read">
      <div className={styles.container}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold ui-text-primary">
              Finance Audit Trail &amp; SOX 404 Controls
            </h1>
            <p className="text-sm ui-text-muted mt-1">
              Real-time ICFR internal controls, Toxic Segregation of Duties (SoD) detector, and immutable financial change logs.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadSoxData}
            disabled={scanning}
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} className={scanning ? "animate-spin" : ""} />
            {scanning ? "Scanning ICFR…" : "Run SoD Scan"}
          </Button>
        </div>

        {summary && (
          <StatCardRow
            stats={[
              {
                label: "SOX 404 Health Score",
                value: `${summary.overallHealthScore.toFixed(1)}%`,
                icon: <ShieldCheck size={20} />,
                color: summary.overallHealthScore >= 90 ? "var(--color-success)" : "var(--color-warning)",
              },
              {
                label: "Monitored SoD Rules",
                value: String(summary.activeRulesCount),
                icon: <Scale size={20} />,
                color: "var(--color-primary)",
              },
              {
                label: "Toxic Role Conflicts",
                value: String(summary.totalConflicts),
                icon: <AlertTriangle size={20} />,
                color: summary.totalConflicts === 0 ? "var(--color-success)" : "var(--chart-4)",
              },
              {
                label: "Maker-Checker Compliance",
                value: `${summary.makerCheckerComplianceRate.toFixed(1)}%`,
                icon: <Lock size={20} />,
                color: "var(--color-primary)",
              },
            ]}
          />
        )}

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-[var(--color-border)]">
          <button
            onClick={() => setActiveTab("audit-logs")}
            style={{
              borderBottom:
                activeTab === "audit-logs"
                  ? "2px solid var(--color-primary)"
                  : "none",
              color:
                activeTab === "audit-logs"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
            }}
            className={styles.tabBtn}
          >
            Audit Trail Logs
          </button>
          <button
            onClick={() => setActiveTab("sod-matrix")}
            style={{
              borderBottom:
                activeTab === "sod-matrix"
                  ? "2px solid var(--color-primary)"
                  : "none",
              color:
                activeTab === "sod-matrix"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
            }}
            className={styles.tabBtn}
          >
            SOX 404 Toxic SoD Matrix ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("conflicts")}
            style={{
              borderBottom:
                activeTab === "conflicts"
                  ? "2px solid var(--color-primary)"
                  : "none",
              color:
                activeTab === "conflicts"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
            }}
            className={styles.tabBtn}
          >
            Detected Conflicts ({conflicts.length})
          </button>
          <button
            onClick={() => setActiveTab("invariants")}
            style={{
              borderBottom:
                activeTab === "invariants"
                  ? "2px solid var(--color-primary)"
                  : "none",
              color:
                activeTab === "invariants"
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
            }}
            className={styles.tabBtn}
          >
            Maker-Checker Invariants ({violations.length} Violations)
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "audit-logs" && (
          <Card className="p-4">
            <ListView resource={financeAuditResource} />
          </Card>
        )}

        {activeTab === "sod-matrix" && (
          <div className="space-y-4">
            <p className="text-xs ui-text-muted">
              Pre-configured toxic permission combinations under SOX Section 404 and PCAOB AS 2201 standards. Possession of both permissions by a single user represents an internal control weakness unless mitigated by dual-authorization compensating controls.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {rules.map((rule) => (
                <div key={rule.ruleId} className={styles.ruleCard}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600">
                          {rule.ruleId}
                        </span>
                        <Badge
                          variant={
                            rule.severity === "CRITICAL"
                              ? "danger"
                              : rule.severity === "HIGH"
                                ? "warning"
                                : "info"
                          }
                        >
                          {rule.severity}
                        </Badge>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]">
                          {rule.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm ui-text-primary mt-1">
                        {rule.name}
                      </h4>
                      <p className="text-xs ui-text-muted mt-1">
                        {rule.riskDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-[var(--color-text-muted)] block mb-1">
                        Incompatible Permission Pair:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 text-xs font-mono">
                          {rule.toxicPermissions[0]}
                        </code>
                        <span className="text-xs text-[var(--color-text-muted)] self-center">vs</span>
                        <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 text-xs font-mono">
                          {rule.toxicPermissions[1]}
                        </code>
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-[var(--color-text-muted)] block mb-1">
                        Compensating Control Mandate:
                      </span>
                      <p className="text-xs ui-text-muted">
                        {rule.mitigatingControl}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "conflicts" && (
          <Card className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider ui-text-muted mb-3">
              Users with Incompatible Role Assignments
            </h4>
            <ListPageTemplate
              columns={[
                {
                  key: "userName",
                  header: "User / Email",
                  render: (v: any, row: any) => (
                    <div>
                      <span className="font-medium text-xs ui-text-primary block">
                        {String(v)}
                      </span>
                      <span className="text-xs ui-text-muted font-mono">
                        {row.userEmail}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "ruleId",
                  header: "Violated Rule",
                  render: (v: any, row: any) => (
                    <div>
                      <span className="font-mono text-xs text-blue-600 block">
                        {String(v)}
                      </span>
                      <span className="text-xs ui-text-muted">
                        {row.ruleName}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "severity",
                  header: "Severity",
                  render: (v: any) => (
                    <Badge
                      variant={
                        v === "CRITICAL"
                          ? "danger"
                          : v === "HIGH"
                            ? "warning"
                            : "info"
                      }
                    >
                      {String(v)}
                    </Badge>
                  ),
                },
                {
                  key: "assignedRoles",
                  header: "Assigned Roles",
                  render: (v: any) => (
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(v) &&
                        v.map((r: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded text-xs bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)]"
                          >
                            {r}
                          </span>
                        ))}
                    </div>
                  ),
                },
                {
                  key: "mitigationStatus",
                  header: "Mitigation Status",
                  render: (v: any) => (
                    <Badge
                      variant={
                        v === "COMPENSATING_CONTROL_ACTIVE"
                          ? "success"
                          : v === "EXCEPTION_GRANTED"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {String(v).replace(/_/g, " ")}
                    </Badge>
                  ),
                },
                {
                  key: "mitigationNotes",
                  header: "Mitigation Rationale",
                  render: (v: any) => (
                    <span className="text-xs ui-text-muted">
                      {String(v || "—")}
                    </span>
                  ),
                },
              ]}
              data={conflicts as unknown as Record<string, unknown>[]}
              loading={scanning}
              emptyTitle="Zero Toxic SoD Conflicts"
              emptyDescription="All tenant users comply with SOX 404 segregation of duties mandates. No incompatible roles found."
            />
          </Card>
        )}

        {activeTab === "invariants" && (
          <Card className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider ui-text-muted mb-3">
              Single-Actor Transaction Violations (Maker-Checker Failures)
            </h4>
            <ListPageTemplate
              columns={[
                {
                  key: "entityRef",
                  header: "Reference",
                  render: (v: any) => (
                    <span className="font-mono text-xs font-medium text-blue-600">
                      {String(v)}
                    </span>
                  ),
                },
                {
                  key: "entityType",
                  header: "Type",
                  render: (v: any) => (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[var(--color-surface-subtle)]">
                      {String(v)}
                    </span>
                  ),
                },
                {
                  key: "actorName",
                  header: "Actor (Maker & Checker)",
                  render: (v: any) => (
                    <span className="text-xs font-medium ui-text-primary">
                      {String(v)}
                    </span>
                  ),
                },
                {
                  key: "actionCreated",
                  header: "Initiated As",
                  render: (v: any) => (
                    <span className="text-xs text-amber-600">{String(v)}</span>
                  ),
                },
                {
                  key: "actionExecuted",
                  header: "Executed As",
                  render: (v: any) => (
                    <span className="text-xs text-red-600">{String(v)}</span>
                  ),
                },
                {
                  key: "timestamp",
                  header: "Timestamp",
                  render: (v: any) => (
                    <span className="text-xs ui-text-muted">
                      {v ? new Date(String(v)).toLocaleString() : "—"}
                    </span>
                  ),
                },
                {
                  key: "violationDescription",
                  header: "Control Breach Description",
                  render: (v: any) => (
                    <span className="text-xs text-red-700">
                      {String(v)}
                    </span>
                  ),
                },
              ]}
              data={violations as unknown as Record<string, unknown>[]}
              loading={scanning}
              emptyTitle="Zero Transaction Control Breaches"
              emptyDescription="All historical journals and payments satisfy maker-checker dual-authorization ICFR invariants."
            />
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
