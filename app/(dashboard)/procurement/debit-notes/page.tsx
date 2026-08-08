"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card, DataTable } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

import { ShoppingCart } from "lucide-react";

export default function DebitNotesPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/expansion/debit-notes"),
      client.get("/procurement/expansion/debit-notes/stats/summary"),
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
        APPROVED: "success",
        DISPUTED: "danger",
        PENDING: "warning",
        CANCELLED: "default",
      }) as Record<
        string,
        "default" | "success" | "warning" | "danger" | "info" | "primary"
      >
    )[s] || "default";

  return (
    <RouteGuard permission="procurement.debit-note.read">
      <PageHeader
        title="Debit Notes"
        description="Debit note lifecycle management for purchase returns and adjustments"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Procurement", href: "/procurement" },
          { label: "Debit Notes" },
        ]}
      />

      {stats && (
        <div className="ui-grid-4" style={{ marginBottom: 16 }}>
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
              <h3>Approved</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-green)",
                }}
              >
                {stats.approved || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Disputed</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-red)",
                }}
              >
                {stats.disputed || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Pending</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-amber)",
                }}
              >
                {stats.pending || 0}
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
                        { key: "col_0", header: "DN #" , render: (dn: any) => (<>{dn.dnNumber || dn.id}</>) },
                        { key: "col_1", header: "Vendor" , render: (dn: any) => (<>{dn.vendor?.name || "—"}</>) },
                        { key: "col_2", header: "Amount" , render: (dn: any) => (<>${Number(dn.amount || 0).toLocaleString()}</>) },
                        { key: "col_3", header: "Reason" , render: (dn: any) => (<>{dn.reason || "—"}</>) },
                        { key: "col_4", header: "Status" , render: (dn: any) => (<><Badge variant={statusVariant(dn.status)}>
                                            {dn.status}
                                          </Badge></>) },
                        { key: "col_5", header: "Date" , render: (dn: any) => (<>{dn.createdAt
                                            ? new Date(dn.createdAt).toLocaleDateString()
                                            : "—"}</>) },
                      ];
                              return <DataTable columns={columns} data={(data || [])} rowKey={(dn: any) => dn.id} />;
                          })()}</>
        </Card>
      )}
    </RouteGuard>
  );
}
