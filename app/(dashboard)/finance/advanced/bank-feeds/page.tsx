"use client";

import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Button, StatusBadge, Badge } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import {
  RefreshCw,
  Plus,
  Trash2,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Link2,
  Info,
  FileText,
  UploadCloud,
  CheckCircle,
  X,
} from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
}

interface BankConnection {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  status: string;
  lastSyncedAt: string | null;
  bankAccountId: string;
}

export default function BankFeedsConnectionsPage() {
  const client = useApiClient();
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedBank, setSelectedBank] = useState("Chase Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("CHECKING");
  const [targetBankAccountId, setTargetBankAccountId] = useState("");
  const [syncingConnId, setSyncingConnId] = useState<string | null>(null);

  // Bank Statement Parser State
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [statementConnectionId, setStatementConnectionId] = useState("");
  const [statementFormat, setStatementFormat] = useState<"MT940" | "CAMT053">("MT940");
  const [statementRawContent, setStatementRawContent] = useState("");
  const [parsedStatement, setParsedStatement] = useState<any | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [statementError, setStatementError] = useState<string | null>(null);

  const handleParseStatement = async () => {
    if (!statementRawContent.trim()) {
      setStatementError("Please paste or upload statement content.");
      return;
    }
    setIsParsing(true);
    setStatementError(null);
    try {
      const res = await client.post<any>("/advanced-finance/bank-statements/parse", {
        rawContent: statementRawContent,
        format: statementFormat,
      });
      setParsedStatement(res);
    } catch (err: any) {
      setStatementError(err?.message || "Failed to parse bank statement file.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportStatement = async () => {
    if (!statementConnectionId) {
      setStatementError("Please select a target bank connection to import into.");
      return;
    }
    if (!statementRawContent.trim()) {
      setStatementError("Statement content cannot be empty.");
      return;
    }
    setIsImporting(true);
    setStatementError(null);
    try {
      const res = await client.post<any>("/advanced-finance/bank-statements/import", {
        connectionId: statementConnectionId,
        rawContent: statementRawContent,
        format: statementFormat,
      });
      setImportResult(res);
      fetchConnections();
    } catch (err: any) {
      setStatementError(err?.message || "Failed to import statement into bank feed.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".xml") || file.name.endsWith(".camt")) {
      setStatementFormat("CAMT053");
    } else {
      setStatementFormat("MT940");
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setStatementRawContent(content || "");
      setParsedStatement(null);
      setImportResult(null);
      setStatementError(null);
    };
    reader.readAsText(file);
  };

  const fetchConnections = useCallback(async () => {
    try {
      setConnections(
        await client.get<BankConnection[]>(
          "/advanced-finance/bank-feeds/connections",
        ),
      );
    } catch {
      alert("Unable to load bank connections.");
    }
  }, [client]);

  const fetchBankAccounts = useCallback(async () => {
    try {
      setBankAccounts(
        await client.get<BankAccount[]>("/advanced-finance/bank-accounts"),
      );
    } catch {
      alert("Unable to load bank accounts.");
    }
  }, [client]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConnections(), fetchBankAccounts()]);
    setLoading(false);
  }, [fetchConnections, fetchBankAccounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBankAccountId) {
      alert("Please select a target ERP Bank Account");
      return;
    }
    try {
      await client.post("/advanced-finance/bank-feeds/connections", {
        bankName: selectedBank,
        accountNumber: accountNumber || "•••• 5543",
        accountType,
        bankAccountId: targetBankAccountId,
        credentialsHash: "feed-token-" + Math.random().toString(36).substring(2),
      });
      setShowAddModal(false);
      setAccountNumber("");
      fetchConnections();
    } catch (err: any) {
      alert(err?.message || "Failed to connect bank feed");
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to disconnect this bank feed? All feed history will be deleted.",
      )
    )
      return;
    try {
      await client.delete(`/advanced-finance/bank-feeds/connections/${id}`);
      fetchConnections();
    } catch {
      alert("Unable to delete the bank connection.");
    }
  };

  const handleSyncTransactions = async (id: string) => {
    setSyncingConnId(id);
    try {
      const data = await client.post<{ syncedCount: number }>(
        `/advanced-finance/bank-feeds/connections/${id}/sync`,
      );
      alert(`Sync Complete! ${data.syncedCount} new transactions downloaded.`);
      fetchConnections();
    } catch {
      alert("Unable to sync the bank connection.");
      alert("Sync failed.");
    } finally {
      setSyncingConnId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 ui-flex-center">
        <Loader2 className="animate-spin h-8 w-8 ui-text-primary" />
      </div>
    );
  }

  return (
    <RouteGuard permission="finance.treasury.read">
      <div className="p-8 ui-stack-6">
        {/* Header */}
        <div className="ui-flex-between ui-items-start">
          <div>
            <h1 className="text-3xl">Bank Feeds & Connections</h1>
            <p className="ui-text-muted mt-1">
              Establish Plaid-style direct synchronization links with your
              external financial accounts to automate reconciliations.
            </p>
          </div>
          <div className="ui-flex ui-gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowStatementModal(true)}>
              <FileText size={16} className="mr-2" />
              Import Statement (MT940 / CAMT.053)
            </Button>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} className="mr-2" />
              Add Direct Connection
            </Button>
          </div>
        </div>

        {/* Info Warning */}
        <div className={styles.s1}>
          <Info size={20} className={styles.s2} />
          <div>
            <span className={styles.s3}>Direct Bank Sync Protocol:</span> Direct
            connections leverage Plaid credentials to synchronise raw bank
            feeds. Unmatched deposits/withdrawals are held in the transaction
            matching bin.
          </div>
        </div>

        {/* Main List */}
        <Card className="ui-card">
          <div className={styles.s4}>
            <h3 className="ui-heading-base">Active direct feeds</h3>
          </div>

          {connections.length === 0 ? (
            <div className={styles.s5}>
              <Link2 size={36} className={styles.s6} />
              <p className={styles.s7}>No direct feeds connected yet</p>
              <p className={styles.s8}>
                Connect your first external bank to begin automating
                reconciliations.
              </p>
            </div>
          ) : (
            <div className="ui-flex-col">
              {connections.map((conn: any) => (
                <div key={conn.id} className={styles.s9}>
                  <div className="ui-hstack-4">
                    <div className={styles.s10}>
                      <Building2 size={20} className="ui-text-primary" />
                    </div>
                    <div>
                      <div className="ui-hstack-2">
                        <span className="ui-heading-base">{conn.bankName}</span>
                        <span className={styles.s11}>{conn.accountType}</span>
                      </div>
                      <p className={styles.s12} style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                        Account: {conn.accountNumber} • Status:{" "}
                        <span
                          className={`${styles.connectionStatus} ${conn.status === "ACTIVE" ? styles.connectionActive : styles.connectionInactive}`}
                        >
                          {conn.status}
                        </span>
                      </p>
                      <p className="ui-text-xs-muted mt-1" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                        Last synced:{" "}
                        {conn.lastSyncedAt
                          ? new Date(conn.lastSyncedAt).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  <div className="ui-flex ui-gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncTransactions(conn.id)}
                      disabled={syncingConnId === conn.id}
                    >
                      {syncingConnId === conn.id ? (
                        <>
                          <Loader2
                            size={14}
                            className={`animate-spin ${styles.s13}`}
                          />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} className={styles.s14} />
                          Sync Now
                        </>
                      )}
                    </Button>
                    <a href={`/finance/advanced/bank-recon`}>
                      <Button variant="secondary" size="sm">
                        Reconcile Feed
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteConnection(conn.id)}
                      className={styles.s15}
                    >
                      <Trash2 size={14} className={styles.s16} />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Modal Dialog */}
        {showAddModal && (
          <div className={styles.s17}>
            <Card className={`ui-card ${styles.s18}`}>
              <div className={styles.s19}>
                <h3 className="ui-heading-lg">Link External Bank Feed</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className={styles.s20}
                >
                  Close
                </Button>
              </div>
              <form onSubmit={handleAddConnection} className="p-5 ui-stack-4">
                <div className="ui-form-group">
                  <label className="ui-label ui-label">
                    Bank / Institution
                  </label>
                  <select
                    className="ui-input w-full"
                    value={selectedBank}
                    onChange={(e: any) => setSelectedBank(e.target.value)}
                  >
                    <option value="Chase Bank">Chase Bank</option>
                    <option value="Wells Fargo">Wells Fargo</option>
                    <option value="Silicon Valley Bank">
                      Silicon Valley Bank (SVB)
                    </option>
                    <option value="Bank of America">Bank of America</option>
                    <option value="Citibank">Citibank</option>
                  </select>
                </div>

                <div className="ui-form-group">
                  <label className="ui-label ui-label">
                    Account Number (Last 4 digits)
                  </label>
                  <input
                    type="text"
                    className="ui-input w-full"
                    placeholder="e.g. 5543"
                    value={accountNumber}
                    onChange={(e: any) => setAccountNumber(e.target.value)}
                    maxLength={4}
                    required
                  />
                </div>

                <div className="ui-form-group">
                  <label className="ui-label ui-label">Account Type</label>
                  <select
                    className="ui-input w-full"
                    value={accountType}
                    onChange={(e: any) => setAccountType(e.target.value)}
                  >
                    <option value="CHECKING">Checking Account</option>
                    <option value="SAVINGS">Savings Account</option>
                    <option value="CREDIT">Credit Card / Debt</option>
                  </select>
                </div>

                <div className="ui-form-group">
                  <label className="ui-label ui-label">
                    Target ERP Bank Account
                  </label>
                  <select
                    className="ui-input w-full"
                    value={targetBankAccountId}
                    onChange={(e: any) => setTargetBankAccountId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Bank Account --</option>
                    {bankAccounts.map((ba: any) => (
                      <option key={ba.id} value={ba.id}>
                        {ba.bankName} - {ba.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ui-flex-end ui-gap-2 mt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Establish Connection
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Bank Statement Upload & Parser Modal */}
        {showStatementModal && (
          <div className={styles.s17}>
            <Card className={styles.statementModal}>
              <div className={styles.s19}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <FileText size={20} style={{ color: "var(--color-primary)" }} />
                  <div>
                    <h3 className="ui-heading-sm">Import Bank Statement</h3>
                    <p className="ui-text-xs-muted">
                      Ingest SWIFT MT940 (.sta/.txt) or ISO 20022 CAMT.053 (.xml) bank statements
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatementModal(false);
                    setParsedStatement(null);
                    setImportResult(null);
                    setStatementError(null);
                  }}
                  className="ui-btn-icon"
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: "var(--space-5)" }} className="ui-stack-4">
                {statementError && (
                  <div className="ui-alert ui-alert-danger">
                    <AlertCircle size={16} />
                    {statementError}
                  </div>
                )}

                {importResult && (
                  <div className="ui-alert ui-alert-success">
                    <CheckCircle size={16} />
                    <span>
                      <strong>Import Successful!</strong> {importResult.importedCount} new transactions imported,{" "}
                      {importResult.duplicateCount} duplicates skipped.
                    </span>
                  </div>
                )}

                <div className="ui-grid-2" style={{ gap: "var(--space-4)" }}>
                  <div>
                    <label className="ui-label">Target Bank Connection *</label>
                    <select
                      className="ui-input w-full"
                      value={statementConnectionId}
                      onChange={(e) => setStatementConnectionId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Target Connection --</option>
                      {connections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.bankName} — {c.accountNumber} ({c.accountType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="ui-label">Statement Format Standard</label>
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                      <Button
                        variant={statementFormat === "MT940" ? "primary" : "outline"}
                        size="sm"
                        type="button"
                        onClick={() => setStatementFormat("MT940")}
                      >
                        SWIFT MT940
                      </Button>
                      <Button
                        variant={statementFormat === "CAMT053" ? "primary" : "outline"}
                        size="sm"
                        type="button"
                        onClick={() => setStatementFormat("CAMT053")}
                      >
                        ISO 20022 CAMT.053
                      </Button>
                    </div>
                  </div>
                </div>

                {/* File Drop Area */}
                <div>
                  <label className="ui-label">Upload Statement File or Paste Content</label>
                  <label className={styles.uploadArea} style={{ display: "block" }}>
                    <input
                      type="file"
                      accept=".txt,.sta,.940,.xml,.camt"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <UploadCloud size={28} style={{ margin: "0 auto var(--space-2)", color: "var(--color-primary)" }} />
                    <p style={{ fontWeight: "var(--weight-medium)" }}>
                      Click to choose file, or drag and drop here
                    </p>
                    <p className="ui-text-xs-muted" style={{ marginTop: "var(--space-1)" }}>
                      Supports SWIFT MT940 (.sta, .txt, .940) & ISO 20022 CAMT.053 (.xml)
                    </p>
                  </label>
                </div>

                <div>
                  <textarea
                    rows={4}
                    className="ui-input w-full"
                    placeholder="Or paste raw statement text / XML here..."
                    value={statementRawContent}
                    onChange={(e) => {
                      setStatementRawContent(e.target.value);
                      setParsedStatement(null);
                      setImportResult(null);
                    }}
                    style={{ fontFamily: "monospace", fontSize: "var(--text-xs)" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleParseStatement}
                    disabled={isParsing || !statementRawContent.trim()}
                  >
                    {isParsing ? <Loader2 size={14} className="animate-spin mr-2" /> : <FileText size={14} className="mr-2" />}
                    Parse & Validate Statement
                  </Button>

                  {parsedStatement && (
                    <Button
                      variant="primary"
                      type="button"
                      onClick={handleImportStatement}
                      disabled={isImporting || !statementConnectionId}
                    >
                      {isImporting ? <Loader2 size={14} className="animate-spin mr-2" /> : <CheckCircle2 size={14} className="mr-2" />}
                      Ingest {parsedStatement.transactions.length} Transactions
                    </Button>
                  )}
                </div>

                {/* Parsed Summary Preview */}
                {parsedStatement && (
                  <div className="ui-stack-3" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 className="ui-heading-xs">Parsed Statement Summary</h4>
                      <Badge variant="success">Format: {parsedStatement.format}</Badge>
                    </div>

                    <div className={styles.summaryGrid}>
                      <div className={styles.summaryCard}>
                        <p className="ui-text-xs-muted">Opening Balance</p>
                        <p className="ui-heading-sm" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                          {parsedStatement.currency} {parsedStatement.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="ui-text-xs-muted">
                          {new Date(parsedStatement.openingBalanceDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className={styles.summaryCard}>
                        <p className="ui-text-xs-muted">Closing Balance</p>
                        <p className="ui-heading-sm" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                          {parsedStatement.currency} {parsedStatement.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="ui-text-xs-muted">
                          {new Date(parsedStatement.closingBalanceDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className={styles.summaryCard}>
                        <p className="ui-text-xs-muted">Total Inflows (Credits)</p>
                        <p className="ui-heading-sm" style={{ color: "var(--color-success)", fontVariantNumeric: "tabular-nums lining-nums" }}>
                          +{parsedStatement.currency} {parsedStatement.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="ui-text-xs-muted">
                          {parsedStatement.transactions.filter((t: any) => !t.isDebit).length} inflows
                        </p>
                      </div>

                      <div className={styles.summaryCard}>
                        <p className="ui-text-xs-muted">Total Outflows (Debits)</p>
                        <p className="ui-heading-sm" style={{ color: "var(--color-danger)", fontVariantNumeric: "tabular-nums lining-nums" }}>
                          -{parsedStatement.currency} {parsedStatement.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="ui-text-xs-muted">
                          {parsedStatement.transactions.filter((t: any) => t.isDebit).length} outflows
                        </p>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className={styles.previewTableWrapper}>
                      <table className="ui-table" style={{ width: "100%", fontSize: "var(--text-xs)" }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Reference</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedStatement.transactions.map((tx: any, idx: number) => (
                            <tr key={idx}>
                              <td style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                                {new Date(tx.date).toLocaleDateString()}
                              </td>
                              <td>{tx.description}</td>
                              <td>{tx.reference || tx.bankReference || "—"}</td>
                              <td
                                style={{
                                  textAlign: "right",
                                  fontVariantNumeric: "tabular-nums lining-nums",
                                  color: tx.amount >= 0 ? "var(--color-success)" : "var(--color-danger)",
                                }}
                              >
                                {tx.amount >= 0 ? `+${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
