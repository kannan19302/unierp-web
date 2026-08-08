"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card, DataTable } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

import { ShoppingCart } from "lucide-react";

export default function VendorRMAPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/expansion/vendor-rma"),
      client.get("/procurement/expansion/vendor-rma/stats/summary"),
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
        OPEN: "warning",
        APPROVED: "info",
        COMPLETED: "success",
        REJECTED: "danger",
        CANCELLED: "default",
      }) as Record<
        string,
        "default" | "success" | "warning" | "danger" | "info" | "primary"
      >
    )[s] || "default";

  return (
    <RouteGuard permission="procurement.vendor-rma.read">
      <PageHeader
        title="Vendor RMA"
        description="Return merchandise authorization requests to suppliers"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Procurement", href: "/procurement" },
          { label: "Vendor RMA" },
        ]}
      />

      {stats && (
        <div className="ui-grid-5" style={{ marginBottom: 16 }}>
          <Card>
            <div className="ui-card">
              <h3>Total</h3>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {stats.total || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Open</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-amber)",
                }}
              >
                {stats.open || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Approved</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-blue)",
                }}
              >
                {stats.approved || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Completed</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-green)",
                }}
              >
                {stats.completed || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Rejected</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-red)",
                }}
              >
                {stats.rejected || 0}
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
                        { key: "col_0", header: "RMA #" , render: (rma: any) => (<>{rma.rmaNumber || rma.id}</>) },
                        { key: "col_1", header: "Vendor" , render: (rma: any) => (<>{rma.vendor?.name || "—"}</>) },
                        { key: "col_2", header: "Product" , render: (rma: any) => (<>{rma.product?.name || "—"}</>) },
                        { key: "col_3", header: "Quantity" , render: (rma: any) => (<>{rma.quantity ?? "—"}</>) },
                        { key: "col_4", header: "Reason" , render: (rma: any) => (<>{rma.reason || "—"}</>) },
                        { key: "col_5", header: "Status" , render: (rma: any) => (<><Badge variant={statusVariant(rma.status)}>
                                            {rma.status}
                                          </Badge></>) },
                        { key: "col_6", header: "Date" , render: (rma: any) => (<>{rma.createdAt
                                            ? new Date(rma.createdAt).toLocaleDateString()
                                            : "—"}</>) },
                      ];
                              return <DataTable columns={columns} data={(data || [])} rowKey={(rma: any) => rma.id} />;
                          })()}</>
        </Card>
      )}
    </RouteGuard>
  );
}
