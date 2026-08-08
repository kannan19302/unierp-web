"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, Table, DataTable } from "@unerp/ui";
import { LifeBuoy, Plus, MessageSquare, Clock } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function SaasPortalSupportPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const toast = useToast();

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await client.get<any[]>(
        "/saas-portal/support-self-service/tickets",
      );
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Failed to load Support Tickets",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async () => {
    try {
      if (!subject) {
        toast.error("Validation Error", "Ticket subject is required");
        return;
      }
      await client.post("/saas-portal/support-self-service/tickets", {
        subject,
        category: "BILLING",
        priority: "MEDIUM",
      });
      toast.success(
        "Ticket Submitted",
        "Customer support ticket logged successfully",
      );
      setSubject("");
      loadTickets();
    } catch (err) {
      toast.error(
        "Failed to submit ticket",
        err instanceof Error ? err.message : "Error",
      );
    }
  };

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
        title="Customer Support Self-Service Desk"
        description="Submit support tickets, communicate with customer care representatives, and track ticket status."
      />

      <Card style={{ padding: "20px", margin: "24px 0" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
          Open New Support Ticket
        </h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            placeholder="Brief subject of your issue..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
            }}
          />
          <Button onClick={handleCreateTicket}>Submit Ticket</Button>
        </div>
      </Card>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Your Active Support Tickets
        </h3>
        {tickets.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "32px 0",
            }}
          >
            No active support tickets found.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Ticket #" , render: (t: any) => (<>{t.ticketNumber}</>) },
                        { key: "col_1", header: "Subject" , render: (t: any) => (<>{t.subject}</>) },
                        { key: "col_2", header: "Category" , render: (t: any) => (<>{t.category}</>) },
                        { key: "col_3", header: "Priority" , render: (t: any) => (<><Badge variant={t.priority === "HIGH" ? "danger" : "info"}>
                                            {t.priority}
                                          </Badge></>) },
                        { key: "col_4", header: "Status" , render: (t: any) => (<><Badge
                                            variant={t.status === "RESOLVED" ? "success" : "warning"}
                                          >
                                            {t.status}
                                          </Badge></>) },
                      ];
                              return <DataTable columns={columns} data={tickets} rowKey={(t: any) => t.id} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
