import { Table, DataTable } from "@unerp/ui";
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function ContractDeepPage() {
  const [dash, setDash] = useState<any>(null);
  const [calendar, setCalendar] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/crm/contract-deep/dashboard")
      .then((r) => r.json())
      .then(setDash);
    fetch("/api/crm/contract-deep/expiry-calendar?range=90d")
      .then((r) => r.json())
      .then((d) => setCalendar(d.data || []));
  }, []);

  return (
    <div>
      <div className="ui-card p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Contract Deep Dashboard</h1>
        <div className="ui-grid-4 mb-6">
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold">{dash?.total ?? 0}</p>
            <p className="text-sm text-muted-foreground">Total Contracts</p>
          </div>
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold text-green-600">
              {dash?.active ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold text-orange-600">
              {dash?.expiringSoon ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
          </div>
          <div className="p-4 border rounded text-center">
            <p className="text-3xl font-bold text-red-600">
              {dash?.expired ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Expired</p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-4">
          Total Active Value: ${(dash?.totalActiveValue ?? 0).toLocaleString()}{" "}
          | Templates: {dash?.templates ?? 0}
        </div>
        <div className="ui-grid-3">
          <Link
            href="/crm/contract-deep/templates"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Templates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Contract templates & categories
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/clause-library"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Clause Library</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage contract clauses
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/obligations"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Obligations</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track contract obligations
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/compliance"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Compliance</h2>
            <p className="text-sm text-muted-foreground mt-1">
              SLA compliance & value at risk
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/financial-summary"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Financial Summary</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Contract financials
            </p>
          </Link>
          <Link
            href="/crm/contract-deep/version-history"
            className="ui-card p-4 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-lg">Version History</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Contract version tracking
            </p>
          </Link>
        </div>
      </div>
      <div className="ui-card p-6">
        <h2 className="text-lg font-semibold mb-4">
          Upcoming Expiry Calendar (90 days)
        </h2>
        <div className="overflow-x-auto">
          <>{(() => {
                          const columns = [
                    { key: "col_0", header: "Contract" , render: (c: any) => (<>{c.contractNumber}- {c.title}</>) },
                    { key: "col_1", header: "Customer/Vendor" , render: (c: any) => (<>{c.customer?.name || c.vendor?.name || "-"}</>) },
                    { key: "col_2", header: "End Date" , render: (c: any) => (<>{new Date(c.endDate).toLocaleDateString()}</>) },
                    { key: "col_3", header: "Renewal Date" , render: (c: any) => (<>{new Date(c.renewalDate).toLocaleDateString()}</>) },
                    { key: "col_4", header: "Value" , render: (c: any) => (<>{c.currency}{Number(c.value).toLocaleString()}</>) },
                    { key: "col_5", header: "Status" , render: (c: any) => (<>{c.status}</>) },
                    { key: "col_6", header: "Auto-Renew" , render: (c: any) => (<>{c.autoRenew ? "Yes" : "No"}</>) },
                  ];
                          return <DataTable columns={columns} data={calendar} rowKey={(c: any) => c.id} />;
                      })()}</>
        </div>
      </div>
    </div>
  );
}
