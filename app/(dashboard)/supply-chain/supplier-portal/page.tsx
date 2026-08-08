"use client";

import React, { useState, useEffect } from "react";
import { PageHeader, Card, Button, Badge, DataTable, type Column, Spinner, StatusBadge } from "@kannan19302/ui";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";
import { Users, Send, BarChart3 } from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

const SUB_TABS: SubTab[] = [
  {
    id: "users",
    label: "Portal Users",
    href: "/supply-chain/supplier-portal?tab=users",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/supply-chain/supplier-portal?tab=dashboard",
  },
];

export default function SupplierPortalPage() {
  const client = useApiClient();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const activeTab = searchParams.get("tab") || "users";

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get<any>("/supply-chain/supplier-portal/users")
      .then((res: any) => setUsers(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<any>[] = [
    {
      key: "email",
      header: "Email",
      render: (r: any) => <span className="ui-link">{r.email}</span>,
    },
    {
      key: "portalAccessLevel",
      header: "Access Level",
      render: (r: any) => <Badge variant="info">{r.portalAccessLevel}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (r: any) => <StatusBadge status={r.status} />,
    },
  ];

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <RouteGuard permission="supply-chain.supplier-portal.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Supplier Collaboration Portal"
          description="Supplier onboarding, document exchange, PO collaboration"
          breadcrumbs={[
            { label: "Supply Chain", href: "/supply-chain" },
            { label: "Supplier Portal" },
          ]}
        />

        <SubTabBar tabs={SUB_TABS} />

        {activeTab === "users" && (
          <Card padding="none">
            <DataTable
              columns={columns}
              data={users}
              loading={loading}
              rowKey={(r: any) => r.id}
              emptyTitle="No portal users"
              emptyMessage="Invite your first supplier to the portal."
              emptyIcon={<Users size={48} />}
            />
          </Card>
        )}

        {activeTab === "dashboard" && (
          <Card padding="md">
            <p className="ui-text-tertiary">
              Supplier portal onboarding status, active collaborations, and
              document exchange logs.
            </p>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
