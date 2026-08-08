"use client";
import { DataTable } from "@kannan19302/ui";
import { useState, useEffect } from "react";

export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/crm/contract-deep/templates").then((r: any) => r.json()),
      fetch("/api/crm/contract-deep/template-categories").then((r: any) => r.json()),
    ]).then(([t, c]: any) => {
      setTemplates(t.data || []);
      setCategories(c.data || []);
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <div className="ui-card p-6">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Templates</h1>
      {categories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            Categories
          </h2>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c: any) => (
              <span
                key={c.id}
                className="px-3 py-1 bg-muted rounded-full text-sm"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Name", render: (t: any) => (<>{t.name}</>) },
                { key: "col_1", header: "Type", render: (t: any) => (<>{t.contractType}</>) },
                { key: "col_2", header: "Version", render: (t: any) => (<>v{t.version}</>) },
                { key: "col_3", header: "Active", render: (t: any) => (<>{t.isActive ? "Yes" : "No"}</>) },
                { key: "col_4", header: "Actions", render: (t: any) => (<><button className="text-blue-600 hover:underline">
                                  Generate
                                </button>
                                <button className="text-blue-600 hover:underline">
                                  Edit
                                </button></>) },
              ];
                        return <DataTable columns={columns} data={templates} rowKey={(t: any) => t.id} />;
                      })()}</>
      </div>
    </div>
  );
}
