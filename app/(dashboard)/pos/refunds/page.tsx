"use client";
import React, { useState, useEffect } from "react";
import { RotateCcw, Eye, Check, X } from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { useToast, DataTable } from "@kannan19302/ui";

export default function POSRefundsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    load();
  }, [page]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const data = await client.get<any>(`/pos/exp/refunds?${params}`);
      if (data?.data) {
        setRefunds(data.data);
        setTotalPages(data.meta?.totalPages || 1);
      }
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load refunds";
      setLoadError(message);
      notifyError("Failed to load refunds", message);
    }
    setLoading(false);
  };

  const approve = async (id: string, approved: boolean) => {
    try {
      await client.put(`/pos/exp/refunds/${id}/approve`, { approved });
      load();
      setSelected(null);
    } catch (err) {
      notifyError(
        approved ? "Failed to approve refund" : "Failed to reject refund",
        err instanceof Error ? err.message : undefined,
      );
    }
  };

  return (
    <RouteGuard permission="pos.return.read">
      <div className="ui-stack-6">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <RotateCcw className="ui-text-primary" /> Refunds & Returns
          </h1>
          <p className="ui-text-sm-muted">
            Process and manage refund requests.
          </p>
        </div>
        {loadError && (
          <div className="ui-alert ui-alert-danger">
            Failed to load refunds — {loadError}
          </div>
        )}
        {selected ? (
          <div className="ui-card p-5">
            <button
              onClick={() => setSelected(null)}
              className="ui-text-primary mb-4"
            >
              ← Back
            </button>
            <div className="ui-grid-3">
              <div>
                <strong>Refund #:</strong> {selected.refundNumber}
              </div>
              <div>
                <strong>Status:</strong> {selected.status}
              </div>
              <div>
                <strong>Amount:</strong> $
                {Number(selected.refundAmount).toFixed(2)}
              </div>
              <div>
                <strong>Method:</strong> {selected.refundMethod || "-"}
              </div>
              <div>
                <strong>Reason:</strong> {selected.reason || "-"}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(selected.createdAt).toLocaleString()}
              </div>
            </div>
            {selected.status === "PENDING" && (
              <div className="ui-hstack-2 mt-4">
                <button
                  className="ui-btn"
                  onClick={() => approve(selected.id, true)}
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  className="ui-btn-secondary ui-text-error"
                  onClick={() => approve(selected.id, false)}
                >
                  <X size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="ui-card">
            <>{(() => {
                                    const columns = [
                            { key: "col_0", header: "Refund #", render: (r: any) => (<>{r.refundNumber}</>) },
                            { key: "col_1", header: "Status", render: (r: any) => (<><span
                                                    className={`ui-badge-${r.status === "APPROVED" ? "success" : r.status === "PENDING" ? "warning" : r.status === "REJECTED" ? "error" : ""}`}
                                                  >
                                                    {r.status}
                                                  </span></>) },
                            { key: "col_2", header: "Amount", render: (r: any) => (<>${Number(r.refundAmount).toFixed(2)}</>) },
                            { key: "col_3", header: "Method", render: (r: any) => (<>{r.refundMethod || "-"}</>) },
                            { key: "col_4", header: "Date", render: (r: any) => (<>{new Date(r.createdAt).toLocaleString()}</>) },
                            { key: "col_5", header: "Actions", render: (r: any) => (<><button
                                                    className="ui-btn-icon"
                                                    onClick={async () => {
                                                      const d = await client.get<any>(
                                                        `/pos/exp/refunds/${r.id}`,
                                                      );
                                                      setSelected(d);
                                                    }}
                                                  >
                                                    <Eye size={14} />
                                                  </button></>) },
                          ];
                                    return <DataTable columns={columns} data={refunds} rowKey={(r: any) => r.id} />;
                                  })()}</>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
