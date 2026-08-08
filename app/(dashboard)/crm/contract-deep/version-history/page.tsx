import { DataTable } from "@kannan19302/ui";
"use client";
import { useState } from "react";

export default function VersionHistoryPage() {
  const [contractId, setContractId] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!contractId) return;
    const r = await fetch(
      `/api/crm/contract-deep/contracts/${contractId}/versions`,
    );
    setHistory(await r.json());
    setLoaded(true);
  };

  return (
    <div className="ui-card p-6">
      <h1 className="text-2xl font-bold mb-6">Contract Version History</h1>
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
        <button className="ui-btn" onClick={load}>
          Load History
        </button>
      </div>
      {loaded && history && (
        <div className="space-y-6">
          {history.versions?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Versions</h2>
              <div className="overflow-x-auto">
                <>{(() => {
                                        const columns = [
                                { key: "col_0", header: "Version", render: (v: any) => (<>v{v.versionNumber}</>) },
                                { key: "col_1", header: "Change Summary", render: (v: any) => (<>{v.changeSummary}</>) },
                                { key: "col_2", header: "Created By", render: (v: any) => (<>{v.createdBy}</>) },
                                { key: "col_3", header: "Date", render: (v: any) => (<>{new Date(v.createdAt).toLocaleDateString()}</>) },
                              ];
                                        return <DataTable columns={columns} data={history.versions} rowKey={(v: any) => v.id} />;
                                      })()}</>
              </div>
            </div>
          )}
          {history.amendments?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Amendments</h2>
              <div className="overflow-x-auto">
                <>{(() => {
                                        const columns = [
                                { key: "col_0", header: "Number", render: (a: any) => (<>{a.amendmentNumber}</>) },
                                { key: "col_1", header: "Title", render: (a: any) => (<>{a.title}</>) },
                                { key: "col_2", header: "Created By", render: (a: any) => (<>{a.createdBy}</>) },
                                { key: "col_3", header: "Date", render: (a: any) => (<>{new Date(a.createdAt).toLocaleDateString()}</>) },
                              ];
                                        return <DataTable columns={columns} data={history.amendments} rowKey={(a: any) => a.id} />;
                                      })()}</>
              </div>
            </div>
          )}
          {!history.versions?.length && !history.amendments?.length && (
            <p className="text-muted-foreground">
              No version history found for this contract
            </p>
          )}
        </div>
      )}
    </div>
  );
}
