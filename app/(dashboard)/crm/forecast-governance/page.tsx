"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast, Button, DataTable } from "@kannan19302/ui";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Users,
  Clock,
} from "lucide-react";
import { apiGet } from "../_components/api";

export default function ForecastGovernancePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [accuracy, setAccuracy] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      const [cat, tr, cov, acc] = await Promise.all([
        apiGet<any>("/crm/forecast-governance/categories"),
        apiGet<any[]>("/crm/forecast-governance/trend"),
        apiGet<any>("/crm/forecast-governance/pipeline-coverage/current"),
        apiGet<any[]>("/crm/forecast-governance/accuracy"),
      ]);
      setCategories(cat);
      setTrend(Array.isArray(tr) ? tr : []);
      setCoverage(cov);
      setAccuracy(Array.isArray(acc) ? acc : []);
    } catch (err) {
      toast.error(
        "Could not load forecast governance data",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  const summary = categories?.summary || {
    totalPipeline: 0,
    totalWeighted: 0,
    totalCommit: 0,
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Forecast Governance"
        description="Manage team forecasts, rollups, and accuracy analytics"
      />
      <div className="ui-card-grid ui-grid-4">
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="ui-stat-value">
            ${(summary.totalCommit || 0).toLocaleString()}
          </div>
          <div className="ui-stat-label">Commit Amount</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="ui-stat-value">
            ${(summary.totalWeighted || 0).toLocaleString()}
          </div>
          <div className="ui-stat-label">Weighted Pipeline</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <Target size={24} />
          </div>
          <div className="ui-stat-value">
            ${(summary.totalPipeline || 0).toLocaleString()}
          </div>
          <div className="ui-stat-label">Total Pipeline</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="ui-stat-value">
            {coverage?.overallCoverage
              ? `${(coverage.overallCoverage * 100).toFixed(0)}%`
              : "N/A"}
          </div>
          <div className="ui-stat-label">Pipeline Coverage</div>
        </Card>
      </div>

      <div className="ui-grid-2">
        <Card title="Forecast Categories">
          <div className="ui-table-wrapper">
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Category" , render: (c: any) => (<><Badge
                                              variant={
                                                c.category === "Commit"
                                                  ? "success"
                                                  : c.category === "Best Case"
                                                    ? "warning"
                                                    : "default"
                                              }
                                            >
                                              {c.category}
                                            </Badge></>) },
                        { key: "col_1", header: "Deals" , render: (c: any) => (<>{c.dealCount}</>) },
                        { key: "col_2", header: "Amount" , render: (c: any) => (<>${c.totalAmount.toLocaleString()}</>) },
                        { key: "col_3", header: "Weighted" , render: (c: any) => (<>${c.weightedAmount.toLocaleString()}</>) },
                      ];
                              return <DataTable columns={columns} data={categories?.categories} rowKey={(c: any) => c.category} />;
                          })()}</>
          </div>
        </Card>

        <Card title="Forecast Trend">
          <div className="ui-table-wrapper">
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Period" , render: (t: any) => (<>{t.period}</>) },
                        { key: "col_1", header: "Commit" , render: (t: any) => (<>${(t.commit || 0).toLocaleString()}</>) },
                        { key: "col_2", header: "Best Case" , render: (t: any) => (<>${(t.bestCase || 0).toLocaleString()}</>) },
                        { key: "col_3", header: "Pipeline" , render: (t: any) => (<>${(t.pipeline || 0).toLocaleString()}</>) },
                        { key: "col_4", header: "Closed" , render: (t: any) => (<><Badge variant="success">
                                              ${(t.closedWon || 0).toLocaleString()}
                                            </Badge></>) },
                      ];
                              return <DataTable columns={columns} data={trend} rowKey={(t: any) => t.period} />;
                          })()}</>
          </div>
        </Card>
      </div>

      <div className="ui-grid-2">
        <Card title="Forecast Accuracy">
          <div className="ui-table-wrapper">
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Period" , render: (a: any) => (<>{a.period}</>) },
                        { key: "col_1", header: "Forecasted" , render: (a: any) => (<>${(a.forecastedAmount || 0).toLocaleString()}</>) },
                        { key: "col_2", header: "Actual" , render: (a: any) => (<>${(a.actualAmount || 0).toLocaleString()}</>) },
                        { key: "col_3", header: "Accuracy" , render: (a: any) => (<><Badge
                                              variant={
                                                a.accuracyPct >= 80
                                                  ? "success"
                                                  : a.accuracyPct >= 50
                                                    ? "warning"
                                                    : "danger"
                                              }
                                            >
                                              {a.accuracyPct}%
                                            </Badge></>) },
                        { key: "col_4", header: "Variance" , render: (a: any) => (<>${(a.variance || 0).toLocaleString()}</>) },
                      ];
                              return <DataTable columns={columns} data={accuracy} rowKey={(a: any) => a.period} />;
                          })()}</>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="ui-card-actions">
            <Button
              variant="primary"
              onClick={() =>
                (window.location.href = "/crm/forecast-governance/team-rollup")
              }
            >
              <Users size={16} /> View Team Rollups
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                (window.location.href = "/crm/forecast-governance/accuracy")
              }
            >
              <BarChart3 size={16} /> Accuracy Analytics
            </Button>
            <Button
              variant="secondary"
              onClick={() => (window.location.href = "/crm/deal-desk")}
            >
              <Target size={16} /> Deal Desk
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
