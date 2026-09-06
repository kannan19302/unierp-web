"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowRightLeft,
  Loader2,
  Network,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

interface IntercompanyTransaction {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  description: string;
  amount: number | string;
  currency: string;
  status: string;
}

interface IntercompanyStats {
  totalTransactionsCount: number;
  eliminatedCount: number;
  matchedCount: number;
  pendingCount: number;
  totalNettedVolume: number;
  pendingNettingVolume: number;
  pendingMatchVolume: number;
}

interface NettingRunItem {
  id: string;
  runNumber: string;
  status: string;
  nettingDate: string;
  totalReceivables: number | string;
  totalPayables: number | string;
  netSettlementAmount: number | string;
}

interface MultilateralMatrixData {
  runId: string;
  runNumber: string;
  status: string;
  grossVolume: number;
  netVolume: number;
  volumeReductionPercentage: number;
  grossTransactionCount: number;
  netTransactionCount: number;
  transactionsSaved: number;
  participants: string[];
  pairwiseMatrix: Record<string, Record<string, number>>;
  positions: Array<{
    orgId: string;
    grossPayables: number;
    grossReceivables: number;
    netPosition: number;
    role: "PAYER" | "RECEIVER" | "SQUARE";
  }>;
  settlements: Array<{
    fromOrgId: string;
    toOrgId: string;
    amount: number;
    description: string;
  }>;
}

const EMPTY_STATS: IntercompanyStats = {
  totalTransactionsCount: 0,
  eliminatedCount: 0,
  matchedCount: 0,
  pendingCount: 0,
  totalNettedVolume: 0,
  pendingNettingVolume: 0,
  pendingMatchVolume: 0,
};

export default function IntercompanyPage() {
  const client = useApiClient();
  const [transactions, setTransactions] = useState<IntercompanyTransaction[]>([]);
  const [stats, setStats] = useState<IntercompanyStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"transactions" | "netting-matrix">("transactions");
  const [nettingRuns, setNettingRuns] = useState<NettingRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [matrixData, setMatrixData] = useState<MultilateralMatrixData | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [settlingRun, setSettlingRun] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, statsRes, runsRes] = await Promise.all([
        client.get<{ items: IntercompanyTransaction[]; total: number }>(
          "/advanced-finance/intercompany/transactions",
        ),
        client.get<IntercompanyStats>("/advanced-finance/intercompany/stats"),
        client.get<NettingRunItem[]>("/advanced-finance/netting/runs").catch(() => []),
      ]);
      setTransactions(txRes?.items || []);
      setStats(statsRes || EMPTY_STATS);
      const runs = Array.isArray(runsRes) ? runsRes : [];
      setNettingRuns(runs);
      if (runs.length > 0 && !selectedRunId) {
        setSelectedRunId(runs[0].id);
      }
    } catch {
      setTransactions([]);
      setStats(EMPTY_STATS);
      setNettingRuns([]);
    } finally {
      setLoading(false);
    }
  }, [client, selectedRunId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMatrix = useCallback(async (runId: string) => {
    setMatrixLoading(true);
    setErrorMessage("");
    try {
      const data = await client.get<MultilateralMatrixData>(
        `/advanced-finance/netting/runs/${runId}/multilateral-matrix`,
      );
      setMatrixData(data);
    } catch {
      setMatrixData(null);
      setErrorMessage("Could not load multilateral netting matrix for this run.");
    } finally {
      setMatrixLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (viewMode === "netting-matrix" && selectedRunId) {
      loadMatrix(selectedRunId);
    }
  }, [viewMode, selectedRunId, loadMatrix]);

  const handleSettleRun = async () => {
    if (!selectedRunId) return;
    setSettlingRun(true);
    try {
      await client.post(`/advanced-finance/netting/runs/${selectedRunId}/settle`, {});
      await fetchData();
      await loadMatrix(selectedRunId);
    } catch {
      setErrorMessage("Failed to settle netting run.");
    } finally {
      setSettlingRun(false);
    }
  };

  const columns: ListColumn<IntercompanyTransaction>[] = [
    { key: "sourceEntity", header: "Source Entity" },
    { key: "targetEntity", header: "Target Entity" },
    { key: "description", header: "Description" },
    {
      key: "amount",
      header: "Amount",
      render: (val: any, row: any) => (
        <span style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
          {row.currency}{" "}
          {Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (val: any) => (
        <span
          className={`ui-badge ui-badge-${val === "ELIMINATED" || val === "MATCHED" ? "success" : "warning"}`}
        >
          {String(val)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: any, row: any) =>
        row.status === "MATCHED" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              client
                .post(`/advanced-finance/intercompany/eliminate/${row.id}`, {})
                .then(fetchData);
            }}
          >
            Eliminate
          </Button>
        ) : null,
    },
  ];

  if (loading) {
    return (
      <div className="ui-flex-center py-24">
        <Loader2
          className="animate-spin"
          size={32}
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.journal.read">
      <div className="ui-stack-4 ui-animate-in">
        {/* Navigation / Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "transactions" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("transactions")}
            >
              <ArrowRightLeft size={14} className="mr-1" /> Transactions & Eliminations
            </Button>
            <Button
              variant={viewMode === "netting-matrix" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setViewMode("netting-matrix")}
            >
              <Network size={14} className="mr-1" /> Multilateral Netting Settlement
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RefreshCw size={14} />
          </Button>
        </div>

        {errorMessage && (
          <div className="ui-alert ui-alert-error">
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
            <button className="ml-auto" onClick={() => setErrorMessage("")}>×</button>
          </div>
        )}

        {/* Global Intercompany Stats */}
        <div className="ui-grid-3">
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Total IC Transactions</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-primary)", fontVariantNumeric: "tabular-nums lining-nums" }}
              >
                {stats.totalTransactionsCount}
              </p>
              <p className="ui-text-xs-muted" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                {stats.eliminatedCount} eliminated, {stats.matchedCount} matched
              </p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Netted Volume (Eliminated)</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-success)", fontVariantNumeric: "tabular-nums lining-nums" }}
              >
                ${stats.totalNettedVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="ui-text-xs-muted" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                ${stats.pendingNettingVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })} pending netting
              </p>
            </div>
          </Card>
          <Card padding="md">
            <div className="ui-stack-2">
              <p className="ui-text-xs-muted">Pending Match</p>
              <p
                className="ui-heading-sm"
                style={{ color: "var(--color-warning)", fontVariantNumeric: "tabular-nums lining-nums" }}
              >
                {stats.pendingCount} {stats.pendingCount === 1 ? "Entry" : "Entries"}
              </p>
              <p className="ui-text-xs-muted" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                ${stats.pendingMatchVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })} unmatched
              </p>
            </div>
          </Card>
        </div>

        {viewMode === "transactions" ? (
          <Card padding="md">
            <ListPageTemplate
              title="Intercompany Transactions & Eliminations"
              subtitle="Manage multi-entity intercompany loan agreements, management fees, and consolidation elimination entries."
              columns={columns}
              data={transactions}
              actions={
                <div className="ui-flex ui-gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      client
                        .post("/advanced-finance/intercompany/elimination-runs", {
                          period: "2026-03",
                          notes: "Automated intercompany balance elimination",
                        })
                        .then(fetchData)
                    }
                  >
                    Post Elimination Run
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() =>
                      client
                        .post("/advanced-finance/intercompany/auto-match", {})
                        .then(fetchData)
                    }
                  >
                    <ArrowRightLeft size={14} className="mr-1.5" /> Run Auto-Match
                  </Button>
                </div>
              }
            />
          </Card>
        ) : (
          <div className="ui-stack-4">
            {/* Netting Run Selector */}
            <Card padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    Active Netting Cycle:
                  </span>
                  {nettingRuns.length === 0 ? (
                    <span className="text-sm text-[var(--color-text-secondary)]">No netting runs available</span>
                  ) : (
                    <select
                      className="ui-input py-1 px-2 text-sm"
                      value={selectedRunId || ""}
                      onChange={(e) => setSelectedRunId(e.target.value)}
                    >
                      {nettingRuns.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.runNumber} ({r.status}) — {new Date(r.nettingDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {matrixData && (
                  <div className="flex items-center gap-2">
                    <span className="ui-badge ui-badge-info">{matrixData.status}</span>
                    {matrixData.status === "APPROVED" && (
                      <Button size="sm" onClick={handleSettleRun} disabled={settlingRun}>
                        {settlingRun ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 size={14} className="mr-1" />
                        )}
                        Execute Net Settlements
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {matrixLoading ? (
              <div className="ui-flex-center py-16">
                <Loader2 size={24} className="animate-spin text-[var(--color-brand)]" />
              </div>
            ) : !matrixData ? (
              <Card padding="md">
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <Network size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No Multilateral Netting Data</p>
                  <p className="text-xs mt-1">Select an active netting cycle to view clearing settlement matrices.</p>
                </div>
              </Card>
            ) : (
              <>
                {/* Compression Metrics Banner */}
                <div className="ui-grid-4">
                  <Card padding="sm">
                    <div className="text-xs text-[var(--color-text-secondary)]">Gross Volume</div>
                    <div
                      className="text-base font-semibold text-[var(--color-text-primary)]"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      ${matrixData.grossVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {matrixData.grossTransactionCount} bilateral obligations
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="text-xs text-[var(--color-text-secondary)]">Central Net Settlement</div>
                    <div
                      className="text-base font-semibold text-[var(--color-brand)]"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      ${matrixData.netVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {matrixData.netTransactionCount} clearing payments
                    </div>
                  </Card>
                  <Card padding="sm">
                    <div className="text-xs text-[var(--color-text-secondary)]">Capital Compression</div>
                    <div
                      className="text-base font-semibold text-green-600 flex items-center gap-1"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      <TrendingDown size={16} />
                      {matrixData.volumeReductionPercentage}%
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">cross-border liquidity saved</div>
                  </Card>
                  <Card padding="sm">
                    <div className="text-xs text-[var(--color-text-secondary)]">Transactions Eliminated</div>
                    <div
                      className="text-base font-semibold text-[var(--color-text-primary)]"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      {matrixData.transactionsSaved} legs
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">bank transfer fee savings</div>
                  </Card>
                </div>

                {/* Multilateral Clearing Matrix & Net Positions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Entity Net Positions */}
                  <Card padding="md">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 size={16} className="text-[var(--color-brand)]" />
                      <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
                        Participant Central Clearing Positions
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                            <th className="pb-2">Subsidiary</th>
                            <th className="pb-2 text-right">Gross Payables</th>
                            <th className="pb-2 text-right">Gross Receivables</th>
                            <th className="pb-2 text-right">Net Position</th>
                            <th className="pb-2 text-center">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {matrixData.positions.map((pos) => (
                            <tr key={pos.orgId}>
                              <td className="py-2 font-medium text-[var(--color-text-primary)]">{pos.orgId}</td>
                              <td
                                className="py-2 text-right text-[var(--color-text-secondary)]"
                                style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                              >
                                ${pos.grossPayables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td
                                className="py-2 text-right text-[var(--color-text-secondary)]"
                                style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                              >
                                ${pos.grossReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td
                                className={`py-2 text-right font-semibold ${
                                  pos.netPosition > 0 ? "text-green-600" : pos.netPosition < 0 ? "text-red-500" : ""
                                }`}
                                style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                              >
                                {pos.netPosition >= 0 ? "+" : "-"}$
                                {Math.abs(pos.netPosition).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 text-center">
                                <span
                                  className={`ui-badge ${
                                    pos.role === "RECEIVER"
                                      ? "ui-badge-green"
                                      : pos.role === "PAYER"
                                        ? "ui-badge-yellow"
                                        : "ui-badge-gray"
                                  }`}
                                >
                                  {pos.role}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Central Settlement Instructions */}
                  <Card padding="md">
                    <div className="flex items-center gap-2 mb-3">
                      <Network size={16} className="text-[var(--color-brand)]" />
                      <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">
                        Streamlined Central Settlement Flows
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {matrixData.settlements.length === 0 ? (
                        <p className="text-xs text-[var(--color-text-secondary)] py-4 text-center">
                          All entities are square. No cash transfers required.
                        </p>
                      ) : (
                        matrixData.settlements.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-medium text-[var(--color-text-primary)]">
                                {s.fromOrgId} → {s.toOrgId}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)]">
                                {s.description}
                              </div>
                            </div>
                            <div
                              className="font-semibold text-[var(--color-text-primary)] text-sm"
                              style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                            >
                              ${s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
