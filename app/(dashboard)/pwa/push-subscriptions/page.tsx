"use client";
import React, { useState, useEffect } from "react";
import { Card, DataTable, Badge, Spinner, type Column } from "@kannan19302/ui";
import { Trash2 } from "lucide-react";

interface PushSub {
  id: string;
  userId: string;
  endpoint: string;
  deviceType?: string;
  browser?: string;
  platform?: string;
  status: string;
  tags: string[];
  createdAt: string;
}

export default function PushSubscriptionsPage() {
  const [items, setItems] = useState<PushSub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/pwa/push-subscriptions")
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

  const columns: Column<PushSub>[] = [
    { key: "userId", header: "User" },
    { key: "deviceType", header: "Device", render: (r: any) => r.deviceType || "-" },
    { key: "browser", header: "Browser", render: (r: any) => r.browser || "-" },
    { key: "platform", header: "Platform", render: (r: any) => r.platform || "-" },
    {
      key: "status",
      header: "Status",
      render: (r: any) => (
        <Badge variant={r.status === "ACTIVE" ? "success" : "danger"}>
          {r.status}
        </Badge>
      ),
    },
    { key: "tags", header: "Tags", render: (r: any) => r.tags?.join(", ") || "-" },
    {
      key: "actions",
      header: "Actions",
      render: (r: any) => (
        <button
          onClick={(e: any) => {
            e.stopPropagation();
          }}
          className="ui-btn-icon"
        >
          <Trash2 size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1>Push Subscriptions</h1>
      </div>
      <Card>
        <DataTable columns={columns} data={items} />
      </Card>
    </div>
  );
}
