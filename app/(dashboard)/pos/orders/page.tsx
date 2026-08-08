import { DataTable } from "@kannan19302/ui";
"use client";

import styles from "./page.module.css";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Eye,
  RotateCcw,
  XCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

interface POSOrder {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  customerName: string | null;
  cashierName: string | null;
  grandTotal: string;
  paidAmount: string;
  createdAt: string;
}

export default function POSOrdersPage() {
  const client = useApiClient();
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search,
      });
      const data = await client.get<unknown>(`/pos/orders?${params}`);
      if (
        data &&
        typeof data === "object" &&
        "data" in data &&
        Array.isArray(data.data)
      ) {
        setOrders(data.data as POSOrder[]);
        setTotalPages(
          "totalPages" in data && typeof data.totalPages === "number"
            ? data.totalPages
            : 1,
        );
      } else {
        setOrders([]);
        setTotalPages(1);
      }
    } catch {
      setOrders([]);
      setTotalPages(1);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [page, search, client]);

  const loadOrderDetail = async (id: string) => {
    try {
      const data = await client.get<unknown>(`/pos/orders/${id}`);
      setSelectedOrder(data && typeof data === "object" ? data : null);
    } catch {
      setSelectedOrder(null);
    }
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: "var(--color-success)",
      RETURNED: "var(--color-warning)",
      EXCHANGED: "var(--color-primary)",
      VOIDED: "var(--color-error)",
    };
    return map[s] || "var(--color-text-secondary)";
  };

  return (
    <RouteGuard permission="pos.orders.read">
      <div className="ui-stack-6">
        <div>
          <h1 className="text-2xl ui-hstack-2">
            <ShoppingCart className="ui-text-primary" />
            POS Orders
          </h1>
          <p className="ui-text-sm-muted">
            View, search, and manage all point-of-sale transactions.
          </p>
        </div>

        <div className={styles.p1}>
          <div className={styles.p2}>
            <Search size={16} className={styles.p3} />
            <input
              placeholder="Search by order # or customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={styles.p4}
            />
          </div>
        </div>

        {selectedOrder ? (
          <div className="ui-card p-5">
            <button
              onClick={() => setSelectedOrder(null)}
              className={styles.p5}
            >
              ← Back to Orders
            </button>
            <div className="ui-grid-2">
              <div>
                <strong>Order:</strong> {selectedOrder.orderNumber}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span style={{ color: statusColor(selectedOrder.status) }}>
                  {selectedOrder.status}
                </span>
              </div>
              <div>
                <strong>Customer:</strong>{" "}
                {selectedOrder.customerName || "Walk-in"}
              </div>
              <div>
                <strong>Cashier:</strong>{" "}
                {selectedOrder.cashierName || selectedOrder.cashierId}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Total:</strong> $
                {Number(selectedOrder.grandTotal).toFixed(2)}
              </div>
            </div>
            <h3 className={styles.p6}>Items</h3>
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Product" , render: (item: any) => (<>{item.productName}</>) },
                        { key: "col_1", header: "Qty" , render: (item: any) => (<>{Number(item.qty)}</>) },
                        { key: "col_2", header: "Price" , render: (item: any) => (<>${Number(item.unitPrice).toFixed(2)}</>) },
                        { key: "col_3", header: "Total" , render: (item: any) => (<>${Number(item.lineTotal).toFixed(2)}</>) },
                      ];
                              return <DataTable columns={columns} data={(selectedOrder.items || [])} rowKey={(item: any) => item.id} />;
                          })()}</>
            <h3 className={styles.p15}>Payments</h3>
            {(selectedOrder.payments || []).map((p: any) => (
              <div key={p.id} className={styles.p16}>
                <span>{p.method}</span>
                <span>${Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.p17}>
            <>{(() => {
                                    const columns = [
                            { key: "col_0", header: h, render: (o: any) => (<>{o.orderNumber}</>) },
                          ];
                                    return <DataTable columns={columns} data={orders} rowKey={(o: any) => o.id} />;
                                  })()}</>
            <div className={styles.p28}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  cursor: page > 1 ? "pointer" : "default",
                  opacity: page > 1 ? 1 : 0.5,
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <span className={styles.p30}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  cursor: page < totalPages ? "pointer" : "default",
                  opacity: page < totalPages ? 1 : 0.5,
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
