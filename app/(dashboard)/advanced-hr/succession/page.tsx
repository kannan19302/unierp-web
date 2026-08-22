"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { Award, UserCheck, TrendingUp } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AdvancedHrSuccessionPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [planName, setPlanName] = useState("");
  const toast = useToast();

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/advanced-hr/succession-planning-deep/plans",
      );
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load succession plans",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreate = async () => {
    try {
      if (!planName) {
        toast.error("Validation", "Plan name required");
        return;
      }
      await client.post("/advanced-hr/succession-planning-deep/plans", {
        planName,
        targetRoleId: "role-vp-eng",
        urgencyLevel: "HIGH",
      });
      toast.success("Plan Created", `Succession plan "${planName}" initiated.`);
      setPlanName("");
      loadPlans();
    } catch (err) {
      toast.error(
        "Failed to create plan",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

  if (loading)
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

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Executive Succession Planning & Leadership Pipeline Manager"
        description="Build succession plans for critical roles, nominate readiness candidates, and map leadership pipeline depth."
      />
      <Card style={{ padding: "var(--space-5)", margin: "var(--space-6) 0" }}>
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <input
            type="text"
            placeholder="Succession plan title (e.g. VP Engineering 2027 Pipeline)..."
            value={planName}
            onChange={(e: any) => setPlanName(e.target.value)}
            style={{
              flex: 1,
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreate}>Create Plan</Button>
        </div>
      </Card>
      <Card style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Active Succession Plans
        </h3>
        {plans.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "var(--space-8) 0",
            }}
          >
            No succession plans defined.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Plan Name" , render: (p: any) => (<>{p.planName}</>) },
                        { key: "col_1", header: "Urgency" , render: (p: any) => (<><Badge
                                            variant={p.urgencyLevel === "HIGH" ? "danger" : "warning"}
                                          >
                                            {p.urgencyLevel}
                                          </Badge></>) },
                        { key: "col_2", header: "Action" , render: (p: any) => (<><Button size="sm" variant="outline">
                                            Add Candidate
                                          </Button></>) },
                      ];
                              return <DataTable columns={columns} data={plans} rowKey={(p: any) => p.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
