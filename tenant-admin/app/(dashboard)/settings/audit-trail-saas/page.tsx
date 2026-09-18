"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { Shield, Clock, UserCheck, Activity } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function SaasPortalAuditTrailPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const toast = useToast();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/saas-portal/audit-trail-deep/logs",
      );
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Audit Trail logs",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Administrative Security & Audit Trail"
        description="Immutable administrative action logs, user privilege changes, and security compliance trail."
      />

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Audit Log Stream
        </h3>
        {logs.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No administrative audit events recorded.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Timestamp" , render: (log: any) => (<>{new Date(log.timestamp).toLocaleString()}</>) },
                        { key: "col_1", header: "Actor" , render: (log: any) => (<>{log.actor}</>) },
                        { key: "col_2", header: "Action" , render: (log: any) => (<><Badge variant="info">{log.action}</Badge></>) },
                        { key: "col_3", header: "Resource" , render: (log: any) => (<>{log.resource}</>) },
                        { key: "col_4", header: "IP Address" , render: (log: any) => (<>{log.ipAddress}</>) },
                      ];
                              return <DataTable columns={columns} data={logs} rowKey={(log: any) => log.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
