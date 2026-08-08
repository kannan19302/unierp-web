"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, DataTable, useToast } from "@kannan19302/ui";
import { RouteGuard } from "@kannan19302/framework";
import { Monitor, XCircle } from "lucide-react";
import type { Column } from "@kannan19302/ui";

interface Session {
  id: string;
  device: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  startedAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

export default function SessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const res = await fetch("/api/v1/auth/sessions");
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (id: string) => {
    const res = await fetch(`/api/v1/auth/sessions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast({ title: "Session revoked", variant: "success" });
      await fetchSessions();
    } else toast({ title: "Failed to revoke session", variant: "error" });
  };

  const columns: Column<Session>[] = [
    {
      key: "device",
      header: "Device",
      render: (r: any) => (
        <span className="ui-flex-row ui-gap-2 u-items-center">
          <Monitor size={14} />
          {r.device ?? "Unknown"}
        </span>
      ),
    },
    { key: "browser", header: "Browser", render: (r: any) => r.browser ?? "-" },
    {
      key: "ipAddress",
      header: "IP Address",
      render: (r: any) => r.ipAddress ?? "-",
    },
    { key: "location", header: "Location", render: (r: any) => r.location ?? "-" },
    {
      key: "startedAt",
      header: "Started",
      render: (r: any) => new Date(r.startedAt).toLocaleString(),
    },
    {
      key: "lastActivityAt",
      header: "Last Active",
      render: (r: any) => new Date(r.lastActivityAt).toLocaleString(),
    },
    {
      key: "isCurrent",
      header: "",
      render: (r: any) =>
        r.isCurrent ? (
          <span className="ui-badge ui-badge-info">Current</span>
        ) : null,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r: any) =>
        r.isCurrent ? null : (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<XCircle size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              handleRevoke(r.id);
            }}
          >
            Revoke
          </Button>
        ),
    },
  ];

  return (
    <RouteGuard permission="auth.session.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Active Sessions"
          description="Manage your active login sessions across devices."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Auth", href: "/auth" },
            { label: "Sessions" },
          ]}
        />
        <DataTable columns={columns} data={sessions} loading={loading} />
      </div>
    </RouteGuard>
  );
}
