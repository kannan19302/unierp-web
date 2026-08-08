"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { Card, Button, DataTable } from "@kannan19302/ui";
import { RouteGuard } from "@kannan19302/framework";

interface TrendResult {
  id: string;
  kpiName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  previousValue: number | null;
  changePercent: number | null;
  metadata: Record<string, unknown> | null;
}

export default function TrendsPage() {
  const client = useApiClient();
  const [trends, setTrends] = useState<TrendResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState("MONTH");

  useEffect(() => {
    fetchTrends();
  }, [client, groupBy]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const r = await client.get<{ data: TrendResult[]; meta: unknown }>(
        `/analytics/trends?groupBy=${groupBy}`,
      );
      setTrends(r.data || []);
    } catch {
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const computeTrends = async () => {
    try {
      setLoading(true);
      await client.post("/analytics/trends", { groupBy });
      fetchTrends();
    } catch {
      /* ignore */
    }
  };

  return (
    <RouteGuard permission="analytics.trends.read">
      <div className="p-8 ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl ui-hstack-3">
              <TrendingUp size={28} className="ui-text-primary" /> Trend
              Analysis
            </h1>
            <p className="ui-text-muted mt-1">
              KPI trends over time with period-over-period change
            </p>
          </div>
          <Button onClick={computeTrends} disabled={loading}>
            Compute Trends
          </Button>
        </div>

        <Card className="p-6">
          <div className="ui-flex ui-gap-3 ui-items-center mb-4">
            <label className="text-sm font-medium">Group by:</label>
            <select
              className="ui-input w-48"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="DAY">Day</option>
              <option value="WEEK">Week</option>
              <option value="MONTH">Month</option>
              <option value="QUARTER">Quarter</option>
              <option value="YEAR">Year</option>
            </select>
          </div>
          {loading ? (
            <div className="ui-flex-center p-8">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <>{(() => {
                                      const columns = [
                                { key: "col_0", header: "KPI" , render: (t: any) => (<>{t.kpiName}</>) },
                                { key: "col_1", header: "Period" , render: (t: any) => (<>{t.period}{" "}{new Date(t.periodStart).toLocaleDateString()}-{" "}{new Date(t.periodEnd).toLocaleDateString()}</>) },
                                { key: "col_2", header: "Value" , render: (t: any) => (<>{t.value.toLocaleString()}</>) },
                                { key: "col_3", header: "Previous" , render: (t: any) => (<>{t.previousValue?.toLocaleString() ?? "-"}</>) },
                                { key: "col_4", header: "Change" , render: (t: any) => (<>{t.changePercent !== null
                                                        ? `${t.changePercent >= 0 ? "+" : ""}${t.changePercent.toFixed(1)}%`
                                                        : "-"}</>) },
                              ];
                                      return <DataTable columns={columns} data={trends} rowKey={(t: any) => t.id} />;
                                  })()}</>
            </div>
          )}
        </Card>
      </div>
    </RouteGuard>
  );
}
