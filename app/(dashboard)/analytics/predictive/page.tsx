"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  PageHeader,
  Button,
  Spinner,
  useToast,
  Badge,
  DataTable,
} from "@kannan19302/ui";
import {
  TrendingUp,
  Sparkles,
  Target,
  Play,
  CheckCircle2,
  BarChart2,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface PredictiveModelItem {
  id: string;
  modelName: string;
  algorithm: string;
  targetMetric: string;
  accuracyScore: number;
  status: string;
  trainedAt?: string;
}

interface ForecastRunResult {
  id: string;
  modelId: string;
  forecastHorizon: string;
  resultMetrics: {
    predictedGrowth: string;
    confidenceInterval: string;
    forecastedValue: number;
    lowerBound: number;
    upperBound: number;
    historicalPointsCount: number;
  };
  createdAt: string;
}

export default function AnalyticsPredictivePage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [simulatingModelId, setSimulatingModelId] = useState<string | null>(null);
  const [models, setModels] = useState<PredictiveModelItem[]>([]);
  const [modelName, setModelName] = useState("");
  const [algorithm, setAlgorithm] = useState("LINEAR_REGRESSION");
  const [targetMetric, setTargetMetric] = useState("REVENUE_GROWTH");
  const [activeForecast, setActiveForecast] = useState<ForecastRunResult | null>(null);
  const toast = useToast();

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await client.get<PredictiveModelItem[]>(
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
    if (!modelName.trim()) {
      toast.error("Validation Error", "Model title is required.");
      return;
    }
    try {
      setTraining(true);
      const newModel = await client.post<PredictiveModelItem>(
        "/analytics/predictive-engine-deep/models",
        {
          modelName: modelName.trim(),
          algorithm,
          targetMetric,
        },
      );
      toast.success(
        "Model Trained Successfully",
        `AI Model "${newModel.modelName}" trained with ${Number(newModel.accuracyScore || 85).toFixed(1)}% confidence score.`,
      );
      setModelName("");
      loadModels();
    } catch (err) {
      toast.error(
        "Training Failed",
        err instanceof Error ? err.message : "Error training model",
      );
    } finally {
      setTraining(false);
    }
  };

  const handleRunForecast = async (model: PredictiveModelItem) => {
    try {
      setSimulatingModelId(model.id);
      const result = await client.post<ForecastRunResult>(
        `/analytics/predictive-engine-deep/models/${model.id}/forecast`,
        { forecastHorizon: "30D" },
      );
      setActiveForecast(result);
      toast.success(
        "Simulation Complete",
        `Forecast run executed for model "${model.modelName}".`,
      );
    } catch (err) {
      toast.error(
        "Forecast Simulation Failed",
        err instanceof Error ? err.message : "Error executing forecast",
      );
    } finally {
      setSimulatingModelId(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(var(--space-12) * 5)",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.container} data-density="compact">
      <PageHeader
        title="Predictive Analytics & AI Forecasting Engine"
        description="Train machine learning forecasting models, simulate revenue projections, and detect financial trends."
      />

      {/* Model Training Section */}
      <Card className={styles.trainCard}>
        <h3 className={styles.trainTitle}>
          <Sparkles size={16} style={{ color: "var(--color-primary)" }} />
          Train Enterprise Predictive Model
        </h3>
        <div className={styles.trainGrid}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Model Title</label>
            <input
              type="text"
              placeholder="e.g. Q4 Enterprise Revenue Predictor..."
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className={styles.textInput}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>ML Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className={styles.selectInput}
            >
              <option value="LINEAR_REGRESSION">Linear Regression (OLS)</option>
              <option value="RANDOM_FOREST">Random Forest Regressor</option>
              <option value="ARIMA">ARIMA Time Series</option>
              <option value="GRADIENT_BOOSTING">Gradient Boosting (XGB)</option>
            </select>
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Target Metric</label>
            <select
              value={targetMetric}
              onChange={(e) => setTargetMetric(e.target.value)}
              className={styles.selectInput}
            >
              <option value="REVENUE_GROWTH">Monthly Revenue Growth</option>
              <option value="CASH_FLOW">Operating Cash Flow</option>
              <option value="INVENTORY_TURNOVER">Inventory Turn Velocity</option>
            </select>
          </div>

          <Button onClick={handleTrain} disabled={training}>
            <Sparkles
              size={14}
              style={{
                marginRight: "var(--space-1-5)",
                animation: training ? "spin 1s linear infinite" : undefined,
              }}
            />
            {training ? "Training ML..." : "Train Model"}
          </Button>
        </div>
      </Card>

      {/* Active Forecast Simulation Results */}
      {activeForecast && (
        <Card className={styles.forecastResultCard}>
          <div className={styles.forecastResultHeader}>
            <h3 className={styles.forecastResultTitle}>
              <TrendingUp size={18} style={{ color: "var(--color-primary)" }} />
              Live Forecast Simulation ({activeForecast.forecastHorizon} Horizon)
            </h3>
            <Badge variant="success">Confidence: {activeForecast.resultMetrics.confidenceInterval}</Badge>
          </div>

          <div className={styles.forecastMetricsGrid}>
            <div className={styles.forecastMetricItem}>
              <div className={styles.forecastMetricLabel}>Projected Growth</div>
              <div
                className={styles.forecastMetricVal}
                style={{ color: "var(--color-success)" }}
              >
                {activeForecast.resultMetrics.predictedGrowth}
              </div>
            </div>

            <div className={styles.forecastMetricItem}>
              <div className={styles.forecastMetricLabel}>Forecasted Value</div>
              <div className={styles.forecastMetricVal}>
                ${activeForecast.resultMetrics.forecastedValue.toLocaleString()}
              </div>
            </div>

            <div className={styles.forecastMetricItem}>
              <div className={styles.forecastMetricLabel}>95% Confidence Bounds</div>
              <div
                className={styles.forecastMetricVal}
                style={{ fontSize: "var(--text-sm)" }}
              >
                ${activeForecast.resultMetrics.lowerBound.toLocaleString()} – $
                {activeForecast.resultMetrics.upperBound.toLocaleString()}
              </div>
            </div>

            <div className={styles.forecastMetricItem}>
              <div className={styles.forecastMetricLabel}>Historical Data Points</div>
              <div className={styles.forecastMetricVal}>
                {activeForecast.resultMetrics.historicalPointsCount} periods
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Trained Models Table */}
      <Card className={styles.modelsSection}>
        <h3 className={styles.modelsHeader}>Registered Machine Learning Models</h3>
        {models.length === 0 ? (
          <p className={styles.emptyModels}>
            No predictive models trained yet. Configure and train a model above to begin forecasting.
          </p>
        ) : (
          <DataTable
            columns={[
              {
                key: "modelName",
                header: "Model Name",
                render: (m: PredictiveModelItem) => (
                  <span style={{ fontWeight: "var(--weight-semibold)" }}>
                    {m.modelName}
                  </span>
                ),
              },
              {
                key: "algorithm",
                header: "Algorithm",
                render: (m: PredictiveModelItem) => (
                  <span style={{ fontFamily: "var(--font-mono, monospace)" }}>
                    {m.algorithm}
                  </span>
                ),
              },
              {
                key: "targetMetric",
                header: "Target Dimension",
                render: (m: PredictiveModelItem) => (
                  <Badge variant="info">{m.targetMetric}</Badge>
                ),
              },
              {
                key: "accuracyScore",
                header: "Accuracy Score",
                render: (m: PredictiveModelItem) => (
                  <span
                    style={{
                      color: "var(--color-success)",
                      fontWeight: "var(--weight-bold)",
                    }}
                  >
                    {Number(m.accuracyScore).toFixed(1)}%
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (m: PredictiveModelItem) => (
                  <Badge variant="success">{m.status}</Badge>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (m: PredictiveModelItem) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRunForecast(m)}
                    disabled={simulatingModelId === m.id}
                  >
                    <Play
                      size={12}
                      style={{
                        marginRight: "var(--space-1)",
                        animation:
                          simulatingModelId === m.id
                            ? "spin 1s linear infinite"
                            : undefined,
                      }}
                    />
                    {simulatingModelId === m.id ? "Simulating..." : "Run Forecast"}
                  </Button>
                ),
              },
            ]}
            data={models}
            rowKey={(m: PredictiveModelItem) => m.id}
          />
        )}
      </Card>
    </div>
  );
}
