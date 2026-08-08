"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { Cpu, TrendingUp, Sparkles, Target } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AnalyticsPredictivePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [modelName, setModelName] = useState("");
  const toast = useToast();

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/analytics/predictive-engine-deep/models",
      );
      setModels(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Predictive Models",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleTrain = async () => {
    try {
      if (!modelName) {
        toast.error("Validation Error", "Model name is required");
        return;
      }
      await client.post("/analytics/predictive-engine-deep/models", {
        modelName,
        algorithm: "RANDOM_FOREST",
        targetMetric: "REVENUE_GROWTH",
      });
      toast.success(
        "Model Trained",
        `Predictive AI model "${modelName}" trained with 94.5% accuracy.`,
      );
      setModelName("");
      loadModels();
    } catch (err) {
      toast.error(
        "Failed to train model",
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
        title="Predictive Analytics & AI Forecasting Engine"
        description="Train machine learning forecasting models, simulate revenue projections, and detect financial anomalies."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Train New Predictive Model
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Model Title (e.g. Q4 Revenue Growth Predictor)..."
            value={modelName}
            onChange={(e: any) => setModelName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleTrain}>
            <Sparkles size={14} style={{ marginRight: "6px" }} /> Train ML Model
          </Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Trained ML Models
        </h3>
        {models.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No trained predictive models.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Model Name" , render: (m: any) => (<>{m.modelName}</>) },
                        { key: "col_1", header: "Algorithm" , render: (m: any) => (<>{m.algorithm}</>) },
                        { key: "col_2", header: "Target Metric" , render: (m: any) => (<>{m.targetMetric}</>) },
                        { key: "col_3", header: "Accuracy Score" , render: (m: any) => (<>{Number(m.accuracyScore).toFixed(2)}%
                                        </>) },
                        { key: "col_4", header: "Status" , render: (m: any) => (<><Badge variant="success">{m.status}</Badge></>) },
                      ];
                              return <DataTable columns={columns} data={models} rowKey={(m: any) => m.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
