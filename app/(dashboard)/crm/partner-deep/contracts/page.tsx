"use client";
import { DataTable } from "@kannan19302/ui";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";

export default function PartnerContractsPage() {
  const api = useApiClient();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/contracts")
      .then((res: any) => {
        setContracts(res.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading contracts...</div>;

  return (
    <div className="ui-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Partner Contracts</h1>
      </div>
      <>{(() => {
                    const columns = [
            { key: "col_0", header: "Contract #", render: (c: any) => (<>{c.contractNumber}</>) },
            { key: "col_1", header: "Name", render: (c: any) => (<>{c.name}</>) },
            { key: "col_2", header: "Type", render: (c: any) => (<>{c.type}</>) },
            { key: "col_3", header: "Status", render: (c: any) => (<><span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.status === "ACTIVE" ? "bg-green-100 text-green-800" : c.status === "EXPIRED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {c.status}
                          </span></>) },
            { key: "col_4", header: "Value", render: (c: any) => (<>{c.currency} {c.value?.toLocaleString()}</>) },
            { key: "col_5", header: "Start", render: (c: any) => (<>{new Date(c.startDate).toLocaleDateString()}</>) },
            { key: "col_6", header: "End", render: (c: any) => (<>{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}</>) },
          ];
                    return <DataTable columns={columns} data={contracts} rowKey={(c: any) => c.id} />;
                  })()}</>
    </div>
  );
}
