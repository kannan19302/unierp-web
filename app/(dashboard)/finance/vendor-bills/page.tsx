"use client";

import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { vendorBillResource } from "@/modules/finance";

export default function VendorBillsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.payables.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Vendor bills"
          description="Capture, review, approve, and pay supplier bills"
        />
        <ListView resource={vendorBillResource} onCreate={() => setShowCreate(true)} />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New vendor bill">
          <FormView
            resource={vendorBillResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
