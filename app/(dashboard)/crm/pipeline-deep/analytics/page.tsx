import { DataTable } from "@unerp/ui";
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@unerp/framework";

export default function PipelineAnalyticsPage() {
  const api = useApiClient();
  const [dashboard, setDashboard] = useState<any>(null);
  const [sizeDist, setSizeDist] = useState<any[]>([]);
  const [lossReasons, setLossReasons] = useState<any[]>([]);
  const [winBySource, setWinBySource] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/crm/pipeline-deep/dashboard"),
      api.get("/crm/pipeline-deep/deal-size-distribution"),
      api.get("/crm/pipeline-deep/loss-reason-analysis"),
      api.get("/crm/pipeline-deep/win-rate-by-source"),
    ])
      .then(([d, s, l, w]: any) => {
        setDashboard(d.data || {});
        setSizeDist(s.data || []);
        setLossReasons(l.data || []);
        setWinBySource(w.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pipeline Analytics</h1>

      {dashboard && (
        <div className="ui-grid-4">
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Total Deals</p>
            <p className="text-2xl font-bold">{dashboard.totalDeals}</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{dashboard.winRate}%</p>
          </div>
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
            <p className="text-2xl font-bold">
              ${dashboard.pipelineValue?.toLocaleString()}
            </p>
          </div>
          <div className="ui-card p-4">
            <p className="text-sm text-muted-foreground">Won</p>
            <p className="text-2xl font-bold">{dashboard.wonDeals}</p>
          </div>
        </div>
      )}

      <div className="ui-card p-4">
        <h2 className="font-semibold mb-3">Deal Size Distribution</h2>
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Bucket", render: (b: any) => (<>{b.label}</>) },
                { key: "col_1", header: "Count", render: (b: any) => (<>{b.count}</>) },
              ];
                        return <DataTable columns={columns} data={sizeDist} rowKey={(b: any) => b.label} />;
                      })()}</>
      </div>

      <div className="ui-card p-4">
        <h2 className="font-semibold mb-3">Loss Reason Analysis</h2>
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Reason", render: (l: any) => (<>{l.reason}</>) },
                { key: "col_1", header: "Count", render: (l: any) => (<>{l.count}</>) },
                { key: "col_2", header: "Total Amount", render: (l: any) => (<>${l.totalAmount?.toLocaleString()}</>) },
                { key: "col_3", header: "%", render: (l: any) => (<>{l.percentage}%</>) },
              ];
                        return <DataTable columns={columns} data={lossReasons} rowKey={(l: any) => l.reason} />;
                      })()}</>
      </div>

      <div className="ui-card p-4">
        <h2 className="font-semibold mb-3">Win Rate by Source</h2>
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Source", render: (s: any) => (<>{s.source}</>) },
                { key: "col_1", header: "Total", render: (s: any) => (<>{s.total}</>) },
                { key: "col_2", header: "Converted", render: (s: any) => (<>{s.converted}</>) },
                { key: "col_3", header: "Conv. Rate", render: (s: any) => (<>{s.conversionRate}%</>) },
              ];
                        return <DataTable columns={columns} data={winBySource} rowKey={(s: any) => s.source} />;
                      })()}</>
      </div>
    </div>
  );
}
