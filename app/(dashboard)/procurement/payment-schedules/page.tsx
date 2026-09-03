"use client";
import { useState, useEffect } from "react";
import { PageHeader, Badge, Spinner, Card, DataTable } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

import { ShoppingCart } from "lucide-react";

export default function PaymentSchedulesPage() {
  const client = useApiClient();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/procurement/scheduling/payment-schedules"),
      client.get("/procurement/scheduling/payment-schedules/stats/summary"),
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
        UPCOMING: "primary",
        OVERDUE: "danger",
        PAID: "success",
        PARTIAL: "warning",
        CANCELLED: "default",
      }) as Record<
        string,
        "default" | "success" | "warning" | "danger" | "info" | "primary"
      >
    )[s] || "default";

  return (
    <RouteGuard permission="procurement.payment-schedule.read">
      <PageHeader
        title="Payment Schedules"
        description="Track scheduled payments, due dates, and payment status across purchase orders"
      />

      {stats && (
        <div className="ui-grid-4" style={{ marginBottom: 16 }}>
          <Card>
            <div className="ui-card">
              <h3>Upcoming</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-blue)",
                }}
              >
                {stats.upcoming || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Overdue</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-red)",
                }}
              >
                {stats.overdue || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Paid</h3>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "var(--color-green)",
                }}
              >
                {stats.paid || 0}
              </p>
            </div>
          </Card>
          <Card>
            <div className="ui-card">
              <h3>Total Amount</h3>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                ${Number(stats.totalAmount || 0).toLocaleString()}
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
                        { key: "col_0", header: "Schedule #" , render: (s: any) => (<>{s.scheduleNumber || s.id}</>) },
                        { key: "col_1", header: "PO Reference" , render: (s: any) => (<>{s.poReference || s.purchaseOrder?.orderNumber || "—"}</>) },
                        { key: "col_2", header: "Vendor" , render: (s: any) => (<>{s.vendor?.name || "—"}</>) },
                        { key: "col_3", header: "Amount Due" , render: (s: any) => (<>${Number(s.amountDue || 0).toLocaleString()}</>) },
                        { key: "col_4", header: "Due Date" , render: (s: any) => (<>{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—"}</>) },
                        { key: "col_5", header: "Paid Date" , render: (s: any) => (<>{s.paidDate
                                            ? new Date(s.paidDate).toLocaleDateString()
                                            : "—"}</>) },
                        { key: "col_6", header: "Status" , render: (s: any) => (<><Badge variant={statusVariant(s.status)}>{s.status}</Badge></>) },
                      ];
                              return <DataTable columns={columns} data={(data || [])} rowKey={(s: any) => s.id} />;
                          })()}</>
        </Card>
      )}
    </RouteGuard>
  );
}
