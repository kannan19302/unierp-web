"use client";
import React, { useState, useEffect } from "react";
import { SplitSquareHorizontal, Search } from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { useToast, DataTable } from "@kannan19302/ui";

export default function POSSplitPaymentsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const d = await client.get<any>(`/pos/exp/split-payments/${orderId}`);
      setPayments(Array.isArray(d) ? d : []);
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load split payments";
      setLoadError(message);
      notifyError("Failed to load split payments", message);
    }
    setLoading(false);
  };

  return (
    <RouteGuard permission="pos.split-payment.read">
      <div className="ui-stack-6">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <SplitSquareHorizontal className="ui-text-primary" /> Split Payments
          </h1>
          <p className="ui-text-sm-muted">
            View split payment details for orders.
          </p>
        </div>
        <div className="ui-card">
          <div className="flex gap-2">
            <input
              className="ui-input flex-1"
              placeholder="Enter Order ID..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <button className="ui-btn" onClick={load}>
              <Search size={14} /> Search
            </button>
          </div>
        </div>
        {loadError && (
          <div className="ui-alert ui-alert-danger">
            Failed to load split payments — {loadError}
          </div>
        )}
        <div className="ui-card">
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Method", render: (p: any) => (<>{p.method}</>) },
                    { key: "col_1", header: "Amount", render: (p: any) => (<>${Number(p.amount).toFixed(2)}</>) },
                    { key: "col_2", header: "Reference", render: (p: any) => (<>{p.reference || "-"}</>) },
                    { key: "col_3", header: "Card Last4", render: (p: any) => (<>{p.cardLast4 || "-"}</>) },
                    { key: "col_4", header: "Status", render: (p: any) => (<>{p.status}</>) },
                    { key: "col_5", header: "Date", render: (p: any) => (<>{new Date(p.createdAt).toLocaleString()}</>) },
                  ];
                            return <DataTable columns={columns} data={payments} rowKey={(p: any) => p.id} />;
                          })()}</>
        </div>
      </div>
    </RouteGuard>
  );
}
