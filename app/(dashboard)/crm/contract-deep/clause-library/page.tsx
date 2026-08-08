"use client";
import { DataTable } from "@kannan19302/ui";
import { useState, useEffect } from "react";

export default function ClauseLibraryPage() {
  const [clauses, setClauses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crm/contract-deep/clause-library")
      .then((r: any) => r.json())
      .then((d: any) => {
        setClauses(d.data || []);
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
        <h1 className="text-2xl font-bold">Clause Library</h1>
        <button className="ui-btn">+ New Clause</button>
      </div>
      <div className="overflow-x-auto">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Title", render: (c: any) => (<>{c.title}</>) },
                { key: "col_1", header: "Category", render: (c: any) => (<>{c.category}</>) },
                { key: "col_2", header: "Standard", render: (c: any) => (<>{c.isStandard ? "Yes" : "No"}</>) },
                { key: "col_3", header: "Actions", render: (c: any) => (<><button className="text-blue-600 hover:underline">
                                  Edit
                                </button>
                                <button className="text-red-600 hover:underline">
                                  Delete
                                </button></>) },
              ];
                        return <DataTable columns={columns} data={clauses} rowKey={(c: any) => c.id} />;
                      })()}</>
      </div>
    </div>
  );
}
