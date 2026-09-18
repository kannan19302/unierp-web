"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { Zap, TrendingUp, Check, ArrowRight } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function SaasPortalSubscriptionPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [upgrades, setUpgrades] = useState<any[]>([]);
  const toast = useToast();

  const loadUpgrades = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/saas-portal/subscription-tier-engine/upgrades",
      );
      setUpgrades(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Subscription Tier data",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpgrades();
  }, []);

  const handleUpgrade = async (toTier: string, charge: number) => {
    try {
      await client.post("/saas-portal/subscription-tier-engine/upgrade", {
        fromTier: "PROFESSIONAL",
        toTier,
        proratedCharge: charge,
      });
      toast.success("Plan Upgraded", `Plan successfully upgraded to ${toTier}`);
      loadUpgrades();
    } catch (err) {
      toast.error(
        "Failed to upgrade plan",
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
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Subscription Tier & Self-Service Upgrades"
        description="Compare subscription tiers, calculate prorated charges, and view plan change history."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>Starter</h3>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", margin: "12px 0" }}
          >
            $49
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              /mo
            </span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Essential ERP tools for small teams.
          </p>
          <Button
            variant="outline"
            style={{ width: "100%", marginTop: "16px" }}
            disabled
          >
            Current Tier
          </Button>
        </Card>

        <Card
          style={{
            padding: "24px",
            border: "2px solid #3b82f6",
            backgroundColor: "var(--color-info-light)",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <Badge variant="primary">POPULAR</Badge>
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>Professional</h3>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", margin: "12px 0" }}
          >
            $199
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              /mo
            </span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Advanced automation & custom workflows.
          </p>
          <Button
            style={{ width: "100%", marginTop: "16px" }}
            onClick={() => handleUpgrade("PROFESSIONAL", 150)}
          >
            Upgrade Now
          </Button>
        </Card>

        <Card style={{ padding: "24px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>Enterprise</h3>
          <div
            style={{ fontSize: "32px", fontWeight: "bold", margin: "12px 0" }}
          >
            $499
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              /mo
            </span>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
            Dedicated DB isolation, white-label, SLA.
          </p>
          <Button
            variant="outline"
            style={{ width: "100%", marginTop: "16px" }}
            onClick={() => handleUpgrade("ENTERPRISE", 300)}
          >
            Upgrade to Enterprise
          </Button>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Plan Change History
        </h3>
        {upgrades.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "24px 0",
            }}
          >
            No previous plan upgrades recorded.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Date" , render: (u: any) => (<>{new Date(u.effectiveDate).toLocaleDateString()}</>) },
                        { key: "col_1", header: "From Tier" , render: (u: any) => (<>{u.fromTier}</>) },
                        { key: "col_2", header: "To Tier" , render: (u: any) => (<>{u.toTier}</>) },
                        { key: "col_3", header: "Prorated Charge" , render: (u: any) => (<>${Number(u.proratedCharge).toFixed(2)}</>) },
                        { key: "col_4", header: "Status" , render: (u: any) => (<><Badge variant="success">{u.status}</Badge></>) },
                      ];
                              return <DataTable columns={columns} data={upgrades} rowKey={(u: any) => u.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
