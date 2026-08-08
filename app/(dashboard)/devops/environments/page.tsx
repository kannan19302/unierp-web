"use client";
import React, { useState, useEffect } from "react";
import { Card, DataTable, Badge, Spinner, Button, type Column } from "@kannan19302/ui";
import { Plus, Eye, Activity } from "lucide-react";

interface Environment {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  baseUrl?: string;
  region?: string;
  healthStatus?: string;
  lastDeployAt?: string;
}

export default function EnvironmentsPage() {
  const [items, setItems] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/devops/environments")
      .then((r: any) => r.json())
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    );

  const columns: Column<Environment>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "slug", header: "Slug" },
    {
      key: "type",
      header: "Type",
      render: (r: any) => (
        <Badge variant={r.type === "PRODUCTION" ? "danger" : "info"}>
          {r.type}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "warning"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "healthStatus",
      header: "Health",
      render: (r: any) =>
        r.healthStatus ? (
          <Badge variant={r.healthStatus === "HEALTHY" ? "success" : "danger"}>
            {r.healthStatus}
          </Badge>
        ) : (
          "-"
        ),
    },
    { key: "region", header: "Region", render: (r: any) => r.region || "-" },
    {
      key: "id",
      header: "Actions",
      render: (r: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e: any) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e: any) => {
              e.stopPropagation();
            }}
            className="ui-btn-icon"
          >
            <Activity size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Environments</h1>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Create Environment
        </Button>
      </div>
      <Card>
        <DataTable columns={columns} data={items} />
      </Card>
    </div>
  );
}
