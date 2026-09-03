"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, PageHeader, Button, Spinner, Badge } from "@kannan19302/ui";
import { useApiClient } from "@kannan19302/framework";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Building,
  Calendar,
  Layers,
  Send,
  ArrowRight,
  Info,
} from "lucide-react";

interface RFQItem {
  id: string;
  productId: string | null;
  description: string;
  quantity: number;
  product?: { name: string; sku: string } | null;
}

interface PublicRFQ {
  id: string;
  rfqNumber: string;
  notes: string | null;
  expectedDate: string | null;
  lineItems: RFQItem[];
}

interface Vendor {
  id: string;
  name: string;
}

export default function PublicBiddingPage() {
  const params = useParams();
  const rfqNumber = params.rfqNumber as string;
  const client = useApiClient();

  const [rfq, setRfq] = useState<PublicRFQ | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedVendor, setSelectedVendor] = useState("");
  const [quotationNumber, setQuotationNumber] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [linePrices, setLinePrices] = useState<
    Record<string, { unitPrice: number; taxRate: number }>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rfqData = await client.get<PublicRFQ>(
        `/procurement/public/rfqs/${rfqNumber}`,
      );
      setRfq(rfqData);

      // Fetch registered vendors for bid matching
      const vData = await client.get<Vendor[] | { data?: Vendor[] }>(
        "/crm/vendors",
      );
      setVendors(Array.isArray(vData) ? vData : (vData.data ?? []));

      // Initialize linePrices mapping
      const initialPrices: Record<
        string,
        { unitPrice: number; taxRate: number }
      > = {};
      rfqData.lineItems.forEach((item: RFQItem) => {
        initialPrices[item.id] = { unitPrice: 0, taxRate: 0 };
      });
      setLinePrices(initialPrices);
    } catch {
      setError("Could not load RFQ details. The RFQ may not exist or has expired.");
      setRfq(null);
      setVendors([]);
      setLinePrices({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rfqNumber) {
      loadData();
    }
  }, [rfqNumber]);

  const handlePriceChange = (
    itemId: string,
    field: "unitPrice" | "taxRate",
    val: number,
  ) => {
    setLinePrices((prev: any) => {
      const current = prev[itemId] || { unitPrice: 0, taxRate: 0 };
      return {
        ...prev,
        [itemId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!rfq) return;

      const itemsPayload = rfq.lineItems.map((item: any) => {
        const prc = linePrices[item.id] || { unitPrice: 0, taxRate: 0 };
        return {
          productId: item.productId || undefined,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(prc.unitPrice),
          taxRate: Number(prc.taxRate),
        };
      });

      const payload = {
        vendorId: selectedVendor,
        quotationNumber,
        validUntil: new Date(validUntil).toISOString(),
        notes: notes || undefined,
        lineItems: itemsPayload,
      };

      await client.post(
        `/procurement/public/rfqs/${rfqNumber}/submit-bid`,
        payload,
      );
      setSubmittedSuccess(true);
    } catch {
      setError("Action could not be completed. Please try again.");
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  let subtotal = 0;
  let taxAmount = 0;
  if (rfq) {
    rfq.lineItems.forEach((item: any) => {
      const prc = linePrices[item.id] || { unitPrice: 0, taxRate: 0 };
      const itemSubtotal = item.quantity * prc.unitPrice;
      const itemTax = itemSubtotal * (prc.taxRate / 100);
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });
  }
  const totalAmount = subtotal + taxAmount;

  if (loading) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className={styles.s1}>
        <div className={styles.s2}>
          <AlertCircle size={32} className="ui-text-warning" />
          <h2 className={styles.s4}>RFQ Not Available</h2>
          <p className={styles.s5}>
            {error || "The requested RFQ could not be found or has expired."}
          </p>
        </div>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className={styles.s1}>
        <div className={styles.s2}>
          <div className={styles.s3}>
            <CheckCircle size={32} />
          </div>
          <h2 className={styles.s4}>Bid Submitted Successfully!</h2>
          <p className={styles.s5}>
            Your official pricing quotation has been recorded in our sourcing
            registry under RFQ number{" "}
            <span className={styles.s6}>{rfqNumber}</span>.
          </p>
          <div className={styles.s7}>
            <Button
              onClick={() => window.close()}
              className="ui-btn ui-btn-secondary"
            >
              Close Window
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.s8}>
      <div className={styles.s9}>
        {/* Header Branding */}
        <div className={styles.s10}>
          <div>
            <h1 className={styles.s11}>Sourcing & Supplier Bid Portal</h1>
            <p className={styles.s12}>
              Universal ERP (UniERP) Vendor Sourcing Network
            </p>
          </div>
          <div className={styles.s13}>
            <Info size={16} className={styles.s36} />
            <span className={styles.s14}>RFQ: {rfqNumber}</span>
          </div>
        </div>

        {error && (
          <div className={styles.s15}>
            <AlertCircle size={16} />
            <span>Note: {error}</span>
          </div>
        )}

        <div className={`ui-grid-3 ${styles.s16}`}>
          {/* Form */}
          <form onSubmit={handleFormSubmit} className={styles.s17}>
            <Card className="ui-card">
              <h3 className={styles.s18}>Supplier Proposal Profile</h3>

              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Select Vendor Identity</label>
                  <select
                    required
                    value={selectedVendor}
                    onChange={(e: any) => setSelectedVendor(e.target.value)}
                    className="ui-input"
                  >
                    <option value="">Choose Supplier Profile...</option>
                    {vendors.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Your Quotation Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QT-998822"
                    value={quotationNumber}
                    onChange={(e: any) => setQuotationNumber(e.target.value)}
                    className="ui-input"
                  />
                </div>
              </div>

              <div className={`ui-grid-2 ${styles.s19}`}>
                <div className="ui-form-group">
                  <label className="ui-label">Quotation Valid Until</label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e: any) => setValidUntil(e.target.value)}
                    className="ui-input"
                  />
                </div>
              </div>
            </Card>

            <Card className="ui-card">
              <h3 className={styles.s18}>RFQ Items Pricing Proposal</h3>

              <div className={styles.s20}>
                {rfq?.lineItems.map((item: any) => {
                  const prc = linePrices[item.id] || {
                    unitPrice: 0,
                    taxRate: 0,
                  };
                  return (
                    <div key={item.id} className={styles.s21}>
                      <div className={styles.s22}>
                        <div>
                          <div className={styles.s23}>
                            {item.product
                              ? item.product.name
                              : "Custom Item / Service"}
                          </div>
                          <div className={styles.s24}>{item.description}</div>
                        </div>
                        <Badge variant="default">
                          Qty Requested: {item.quantity}
                        </Badge>
                      </div>

                      <div className={`ui-grid-3 ${styles.s25}`}>
                        <div className="ui-form-group">
                          <label className={`ui-label ${styles.s26}`}>
                            Your Unit Price ($)
                          </label>
                          <input
                            type="number"
                            required
                            min={0}
                            value={prc.unitPrice}
                            onChange={(e: any) =>
                              handlePriceChange(
                                item.id,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                            className="ui-input"
                          />
                        </div>
                        <div className="ui-form-group">
                          <label className={`ui-label ${styles.s26}`}>
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            required
                            min={0}
                            max={100}
                            value={prc.taxRate}
                            onChange={(e: any) =>
                              handlePriceChange(
                                item.id,
                                "taxRate",
                                Number(e.target.value),
                              )
                            }
                            className="ui-input"
                          />
                        </div>
                        <div className={styles.s27}>
                          <span className={styles.s28}>Row Line Total:</span>
                          <span className={styles.s23}>
                            $
                            {(
                              item.quantity *
                              prc.unitPrice *
                              (1 + prc.taxRate / 100)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="ui-card">
              <div className="ui-form-group">
                <label className="ui-label">
                  Proposal Notes / Terms of Supply
                </label>
                <textarea
                  placeholder="Detail shipping schedules, carrier specifications, or payment milestones..."
                  value={notes}
                  onChange={(e: any) => setNotes(e.target.value)}
                  className="ui-input"
                  rows={3}
                />
              </div>
            </Card>

            <div className={styles.s29}>
              <Button
                type="submit"
                disabled={submitting}
                className="ui-btn ui-btn-primary"
                style={{ padding: "var(--space-3) var(--space-6)" }}
              >
                {submitting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    Submit Proposal Bid{" "}
                    <Send size={16} className={styles.s37} />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Sourcing Summary */}
          <div className={styles.s20}>
            <Card className="ui-card">
              <h3 className={styles.s30}>Proposal Totals</h3>
              <div className={styles.s31}>
                <div className={styles.s32}>
                  <span>Quote Subtotal:</span>
                  <span className={styles.s6}>
                    ${subtotal.toLocaleString()}
                  </span>
                </div>
                <div className={styles.s32}>
                  <span>Tax Amount:</span>
                  <span className={styles.s6}>
                    ${taxAmount.toLocaleString()}
                  </span>
                </div>
                <div className={styles.s33}>
                  <span>Proposal Total:</span>
                  <span>${totalAmount.toLocaleString()} USD</span>
                </div>
              </div>
            </Card>

            {rfq?.notes && (
              <Card className="ui-card">
                <h3 className={styles.s34}>Special Instructions</h3>
                <p className={styles.s35}>{rfq.notes}</p>
              </Card>
            )}

            <Card className="ui-card">
              <h3 className={styles.s34}>Need Help?</h3>
              <p className={styles.s35}>
                If you encounter any issues submitting your proposal bid, please
                reach out directly to the buyer's procurement administration
                contact listed in the invitation email.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
