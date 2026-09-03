"use client";

import styles from "./page.module.css";

import React, { useState, useEffect } from "react";
import { PageHeader, Button, Badge, ListPageTemplate, type ListColumn } from "@kannan19302/ui";
import { Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  totalAmount: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  orderDate: string;
  expectedDate: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  vendorName: string;
  notes?: string;
  lineItems?: PurchaseOrderItem[];
}

export default function PurchaseOrdersPage() {
  const client = useApiClient();
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    Array<{
      productId: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>
  >([
    { productId: "", description: "", quantity: 1, unitPrice: 0, taxRate: 10 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [poRes, vRes, pRes] = await Promise.all([
        client.get<PurchaseOrder[]>("/procurement/purchase-orders"),
        client.get<Vendor[]>("/crm/vendors"),
        client.get<Product[]>("/inventory/products"),
      ]);

      setPos(Array.isArray(poRes) ? poRes : []);
      setVendors(Array.isArray(vRes) ? vRes : []);
      setProducts(Array.isArray(pRes) ? pRes : []);
    } catch {
      setError("Could not load data. Please try again.");
      setPos([]);
      setVendors([]);
      setProducts([]);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/procurement/purchase-orders", {
        vendorId: selectedVendor,
        poNumber,
        expectedDate: expectedDate || undefined,
        notes,
        lineItems: items.map((item: any) => ({
          productId: item.productId || undefined,
          description:
            item.description ||
            products.find((p: any) => p.id === item.productId)?.name ||
            "Custom item",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
      });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to create purchase order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprovePO = async (id: string) => {
    try {
      await client.patch(`/procurement/purchase-orders/${id}/status`, {
        status: "APPROVED",
      });
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to approve purchase order.");
    }
  };

  const resetForm = () => {
    setSelectedVendor("");
    setPoNumber("");
    setExpectedDate("");
    setNotes("");
    setItems([
      {
        productId: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 10,
      },
    ]);
  };

  const columns: ListColumn[] = [
    {
      key: "poNumber",
      header: "Order ID",
      render: (_v: any, row: any) => {
        const po = row as unknown as PurchaseOrder;
        return <span className="font-bold">{po.poNumber}</span>;
      },
    },
    {
      key: "vendorName",
      header: "Supplier",
    },
    {
      key: "orderDate",
      header: "Order Date",
      render: (_v: any, row: any) => {
        const po = row as unknown as PurchaseOrder;
        return (
          <span className="ui-text-muted">
            {new Date(po.orderDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Total Value",
      render: (_v: any, row: any) => {
        const po = row as unknown as PurchaseOrder;
        return (
          <span className={styles.p1}>
            ${po.totalAmount.toLocaleString()} {po.currency}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (_v: any, row: any) => {
        const po = row as unknown as PurchaseOrder;
        return (
          <Badge
            variant={
              po.status === "APPROVED" || po.status === "RECEIVED"
                ? "success"
                : "info"
            }
          >
            {po.status}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (_v: any, row: any) => {
        const po = row as unknown as PurchaseOrder;
        if (po.status !== "DRAFT") return null;
        return (
          <button
            onClick={(e: any) => {
              e.stopPropagation();
              handleApprovePO(po.id);
            }}
            className={["ui-btn ui-btn-primary", styles.p2].join(" ")}
          >
            <CheckCircle size={12} /> Approve Order
          </button>
        );
      },
    },
  ];

  return (
    <RouteGuard permission="procurement.purchase-order.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Purchase Orders"
          description="Draft, approve, and track commercial purchase contracts sent to suppliers."
          actions={
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="ui-hstack-2"
            >
              <Plus size={14} />
              Create Purchase Order
            </Button>
          }
        />

        {error && (
          <div className={styles.p3}>
            <AlertCircle size={16} />
            <span>Note: {error}</span>
          </div>
        )}

        <ListPageTemplate
          title=""
          columns={columns}
          data={pos as unknown as Record<string, unknown>[]}
          loading={loading}
          searchable
          searchPlaceholder="Search purchase orders..."
          emptyTitle="No Purchase Orders recorded"
          emptyDescription="Create your first purchase order to get started."
        />

        {/* PO Creation Modal */}
        {isModalOpen && (
          <div className={styles.p4}>
            <div className={["ui-card", styles.p5].join(" ")}>
              <div className={styles.p6}>
                <span className={styles.p7}>Create Purchase Order (PO)</span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="ui-btn-icon ui-text-muted"
                >
                  Close
                </button>
              </div>
              <div className="ui-card-body p-5">
                <form onSubmit={handleCreatePO} className="ui-stack-4">
                  <div className="ui-grid-2">
                    <div className="ui-form-group ui-stack-1">
                      <label className="ui-label ui-text-xs-label">
                        Purchase Order Code *
                      </label>
                      <input
                        type="text"
                        className="ui-input"
                        value={poNumber}
                        onChange={(e: any) => setPoNumber(e.target.value)}
                        placeholder="e.g. PO-2026-003"
                        required
                      />
                    </div>
                    <div className="ui-form-group ui-stack-1">
                      <label className="ui-label ui-text-xs-label">
                        Supplier *
                      </label>
                      <select
                        className={["ui-input", styles.p8].join(" ")}
                        value={selectedVendor}
                        onChange={(e: any) => setSelectedVendor(e.target.value)}
                        required
                      >
                        <option value="">-- Select Supplier --</option>
                        {vendors.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ui-grid-2">
                    <div className="ui-form-group ui-stack-1">
                      <label className="ui-label ui-text-xs-label">
                        Expected Receipt Date
                      </label>
                      <input
                        type="date"
                        className="ui-input"
                        value={expectedDate}
                        onChange={(e: any) => setExpectedDate(e.target.value)}
                      />
                    </div>
                    <div className="ui-form-group ui-stack-1">
                      <label className="ui-label ui-text-xs-label">
                        Internal Contract Notes
                      </label>
                      <input
                        type="text"
                        className="ui-input"
                        value={notes}
                        onChange={(e: any) => setNotes(e.target.value)}
                        placeholder="e.g. Reference supplier contract or quotation"
                      />
                    </div>
                  </div>

                  {/* PO Item Adding Grid */}
                  <div className={styles.p9}>
                    <div className="ui-flex-between mb-2">
                      <span className={styles.p10}>Contracted Items</span>
                      <button
                        type="button"
                        onClick={() =>
                          setItems([
                            ...items,
                            {
                              productId: "",
                              description: "",
                              quantity: 1,
                              unitPrice: 0,
                              taxRate: 10,
                            },
                          ])
                        }
                        className={["ui-btn ui-btn-secondary", styles.p11].join(
                          " ",
                        )}
                      >
                        Add Item
                      </button>
                    </div>

                    {items.map((item: any, idx: any) => (
                      <div key={idx} className={styles.p12}>
                        <select
                          className={["ui-input", styles.p13].join(" ")}
                          value={item.productId}
                          onChange={(e: any) => {
                            const updated = [...items];
                            if (updated[idx]) {
                              updated[idx].productId = e.target.value;
                              setItems(updated);
                            }
                          }}
                        >
                          <option value="">-- Catalog Item --</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          className="ui-input flex-1"
                          placeholder="Spec..."
                          value={item.description}
                          onChange={(e: any) => {
                            const updated = [...items];
                            if (updated[idx]) {
                              updated[idx].description = e.target.value;
                              setItems(updated);
                            }
                          }}
                        />
                        <input
                          type="number"
                          className={["ui-input", styles.p14].join(" ")}
                          value={item.quantity}
                          onChange={(e: any) => {
                            const updated = [...items];
                            if (updated[idx]) {
                              updated[idx].quantity =
                                parseFloat(e.target.value) || 1;
                              setItems(updated);
                            }
                          }}
                          placeholder="Qty"
                          required
                        />
                        <input
                          type="number"
                          className={["ui-input", styles.p15].join(" ")}
                          value={item.unitPrice}
                          onChange={(e: any) => {
                            const updated = [...items];
                            if (updated[idx]) {
                              updated[idx].unitPrice =
                                parseFloat(e.target.value) || 0;
                              setItems(updated);
                            }
                          }}
                          placeholder="Price"
                          required
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setItems(items.filter((_: any, i: any) => i !== idx))
                            }
                            className={styles.p16}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className={styles.p17}>
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="ui-btn ui-btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? "Creating..." : "Create Draft PO"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
