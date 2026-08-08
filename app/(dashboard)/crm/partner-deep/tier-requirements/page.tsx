"use client";
import { DataTable } from "@kannan19302/ui";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";

export default function TierRequirementsPage() {
  const api = useApiClient();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/tier-requirements")
      .then((res: any) => {
        setRequirements(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading tier requirements...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Tier Requirements</h1>
      <>{(() => {
                    const columns = [
            { key: "col_0", header: "Tier", render: (r: any) => (<>{r.tier?.name || r.tierId}</>) },
            { key: "col_1", header: "Metric", render: (r: any) => (<>{r.metric}</>) },
            { key: "col_2", header: "Min", render: (r: any) => (<>{r.minValue}</>) },
            { key: "col_3", header: "Max", render: (r: any) => (<>{r.maxValue ?? "—"}</>) },
            { key: "col_4", header: "Unit", render: (r: any) => (<>{r.unit}</>) },
            { key: "col_5", header: "Weight", render: (r: any) => (<>{r.weight}</>) },
          ];
                    return <DataTable columns={columns} data={requirements} rowKey={(r: any) => r.id} />;
                  })()}</>
    </div>
  );
}
