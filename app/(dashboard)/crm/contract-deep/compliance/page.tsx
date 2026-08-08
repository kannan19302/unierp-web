import { DataTable } from "@unerp/ui";
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CompliancePage() {
  const [risk, setRisk] = useState<any>(null);

  useEffect(() => {
    fetch("/api/crm/contract-deep/value-at-risk")
      .then((r) => r.json())
      .then(setRisk);
  }, []);

  return (
    <div>
      <div className="ui-card p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Compliance & Risk</h1>
        {risk && (
          <div className="ui-grid-3 mb-6">
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-orange-600">{risk.count}</p>
              <p className="text-sm text-muted-foreground">Contracts at Risk</p>
            </div>
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-red-600">
                ${(risk.totalAtRisk ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Total Value at Risk
              </p>
            </div>
            <div className="p-4 border rounded text-center">
              <p className="text-3xl font-bold text-blue-600">
                {risk.contracts?.filter((c: any) => c.autoRenew).length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">
                Auto-Renew Enabled
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-4">
          <Link href="/crm/contract-deep" className="ui-btn">
            Back to Dashboard
          </Link>
        </div>
      </div>
      {risk?.contracts && risk.contracts.length > 0 && (
        <div className="ui-card p-6">
          <h2 className="text-lg font-semibold mb-4">
            Contracts Expiring Within 30 Days
          </h2>
          <div className="overflow-x-auto">
            <>{(() => {
                                const columns = [
                        { key: "col_0", header: "Contract", render: (c: any) => (<>{c.contractNumber} - {c.title}</>) },
                        { key: "col_1", header: "Customer", render: (c: any) => (<>{c.customer?.name || "-"}</>) },
                        { key: "col_2", header: "End Date", render: (c: any) => (<>{new Date(c.endDate).toLocaleDateString()}</>) },
                        { key: "col_3", header: "Value", render: (c: any) => (<>{c.currency} {Number(c.value).toLocaleString()}</>) },
                        { key: "col_4", header: "Auto-Renew", render: (c: any) => (<>{c.autoRenew ? "Yes" : "No"}</>) },
                      ];
                                return <DataTable columns={columns} data={risk.contracts} rowKey={(c: any) => c.id} />;
                              })()}</>
          </div>
        </div>
      )}
    </div>
  );
}
