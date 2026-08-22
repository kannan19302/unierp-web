"use client";
// @ts-nocheck

import styles from "./page.module.css";

import React, { useState, useEffect } from "react";
import { PageHeader, Button, Spinner, Badge, StatCardRow, ListPageTemplate, type ListColumn, DataTable } from "@kannan19302/ui";
import {
  Plus,
  X,
  History,
  FileText,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

interface PurchaseReturn {
  id: string;
  returnNumber: string;
  status: string;
  returnDate: string;
  totalAmount: number;
  vendorName: string;
  poNumber: string;
  lineItemCount: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorName: string;
}

interface PurchaseOrderItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface PurchaseOrderDetail {
  id: string;
  poNumber: string;
  lineItems: PurchaseOrderItem[];
}

export default function PurchaseReturnsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Selected details drawer
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(
    null,
  );

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [returnNumber, setReturnNumber] = useState("");
  const [reason, setReason] = useState("");
  const [lineItems, setLineItems] = useState<
    Array<{
      productId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>
  >([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [returnsRes, ordersRes] = await Promise.all([
        client.get<PurchaseReturn[] | { data?: PurchaseReturn[] }>(
          "/procurement/returns",
        ),
        client.get<PurchaseOrder[] | { data?: PurchaseOrder[] }>(
          "/procurement/purchase-orders",
        ),
      ]);

      setReturns(
        Array.isArray(returnsRes) ? returnsRes : returnsRes.data || [],
      );
      setOrders(Array.isArray(ordersRes) ? ordersRes : ordersRes.data || []);
    } catch {
      setError("Could not load data. Please try again.");
      setReturns([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleOrderChange = async (orderId: string) => {
    setPurchaseOrderId(orderId);
    if (!orderId) {
      setLineItems([]);
      return;
    }

    setLoadingOrderItems(true);
    try {
      const data = await client.get<PurchaseOrderDetail>(
        `/procurement/purchase-orders/${orderId}`,
      );
      setLineItems(
        data.lineItems.map((item: any) => ({
          productId: item.productId,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
        })),
      );
    } catch {
      setLineItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      purchaseOrderId,
      returnNumber,
      reason: reason || undefined,
      lineItems: lineItems.filter((item: any) => item.quantity > 0),
    };

    try {
      await client.post("/procurement/returns", payload);

      setModalSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        loadData();
      }, 1500);
    } catch {
      setError("Action could not be completed. Please try again.");
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPurchaseOrderId("");
    setReturnNumber("");
    setReason("");
    setLineItems([]);
    setModalSuccess(false);
  };

  const getReturnTotal = returns.reduce((acc: any, r: any) => acc + r.totalAmount, 0);
  const getReturnCount = returns.length;

  const columns: ListColumn[] = [
    {
      key: "returnNumber",
      header: "Return ID",
      render: (_v: any, row: any) => {
        const r = row as unknown as PurchaseReturn;
        return <span className={styles.p1}>{r.returnNumber}</span>;
      },
    },
    {
      key: "vendorName",
      header: "Vendor Name",
      render: (_v: any, row: any) => {
        const r = row as unknown as PurchaseReturn;
        return <span>{r.vendorName}</span>;
      },
    },
    {
      key: "poNumber",
      header: "Purchase Order",
      render: (_v: any, row: any) => {
        const r = row as unknown as PurchaseReturn;
        return <Badge variant="default">{r.poNumber}</Badge>;
      },
    },
    {
      key: "returnDate",
      header: "Date Logged",
      render: (_v: any, row: any) => {
        const r = row as unknown as PurchaseReturn;
        return (
          <span className="ui-text-muted">
            {new Date(r.returnDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "lineItemCount",
      header: "Items",
      render: (_v: any, row: any) => {
        const r = row as unknown as PurchaseReturn;
        return <span className="font-medium">{r.lineItemCount} Types</span>;
      },
    },
    {
      key: "totalAmount",
      header: "Total Debit",
      render: (_v: any, row: any) => {
        const r = row as unknown as PurchaseReturn;
        return (
          <span className="font-bold">${r.totalAmount.toLocaleString()}</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: () => <Badge variant="success">Completed</Badge>,
    },
  ];

  return (
    <RouteGuard permission="procurement.return.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Supplier Returns"
          description="Log returned procurement goods, generate debit notes against vendor accounts, and reduce stock logs."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Procurement", href: "/procurement" },
            { label: "Returns" },
          ]}
          actions={
            <Button
              onClick={() => {
                setIsModalOpen(true);
                setReturnNumber(
                  `PR-${Math.floor(1000 + Math.random() * 9000)}`,
                );
              }}
              variant="primary"
              className="ui-hstack-2"
            >
              <Plus size={16} />
              <span>Log Supplier Return</span>
            </Button>
          }
        />

        {error && (
          <div className={styles.p2}>
            <AlertCircle size={16} className="ui-text-warning" />
            <span>{error}</span>
          </div>
        )}

        <StatCardRow
          stats={[
            {
              label: "Total Supplier Returns",
              value: `$${getReturnTotal.toLocaleString()}`,
              icon: <RotateCcw size={16} />,
              color: "var(--chart-4)",
            },
            {
              label: "Return Invoices Count",
              value: `${getReturnCount} Cases`,
              icon: <History size={16} />,
              color: "var(--chart-1)",
            },
            {
              label: "Debit Notes Issued",
              value: `${getReturnCount} Active`,
              icon: <FileText size={16} />,
              color: "var(--chart-2)",
            },
          ]}
        />

        <ListPageTemplate
          title=""
          columns={columns}
          data={returns as unknown as Record<string, unknown>[]}
          loading={loading}
          searchable
          searchPlaceholder="Search return slips..."
          emptyTitle="No Returns Logged"
          emptyDescription="Log returns to update warehouse stock and release Debit Notes."
          onRowClick={(row: any) =>
            setSelectedReturn(row as unknown as PurchaseReturn)
          }
        />

        {/* Selected Return Details Drawer */}
        {selectedReturn && (
          <div className={styles.p3}>
            <div className="ui-flex-between">
              <h3 className="ui-heading-lg">Return Summary</h3>
              <button
                onClick={() => setSelectedReturn(null)}
                className="ui-btn-icon ui-text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <div className={styles.p4}>{selectedReturn.returnNumber}</div>
              <div className={styles.p5}>
                Supplier: {selectedReturn.vendorName}
              </div>
            </div>

            <div className={styles.p6}>
              <div className="ui-flex-between">
                <span className="ui-text-muted">Original PO Reference:</span>
                <span className="font-semibold">{selectedReturn.poNumber}</span>
              </div>
              <div className="ui-flex-between">
                <span className="ui-text-muted">Debit Note Issued:</span>
                <span className={styles.p7}>Active (DN-PR)</span>
              </div>
              <div className="ui-flex-between">
                <span className="ui-text-muted">Return Date:</span>
                <span>
                  {new Date(selectedReturn.returnDate).toLocaleString()}
                </span>
              </div>
              <div className="ui-flex-between">
                <span className="ui-text-muted">Stock Status:</span>
                <span className={styles.p8}>Deducted</span>
              </div>
              <div className="ui-flex-between">
                <span className="ui-text-muted">Total Debit Amount:</span>
                <span className="ui-heading-lg">
                  ${selectedReturn.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Log Return Modal */}
        {isModalOpen && (
          <div className={styles.p9}>
            <div className={styles.p10}>
              <div className={styles.p11}>
                <h3 className="ui-heading-base">
                  Log Supplier Return & Issue Debit Note
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="ui-btn-icon ui-text-muted"
                >
                  <X size={18} />
                </button>
              </div>

              {modalSuccess ? (
                <div className={styles.p12}>
                  <RotateCcw size={48} className={styles.p13} />
                  <div className="ui-heading-base">
                    Return Slips Created Successfully
                  </div>
                  <div className="ui-text-sm-muted">
                    The inventory items have been deducted, and a Debit Note was
                    generated.
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateReturn} className={styles.p14}>
                  <div className="ui-grid-2">
                    <div className="ui-form-group">
                      <label className={styles.p15}>Return Reference No.</label>
                      <input
                        type="text"
                        required
                        value={returnNumber}
                        onChange={(e: any) => setReturnNumber(e.target.value)}
                        className={["ui-input", styles.p16].join(" ")}
                      />
                    </div>

                    <div className="ui-form-group">
                      <label className={styles.p17}>
                        Select Purchase Order
                      </label>
                      <select
                        required
                        value={purchaseOrderId}
                        onChange={(e: any) => handleOrderChange(e.target.value)}
                        className={["ui-input", styles.p18].join(" ")}
                      >
                        <option value="">-- Choose Purchase Order --</option>
                        {orders.map((o: any) => (
                          <option key={o.id} value={o.id}>
                            {o.poNumber} ({o.vendorName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ui-form-group">
                    <label className={styles.p19}>Return Reason</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Broken packaging, defective materials, incorrect specification..."
                      value={reason}
                      onChange={(e: any) => setReason(e.target.value)}
                      className={["ui-input", styles.p20].join(" ")}
                    />
                  </div>

                  <div>
                    <label className={styles.p21}>Line Items to Return</label>
                    {loadingOrderItems ? (
                      <div className={styles.p22}>
                        <Spinner size="md" />
                      </div>
                    ) : lineItems.length === 0 ? (
                      <div className={styles.p23}>
                        Please select a Purchase Order to populate return items.
                      </div>
                    ) : (
                      <div className={styles.p24}>
                        {(() => {
                          const columns = [
                            { key: "description", header: "Description", render: (item: any) => <>{item.description}</> },
                            {
                              key: "qty",
                              header: "Qty",
                              render: (item: any, index?: number) => (
                                <input
                                  type="number"
                                  min={0}
                                  value={item.quantity}
                                  onChange={(e: any) => {
                                    const updated = [...lineItems];
                                    const idx = index ?? 0;
                                    if (updated[idx]) {
                                      updated[idx]!.quantity = Number(e.target.value);
                                      setLineItems(updated);
                                    }
                                  }}
                                  className={styles.p32}
                                />
                              ),
                            },
                            { key: "unitPrice", header: "Unit Price", render: (item: any) => <>${Number(item.unitPrice || 0).toLocaleString()}</> },
                            { key: "taxRate", header: "Tax (%)", render: (item: any) => <>{item.taxRate}%</> },
                            {
                              key: "total",
                              header: "Total",
                              render: (item: any) => {
                                const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * (1 + (Number(item.taxRate) || 0) / 100);
                                return <>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</>;
                              },
                            },
                          ];
                          return <DataTable columns={columns} data={lineItems} rowKey={(item: any, index: number) => String(index)} />;
                        })()}
                      </div>
                    )}
                  </div>

                  <div className={styles.p36}>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting || lineItems.length === 0}
                    >
                      {submitting ? "Registering Return..." : "Complete Return"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
