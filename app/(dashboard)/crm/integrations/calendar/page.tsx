import { DataTable } from "@unerp/ui";
"use client";

import { useState, useEffect } from "react";
export default function CalendarPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/crm/integrations/calendar")
      .then((res) => res.json())
      .then((data) => {
        setConnections(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="ui-card p-6">Loading calendar connections...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Calendar Connections</h1>
      <>{(() => {
                    const columns = [
            { key: "col_0", header: "Name", render: (c: any) => (<>{c.name}</>) },
            { key: "col_1", header: "Provider", render: (c: any) => (<>{c.provider}</>) },
            { key: "col_2", header: "Sync", render: (c: any) => (<><span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.syncEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                          >
                            {c.syncEnabled ? "On" : "Off"}
                          </span></>) },
            { key: "col_3", header: "Last Sync", render: (c: any) => (<>{c.lastSyncAt
                            ? new Date(c.lastSyncAt).toLocaleString()
                            : "Never"}</>) },
            { key: "col_4", header: "Interval", render: (c: any) => (<>{c.syncIntervalMinutes}m</>) },
          ];
                    return <DataTable columns={columns} data={connections} rowKey={(c: any) => c.id} />;
                  })()}</>
    </div>
  );
}
