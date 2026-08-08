import { DataTable } from "@unerp/ui";
"use client";
import { useState, useEffect } from "react";

export default function OptOutPage() {
  const [optOuts, setOptOuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/communication-deep/opt-out")
      .then((r) => r.json())
      .then((d) => {
        setOptOuts(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="ui-card p-6">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="ui-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Opt-Out List</h1>
        <button className="ui-btn">+ Add Opt-Out</button>
      </div>
      <div className="overflow-x-auto">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Entity Type", render: (o: any) => (<>{o.entityType}</>) },
                { key: "col_1", header: "Entity ID", render: (o: any) => (<>{o.entityId}</>) },
                { key: "col_2", header: "Channel", render: (o: any) => (<>{o.channel}</>) },
                { key: "col_3", header: "Reason", render: (o: any) => (<>{o.reason || "-"}</>) },
                { key: "col_4", header: "Opted Out", render: (o: any) => (<>{new Date(o.optedOutAt).toLocaleDateString()}</>) },
              ];
                        return <DataTable columns={columns} data={optOuts} rowKey={(o: any) => o.id} />;
                      })()}</>
      </div>
    </div>
  );
}
