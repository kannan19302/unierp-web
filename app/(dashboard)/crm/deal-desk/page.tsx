"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast, Button, DataTable } from "@kannan19302/ui";
import {
  ClipboardList,
  AlertTriangle,
  Settings,
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { apiGet } from "../_components/api";

export default function DealDeskPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      const data = await apiGet<any>("/crm/deal-desk/dashboard");
      setDashboard(data);
    } catch (err) {
      toast.error(
        "Could not load deal desk dashboard",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  const stats = dashboard?.stats || {};

  return (
    <div className="ui-page">
      <PageHeader
        title="Deal Desk"
        description="Manage deal approvals, special pricing, discount requests, and deal alerts"
      />

      <div className="ui-card-grid ui-grid-5">
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <ClipboardList size={24} />
          </div>
          <div className="ui-stat-value">{stats.pending || 0}</div>
          <div className="ui-stat-label">Pending</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="ui-stat-value">{stats.urgent || 0}</div>
          <div className="ui-stat-label">Urgent</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="ui-stat-value">{stats.approved || 0}</div>
          <div className="ui-stat-label">Approved</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <XCircle size={24} />
          </div>
          <div className="ui-stat-value">{stats.rejected || 0}</div>
          <div className="ui-stat-label">Rejected</div>
        </Card>
        <Card className="ui-stat-card">
          <div className="ui-stat-icon">
            <Clock size={24} />
          </div>
          <div className="ui-stat-value">{stats.avgResponseHours || 0}h</div>
          <div className="ui-stat-label">Avg Response</div>
        </Card>
      </div>

      <div className="ui-grid-2">
        <Card title="Open Requests">
          <div className="ui-table-wrapper">
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Type" , render: (r: any) => (<>{r.requestType}</>) },
                        { key: "col_1", header: "Status" , render: (r: any) => (<><Badge
                                              variant={r.status === "PENDING" ? "warning" : "info"}
                                            >
                                              {r.status}
                                            </Badge></>) },
                        { key: "col_2", header: "Priority" , render: (r: any) => (<><Badge
                                              variant={
                                                r.priority === "URGENT"
                                                  ? "danger"
                                                  : r.priority === "HIGH"
                                                    ? "warning"
                                                    : "default"
                                              }
                                            >
                                              {r.priority}
                                            </Badge></>) },
                        { key: "col_3", header: "Created" , render: (r: any) => (<>{new Date(r.createdAt).toLocaleDateString()}</>) },
                      ];
                              return <DataTable columns={columns} data={dashboard?.openRequests} rowKey={(r: any) => r.id} />;
                          })()}</>
          </div>
          <div className="ui-card-actions">
            <Button
              variant="primary"
              onClick={() => (window.location.href = "/crm/deal-desk/requests")}
            >
              View All Requests
            </Button>
          </div>
        </Card>

        <Card title="Recent Activity">
          <div className="ui-table-wrapper">
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Opportunity" , render: (r: any) => (<>{r.opportunityName || "N/A"}</>) },
                        { key: "col_1", header: "Type" , render: (r: any) => (<>{r.requestType}</>) },
                        { key: "col_2", header: "Status" , render: (r: any) => (<><Badge
                                              variant={
                                                r.status === "APPROVED"
                                                  ? "success"
                                                  : r.status === "REJECTED"
                                                    ? "danger"
                                                    : "warning"
                                              }
                                            >
                                              {r.status}
                                            </Badge></>) },
                        { key: "col_3", header: "Updated" , render: (r: any) => (<>{new Date(r.updatedAt).toLocaleDateString()}</>) },
                      ];
                              return <DataTable columns={columns} data={dashboard?.recentActivity} rowKey={(r: any) => r.id} />;
                          })()}</>
          </div>
        </Card>
      </div>

      <div className="ui-card-grid ui-grid-3">
        <Card className="ui-card-action">
          <Button
            variant="primary"
            className="ui-w-full"
            onClick={() => (window.location.href = "/crm/deal-desk/requests")}
          >
            <ClipboardList size={16} /> Deal Desk Requests
          </Button>
        </Card>
        <Card className="ui-card-action">
          <Button
            variant="secondary"
            className="ui-w-full"
            onClick={() => (window.location.href = "/crm/deal-desk/alerts")}
          >
            <AlertTriangle size={16} /> Deal Alerts
          </Button>
        </Card>
        <Card className="ui-card-action">
          <Button
            variant="secondary"
            className="ui-w-full"
            onClick={() => (window.location.href = "/crm/deal-desk/automation")}
          >
            <Settings size={16} /> Automation Rules
          </Button>
        </Card>
      </div>
    </div>
  );
}
