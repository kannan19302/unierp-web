"use client";

import React, { useState, useEffect } from "react";
import { DataTable, Card, PageHeader, Spinner, Badge, useToast, Button, Input } from "@kannan19302/ui";
import {
  ClipboardList,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUp,
} from "lucide-react";
import { apiGet } from "../../_components/api";

export default function DealDeskRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const toast = useToast();

  const loadData = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiGet<any>(`/crm/deal-desk/requests?${params}`);
      setRequests(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(
        "Could not load requests",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Deal Desk Requests"
        description="View and manage discount, special terms, and pricing requests"
        breadcrumbs={[
          { label: "Deal Desk", href: "/crm/deal-desk" },
          { label: "Requests" },
        ]}
      />

      <Card>
        <div className="ui-form-row">
          <div className="ui-form-group">
            <label className="ui-label">Filter by Status</label>
            <select
              className="ui-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="MORE_INFO">More Info Needed</option>
            </select>
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Total: {total} requests</label>
          </div>
        </div>
      </Card>

      <Card>
        <div className="ui-table-wrapper">
          <DataTable
            columns={[
              {
                key: "opportunity",
                header: "Opportunity",
                render: (r: any) => (
                  <div
                    className="ui-text-link"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      (window.location.href = `/crm/deal-desk/requests/${r.id}`)
                    }
                  >
                    {r.opportunity?.name || "N/A"}
                  </div>
                )
              },
              {
                key: "type",
                header: "Type",
                render: (r: any) => (
                  <Badge variant="info">{r.requestType}</Badge>
                )
              },
              {
                key: "amount",
                header: "Amount",
                render: (r: any) => (
                  <>${Number(r.opportunity?.amount || 0).toLocaleString()}</>
                )
              },
              {
                key: "discount",
                header: "Discount",
                render: (r: any) => (
                  <>{r.discountRequest ? `${r.discountRequest}%` : "-"}</>
                )
              },
              {
                key: "priority",
                header: "Priority",
                render: (r: any) => (
                  <Badge
                    variant={
                      r.priority === "URGENT"
                        ? "danger"
                        : r.priority === "HIGH"
                          ? "warning"
                          : "default"
                    }
                  >
                    {r.priority}
                  </Badge>
                )
              },
              {
                key: "status",
                header: "Status",
                render: (r: any) => (
                  <Badge
                    variant={
                      r.status === "APPROVED"
                        ? "success"
                        : r.status === "REJECTED"
                          ? "danger"
                          : r.status === "PENDING"
                            ? "warning"
                            : "info"
                    }
                  >
                    {r.status}
                  </Badge>
                )
              },
              {
                key: "created",
                header: "Created",
                render: (r: any) => (
                  <>{new Date(r.createdAt).toLocaleDateString()}</>
                )
              },
              {
                key: "actions",
                header: "Actions",
                render: (r: any) => (
                  <div className="ui-action-cell">
                    <Button
                      variant="ghost"
                      onClick={() =>
                        (window.location.href = `/crm/deal-desk/requests/${r.id}`)
                      }
                    >
                      View
                    </Button>
                  </div>
                )
              }
            ]}
            data={requests}
            rowKey={(r: any) => String(r.id)}
          />
        </div>
        {total > 50 && (
          <div className="ui-pagination">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {Math.ceil(total / 50)}
            </span>
            <Button
              variant="secondary"
              disabled={page >= Math.ceil(total / 50)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
