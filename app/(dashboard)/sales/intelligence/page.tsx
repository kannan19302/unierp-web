"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge } from "@kannan19302/ui";
import { useApiClient } from "@kannan19302/framework";

export default function SalesIntelligencePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const toast = useToast();

  const loadSignals = async () => {
    try {
      setLoading(true);
      const [sumData, sigData] = await Promise.all([
        client.get<any>("/sales/intelligence-signals/summary"),
        client.get<any[]>("/sales/intelligence-signals"),
      ]);
      setSummary(sumData);
      setSignals(Array.isArray(sigData) ? sigData : []);
    } catch (err) {
      toast.error(
        "Failed to load Sales Intelligence Signals",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
  }, []);

  const handleMarkActioned = async (id: string) => {
    try {
      await client.put(`/sales/intelligence-signals/${id}/action`, {});
      toast.success("Actioned", "Signal marked as actioned");
      loadSignals();
    } catch (err) {
      toast.error(
        "Failed to update signal",
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
        title="Sales Intelligence & Risk Detection"
        description="Real-time buyer engagement signals, executive departure alerts, and account churn indicators."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-4)",
          margin: "var(--space-6) 0",
        }}
      >
        <Card style={{ padding: "var(--space-5)" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Pending Signals
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "var(--space-1)" }}
          >
            {summary?.totalPendingSignals ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "var(--space-5)", borderLeft: "var(--space-1) solid #ef4444" }}>
          <span
            style={{
              fontSize: "13px",
              color: "var(--chart-4)",
              fontWeight: 600,
            }}
          >
            Critical Alerts
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--chart-4)",
              marginTop: "var(--space-1)",
            }}
          >
            {summary?.criticalCount ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "var(--space-5)", borderLeft: "var(--space-1) solid #f59e0b" }}>
          <span
            style={{
              fontSize: "13px",
              color: "var(--chart-3)",
              fontWeight: 600,
            }}
          >
            High Priority
          </span>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--chart-3)",
              marginTop: "var(--space-1)",
            }}
          >
            {summary?.highCount ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "var(--space-5)" }}>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Medium / Low
          </span>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "var(--space-1)" }}
          >
            {(summary?.mediumCount ?? 0) + (summary?.lowCount ?? 0)}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Detected Buyer & Account Signals
        </h3>
        {signals.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "var(--space-8) 0",
            }}
          >
            No un-actioned intelligence signals detected.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
          >
            {signals.map((sig: any) => (
              <div
                key={sig.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-4)",
                  borderRadius: "var(--space-2)",
                  border: "1px solid #e2e8f0",
                  backgroundColor: sig.isActioned
                    ? "var(--color-bg-sunken)"
                    : "var(--color-text-inverse)",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    <Badge
                      variant={
                        sig.severity === "CRITICAL" || sig.severity === "HIGH"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {sig.severity}
                    </Badge>
                    <span
                      style={{
                        fontSize: "var(--space-3)",
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      {sig.signalType}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--space-3)",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      via {sig.source}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--color-bg-elevated)",
                    }}
                  >
                    {sig.headline}
                  </div>
                </div>
                {!sig.isActioned && (
                  <Button size="sm" onClick={() => handleMarkActioned(sig.id)}>
                    Mark Actioned
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
