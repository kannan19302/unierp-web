"use client";

import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { planResource } from "@/modules/super-admin";

export default function PlansPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="system.superadmin.access">
      <div className="ui-card">
        <PageHeader
          title="SaaS Plans"
          description="Manage subscription plans, packaging, and versioned price books."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Settings", href: "/settings" },
            { label: "Super Admin", href: "/settings/super-admin" },
            { label: "Plans" },
          ]}
        />
        <ListView
          resource={planResource}
          onCreate={() => setShowCreate(true)}
        />
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Define Plan"
        >
          <FormView
            resource={planResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
