"use client";

import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { ListView, FormView, RouteGuard } from "@kannan19302/framework";
import { paymentTermResource } from "@/modules/finance";

export default function PaymentTermsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.paymentterm.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Payment Terms"
          description="Configure payment schedules, due day intervals, and early payment discounts"
        />

        <ListView
          resource={paymentTermResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New Payment Term"
        >
          <FormView
            resource={paymentTermResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
