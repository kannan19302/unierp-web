"use client";
// @ts-nocheck
import { useState, useEffect } from "react";
import { PageHeader, Spinner, Card, DataTable } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

import { ShoppingCart, BarChart3 } from "lucide-react";

export default function ProcurementAnalyticsPage() {
  const client = useApiClient();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/procurement/intelligence/analytics/dashboard")
      .then((res: any) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <RouteGuard permission="procurement.purchase-order.read">
      <PageHeader
        title="Procurement Analytics"
        description="Spend analysis, budget tracking, and vendor performance metrics."
      />

      {loading ? (
        <Spinner />
      ) : data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="ui-grid-5">
            <Card>
              <div className="ui-card">
                <h3>Budgeted</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  ${(data.budgetOverview?.totalBudgeted || 0).toLocaleString()}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Spent</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  ${(data.budgetOverview?.totalSpent || 0).toLocaleString()}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Utilization</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  {data.budgetOverview?.utilizationRate || 0}%
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Vendors</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  {data.scorecardStats?.vendorsScored || 0}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card">
                <h3>Avg Score</h3>
                <p style={{ fontSize: 24, fontWeight: 700 }}>
                  {data.scorecardStats?.avgOverall
                    ? `${data.scorecardStats.avgOverall}/100`
                    : "—"}
                </p>
              </div>
            </Card>
          </div>

          <Card>
            <h3>Top Vendors by Spend</h3>
            <>{(() => {
                                  const columns = [
                            { key: "col_0", header: "Vendor" , render: (v: any) => (<>{v.vendorName}</>) },
                            { key: "col_1", header: "Total Spend" , render: (v: any) => (<>${v.totalSpend.toLocaleString()}</>) },
                            { key: "col_2", header: "Orders" , render: (v: any) => (<>{v.orderCount}</>) },
                            { key: "col_3", header: "Overall Score" , render: (v: any) => (<>{v.overallScore ? `${v.overallScore}/100` : "—"}</>) },
                          ];
                                  return <DataTable columns={columns} data={(data.vendorPerformance || []).slice(0, 10)} rowKey={(v: any) => v.vendorId} />;
                              })()}</>
          </Card>

          <div className="ui-grid-2">
            <Card>
              <h3>Spend by Status</h3>
              <>{(() => {
                                      const columns = [
                                { key: "col_0", header: "Status" , render: ([status, s]: any) => (<>{status}</>) },
                                { key: "col_1", header: "Total" , render: ([status, s]: any) => (<>${s.total.toLocaleString()}</>) },
                                { key: "col_2", header: "Count" , render: ([status, s]: any) => (<>{s.count}</>) },
                              ];
                                      return <DataTable columns={columns} data={Object.entries(data.spendByStatus || {})} rowKey={([status, s]: any) => status} />;
                                  })()}</>
            </Card>

            <Card>
              <h3>Monthly Spend Trend</h3>
              <>{(() => {
                                      const columns = [
                                { key: "col_0", header: "Month" , render: (m: any) => (<>{m.month}</>) },
                                { key: "col_1", header: "Total" , render: (m: any) => (<>${m.total.toLocaleString()}</>) },
                                { key: "col_2", header: "Orders" , render: (m: any) => (<>{m.count}</>) },
                              ];
                                      return <DataTable columns={columns} data={(data.monthlyTrend || []).slice(-6)} rowKey={(m: any) => m.month} />;
                                  })()}</>
            </Card>
          </div>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </RouteGuard>
  );
}
