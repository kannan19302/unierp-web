import { DataTable } from "@kannan19302/ui";
"use client";

import { useState, useEffect } from "react";
export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/crm/integrations/webhooks")
      .then((res) => res.json())
      .then((data) => {
        setWebhooks(Array.isArray(data) ? data : data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading webhooks...</div>;

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-4">Webhook Configs</h1>
      <>{(() => {
                    const columns = [
            { key: "col_0", header: "Name", render: (w: any) => (<>{w.name}</>) },
            { key: "col_1", header: "URL", render: (w: any) => (<>{w.url}</>) },
            { key: "col_2", header: "Events", render: (w: any) => (<>{w.events?.join(", ")}</>) },
            { key: "col_3", header: "Status", render: (w: any) => (<><span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${w.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                          >
                            {w.enabled ? "Enabled" : "Disabled"}
                          </span></>) },
            { key: "col_4", header: "Max Retries", render: (w: any) => (<>{w.maxRetries}</>) },
          ];
                    return <DataTable columns={columns} data={webhooks} rowKey={(w: any) => w.id} />;
                  })()}</>
    </div>
  );
}
