"use client";
import { DataTable } from "@kannan19302/ui";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";

export default function PipelineInspectionPage() {
  const api = useApiClient();
  const [configs, setConfigs] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/crm/pipeline-deep/inspection-configs"),
      api.get("/crm/pipeline-deep/inspection-results"),
    ])
      .then(([c, r]: any) => {
        setConfigs(c.data || []);
        setResults(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const runInspection = async (configId: string) => {
    setRunning(configId);
    try {
      await api.post(`/crm/pipeline-deep/inspection-configs/${configId}/run`);
      const res: any = await api.get("/crm/pipeline-deep/inspection-results");
      setResults(res.data || []);
    } catch {
      /* ignore */
    }
    setRunning(null);
  };

  if (loading) return <div className="ui-card p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="ui-card p-6">
        <h1 className="text-2xl font-bold mb-4">Inspection Configs</h1>
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Name", render: (c: any) => (<>{c.name}</>) },
                { key: "col_1", header: "Schedule", render: (c: any) => (<>{c.schedule}</>) },
                { key: "col_2", header: "Rules", render: (c: any) => (<>{(c.rules || []).length}</>) },
                { key: "col_3", header: "Enabled", render: (c: any) => (<><span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                                >
                                  {c.enabled ? "Yes" : "No"}
                                </span></>) },
                { key: "col_4", header: "Actions", render: (c: any) => (<><button
                                  className="text-xs text-blue-600 hover:underline"
                                  onClick={() => runInspection(c.id)}
                                  disabled={running === c.id}
                                >
                                  {running === c.id ? "Running..." : "Run"}
                                </button></>) },
              ];
                        return <DataTable columns={columns} data={configs} rowKey={(c: any) => c.id} />;
                      })()}</>
      </div>

      <div className="ui-card p-6">
        <h2 className="text-xl font-bold mb-4">Recent Inspection Results</h2>
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Scanned", render: (r: any) => (<>{r.totalScanned}</>) },
                { key: "col_1", header: "Findings", render: (r: any) => (<>{r.totalFindings}</>) },
                { key: "col_2", header: "Status", render: (r: any) => (<><span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {r.status}
                                </span></>) },
                { key: "col_3", header: "Completed", render: (r: any) => (<>{r.completedAt
                                  ? new Date(r.completedAt).toLocaleString()
                                  : "—"}</>) },
              ];
                        return <DataTable columns={columns} data={results} rowKey={(r: any) => r.id} />;
                      })()}</>
      </div>
    </div>
  );
}
