"use client";

import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { subscriptionResource } from "@/modules/super-admin";

export default function SubscriptionsPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="system.superadmin.access">
      <div className="ui-card">
        <PageHeader
          title="Tenant Subscriptions"
          description="Manage active subscriptions, upgrades, downgrades, proration, and win-back transitions."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Settings", href: "/settings" },
            { label: "Super Admin", href: "/settings/super-admin" },
            { label: "Subscriptions" },
          ]}
        />
        <ListView
          resource={subscriptionResource}
          onCreate={() => setShowCreate(true)}
        />
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create / Upgrade Subscription"
        >
          <FormView
            resource={subscriptionResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
