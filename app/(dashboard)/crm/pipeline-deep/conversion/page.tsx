"use client";
import { DataTable } from "@kannan19302/ui";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";

export default function PipelineConversionPage() {
  const api = useApiClient();
  const [conversion, setConversion] = useState<any[]>([]);
  const [duration, setDuration] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/crm/pipeline-deep/stage-conversion/null"),
      api.get("/crm/pipeline-deep/stage-duration/null"),
    ])
      .then(([c, d]: any) => {
        setConversion(c.data || []);
        setDuration(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading conversion data...</div>;

  return (
    <div className="space-y-6">
      <div className="ui-card p-4">
        <h1 className="text-xl font-bold mb-4">Stage Conversion Rates</h1>
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Stage", render: (s: any) => (<>{s.stage}</>) },
                { key: "col_1", header: "Entered", render: (s: any) => (<>{s.entered}</>) },
                { key: "col_2", header: "Won", render: (s: any) => (<>{s.won}</>) },
                { key: "col_3", header: "Lost", render: (s: any) => (<>{s.lost}</>) },
                { key: "col_4", header: "→Win %", render: (s: any) => (<>{s.conversionToWin}%</>) },
                { key: "col_5", header: "→Lost %", render: (s: any) => (<>{s.conversionToLoss}%</>) },
              ];
                        return <DataTable columns={columns} data={conversion} rowKey={(s: any) => s.stage} />;
                      })()}</>
      </div>

      <div className="ui-card p-4">
        <h2 className="text-xl font-bold mb-4">Stage Duration Analysis</h2>
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Stage", render: (s: any) => (<>{s.stage}</>) },
                { key: "col_1", header: "Deals", render: (s: any) => (<>{s.count}</>) },
                { key: "col_2", header: "Avg Days", render: (s: any) => (<>{s.avgDays}</>) },
                { key: "col_3", header: "Min Days", render: (s: any) => (<>{s.minDays}</>) },
                { key: "col_4", header: "Max Days", render: (s: any) => (<>{s.maxDays}</>) },
              ];
                        return <DataTable columns={columns} data={duration} rowKey={(s: any) => s.stage} />;
                      })()}</>
      </div>
    </div>
  );
}
