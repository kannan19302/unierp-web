"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { Filter, ArrowDown, TrendingDown } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AnalyticsFunnelsPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [conversions, setConversions] = useState<any[]>([]);
  const toast = useToast();

  const loadConversions = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/funnel-conversion-deep/conversions",
      );
      setConversions(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Conversion Funnels",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversions();
  }, []);

  const handleCompute = async () => {
    try {
      await client.post("/analytics/funnel-conversion-deep/compute", {
        funnelName: "Enterprise SaaS Signup Flow",
      });
      toast.success("Funnel Computed", "Funnel conversion dropoff calculated.");
      loadConversions();
    } catch (err) {
      toast.error(
        "Failed to compute funnel",
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
        title="Conversion Funnels & Dropoff Analytics"
        description="Track step-by-step user acquisition funnels, compute dropoff metrics, and optimize conversions."
      />

      <Card
        style={{
          padding: "20px",
          margin: "24px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
            Compute Live Funnel Conversions
          </h3>
          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-secondary)",
              margin: "4px 0 0 0",
            }}
          >
            Analyze conversion steps across user onboarding journeys.
          </p>
        </div>
        <Button onClick={handleCompute}>Calculate Funnel Dropoff</Button>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Funnel Audits
        </h3>
        {conversions.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No conversion funnel calculations recorded.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Funnel Name" , render: (c: any) => (<>{c.funnelName}</>) },
                        { key: "col_1", header: "Period" , render: (c: any) => (<>{c.period}</>) },
                        { key: "col_2", header: "Overall Dropoff" , render: (c: any) => (<>{Number(c.overallDropoff).toFixed(2)}%
                                        </>) },
                        { key: "col_3", header: "Calculated At" , render: (c: any) => (<>{new Date(c.calculatedAt).toLocaleString()}</>) },
                      ];
                              return <DataTable columns={columns} data={conversions} rowKey={(c: any) => c.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
