"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card, Table, DataTable } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { ShoppingCart } from "lucide-react";

export default function RfqAuctionsPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/intelligence/auctions"),
      client.get("/procurement/intelligence/auctions/stats/summary"),
    ])
      .then(([res, statsRes]: any[]) => {
        setData(res.data || []);
        setStats(statsRes);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statusVariant = (
    s: string,
  ): "default" | "success" | "warning" | "danger" | "info" | "primary" =>
    (
      ({
        ACTIVE: "success",
        CLOSED: "default",
        AWARDED: "primary",
        CANCELLED: "danger",
      }) as Record<
        string,
        "default" | "success" | "warning" | "danger" | "info" | "primary"
      >
    )[s] || "default";

  return (
    <RouteGuard permission="procurement.rfq-auction.read">
      <PageHeader
        title="RFQ Auctions"
        description="Reverse auction management for competitive supplier bidding"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Procurement", href: "/procurement" },
          { label: "RFQ Auctions" },
        ]}
      />

      {stats && (
        <div className="ui-grid-4" style={{ marginBottom: 16 }}>
          <Card>
            <div className="ui-card">
              <h3>Active</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-green)",
                }}
              >
                {stats.active || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Closed</h3>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {stats.closed || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Awarded</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-blue)",
                }}
              >
                {stats.awarded || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Cancelled</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-red)",
                }}
              >
                {stats.cancelled || 0}
              </p>
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Auction #" , render: (a: any) => (<>{a.auctionNumber || a.id}</>) },
                        { key: "col_1", header: "Title" , render: (a: any) => (<>{a.title || "—"}</>) },
                        { key: "col_2", header: "Vendor" , render: (a: any) => (<>{a.vendor?.name || "—"}</>) },
                        { key: "col_3", header: "Start Date" , render: (a: any) => (<>{a.startDate
                                            ? new Date(a.startDate).toLocaleDateString()
                                            : "—"}</>) },
                        { key: "col_4", header: "End Date" , render: (a: any) => (<>{a.endDate ? new Date(a.endDate).toLocaleDateString() : "—"}</>) },
                        { key: "col_5", header: "Status" , render: (a: any) => (<><Badge variant={statusVariant(a.status)}>{a.status}</Badge></>) },
                        { key: "col_6", header: "Awarded To" , render: (a: any) => (<>{a.awardedTo?.name || a.awardedVendor || "—"}</>) },
                      ];
                              return <DataTable columns={columns} data={(data || [])} rowKey={(a: any) => a.id} />;
                          })()}</>
        </Card>
      )}
    </RouteGuard>
  );
}
