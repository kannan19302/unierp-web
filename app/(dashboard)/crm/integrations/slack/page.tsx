"use client";
import { DataTable } from "@kannan19302/ui";

import { useState, useEffect } from "react";
export default function SlackPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/crm/integrations/slack")
      .then((res: any) => res.json())
      .then((data: any) => {
        setConnections(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading Slack connections...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Slack Connections</h1>
      <>{(() => {
                    const columns = [
            { key: "col_0", header: "Name", render: (s: any) => (<>{s.name}</>) },
            { key: "col_1", header: "Workspace", render: (s: any) => (<>{s.workspaceName}</>) },
            { key: "col_2", header: "Default Channel", render: (s: any) => (<>{s.defaultChannel || "—"}</>) },
            { key: "col_3", header: "Status", render: (s: any) => (<><span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${s.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                          >
                            {s.enabled ? "Enabled" : "Disabled"}
                          </span></>) },
          ];
                    return <DataTable columns={columns} data={connections} rowKey={(s: any) => s.id} />;
                  })()}</>
    </div>
  );
}
