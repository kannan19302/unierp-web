"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button, Badge, DataTable } from "@kannan19302/ui";
import { MessageSquare, Clock, User, Phone, Globe } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface ChatSession {
  id: string;
  visitorId: string;
  customerId?: string;
  assignedAgentId?: string;
  status: string;
  source: string;
  pageUrl?: string;
  rating?: number;
  durationSec?: number;
  startedAt: string;
  endedAt?: string;
  tags?: string[];
}

export default function LiveChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet<ChatSession[] | { data: ChatSession[] }>(
        `/api/crm/support/live-chat${filter ? `?status=${filter}` : ""}`,
      );
      setSessions(Array.isArray(res) ? res : res?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const endSession = async (id: string) => {
    await apiSend(`/api/crm/support/live-chat/${id}/end`, "POST");
    load();
  };

  const statusBadge: Record<string, "success" | "warning" | "default"> = {
    ACTIVE: "success",
    WAITING: "warning",
    CLOSED: "default",
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Live Chat Sessions"
        description="Monitor and manage active chat sessions"
      />
      <div className="ui-flex ui-gap-2 ui-mb-4 ui-flex-wrap">
        <Button
          variant={!filter ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={filter === "ACTIVE" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("ACTIVE")}
        >
          Active
        </Button>
        <Button
          variant={filter === "WAITING" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("WAITING")}
        >
          Waiting
        </Button>
        <Button
          variant={filter === "CLOSED" ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter("CLOSED")}
        >
          Closed
        </Button>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <Card>
          <div className="ui-card-body p-0">
            <>{(() => {
                                    const columns = [
                            { key: "col_0", header: "Visitor", render: (s: any) => (<><User size={12} /> {s.visitorId.substring(0, 8)}</>) },
                            { key: "col_1", header: "Status", render: (s: any) => (<><Badge variant={statusBadge[s.status] || "default"}>
                                                  {s.status}
                                                </Badge></>) },
                            { key: "col_2", header: "Source", render: (s: any) => (<><Globe size={12} /> {s.source}</>) },
                            { key: "col_3", header: "Agent", render: (s: any) => (<>{s.assignedAgentId
                                                  ? s.assignedAgentId.substring(0, 8)
                                                  : "-"}</>) },
                            { key: "col_4", header: "Duration", render: (s: any) => (<>{s.durationSec ? (
                                                  `${Math.round(s.durationSec / 60)}m`
                                                ) : (
                                                  <Clock size={12} />
                                                )}</>) },
                            { key: "col_5", header: "Rating", render: (s: any) => (<>{s.rating ? `${s.rating}/5` : "-"}</>) },
                            { key: "col_6", header: "Actions", render: (s: any) => (<>{s.status !== "CLOSED" && (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => endSession(s.id)}
                                                  >
                                                    End
                                                  </Button>
                                                )}</>) },
                          ];
                                    return <DataTable columns={columns} data={sessions} rowKey={(s: any) => s.id} />;
                                  })()}</>
            {sessions.length === 0 && (
              <p className="ui-p-3 ui-text-sm text-muted">
                No chat sessions found
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
