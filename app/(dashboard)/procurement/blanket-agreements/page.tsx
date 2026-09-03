"use client";

import styles from "./page.module.css";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, Badge, DataTable } from "@kannan19302/ui";
import {
  Plus,
  Trash2,
  X,
  FileText,
  AlertCircle,
  Calendar,
  Building,
  Layers,
  Percent,
  CheckCircle,
  FileSpreadsheet,
} from "lucide-react";
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

interface AgreementItem {
  id: string;
  productId?: string;
  productName?: string;
  description: string;
  quantity: number;
  releasedQty: number;
  unitPrice: number;
  totalAmount: number;
}

interface BlanketAgreement {
  id: string;
  agreementNumber: string;
  title: string;
  status: string; // ACTIVE, EXPIRED, TERMINATED
  vendorId: string;
  vendorName?: string;
  startDate: string;
  endDate: string;
  agreementLimit: number;
  releasedAmount: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  lineItems?: AgreementItem[];
}

export default function BlanketAgreementsPage() {
  const client = useApiClient();
  const [agreements, setAgreements] = useState<BlanketAgreement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [agreementNumber, setAgreementNumber] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [agreementLimit, setAgreementLimit] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<
    Array<{
      productId: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>
  >([{ productId: "", description: "", quantity: 1, unitPrice: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  // Release PO states
  const [selectedAgreement, setSelectedAgreement] =
    useState<BlanketAgreement | null>(null);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releaseQuantities, setReleaseQuantities] = useState<
    Record<string, number>
  >({});
  const [releasing, setReleasing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [baRes, vRes, prodRes] = await Promise.all([
        client.get<BlanketAgreement[]>("/procurement/blanket-agreements"),
        client.get<Vendor[]>("/crm/vendors"),
        client.get<Product[]>("/inventory/products"),
      ]);

      setAgreements(Array.isArray(baRes) ? baRes : []);
      setVendors(Array.isArray(vRes) ? vRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch {
      setError("Could not load data. Please try again.");
      setAgreements([]);
      setVendors([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [client]);

  const resetForm = () => {
    setTitle("");
    setAgreementNumber(
      `BPA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    );
    setSelectedVendor("");
    setStartDate("");
    setEndDate("");
    setAgreementLimit(0);
    setCurrency("USD");
    setNotes("");
    setItems([{ productId: "", description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { productId: "", description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_: any, i: any) => i !== index));
  };

  const handleItemChange = (index: number, key: string, value: any) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    if (!currentItem) return;

    const updated = { ...currentItem, [key]: value } as any;
    newItems[index] = updated;

    if (key === "productId") {
      const prod = products.find((p: any) => p.id === value);
      if (prod) {
        updated.description = prod.name;
        updated.unitPrice = Number((prod as any)?.costPrice || (prod as any)?.price || 0);
      }
    }
    setItems(newItems);

    // Auto-calculate agreementLimit if user edited rows
    const total = newItems.reduce(
      (sum: any, item: any) => sum + item.quantity * item.unitPrice,
      0,
    );
    setAgreementLimit(total);
  };

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post("/procurement/blanket-agreements", {
        agreementNumber,
        vendorId: selectedVendor,
        title,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        agreementLimit: Number(agreementLimit),
        currency,
        notes: notes || undefined,
        lineItems: items.map((item: any) => ({
          productId: item.productId || undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      setIsModalOpen(false);
      loadData();
    } catch {
      // save failed — surface the error instead of fabricating a result
      setError("Action could not be completed. Please try again.");
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReleaseModal = (agreement: BlanketAgreement) => {
    setSelectedAgreement(agreement);
    const initialQty: Record<string, number> = {};
    agreement.lineItems?.forEach((item: any) => {
      // default release to remaining quantity under agreement
      const remaining = Number(item.quantity) - Number(item.releasedQty);
      initialQty[item.id] = remaining > 0 ? remaining : 0;
    });
    setReleaseQuantities(initialQty);
    setIsReleaseModalOpen(true);
  };

  const handleReleaseQuantityChange = (itemId: string, val: number) => {
    setReleaseQuantities({ ...releaseQuantities, [itemId]: val });
  };

  const handleReleasePO = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAgreement) return;
    setReleasing(true);
    try {
      const itemsPayload = Object.entries(releaseQuantities)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([lineId, qty]) => ({
          lineId,
          quantity: Number(qty),
        }));

      if (itemsPayload.length === 0) {
        alert("Please specify at least one item quantity to release.");
        setReleasing(false);
        return;
      }

      await client.post(
        `/procurement/blanket-agreements/${selectedAgreement.id}/release`,
        { items: itemsPayload },
      );

      alert("Successfully released a Purchase Order under this agreement.");
      setIsReleaseModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || "Failed to release Purchase Order.");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <RouteGuard permission="procurement.blanket-agreement.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Blanket Purchase Agreements"
          description="Establish long-term supply contracts, locking in prices for items and releasing orders against the contract."
          actions={
            <Button
              onClick={handleOpenCreateModal}
              className="ui-btn ui-btn-primary"
            >
              <Plus size={16} className="mr-2" />
              New Blanket Contract
            </Button>
          }
        />

        {error && (
          <div className={styles.p1}>
            <AlertCircle size={16} />
            <span>Note: {error}</span>
          </div>
        )}

        {/* Contract Consumption metrics */}
        <div className="ui-grid-3">
          <Card className="ui-card">
            <div className="ui-flex-between">
              <div>
                <div className={styles.p2}>Active Agreements</div>
                <div className={styles.p3}>
                  {agreements.filter((a: any) => a.status === "ACTIVE").length}
                </div>
              </div>
              <div className={styles.p4}>
                <Layers size={20} />
              </div>
            </div>
          </Card>
          <Card className="ui-card">
            <div className="ui-flex-between">
              <div>
                <div className={styles.p5}>Total Contract value</div>
                <div className={styles.p6}>
                  $
                  {agreements
                    .reduce((sum: any, a: any) => sum + Number(a.agreementLimit), 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className={styles.p7}>
                <Percent size={20} />
              </div>
            </div>
          </Card>
          <Card className="ui-card">
            <div className="ui-flex-between">
              <div>
                <div className={styles.p8}>Total Released Spend</div>
                <div className={styles.p9}>
                  $
                  {agreements
                    .reduce((sum: any, a: any) => sum + Number(a.releasedAmount), 0)
                    .toLocaleString()}
                </div>
              </div>
              <div className={styles.p10}>
                <FileSpreadsheet size={20} />
              </div>
            </div>
          </Card>
        </div>

        {/* Main List */}
        <Card className="ui-card">
          {loading ? (
            <div className="ui-center-pad">
              <Spinner size="lg" />
            </div>
          ) : agreements.length === 0 ? (
            <div className="text-center p-12">
              <Layers size={48} className={styles.p11} />
              <h3 className={styles.p12}>No Blanket Purchase Agreements</h3>
              <p className={styles.p13}>
                Create long-term supplier pricing agreements to simplify
                purchasing.
              </p>
            </div>
          ) : (
            <div className="builder-table-wrapper">
              <>{(() => {
                                          const columns = [
                                    { key: "col_0", header: "Agreement No." , render: (ba: any) => (<>{ba.agreementNumber}</>) },
                                    { key: "col_1", header: "Contract Title" , render: (ba: any) => (<><div className="font-medium">{ba.title}</div>{ba.notes && (
                                                              <div className={styles.p19}>{ba.notes}</div>
                                                            )}</>) },
                                    { key: "col_2", header: "Supplier" , render: (ba: any) => (<>{ba.vendorName || "Selected Supplier"}</>) },
                                    { key: "col_3", header: "Duration" , render: (ba: any) => (<><div>
                                                              Start: {new Date(ba.startDate).toLocaleDateString()}
                                                            </div><div className={styles.p21}>
                                                              End: {new Date(ba.endDate).toLocaleDateString()}
                                                            </div></>) },
                                    { key: "col_4", header: "Released Limit" , render: (ba: any) => {
                                      const percentConsumed = ba.agreementLimit > 0 ? (ba.releasedAmount / ba.agreementLimit) * 100 : 0;
                                      return (<><div className={styles.p22}>
                                                              <div className={styles.p23}>
                                                                <span>
                                                                  ${Number(ba.releasedAmount).toLocaleString()}
                                                                </span>
                                                                <span className="ui-text-muted">
                                                                  / ${Number(ba.agreementLimit).toLocaleString()}
                                                                </span>
                                                              </div>
                                                              {/* Progress bar */}
                                                              <div className={styles.p24}>
                                                                <div
                                                                  style={{
                                                                    width: `${Math.min(percentConsumed, 100)}%`,
                                                                    background:
                                                                      percentConsumed >= 90
                                                                        ? "var(--color-danger)"
                                                                        : percentConsumed >= 70
                                                                          ? "var(--color-warning)"
                                                                          : "var(--color-success)",
                                                                  }}
                                                                />
                                                              </div>
                                                            </div></>);
                                    } },
                                    { key: "col_5", header: "Status" , render: (ba: any) => (<><Badge
                                                              variant={
                                                                ba.status === "ACTIVE" ? "success" : "default"
                                                              }
                                                            >
                                                              {ba.status}
                                                            </Badge></>) },
                                    { key: "col_6", header: "Actions" , render: (ba: any) => {
                                      const percentConsumed = ba.agreementLimit > 0 ? (ba.releasedAmount / ba.agreementLimit) * 100 : 0;
                                      return (<><div className="ui-flex-end ui-gap-2">
                                                              <Button
                                                                onClick={() => handleOpenReleaseModal(ba)}
                                                                disabled={
                                                                  ba.status !== "ACTIVE" || percentConsumed >= 100
                                                                }
                                                                className={[
                                                                  "ui-btn ui-btn-primary",
                                                                  styles.p27,
                                                                ].join(" ")}
                                                              >
                                                                Release PO
                                                              </Button>
                                                            </div></>);
                                    } },
                                  ];
                                          return <DataTable columns={columns} data={agreements} rowKey={(ba: any) => ba.id} />;
                                      })()}</>
            </div>
          )}
        </Card>

        {/* BPA Creation Modal */}
        {isModalOpen && (
          <div className={styles.p28}>
            <div className={styles.p29}>
              {/* Header */}
              <div className={styles.p30}>
                <h3 className={styles.p31}>
                  Create Blanket Purchase Agreement
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="ui-btn-icon ui-text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateAgreement} className={styles.p32}>
                <div className="ui-grid-2">
                  <div className="ui-form-group">
                    <label className="ui-label">Agreement Number</label>
                    <input
                      type="text"
                      required
                      value={agreementNumber}
                      onChange={(e: any) => setAgreementNumber(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Contract Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FY2026 Steel Sheet Agreement"
                      value={title}
                      onChange={(e: any) => setTitle(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                </div>

                <div className="ui-grid-2">
                  <div className="ui-form-group">
                    <label className="ui-label">Vendor / Supplier</label>
                    <select
                      required
                      value={selectedVendor}
                      onChange={(e: any) => setSelectedVendor(e.target.value)}
                      className="ui-input"
                    >
                      <option value="">Select Vendor...</option>
                      {vendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Currency</label>
                    <select
                      value={currency}
                      onChange={(e: any) => setCurrency(e.target.value)}
                      className="ui-input"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="ui-grid-2">
                  <div className="ui-form-group">
                    <label className="ui-label">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e: any) => setStartDate(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e: any) => setEndDate(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className={styles.p33}>
                  <div className="ui-flex-between mb-2">
                    <h4 className={styles.p34}>
                      Agreement Line Items & Locked Prices
                    </h4>
                    <Button
                      type="button"
                      onClick={handleAddItemRow}
                      className={["ui-btn ui-btn-secondary", styles.p35].join(
                        " ",
                      )}
                    >
                      <Plus size={12} className={styles.p36} /> Add Item
                    </Button>
                  </div>

                  <div className="ui-stack-2">
                    {items.map((item: any, idx: any) => (
                      <div key={idx} className={styles.p37}>
                        <div
                          className={["ui-form-group", styles.p38].join(" ")}
                        >
                          <label className={["ui-label", styles.p39].join(" ")}>
                            Product
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e: any) =>
                              handleItemChange(idx, "productId", e.target.value)
                            }
                            className="ui-input"
                          >
                            <option value="">Custom Item / Service</option>
                            {products.map((p: any) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div
                          className={["ui-form-group", styles.p40].join(" ")}
                        >
                          <label className={["ui-label", styles.p41].join(" ")}>
                            Description
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contract specifications"
                            value={item.description}
                            onChange={(e: any) =>
                              handleItemChange(
                                idx,
                                "description",
                                e.target.value,
                              )
                            }
                            className="ui-input"
                          />
                        </div>

                        <div className="ui-form-group flex-1">
                          <label className={["ui-label", styles.p42].join(" ")}>
                            Max Qty
                          </label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={item.quantity}
                            onChange={(e: any) =>
                              handleItemChange(
                                idx,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            className="ui-input"
                          />
                        </div>

                        <div
                          className={["ui-form-group", styles.p43].join(" ")}
                        >
                          <label className={["ui-label", styles.p44].join(" ")}>
                            Contract Price ($)
                          </label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={item.unitPrice}
                            onChange={(e: any) =>
                              handleItemChange(
                                idx,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                            className="ui-input"
                          />
                        </div>

                        <div className={styles.p45}>
                          <div className={styles.p46}>Total Limit</div>
                          <div className={styles.p47}>
                            ${(item.quantity * item.unitPrice).toLocaleString()}
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={items.length === 1}
                          className={["ui-btn ui-btn-danger", styles.p48].join(
                            " ",
                          )}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className={styles.p49}>
                    <div className={["ui-form-group", styles.p50].join(" ")}>
                      <label className="ui-label">
                        Agreement Total Value Limit ($)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={agreementLimit}
                        onChange={(e: any) =>
                          setAgreementLimit(Number(e.target.value))
                        }
                        className="ui-input"
                      />
                    </div>
                    <div className="ui-text-sm-muted">
                      Calculated Items Cost:{" "}
                      <span className={styles.p51}>
                        $
                        {items
                          .reduce(
                            (sum: any, item: any) => sum + item.quantity * item.unitPrice,
                            0,
                          )
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ui-form-group">
                  <label className="ui-label">Contract notes & Terms</label>
                  <textarea
                    placeholder="Detail penalty parameters, shipment delays allowances, delivery terms..."
                    value={notes}
                    onChange={(e: any) => setNotes(e.target.value)}
                    className="ui-input"
                    rows={2}
                  />
                </div>

                {/* Footer */}
                <div className={styles.p52}>
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="ui-btn ui-btn-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="ui-btn ui-btn-primary"
                  >
                    {submitting ? <Spinner size="sm" /> : "Create Agreement"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PO Release Drawer */}
        {isReleaseModalOpen && selectedAgreement && (
          <div className={styles.p53}>
            <div className={styles.p54}>
              {/* Header */}
              <div className={styles.p55}>
                <div>
                  <h3 className={styles.p56}>Release Purchase Order</h3>
                  <span className="ui-text-xs-muted">
                    Drawing down from Agreement{" "}
                    {selectedAgreement.agreementNumber}
                  </span>
                </div>
                <button
                  onClick={() => setIsReleaseModalOpen(false)}
                  className="ui-btn-icon ui-text-muted"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleReleasePO} className={styles.p57}>
                <div className="ui-text-sm-muted">
                  Select quantity for the items you want to release. The unit
                  price will remain locked based on the blanket contract
                  agreement.
                </div>

                <div className={styles.p58}>
                  <>{(() => {
                                          const columns = [
                                    { key: "col_0", header: "Description" , render: (item: any) => (<><div className="font-bold">
                                                                  {item.productName || "Custom"}
                                                                </div><div className="ui-text-micro ui-text-muted">
                                                                  {item.description}
                                                                </div></>) },
                                    { key: "col_1", header: "Locked Price" , render: (item: any) => (<>${Number(item.unitPrice).toLocaleString()}</>) },
                                    { key: "col_2", header: "Remaining / Max Qty" , render: (item: any) => {
                                      const maxQty = item.quantity;
                                      const remQty = item.quantity - (item.releasedQuantity || 0);
                                      return (<><span
                                                                  style={{
                                                                    color:
                                                                      remQty <= 0
                                                                        ? "var(--color-danger)"
                                                                        : "inherit",
                                                                  }}
                                                                >
                                                                  {remQty}
                                                                </span>{" "}/ {maxQty}</>);
                                    } },
                                    { key: "col_3", header: "Release Qty" , render: (item: any) => {
                                      const maxQty = item.quantity;
                                      const remQty = item.quantity - (item.releasedQuantity || 0);
                                      return (<><input
                                                                  type="number"
                                                                  min={0}
                                                                  max={remQty}
                                                                  required
                                                                  value={releaseQuantities[item.id] || 0}
                                                                  onChange={(e: any) =>
                                                                    handleReleaseQuantityChange(
                                                                      item.id,
                                                                      Number(e.target.value),
                                                                    )
                                                                  }
                                                                  disabled={remQty <= 0}
                                                                  className={["ui-input", styles.p64].join(" ")}
                                                                /></>);
                                    } },
                                  ];
                                          return <DataTable columns={columns} data={selectedAgreement.lineItems || []} rowKey={(item: any) => item.id} />;
                                      })()}</>
                </div>

                {/* Estimate Release cost */}
                <div className={styles.p65}>
                  <div className="ui-text-sm-muted">
                    Released PO Est. Total Value:{" "}
                    <span className={styles.p66}>
                      $
                      {selectedAgreement.lineItems
                        ?.reduce((sum: any, item: any) => {
                          const qty = releaseQuantities[item.id] || 0;
                          return sum + qty * Number(item.unitPrice);
                        }, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className={styles.p67}>
                  <Button
                    type="button"
                    onClick={() => setIsReleaseModalOpen(false)}
                    className="ui-btn ui-btn-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={releasing}
                    className="ui-btn ui-btn-primary"
                  >
                    {releasing ? (
                      <Spinner size="sm" />
                    ) : (
                      "Release Purchase Order"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
