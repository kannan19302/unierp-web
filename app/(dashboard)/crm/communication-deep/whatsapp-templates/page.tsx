import { DataTable } from "@kannan19302/ui";
"use client";
import { useState, useEffect } from "react";

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/communication-deep/whatsapp-templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.data || []);
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
        <h1 className="text-2xl font-bold">WhatsApp Templates</h1>
        <button className="ui-btn">+ New Template</button>
      </div>
      <div className="overflow-x-auto">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Name", render: (t: any) => (<>{t.name}</>) },
                { key: "col_1", header: "Body", render: (t: any) => (<>{t.body}</>) },
                { key: "col_2", header: "Category", render: (t: any) => (<>{t.category}</>) },
                { key: "col_3", header: "Active", render: (t: any) => (<>{t.isActive ? "Yes" : "No"}</>) },
                { key: "col_4", header: "Actions", render: (t: any) => (<><button className="text-blue-600 hover:underline">
                                  Edit
                                </button>
                                <button className="text-red-600 hover:underline">
                                  Delete
                                </button></>) },
              ];
                        return <DataTable columns={columns} data={templates} rowKey={(t: any) => t.id} />;
                      })()}</>
      </div>
    </div>
  );
}
