import { DataTable } from "@kannan19302/ui";
"use client";
import { useState } from "react";

export default function ObligationsPage() {
  const [contractId, setContractId] = useState("");
  const [obligations, setObligations] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  const search = async () => {
    if (!contractId) return;
    const r = await fetch(
      `/api/crm/contract-deep/contracts/${contractId}/obligations`,
    );
    const d = await r.json();
    setObligations(d.data || []);
    setLoaded(true);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Obligations</h1>
      <div className="flex gap-3 mb-6 items-end">
        <div className="ui-form-group flex-1">
          <label className="text-sm font-medium">Contract ID</label>
          <input
            className="ui-input"
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            placeholder="Enter contract ID"
          />
        </div>
        <button className="ui-btn" onClick={search}>
          Load Obligations
        </button>
      </div>
      {loaded && (
        <div className="overflow-x-auto">
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Description", render: (o: any) => (<>{o.description}</>) },
                    { key: "col_1", header: "Owner", render: (o: any) => (<>{o.owner}</>) },
                    { key: "col_2", header: "Due Date", render: (o: any) => (<>{o.dueDate ? new Date(o.dueDate).toLocaleDateString() : "-"}</>) },
                    { key: "col_3", header: "Priority", render: (o: any) => (<>{o.priority}</>) },
                    { key: "col_4", header: "Status", render: (o: any) => (<>{o.status}</>) },
                  ];
                            return <DataTable columns={columns} data={obligations} rowKey={(o: any) => o.id} />;
                          })()}</>
        </div>
      )}
    </div>
  );
}
