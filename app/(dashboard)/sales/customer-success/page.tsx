"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { ShieldCheck, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function CustomerSuccessPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newPlan, setNewPlan] = useState({
    customerId: "",
    name: "",
    arr: 0,
    nrrTarget: 100,
    churnRiskLevel: "LOW",
  });
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, metricsData] = await Promise.all([
        client.get<any[]>("/sales/customer-success"),
        client.get<any>("/sales/customer-success/metrics"),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setMetrics(metricsData);
    } catch (err) {
      toast.error(
        "Failed to load Customer Success dashboard",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async () => {
    try {
      if (!newPlan.name || !newPlan.customerId) {
        toast.error(
          "Validation Error",
          "Customer ID and Plan Name are required",
        );
        return;
      }
      await client.post("/sales/customer-success", newPlan);
      toast.success("Success", "Customer Success plan created");
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(
        "Failed to create plan",
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
        title="Customer Success & Retention Hub"
        description="Monitor account health, retention goals, NRR metrics, and risk alerts."
        actions={
          <Button onClick={() => setShowModal(true)}>+ New CS Plan</Button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
          margin: "var(--space-6) 0",
        }}
      >
        <Card style={{ padding: "var(--space-5)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Total Active Plans
            </span>
            <Users size={20} color="var(--color-primary)" />
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "var(--space-2)" }}
          >
            {metrics?.activePlans ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "var(--space-5)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              At-Risk Accounts
            </span>
            <AlertTriangle size={20} color="var(--chart-4)" />
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--chart-4)",
              marginTop: "var(--space-2)",
            }}
          >
            {metrics?.atRiskPlans ?? 0}
          </div>
        </Card>
        <Card style={{ padding: "var(--space-5)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Avg Health Score
            </span>
            <ShieldCheck size={20} color="var(--chart-9)" />
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "var(--chart-9)",
              marginTop: "var(--space-2)",
            }}
          >
            {metrics?.avgHealthScore ?? 100}%
          </div>
        </Card>
        <Card style={{ padding: "var(--space-5)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Total Portfolio ARR
            </span>
            <TrendingUp size={20} color="var(--chart-5)" />
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "bold", marginTop: "var(--space-2)" }}
          >
            ${(metrics?.totalArr ?? 0).toLocaleString()}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Customer Success Plans
        </h3>
        {plans.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "var(--space-8) 0",
            }}
          >
            No active customer success plans. Click "+ New CS Plan" to create
            one.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Plan Name" , render: (p: any) => (<>{p.name}</>) },
                        { key: "col_1", header: "Customer ID" , render: (p: any) => (<>{p.customerId}</>) },
                        { key: "col_2", header: "Health Score" , render: (p: any) => (<><Badge
                                            variant={
                                              p.healthScore >= 80
                                                ? "success"
                                                : p.healthScore >= 50
                                                  ? "warning"
                                                  : "danger"
                                            }
                                          >
                                            {p.healthScore}/100
                                          </Badge></>) },
                        { key: "col_3", header: "Risk Level" , render: (p: any) => (<><Badge
                                            variant={
                                              p.churnRiskLevel === "LOW"
                                                ? "success"
                                                : p.churnRiskLevel === "MEDIUM"
                                                  ? "warning"
                                                  : "danger"
                                            }
                                          >
                                            {p.churnRiskLevel}
                                          </Badge></>) },
                        { key: "col_4", header: "ARR" , render: (p: any) => (<>${Number(p.arr || 0).toLocaleString()}</>) },
                        { key: "col_5", header: "Status" , render: (p: any) => (<>{p.status}</>) },
                      ];
                              return <DataTable columns={columns} data={plans} rowKey={(p: any) => p.id} />;
                          })()}</>
        )}
      </Card>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-text-inverse)",
              borderRadius: "var(--space-2)",
              padding: "var(--space-6)",
              width: "480px",
              maxWidth: "90vw",
            }}
          >
            <h3 style={{ margin: "0 0 var(--space-4) 0" }}>
              Create Customer Success Plan
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
                  Customer ID *
                </label>
                <input
                  type="text"
                  placeholder="cust-101"
                  value={newPlan.customerId}
                  onChange={(e: any) =>
                    setNewPlan({ ...newPlan, customerId: e.target.value })
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
                  Plan Name *
                </label>
                <input
                  type="text"
                  placeholder="Enterprise Growth & Adoption"
                  value={newPlan.name}
                  onChange={(e: any) =>
                    setNewPlan({ ...newPlan, name: e.target.value })
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
                  ARR ($)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={newPlan.arr}
                  onChange={(e: any) =>
                    setNewPlan({ ...newPlan, arr: Number(e.target.value) })
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
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "var(--space-2)",
                marginTop: "var(--space-5)",
              }}
            >
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePlan}>Create Plan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
