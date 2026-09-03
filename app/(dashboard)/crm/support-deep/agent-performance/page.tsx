"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Badge, DataTable } from "@kannan19302/ui";
import {
  BarChart3,
  Users,
  Star,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { apiGet } from "../../_components/api";

interface AgentPerf {
  agentId: string;
  agentName: string;
  casesResolved: number;
  avgResolutionHours: number;
  csatScore: number;
  firstResponseMins: number;
  slaBreachCount: number;
  chatsHandled: number;
}

interface Dashboard {
  period: string;
  totalAgents: number;
  totalCasesResolved: number;
  totalChatsHandled: number;
  averageCsat: number;
  agents: AgentPerf[];
}

export default function AgentPerformancePage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [period, setPeriod] = useState("2026-07");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiGet(
        `/api/crm/support/agent-performance/dashboard/${period}`,
      );
      setDashboard(
        res &&
          typeof res === "object" &&
          !Array.isArray(res) &&
          Object.keys(res).length > 0
          ? (res as Dashboard)
          : null,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period]);

  return (
    <div className="ui-page">
      <PageHeader
        title="Agent Performance"
        description="Support team KPIs by period"
      />
      <div className="ui-mb-4">
        <label className="ui-label">Period</label>
        <select
          className="ui-input"
          style={{ maxWidth: 200 }}
          value={period}
          onChange={(e: any) => setPeriod(e.target.value)}
        >
          <option value="2026-07">July 2026</option>
          <option value="2026-06">June 2026</option>
          <option value="2026-Q2">Q2 2026</option>
          <option value="2026-Q1">Q1 2026</option>
        </select>
      </div>
      {loading ? (
        <Spinner />
      ) : dashboard ? (
        <>
          <div className="ui-grid-4 ui-mb-4">
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Agents</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.totalAgents}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Cases Resolved</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.totalCasesResolved}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Chats Handled</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.totalChatsHandled}
                </p>
              </div>
            </Card>
            <Card>
              <div className="ui-card-body">
                <p className="ui-text-xs text-muted">Avg CSAT</p>
                <p className="ui-text-2xl ui-font-bold">
                  {dashboard.averageCsat.toFixed(2)}
                </p>
              </div>
            </Card>
          </div>
          <Card>
            <div className="ui-card-body p-0">
              <>{(() => {
                                        const columns = [
                                { key: "col_0", header: "Agent", render: (a: any) => (<><strong>{a.agentName}</strong></>) },
                                { key: "col_1", header: "Resolved", render: (a: any) => (<><Badge variant="success">{a.casesResolved}</Badge></>) },
                                { key: "col_2", header: "Avg Resolution (h)", render: (a: any) => (<>{a.avgResolutionHours.toFixed(1)}h</>) },
                                { key: "col_3", header: "CSAT", render: (a: any) => (<><Star size={12} /> {a.csatScore.toFixed(1)}</>) },
                                { key: "col_4", header: "First Response (min)", render: (a: any) => (<>{a.firstResponseMins.toFixed(0)}m</>) },
                                { key: "col_5", header: "SLA Breaches", render: (a: any) => (<>{a.slaBreachCount}</>) },
                                { key: "col_6", header: "Chats", render: (a: any) => (<>{a.chatsHandled}</>) },
                              ];
                                        return <DataTable columns={columns} data={dashboard.agents} rowKey={(a: any) => a.agentId} />;
                                      })()}</>
            </div>
          </Card>
        </>
      ) : (
        <p className="text-muted">No performance data for this period</p>
      )}
    </div>
  );
}
