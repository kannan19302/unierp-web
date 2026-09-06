"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import {
  Landmark,
  ArrowRightLeft,
  TrendingUp,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Layers,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn, useToast } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
}

interface Portfolio {
  id: string;
  name: string;
  assetClass: string;
  yieldRate: number | string;
  currentValue: number | string;
}

interface TreasuryTransaction {
  id: string;
  type: string;
  currency: string;
  date: string;
  amount: number | string;
  status: string;
}

interface CashPool {
  id: string;
  name: string;
  poolType: string;
  targetBalance: number | string;
  headerAccountId: string;
  isActive: boolean;
}

interface SweepSimulation {
  poolId: string;
  poolName: string;
  poolType: string;
  targetBalance: number;
  headerAccountId: string;
  headerAccountName: string;
  currentHeaderBalance: number;
  projectedHeaderBalance: number;
  totalSweptUp: number;
  totalFundedDown: number;
  netMobilized: number;
  participants: Array<{
    bankAccountId: string;
    bankName: string;
    accountNumber: string;
    currentBalance: number;
    targetBalance: number;
    variance: number;
    action: "SWEEP_TO_HEADER" | "FUND_FROM_HEADER" | "SQUARE";
    transferAmount: number;
  }>;
}

export default function TreasuryPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashPools, setCashPools] = useState<CashPool[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [sweepSim, setSweepSim] = useState<SweepSimulation | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [executingSweep, setExecutingSweep] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [investmentData, setInvestmentData] = useState({
    name: "",
    assetClass: "EQUITY",
    yieldRate: "",
    currentValue: "",
  });
  const [transferData, setTransferData] = useState({
    type: "TRANSFER",
    amount: "",
    currency: "USD",
    bankAccountId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [portRes, transRes, bankRes, poolsRes] = await Promise.all([
        client.get<Portfolio[]>("/advanced-finance/investment-portfolios"),
        client.get<TreasuryTransaction[]>(
          "/advanced-finance/treasury-transactions",
        ),
        client.get<BankAccount[]>("/advanced-finance/bank-accounts"),
        client.get<CashPool[]>("/advanced-finance/cash-pools").catch(() => []),
      ]);
      setPortfolios(portRes || []);
      setTransactions(transRes || []);
      setBankAccounts(bankRes || []);
      const pools = Array.isArray(poolsRes) ? poolsRes : [];
      setCashPools(pools);
      if (pools.length > 0 && !selectedPoolId) {
        setSelectedPoolId(pools[0].id);
        runSimulation(pools[0].id);
      }
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load treasury data";
      setLoadError(message);
      notifyError("Failed to load treasury data", message);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (poolId: string) => {
    setSimLoading(true);
    try {
      const res = await client.get<SweepSimulation>(
        `/advanced-finance/cash-pools/${poolId}/simulate-sweep`,
      );
      setSweepSim(res);
    } catch {
      setSweepSim(null);
    } finally {
      setSimLoading(false);
    }
  };

  const handleExecuteSweep = async (poolId: string) => {
    setExecutingSweep(true);
    try {
      await client.post(`/advanced-finance/cash-pools/${poolId}/sweep`, {});
      await fetchData();
      await runSimulation(poolId);
    } catch (err: any) {
      notifyError("Failed to execute sweep", err?.message);
    } finally {
      setExecutingSweep(false);
    }
  };

  const handleCreateInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/advanced-finance/investment-portfolios", {
        name: investmentData.name,
        assetClass: investmentData.assetClass,
        yieldRate: parseFloat(investmentData.yieldRate) || 0,
        currentValue: parseFloat(investmentData.currentValue) || 0,
      });
      {
        setShowInvestmentForm(false);
        setInvestmentData({
          name: "",
          assetClass: "EQUITY",
          yieldRate: "",
          currentValue: "",
        });
        fetchData();
      }
    } catch (err) {
      notifyError(
        "Failed to create investment",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/advanced-finance/treasury-transactions", {
        type: transferData.type,
        amount: parseFloat(transferData.amount) || 0,
        currency: transferData.currency,
        bankAccountId: transferData.bankAccountId || undefined,
        status: "SETTLED",
        date: new Date().toISOString(),
      });
      {
        setShowTransferForm(false);
        setTransferData({
          type: "TRANSFER",
          amount: "",
          currency: "USD",
          bankAccountId: "",
        });
        fetchData();
      }
    } catch (err) {
      notifyError(
        "Failed to record treasury transaction",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  const totalInvestments = portfolios.reduce(
    (sum, p) => sum + Number(p.currentValue || 0),
    0,
  );
  const totalOperatingCash = transactions
    .filter((t) => t.status === "SETTLED" || t.status === "POSTED")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalCashPosition = totalOperatingCash + totalInvestments;

  if (loading)
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );

  return (
    <RouteGuard permission="finance.treasury.read">
      <div className="p-8 ui-stack-6">
        <div className="ui-flex-between">
          <div>
            <h1 className="text-3xl">Treasury & Investments</h1>
            <p className="ui-text-muted mt-1">
              Manage corporate cash flow, forex trades, and investment
              portfolios.
            </p>
          </div>
          <div className="ui-flex ui-gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTransferForm(!showTransferForm)}
            >
              <ArrowRightLeft className="mr-2" /> Transfer Funds
            </Button>
            <Button onClick={() => setShowInvestmentForm(!showInvestmentForm)}>
              <TrendingUp className="mr-2" /> New Investment
            </Button>
          </div>
        </div>

        {loadError && (
          <div className="ui-alert ui-alert-danger">
            <AlertTriangle size={16} />
            Failed to load treasury data — portfolios and transactions below may
            be stale or empty. {loadError}
          </div>
        )}

        {showInvestmentForm && (
          <Card className="border-primary/20">
            <div className="p-6">
              <h3 className={styles.s1}>New Corporate Investment</h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateInvestment} className="ui-stack-4">
                <div className="ui-grid-4">
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Investment Name</label>
                    <input
                      className="ui-field-line"
                      required
                      placeholder="Treasury Bond B-2"
                      value={investmentData.name}
                      onChange={(e: any) =>
                        setInvestmentData({
                          ...investmentData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Asset Class</label>
                    <select
                      className="ui-field-line"
                      required
                      value={investmentData.assetClass}
                      onChange={(e: any) =>
                        setInvestmentData({
                          ...investmentData,
                          assetClass: e.target.value,
                        })
                      }
                    >
                      <option value="EQUITY">Equity (Stocks)</option>
                      <option value="FIXED_INCOME">Fixed Income (Bonds)</option>
                      <option value="CASH_EQUIVALENT">Cash Equivalents</option>
                      <option value="COMMODITY">Commodities</option>
                    </select>
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Yield Rate (%)</label>
                    <input
                      className="ui-field-line"
                      type="number"
                      required
                      placeholder="5.5"
                      value={investmentData.yieldRate}
                      onChange={(e: any) =>
                        setInvestmentData({
                          ...investmentData,
                          yieldRate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Initial Value</label>
                    <input
                      className="ui-field-line"
                      type="number"
                      required
                      placeholder="250000"
                      value={investmentData.currentValue}
                      onChange={(e: any) =>
                        setInvestmentData({
                          ...investmentData,
                          currentValue: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInvestmentForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Investment</Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {showTransferForm && (
          <Card className="border-primary/20">
            <div className="p-6">
              <h3 className={styles.s1}>
                Record Treasury Transaction / Transfer
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateTransfer} className="ui-stack-4">
                <div className="ui-grid-4">
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Transaction Type</label>
                    <select
                      className="ui-field-line"
                      required
                      value={transferData.type}
                      onChange={(e: any) =>
                        setTransferData({
                          ...transferData,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="TRANSFER">Inter-Account Transfer</option>
                      <option value="FOREX_BUY">Forex Purchase</option>
                      <option value="FOREX_SELL">Forex Sale</option>
                      <option value="INVESTMENT_BUY">
                        Investment Purchase
                      </option>
                      <option value="INVESTMENT_SELL">
                        Investment Redemption
                      </option>
                    </select>
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Amount</label>
                    <input
                      className="ui-field-line"
                      type="number"
                      required
                      placeholder="50000"
                      value={transferData.amount}
                      onChange={(e: any) =>
                        setTransferData({
                          ...transferData,
                          amount: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Currency</label>
                    <select
                      className="ui-field-line"
                      required
                      value={transferData.currency}
                      onChange={(e: any) =>
                        setTransferData({
                          ...transferData,
                          currency: e.target.value,
                        })
                      }
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="INR">INR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="ui-stack-2">
                    <label className="ui-heading-sm">Bank Account</label>
                    <select
                      className="ui-field-line"
                      required
                      value={transferData.bankAccountId}
                      onChange={(e: any) =>
                        setTransferData({
                          ...transferData,
                          bankAccountId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Account</option>
                      {bankAccounts.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransferForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Record Transaction</Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        <div className="ui-grid-3">
          {/* Portfolios Main */}
          <div className="ui-stack-6">
            <Card className="border-primary/20">
              <div className={styles.s2}>
                <div className="ui-hstack-3">
                  <div
                    className={`p-2.5 bg-emerald-100 dark:bg-emerald-900/30 ${styles.s3}`}
                  >
                    <Landmark
                      className={`text-emerald-700 dark:text-emerald-400 ${styles.s4}`}
                    />
                  </div>
                  <h3 className="font-bold">Investment Portfolios</h3>
                </div>
              </div>
              {(() => {
                const portfolioColumns: ListColumn[] = [
                  {
                    key: "name",
                    header: "Portfolio Name",
                    render: (v: any) => (
                      <span className="font-bold">{v as string}</span>
                    ),
                  },
                  {
                    key: "assetClass",
                    header: "Asset Class",
                    render: (v: any) => (
                      <span className="ui-text-xs-muted">{v as string}</span>
                    ),
                  },
                  {
                    key: "yieldRate",
                    header: "Yield Rate",
                    render: (v: any) => (
                      <span className="font-medium" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                        +{Number(v).toFixed(2)}%
                      </span>
                    ),
                  },
                  {
                    key: "currentValue",
                    header: "Current Value",
                    render: (v: any) => (
                      <span className={styles.s5} style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                        ${Number(v).toLocaleString()}
                      </span>
                    ),
                  },
                ];
                return (
                  <ListPageTemplate
                    columns={portfolioColumns}
                    data={portfolios as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No Portfolios"
                    emptyDescription="No active investment portfolios found."
                  />
                );
              })()}
            </Card>

            {/* ZBA Cash Concentration Simulator */}
            <Card className="border-primary/20">
              <div className={styles.s2}>
                <div className="ui-flex-between w-full">
                  <div className="ui-hstack-3">
                    <div className={`p-2.5 bg-indigo-100 dark:bg-indigo-900/30 ${styles.s3}`}>
                      <Layers className={`text-indigo-700 dark:text-indigo-400 ${styles.s4}`} />
                    </div>
                    <div>
                      <h3 className="font-bold">Zero-Balance Account (ZBA) Cash Concentration</h3>
                      <p className="ui-text-xs-muted">
                        Simulate multi-subsidiary liquidity pooling and execute automated concentration sweeps.
                      </p>
                    </div>
                  </div>
                  {cashPools.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        className="ui-input py-1 px-2 text-xs"
                        value={selectedPoolId || ""}
                        onChange={(e) => {
                          setSelectedPoolId(e.target.value);
                          runSimulation(e.target.value);
                        }}
                      >
                        {cashPools.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.poolType})
                          </option>
                        ))}
                      </select>
                      {selectedPoolId && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => runSimulation(selectedPoolId)}
                          disabled={simLoading}
                        >
                          <RefreshCw size={12} className={simLoading ? "animate-spin" : ""} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                {simLoading ? (
                  <div className="ui-flex-center py-8">
                    <Loader2 size={24} className="animate-spin text-[var(--color-brand)]" />
                  </div>
                ) : !sweepSim ? (
                  <div className="text-center py-6 text-[var(--color-text-secondary)]">
                    <Layers size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No Cash Pool Selected or Available</p>
                    <p className="text-xs mt-1">Configure cash pools in Bank Setup to enable automated concentration sweeps.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
                      <div>
                        <span className="ui-text-xs-muted">Concentration Header</span>
                        <p className="font-semibold text-xs text-[var(--color-text-primary)]">
                          {sweepSim.headerAccountName}
                        </p>
                      </div>
                      <div>
                        <span className="ui-text-xs-muted">Current Balance</span>
                        <p
                          className="font-semibold text-xs text-[var(--color-text-primary)]"
                          style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                        >
                          ${sweepSim.currentHeaderBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="ui-text-xs-muted">Net Mobilized</span>
                        <p
                          className={`font-semibold text-xs ${sweepSim.netMobilized >= 0 ? "text-green-600" : "text-yellow-600"}`}
                          style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                        >
                          {sweepSim.netMobilized >= 0 ? "+" : ""}${sweepSim.netMobilized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="ui-text-xs-muted">Projected Post-Sweep</span>
                        <p
                          className="font-bold text-xs text-[var(--color-brand)]"
                          style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                        >
                          ${sweepSim.projectedHeaderBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Participant Accounts Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
                            <th className="pb-2">Participant Account</th>
                            <th className="pb-2 text-right">Live Balance</th>
                            <th className="pb-2 text-right">Target Threshold</th>
                            <th className="pb-2 text-center">Action</th>
                            <th className="pb-2 text-right">Transfer Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {sweepSim.participants.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-[var(--color-text-secondary)]">
                                No participant accounts linked to this cash pool.
                              </td>
                            </tr>
                          ) : (
                            sweepSim.participants.map((p) => (
                              <tr key={p.bankAccountId}>
                                <td className="py-2">
                                  <span className="font-medium text-[var(--color-text-primary)]">{p.bankName}</span>
                                  <span className="ui-text-xs-muted ml-2 font-mono">···{p.accountNumber.slice(-4)}</span>
                                </td>
                                <td
                                  className="py-2 text-right text-[var(--color-text-secondary)]"
                                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                                >
                                  ${p.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td
                                  className="py-2 text-right text-[var(--color-text-secondary)]"
                                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                                >
                                  ${p.targetBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 text-center">
                                  <span
                                    className={`ui-badge ${
                                      p.action === "SWEEP_TO_HEADER"
                                        ? "ui-badge-green"
                                        : p.action === "FUND_FROM_HEADER"
                                          ? "ui-badge-yellow"
                                          : "ui-badge-gray"
                                    }`}
                                  >
                                    {p.action === "SWEEP_TO_HEADER"
                                      ? "Sweep Up"
                                      : p.action === "FUND_FROM_HEADER"
                                        ? "Fund Down"
                                        : "Square"}
                                  </span>
                                </td>
                                <td
                                  className="py-2 text-right font-semibold text-[var(--color-text-primary)]"
                                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                                >
                                  ${p.transferAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {sweepSim.participants.length > 0 && (
                      <div className="flex justify-end pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleExecuteSweep(sweepSim.poolId)}
                          disabled={executingSweep || sweepSim.totalSweptUp === 0}
                        >
                          {executingSweep ? (
                            <Loader2 size={14} className="animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 size={14} className="mr-1" />
                          )}
                          Execute Concentration Sweep
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card className="border-primary/20">
              <div className={styles.s2}>
                <div className="ui-hstack-3">
                  <div
                    className={`p-2.5 bg-blue-100 dark:bg-blue-900/30 ${styles.s3}`}
                  >
                    <ArrowRightLeft
                      className={`text-blue-700 dark:text-blue-400 ${styles.s4}`}
                    />
                  </div>
                  <h3 className="font-bold">Recent Treasury Transactions</h3>
                </div>
              </div>
              <div className="p-0">
                {transactions.length === 0 ? (
                  <div className={styles.s6}>
                    No recent treasury trades or transfers.
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.slice(0, 5).map((tx: any) => (
                      <div
                        key={tx.id}
                        className={`hover:bg-muted/30 ${styles.s7}`}
                      >
                        <div>
                          <p className="font-medium">
                            {tx.type}{" "}
                            <span className={styles.s8}>({tx.currency})</span>
                          </p>
                          <p className="ui-text-xs-muted mt-1">
                            {new Date(tx.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className="font-bold"
                            style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                          >
                            ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className={styles.s9}>{tx.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Treasury Sidebar */}
          <div className="ui-stack-6">
            <Card className={styles.s10}>
              <div className={styles.s11}>
                <h3 className={styles.s12}>Total Cash Position</h3>
                <p
                  className={styles.s13}
                  style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                >
                  ${totalCashPosition.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <div className={styles.s14}>
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  Sufficient liquidity for next 30 days
                </div>
              </div>
              <div className="p-6 ui-stack-4">
                <div>
                  <div className={styles.s15}>
                    <span className="ui-text-muted">Operating Cash</span>
                    <span
                      className="font-medium"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      ${totalOperatingCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={styles.s16}>
                    <div className={styles.s17}></div>
                  </div>
                </div>
                <div>
                  <div className={styles.s15}>
                    <span className="ui-text-muted">Short-term Inv.</span>
                    <span
                      className="font-medium"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      ${totalInvestments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={styles.s16}>
                    <div className={styles.s17}></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
