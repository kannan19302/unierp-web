import { DataTable } from "@kannan19302/ui";
"use client";

import { useState, useEffect } from "react";
import { useApiClient } from "@kannan19302/framework";

export default function PartnerDashboardPage() {
  const api = useApiClient();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/partner-deep/dashboard")
      .then((res: any) => {
        setDashboard(res.data || res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="ui-card p-6">Loading dashboard...</div>;
  if (!dashboard)
    return <div className="ui-card p-6">Failed to load dashboard</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Partner Dashboard</h1>
      <div className="ui-grid-4">
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Total Partners</p>
          <p className="text-2xl font-bold">{dashboard.totalPartners}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">{dashboard.winRate}%</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">
            ${dashboard.totalEstimatedValue?.toLocaleString()}
          </p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Referrals</p>
          <p className="text-2xl font-bold">{dashboard.totalReferrals}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Active Contracts</p>
          <p className="text-2xl font-bold">{dashboard.activeContracts}</p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">MDF Budget</p>
          <p className="text-2xl font-bold">
            ${dashboard.totalMdfBudget?.toLocaleString()}
          </p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">MDF Spent</p>
          <p className="text-2xl font-bold">
            ${dashboard.totalMdfSpent?.toLocaleString()}
          </p>
        </div>
        <div className="ui-card p-4">
          <p className="text-sm text-muted-foreground">Deal Registrations</p>
          <p className="text-2xl font-bold">
            {dashboard.totalDealRegistrations}
          </p>
        </div>
      </div>
      {dashboard.partnerPerformance?.length > 0 && (
        <div className="ui-card p-4">
          <h2 className="font-semibold mb-3">Per-Partner Performance</h2>
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Partner", render: (p: any) => (<>{p.partnerName}</>) },
                    { key: "col_1", header: "Win Rate", render: (p: any) => (<>{p.wonRate}%</>) },
                    { key: "col_2", header: "Deals", render: (p: any) => (<>{p.wonDeals}/{p.dealRegistrations}</>) },
                    { key: "col_3", header: "Referrals", render: (p: any) => (<>{p.totalReferrals}</>) },
                    { key: "col_4", header: "MDF Util", render: (p: any) => (<>{p.mdfUtilization}%</>) },
                    { key: "col_5", header: "Contracts", render: (p: any) => (<>{p.activeContracts}</>) },
                  ];
                            return <DataTable columns={columns} data={dashboard.partnerPerformance} rowKey={(p: any) => p.partnerId} />;
                          })()}</>
        </div>
      )}
    </div>
  );
}
