"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Calendar,
  TrendingDown,
  AlertCircle,
  Search,
  Sliders,
  CalendarDays,
  Table,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, Button, Badge, ListPageTemplate, type ListColumn, StatCardRow, Modal } from "@kannan19302/ui";
import { apiGet, apiPost } from "@/lib/api";

interface Lease {
  id: string;
  leaseRef: string | null;
  description: string | null;
  startDate: string;
  endDate: string;
  leaseType: string;
  presentValue: number | null;
  carryingAmount: number | null;
  interestRate: number | null;
  status: string;
}

interface Summary {
  totalROU: number;
  totalLiability: number;
  activeLeases: number;
  financeCount: number;
  operatingCount: number;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [leaseType, setLeaseType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Remeasurement Modal State
  const [remeasureItem, setRemeasureItem] = useState<Lease | null>(null);
  const [remeasureForm, setRemeasureForm] = useState({
    effectiveDate: new Date().toISOString().slice(0, 10),
    newEndDate: "",
    newDiscountRate: "",
    newPaymentAmount: "",
    reason: "Lease term extension and IBR adjustment",
  });
  const [remeasuring, setRemeasuring] = useState(false);
  const [remeasureResult, setRemeasureResult] = useState<any | null>(null);
  const [remeasureError, setRemeasureError] = useState("");

  // Amortization Schedule Modal State
  const [scheduleItem, setScheduleItem] = useState<Lease | null>(null);
  const [scheduleRows, setScheduleRows] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (leaseType) params.set("leaseType", leaseType);
      if (status) params.set("status", status);
      const [res, sum] = await Promise.all([
        apiGet<{ data: Lease[]; totalPages: number }>(
          `/finance/leases?${params}`,
        ),
        apiGet<Summary>("/finance/leases/summary"),
      ]);
      setLeases(res.data ?? []);
      setTotalPages(res.totalPages ?? 1);
      setSummary(sum);
    } finally {
      setLoading(false);
    }
  }, [page, search, leaseType, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpenSchedule = async (l: Lease) => {
    setScheduleItem(l);
    setScheduleLoading(true);
    try {
      const data = await apiGet<any>(`/finance/leases/${l.id}/schedule`);
      setScheduleRows(Array.isArray(data) ? data : data?.schedule ?? []);
    } catch {
      setScheduleRows([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleOpenRemeasure = (l: Lease) => {
    setRemeasureItem(l);
    setRemeasureResult(null);
    setRemeasureError("");
    setRemeasureForm({
      effectiveDate: new Date().toISOString().slice(0, 10),
      newEndDate: l.endDate ? l.endDate.slice(0, 10) : "",
      newDiscountRate: l.interestRate != null ? String(l.interestRate) : "5.5",
      newPaymentAmount: "",
      reason: "Lease term extension and IBR adjustment",
    });
  };

  const handleRemeasureSubmit = async () => {
    if (!remeasureItem) return;
    setRemeasuring(true);
    setRemeasureError("");
    try {
      const res = await apiPost<any>(`/finance/leases/${remeasureItem.id}/remeasure`, {
        effectiveDate: remeasureForm.effectiveDate,
        newEndDate: remeasureForm.newEndDate || undefined,
        newDiscountRate: remeasureForm.newDiscountRate ? Number(remeasureForm.newDiscountRate) : undefined,
        newPaymentAmount: remeasureForm.newPaymentAmount ? Number(remeasureForm.newPaymentAmount) : undefined,
        reason: remeasureForm.reason,
      });
      setRemeasureResult(res);
      load();
    } catch (err: any) {
      setRemeasureError(err.message || "Failed to remeasure lease");
    } finally {
      setRemeasuring(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold ui-text-primary">
            Lease Accounting
          </h1>
          <p className="text-sm ui-text-muted mt-1">
            ASC 842 / IFRS 16 right-of-use asset &amp; liability management
          </p>
        </div>
        <Link href="/finance/advanced/leases/new">
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus size={16} /> New Lease
          </Button>
        </Link>
      </div>

      {summary && (
        <StatCardRow
          stats={[
            {
              label: "Total ROU Assets",
              value: fmt(summary.totalROU),
              icon: <FileText size={20} />,
              color: "var(--color-primary)",
            },
            {
              label: "Total Lease Liability",
              value: fmt(summary.totalLiability),
              icon: <TrendingDown size={20} />,
              color: "var(--chart-4)",
            },
            {
              label: "Active Leases",
              value: String(summary.activeLeases),
              icon: <Calendar size={20} />,
              color: "var(--chart-2)",
            },
            {
              label: "Finance / Operating",
              value: `${summary.financeCount} / ${summary.operatingCount}`,
              icon: <AlertCircle size={20} />,
              color: "var(--chart-3)",
            },
          ]}
        />
      )}

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 ui-text-muted"
            />
            <input
              className="ui-input pl-8 w-full text-sm"
              placeholder="Search by ref or description…"
              value={search}
              onChange={(e: any) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="ui-input text-sm"
            value={leaseType}
            onChange={(e: any) => {
              setLeaseType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="FINANCE">Finance</option>
            <option value="OPERATING">Operating</option>
          </select>
          <select
            className="ui-input text-sm"
            value={status}
            onChange={(e: any) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>

        {(() => {
          const leaseColumns: ListColumn[] = [
            {
              key: "leaseRef",
              header: "Ref / Description",
              render: (v: any, row: any) => {
                const l = row as unknown as Lease;
                return (
                  <div>
                    <Link
                      href={`/finance/advanced/leases/${l.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {(v as string | null) ?? "—"}
                    </Link>
                    {l.description && (
                      <p className="text-xs ui-text-muted">{l.description}</p>
                    )}
                  </div>
                );
              },
            },
            {
              key: "leaseType",
              header: "Type",
              render: (v: any) => (
                <Badge
                  variant={(v as string) === "FINANCE" ? "primary" : "info"}
                >
                  {v as string}
                </Badge>
              ),
            },
            {
              key: "startDate",
              header: "Start",
              render: (v: any) => (
                <span>{new Date(v as string).toLocaleDateString()}</span>
              ),
            },
            {
              key: "endDate",
              header: "End",
              render: (v: any) => (
                <span>{new Date(v as string).toLocaleDateString()}</span>
              ),
            },
            {
              key: "presentValue",
              header: "Present Value",
              render: (v: any) => (
                <span className={styles.s1}>
                  {v != null ? fmt(Number(v)) : "—"}
                </span>
              ),
            },
            {
              key: "carryingAmount",
              header: "Carrying Amount",
              render: (v: any) => (
                <span className={styles.s1}>
                  {v != null ? fmt(Number(v)) : "—"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (v: any) => (
                <Badge
                  variant={
                    (v as string) === "ACTIVE"
                      ? "success"
                      : (v as string) === "TERMINATED"
                        ? "danger"
                        : (v as string) === "EXPIRED"
                          ? "warning"
                          : "default"
                  }
                >
                  {v as string}
                </Badge>
              ),
            },
            {
              key: "id",
              header: "Actions",
              render: (v: any, row: any) => {
                const l = row as unknown as Lease;
                return (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/finance/advanced/leases/${v as string}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSchedule(l)}
                      title="View ASC 842 Amortization Schedule"
                    >
                      Schedule
                    </Button>
                    {l.status === "ACTIVE" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenRemeasure(l)}
                        title="Remeasure Lease (ASC 842 / IFRS 16)"
                      >
                        Remeasure
                      </Button>
                    )}
                  </div>
                );
              },
            },
          ];
          return (
            <ListPageTemplate
              columns={leaseColumns}
              data={leases as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyTitle="No Leases Found"
              emptyDescription="No leases found."
              searchable
            />
          );
        })()}

        {totalPages > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p: any) => p - 1)}
            >
              Prev
            </Button>
            <span className="text-sm ui-text-muted self-center">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p: any) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Remeasurement Modal */}
      {remeasureItem && (
        <Modal
          open={Boolean(remeasureItem)}
          onClose={() => setRemeasureItem(null)}
          title={`ASC 842 / IFRS 16 Remeasurement — ${remeasureItem.leaseRef ?? "Lease"}`}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setRemeasureItem(null)}>
                {remeasureResult ? "Close" : "Cancel"}
              </Button>
              {!remeasureResult && (
                <Button
                  variant="primary"
                  onClick={handleRemeasureSubmit}
                  disabled={remeasuring}
                >
                  {remeasuring ? "Remeasuring…" : "Execute Remeasurement"}
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-4">
            {remeasureError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-600">
                {remeasureError}
              </div>
            )}

            {remeasureResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-800">
                      Remeasurement Successfully Posted
                    </h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Journal Entry #{remeasureResult.journalEntryId ?? "Posted"} generated with zero-imbalance subledger lock.
                    </p>
                  </div>
                </div>

                <div className={styles.resultBox}>
                  <h5 className="text-xs font-semibold uppercase tracking-wider ui-text-muted mb-3">
                    Subledger Valuation Adjustments
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs ui-text-muted">Liability Adjustment</div>
                      <div className={`text-base font-semibold ${styles.tableCellNum}`}>
                        {fmt(remeasureResult.liabilityAdjustment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs ui-text-muted">ROU Asset Adjustment</div>
                      <div className={`text-base font-semibold ${styles.tableCellNum}`}>
                        {fmt(remeasureResult.rouAssetAdjustment)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs ui-text-muted">Gain / Loss Recognized</div>
                      <div className={`text-base font-semibold ${styles.tableCellNum}`}>
                        {fmt(remeasureResult.gainOrLoss)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs ui-text-muted">New Lease Liability</div>
                      <div className={`text-base font-semibold ${styles.tableCellNum}`}>
                        {fmt(remeasureResult.newLiabilityBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs ui-text-muted">New ROU Asset Balance</div>
                      <div className={`text-base font-semibold ${styles.tableCellNum}`}>
                        {fmt(remeasureResult.newRouAssetBalance)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs ui-text-muted">
                  Perform remeasurement under ASC 842-10-35 / IFRS 16 §45 for scope changes, rate adjustments, or lease term modifications. Future cash flows will be re-discounted to adjust the lease liability and ROU asset carrying values.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium ui-text-primary mb-1">
                      Modification / Effective Date *
                    </label>
                    <input
                      type="date"
                      className="ui-input w-full text-sm"
                      value={remeasureForm.effectiveDate}
                      onChange={(e) =>
                        setRemeasureForm((prev) => ({ ...prev, effectiveDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium ui-text-primary mb-1">
                      New End Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="ui-input w-full text-sm"
                      value={remeasureForm.newEndDate}
                      onChange={(e) =>
                        setRemeasureForm((prev) => ({ ...prev, newEndDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium ui-text-primary mb-1">
                      New Discount Rate / IBR (% p.a.)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 6.25"
                      className="ui-input w-full text-sm"
                      value={remeasureForm.newDiscountRate}
                      onChange={(e) =>
                        setRemeasureForm((prev) => ({ ...prev, newDiscountRate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium ui-text-primary mb-1">
                      New Monthly Payment ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Leave blank to keep existing"
                      className="ui-input w-full text-sm"
                      value={remeasureForm.newPaymentAmount}
                      onChange={(e) =>
                        setRemeasureForm((prev) => ({ ...prev, newPaymentAmount: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium ui-text-primary mb-1">
                    Modification Reason / Rationale
                  </label>
                  <input
                    type="text"
                    className="ui-input w-full text-sm"
                    value={remeasureForm.reason}
                    onChange={(e) =>
                      setRemeasureForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Amortization Schedule Modal */}
      {scheduleItem && (
        <Modal
          open={Boolean(scheduleItem)}
          onClose={() => setScheduleItem(null)}
          title={`ASC 842 Amortization Schedule — ${scheduleItem.leaseRef ?? "Lease"}`}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setScheduleItem(null)}>
              Close
            </Button>
          }
        >
          {scheduleLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-sm ui-text-muted">
              <Loader2 className="animate-spin mb-2" size={24} />
              Calculating amortization periods…
            </div>
          ) : scheduleRows.length === 0 ? (
            <div className="py-8 text-center text-sm ui-text-muted">
              No schedule records available for this lease.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] font-semibold ui-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2 text-right">Payment</th>
                    <th className="py-2 px-2 text-right">Interest</th>
                    <th className="py-2 px-2 text-right">Principal</th>
                    <th className="py-2 px-2 text-right">Liability Bal</th>
                    <th className="py-2 px-2 text-right">ROU Amort</th>
                    <th className="py-2 px-2 text-right">ROU Bal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {scheduleRows.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-surface-hover)]">
                      <td className="py-2 px-2">{r.period ?? idx + 1}</td>
                      <td className="py-2 px-2">
                        {r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "—"}
                      </td>
                      <td className={`py-2 px-2 ${styles.tableCellNum}`}>
                        {fmt(Number(r.paymentAmount ?? 0))}
                      </td>
                      <td className={`py-2 px-2 ${styles.tableCellNum}`}>
                        {fmt(Number(r.interestExpense ?? 0))}
                      </td>
                      <td className={`py-2 px-2 ${styles.tableCellNum}`}>
                        {fmt(Number(r.principalReduction ?? 0))}
                      </td>
                      <td className={`py-2 px-2 ${styles.tableCellNum}`}>
                        {fmt(Number(r.closingLiability ?? 0))}
                      </td>
                      <td className={`py-2 px-2 ${styles.tableCellNum}`}>
                        {fmt(Number(r.rouDepreciation ?? 0))}
                      </td>
                      <td className={`py-2 px-2 ${styles.tableCellNum}`}>
                        {fmt(Number(r.closingRouAsset ?? 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
