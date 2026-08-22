"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { DollarSign, Layers, Globe, Percent } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AdvancedPricingPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [ruleSets, setRuleSets] = useState<any[]>([]);
  const [testCalc, setTestCalc] = useState({ quantity: 100, basePrice: 150 });
  const [calcResult, setCalcResult] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [currData, rulesData] = await Promise.all([
        client.get<any[]>("/sales/advanced-pricing-deep/currency-matrices"),
        client.get<any[]>("/sales/advanced-pricing-deep/rule-sets"),
      ]);
      setCurrencies(Array.isArray(currData) ? currData : []);
      setRuleSets(Array.isArray(rulesData) ? rulesData : []);
    } catch (err) {
      toast.error(
        "Failed to load Advanced Pricing Matrix",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async () => {
    try {
      const res = await client.post<any>(
        "/sales/advanced-pricing-deep/volume-discount",
        {
          productId: "prod-101",
          quantity: testCalc.quantity,
          basePrice: testCalc.basePrice,
        },
      );
      setCalcResult(res);
    } catch (err) {
      toast.error(
        "Failed to calculate volume discount",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Advanced Pricing & Volume Discount Matrix"
        description="Multi-currency price lists, automated volume tier discounting, and margin floor protection rules."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-6)",
          margin: "var(--space-6) 0",
        }}
      >
        <Card style={{ padding: "var(--space-5)" }}>
          <h3
            style={{ fontSize: "var(--space-4)", fontWeight: 600, marginBottom: "var(--space-4)" }}
          >
            Volume Discount Simulator
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
          >
            <div>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                Order Quantity
              </label>
              <input
                type="number"
                value={testCalc.quantity}
                onChange={(e: any) =>
                  setTestCalc({ ...testCalc, quantity: Number(e.target.value) })
                }
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  marginTop: "var(--space-1)",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-text-secondary)",
                }}
              >
                Base Unit Price ($)
              </label>
              <input
                type="number"
                value={testCalc.basePrice}
                onChange={(e: any) =>
                  setTestCalc({
                    ...testCalc,
                    basePrice: Number(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  marginTop: "var(--space-1)",
                }}
              />
            </div>
            <Button onClick={handleCalculate} style={{ marginTop: "var(--space-2)" }}>
              Calculate Price
            </Button>
          </div>

          {calcResult && (
            <div
              style={{
                marginTop: "var(--space-5)",
                padding: "var(--space-4)",
                backgroundColor: "var(--color-bg-sunken)",
                borderRadius: "var(--space-2)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                }}
              >
                Applied Volume Discount:{" "}
                <strong style={{ color: "var(--chart-9)" }}>
                  {calcResult.appliedDiscountPct}% OFF
                </strong>
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginTop: "var(--space-1)",
                }}
              >
                Unit Price: ${calcResult.unitPrice.toFixed(2)}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--color-text-secondary)",
                  marginTop: "2px",
                }}
              >
                Total Amount: ${calcResult.totalPrice.toFixed(2)} (Saved $
                {calcResult.savingsAmount.toFixed(2)})
              </div>
            </div>
          )}
        </Card>

        <Card style={{ padding: "var(--space-5)" }}>
          <h3
            style={{ fontSize: "var(--space-4)", fontWeight: 600, marginBottom: "var(--space-4)" }}
          >
            Multi-Currency Exchange Matrix
          </h3>
          <>{(() => {
                          const columns = [
                    { key: "col_0", header: "Currency" , render: (c: any) => (<>{c.currency}</>) },
                    { key: "col_1", header: "Symbol" , render: (c: any) => (<>{c.symbol}</>) },
                    { key: "col_2", header: "Base Rate" , render: (c: any) => (<>{c.rate}</>) },
                    { key: "col_3", header: "Type" , render: (c: any) => (<><Badge variant={c.isBase ? "info" : "default"}>
                                        {c.isBase ? "BASE" : "CONVERTED"}
                                      </Badge></>) },
                  ];
                          return <DataTable columns={columns} data={currencies} rowKey={(c: any) => c.currency} />;
                      })()}</>
        </Card>
      </div>
    </div>
  );
}
