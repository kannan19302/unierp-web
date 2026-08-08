import { DataTable } from "@unerp/ui";
"use client";

import { useState } from "react";
import { useApiClient } from "@unerp/framework";

export default function PipelineDealComparisonPage() {
  const api = useApiClient();
  const [ids, setIds] = useState("");
  const [deals, setDeals] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    setError("");
    const opportunityIds = ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (opportunityIds.length < 2) {
      setError("Enter at least 2 opportunity IDs");
      return;
    }
    setLoading(true);
    try {
      const res: any = await api.post("/crm/pipeline-deep/deal-comparison", {
        opportunityIds,
      });
      setDeals(res.data || []);
    } catch (e: any) {
      setError(e.message || "Comparison failed");
    }
    setLoading(false);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Deal Comparison</h1>
      <div className="ui-form-group flex gap-2 mb-4">
        <input
          className="ui-input flex-1"
          placeholder="Opportunity IDs (comma-separated)"
          value={ids}
          onChange={(e) => setIds(e.target.value)}
        />
        <button className="ui-btn" onClick={compare} disabled={loading}>
          {loading ? "Comparing..." : "Compare"}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {deals.length > 0 && (
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Name", render: (d: any) => (<>{d.name}</>) },
                { key: "col_1", header: "Stage", render: (d: any) => (<>{d.stage}</>) },
                { key: "col_2", header: "Amount", render: (d: any) => (<>${d.amount?.toLocaleString()}</>) },
                { key: "col_3", header: "Probability", render: (d: any) => (<>{d.probability}%</>) },
                { key: "col_4", header: "Weighted", render: (d: any) => (<>${d.weightedAmount?.toLocaleString()}</>) },
                { key: "col_5", header: "Customer", render: (d: any) => (<>{d.customerName}</>) },
                { key: "col_6", header: "Rep", render: (d: any) => (<>{d.assignedToName}</>) },
                { key: "col_7", header: "Close", render: (d: any) => (<>{d.expectedCloseDate
                                  ? new Date(d.expectedCloseDate).toLocaleDateString()
                                  : "—"}</>) },
              ];
                        return <DataTable columns={columns} data={deals} rowKey={(d: any) => d.id} />;
                      })()}</>
      )}
    </div>
  );
}
