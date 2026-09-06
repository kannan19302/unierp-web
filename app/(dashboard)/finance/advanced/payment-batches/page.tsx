"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Loader2,
  Play,
  Download,
  Trash2,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import { Card, Button, ListPageTemplate, type ListColumn } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

interface PaymentBatchLine {
  id: string;
  invoiceId: string;
  amount: string | number;
  scheduledPaymentDate: string;
  status: string;
}

interface PaymentBatch {
  id: string;
  batchNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: string | number;
  currency: string;
  settlementDate: string | null;
  notes: string | null;
  createdAt: string;
  submittedAt: string | null;
  lines: PaymentBatchLine[];
  _count?: { lines: number };
}

interface IsoModalData {
  xml: string;
  sha256Hash: string;
  messageId: string;
  controlSum: number;
  paymentCount: number;
  filename: string;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  DRAFT: <Clock size={14} className="text-gray-400" />,
  READY: <Clock size={14} className="text-blue-500" />,
  COMPLETED: <CheckCircle size={14} className="text-green-500" />,
  CANCELLED: <AlertTriangle size={14} className="text-red-400" />,
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "ui-badge-gray",
  READY: "ui-badge-blue",
  RUNNING: "ui-badge-yellow",
  COMPLETED: "ui-badge-green",
  CANCELLED: "ui-badge-red",
};

export default function PaymentBatchesPage() {
  const client = useApiClient();
  const [batches, setBatches] = useState<PaymentBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<PaymentBatch | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [newBatchForm, setNewBatchForm] = useState({
    paymentMethod: "ACH",
    settlementDate: "",
    currency: "USD",
    notes: "",
  });
  const [lineForm, setLineForm] = useState({
    referenceId: "",
    amount: "",
    scheduledPaymentDate: new Date().toISOString().slice(0, 10),
  });

  const [isoModalData, setIsoModalData] = useState<IsoModalData | null>(null);
  const [isoLoading, setIsoLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      setBatches(
        await client.get<PaymentBatch[]>(
          "/advanced-finance/payables/payment-batches",
        ),
      );
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const createBatch = async () => {
    setError("");
    try {
      await client.post("/advanced-finance/payables/payment-batches", {
        paymentMethod: newBatchForm.paymentMethod,
        settlementDate: newBatchForm.settlementDate || undefined,
        currency: newBatchForm.currency,
        notes: newBatchForm.notes || undefined,
      });
      setShowNewForm(false);
      fetchBatches();
    } catch {
      setError("Network error");
    }
  };

  const addLine = async () => {
    if (!selectedBatch) return;
    setError("");
    try {
      await client.post(
        `/advanced-finance/payables/payment-batches/${selectedBatch.id}/lines`,
        {
          referenceId: lineForm.referenceId,
          amount: parseFloat(lineForm.amount),
          scheduledPaymentDate: lineForm.scheduledPaymentDate,
        },
      );
      setShowAddLine(false);
      setSelectedBatch(
        await client.get<PaymentBatch>(
          `/advanced-finance/payables/payment-batches/${selectedBatch.id}`,
        ),
      );
      fetchBatches();
    } catch {
      setError("Network error");
    }
  };

  const removeLine = async (batchId: string, lineId: string) => {
    await client.delete(
      `/advanced-finance/payables/payment-batches/${batchId}/lines/${lineId}`,
    );
    setSelectedBatch(
      await client.get<PaymentBatch>(
        `/advanced-finance/payables/payment-batches/${batchId}`,
      ),
    );
    fetchBatches();
  };

  const runBatch = async (batchId: string) => {
    if (
      !confirm(
        "Run this payment batch? This will settle all lines and post a GL journal entry.",
      )
    )
      return;
    setActioningId(batchId);
    try {
      await client.post(
        `/advanced-finance/payables/payment-batches/${batchId}/run`,
      );
      fetchBatches();
      if (selectedBatch?.id === batchId) {
        setSelectedBatch(
          await client.get<PaymentBatch>(
            `/advanced-finance/payables/payment-batches/${batchId}`,
          ),
        );
      }
    } catch {
      setError("Network error");
    } finally {
      setActioningId(null);
    }
  };

  const exportBatch = async (batchId: string, format: string) => {
    const data = await client.get<{ content: string; format: string }>(
      `/advanced-finance/payables/payment-batches/${batchId}/export?format=${format}`,
    );
    const blob = new Blob([data.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-batch-${batchId}.${format.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportIso20022 = async (batchId: string) => {
    setIsoLoading(true);
    setError("");
    try {
      const data = await client.get<IsoModalData>(
        `/advanced-finance/payables/payment-batches/${batchId}/export-iso20022`,
      );
      setIsoModalData(data);
    } catch {
      setError("Failed to generate ISO 20022 pain.001 XML");
    } finally {
      setIsoLoading(false);
    }
  };

  const downloadIsoXml = (xml: string, filename: string) => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDraft = batches
    .filter((b: any) => b.status === "DRAFT" || b.status === "READY")
    .reduce((sum: any, b: any) => sum + Number(b.totalAmount), 0);

  return (
    <RouteGuard permission="finance.payables.read">
      <div className="ui-page-container">
        <div className="ui-page-head">
          <div className="ui-page-head-content">
            <div className="ui-title-section">
              <CreditCard className="ui-title-icon" size={20} />
              <h1 className="ui-page-title">Vendor Payment Runs</h1>
            </div>
            <p className="ui-page-subtitle">
              Batch open vendor invoices into payment runs. Export as NACHA ACH
              or SEPA XML for your bank.
            </p>
          </div>
          <div className="ui-page-actions">
            <Button onClick={fetchBatches} variant="secondary">
              <RefreshCw size={16} />
            </Button>
            <Button onClick={() => setShowNewForm(true)}>
              <Plus size={16} className="mr-1" /> New Batch
            </Button>
          </div>
        </div>

        {error && (
          <div className="ui-alert ui-alert-error">
            <AlertTriangle size={16} /> {error}
            <button className="ml-auto" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {/* Summary stats */}
        <div className="ui-stat-row mb-4">
          <Card className="ui-stat-card">
            <div className="ui-stat-value">{batches.length}</div>
            <div className="ui-stat-label">Total Batches</div>
          </Card>
          <Card className="ui-stat-card">
            <div className="ui-stat-value">
              {batches.filter((b: any) => b.status === "DRAFT").length}
            </div>
            <div className="ui-stat-label">Draft</div>
          </Card>
          <Card className="ui-stat-card">
            <div className="ui-stat-value" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
              $
              {totalDraft.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="ui-stat-label">Pending Disbursement</div>
          </Card>
          <Card className="ui-stat-card">
            <div className="ui-stat-value">
              {batches.filter((b: any) => b.status === "COMPLETED").length}
            </div>
            <div className="ui-stat-label">Completed</div>
          </Card>
        </div>

        {showNewForm && (
          <Card className="ui-form-card mb-4">
            <h3 className="ui-form-title">New Payment Batch</h3>
            <div className="ui-form-grid">
              <div className="ui-form-group">
                <label className="ui-label">Payment Method</label>
                <select
                  className="ui-input"
                  value={newBatchForm.paymentMethod}
                  onChange={(e: any) =>
                    setNewBatchForm({
                      ...newBatchForm,
                      paymentMethod: e.target.value,
                    })
                  }
                >
                  <option value="ACH">ACH (NACHA)</option>
                  <option value="SEPA">SEPA XML</option>
                  <option value="WIRE">Wire Transfer</option>
                  <option value="CHECK">Check</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Currency</label>
                <select
                  className="ui-input"
                  value={newBatchForm.currency}
                  onChange={(e: any) =>
                    setNewBatchForm({
                      ...newBatchForm,
                      currency: e.target.value,
                    })
                  }
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Settlement Date</label>
                <input
                  type="date"
                  className="ui-input"
                  value={newBatchForm.settlementDate}
                  onChange={(e: any) =>
                    setNewBatchForm({
                      ...newBatchForm,
                      settlementDate: e.target.value,
                    })
                  }
                />
              </div>
              <div className="ui-form-group ui-form-group-full">
                <label className="ui-label">Notes</label>
                <input
                  className="ui-input"
                  value={newBatchForm.notes}
                  onChange={(e: any) =>
                    setNewBatchForm({ ...newBatchForm, notes: e.target.value })
                  }
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="ui-form-actions">
              <Button onClick={createBatch}>Create Batch</Button>
              <Button variant="secondary" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="ui-split-layout">
          {/* Batch list */}
          <Card className="ui-list-card ui-split-left">
            {loading ? (
              <div className="ui-loading">
                <Loader2 className="animate-spin" size={20} /> Loading batches…
              </div>
            ) : batches.length === 0 ? (
              <div className="ui-empty-state">
                <CreditCard size={40} className="ui-empty-icon" />
                <p>
                  No payment batches yet. Create one to start batching vendor
                  payments.
                </p>
              </div>
            ) : (
              batches.map((batch: any) => (
                <div
                  key={batch.id}
                  className={`ui-list-row ui-list-row-clickable ${selectedBatch?.id === batch.id ? "ui-list-row-selected" : ""}`}
                  onClick={() => setSelectedBatch(batch)}
                >
                  <div className="ui-list-row-main">
                    <div className="ui-list-row-title">
                      {STATUS_ICON[batch.status]}
                      <span className="font-medium">{batch.batchNumber}</span>
                      <span
                        className={`ui-badge ${STATUS_COLOR[batch.status] ?? "ui-badge-gray"}`}
                      >
                        {batch.status}
                      </span>
                    </div>
                    <div className="ui-list-row-meta">
                      <span>{batch.paymentMethod}</span>
                      <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                        {batch.currency}{" "}
                        {Number(batch.totalAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      <span>
                        {batch._count?.lines ?? batch.lines?.length ?? 0} lines
                      </span>
                      <span className="text-gray-400">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Batch detail */}
          {selectedBatch && (
            <Card className="ui-detail-card ui-split-right">
              <div className="ui-detail-header">
                <h3 className="ui-detail-title">{selectedBatch.batchNumber}</h3>
                <div className="ui-detail-actions">
                  {["DRAFT", "READY"].includes(selectedBatch.status) && (
                    <>
                      <Button
                        onClick={() => runBatch(selectedBatch.id)}
                        disabled={
                          actioningId === selectedBatch.id ||
                          selectedBatch.lines.length === 0
                        }
                      >
                        {actioningId === selectedBatch.id ? (
                          <Loader2 size={14} className="animate-spin mr-1" />
                        ) : (
                          <Play size={14} className="mr-1" />
                        )}
                        Run Batch
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowAddLine(true)}
                      >
                        <Plus size={14} className="mr-1" /> Add Line
                      </Button>
                    </>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() =>
                      exportBatch(
                        selectedBatch.id,
                        selectedBatch.paymentMethod === "SEPA"
                          ? "SEPA_XML"
                          : "NACHA",
                      )
                    }
                  >
                    <Download size={14} className="mr-1" /> Export
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => exportIso20022(selectedBatch.id)}
                    disabled={isoLoading}
                  >
                    {isoLoading ? (
                      <Loader2 size={14} className="animate-spin mr-1" />
                    ) : (
                      <FileCode size={14} className="mr-1" />
                    )}
                    ISO 20022 XML
                  </Button>
                </div>
              </div>

              {showAddLine && (
                <div className="ui-inline-form mb-4 p-4 border rounded">
                  <div className="ui-form-grid">
                    <div className="ui-form-group">
                      <label className="ui-label">
                        PO / Invoice Reference ID
                      </label>
                      <input
                        className="ui-input"
                        value={lineForm.referenceId}
                        onChange={(e: any) =>
                          setLineForm({
                            ...lineForm,
                            referenceId: e.target.value,
                          })
                        }
                        placeholder="Purchase order or invoice ID"
                      />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="ui-input"
                        value={lineForm.amount}
                        onChange={(e: any) =>
                          setLineForm({ ...lineForm, amount: e.target.value })
                        }
                      />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Payment Date</label>
                      <input
                        type="date"
                        className="ui-input"
                        value={lineForm.scheduledPaymentDate}
                        onChange={(e: any) =>
                          setLineForm({
                            ...lineForm,
                            scheduledPaymentDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="ui-form-actions">
                    <Button onClick={addLine}>Add</Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowAddLine(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <ListPageTemplate
                columns={
                  [
                    {
                      key: "invoiceId",
                      header: "Reference",
                      render: (v: any) => (
                        <span className="font-mono text-sm">
                          {String(v).slice(0, 16)}…
                        </span>
                      ),
                    },
                    {
                      key: "amount",
                      header: "Amount",
                      render: (v: any) => (
                        <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                          $
                          {Number(v).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      ),
                    },
                    {
                      key: "scheduledPaymentDate",
                      header: "Payment Date",
                      render: (v: any) => new Date(String(v)).toLocaleDateString(),
                    },
                    {
                      key: "status",
                      header: "Status",
                      render: (v: any) => (
                        <span
                          className={`ui-badge ${v === "SETTLED" ? "ui-badge-green" : "ui-badge-gray"}`}
                        >
                          {String(v)}
                        </span>
                      ),
                    },
                    {
                      key: "id",
                      header: "Actions",
                      render: (v: any) =>
                        ["DRAFT", "READY"].includes(selectedBatch.status) ? (
                          <button
                            className="ui-action-btn ui-action-btn-danger"
                            onClick={() =>
                              removeLine(selectedBatch.id, String(v))
                            }
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null,
                    },
                  ] as ListColumn[]
                }
                data={
                  selectedBatch.lines as unknown as Record<string, unknown>[]
                }
                loading={false}
                emptyTitle="No lines"
                emptyDescription='No lines added yet. Click "Add Line" to include vendor invoices.'
              />
            </Card>
          )}
        </div>
        {isoModalData && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div
              className="border border-[var(--color-border)] rounded-lg shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden"
              style={{ backgroundColor: "var(--color-surface)" }}
            >
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <FileCode size={18} className="text-[var(--color-brand)]" />
                  <div>
                    <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                      ISO 20022 pain.001.001.03 XML Export
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Customer Credit Transfer Initiation • {isoModalData.filename}
                    </p>
                  </div>
                </div>
                <button
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-lg px-2"
                  onClick={() => setIsoModalData(null)}
                >
                  ×
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-3 gap-3 p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] rounded">
                  <div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Message ID</div>
                    <div className="font-mono text-xs font-semibold text-[var(--color-text-primary)]">
                      {isoModalData.messageId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Control Sum</div>
                    <div
                      className="font-mono text-xs font-semibold text-[var(--color-text-primary)]"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      ${Number(isoModalData.controlSum).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Payment Count</div>
                    <div
                      className="font-mono text-xs font-semibold text-[var(--color-text-primary)]"
                      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
                    >
                      {isoModalData.paymentCount} transaction(s)
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-green-500" />
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                        SHA-256 Integrity Hash (Tamper-Proof Checksum)
                      </div>
                      <div className="font-mono text-xs text-[var(--color-text-secondary)] break-all select-all">
                        {isoModalData.sha256Hash}
                      </div>
                    </div>
                  </div>
                  <button
                    className="p-1.5 hover:bg-[var(--color-border)] rounded text-xs flex items-center gap-1 text-[var(--color-text-secondary)]"
                    onClick={() => {
                      navigator.clipboard.writeText(isoModalData.sha256Hash);
                      setCopiedHash(true);
                      setTimeout(() => setCopiedHash(false), 2000);
                    }}
                  >
                    {copiedHash ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span className="text-xs">{copiedHash ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      pain.001.001.03 XML Payload
                    </span>
                    <button
                      className="text-xs text-[var(--color-brand)] flex items-center gap-1 hover:underline"
                      onClick={() => {
                        navigator.clipboard.writeText(isoModalData.xml);
                        setCopiedXml(true);
                        setTimeout(() => setCopiedXml(false), 2000);
                      }}
                    >
                      {copiedXml ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      {copiedXml ? "Copied XML" : "Copy XML"}
                    </button>
                  </div>
                  <pre className="p-3 rounded border border-[var(--color-border)] bg-[var(--color-surface-sunken)] font-mono text-xs text-[var(--color-text-primary)] max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {isoModalData.xml}
                  </pre>
                </div>
              </div>

              <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsoModalData(null)}>
                  Close
                </Button>
                <Button onClick={() => downloadIsoXml(isoModalData.xml, isoModalData.filename)}>
                  <Download size={14} className="mr-1" /> Download {isoModalData.filename}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
