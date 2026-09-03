"use client";
import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { batchResource } from "@/modules/inventory";

import { Package as InventoryModuleIcon } from "lucide-react";
export default function BatchesPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="inventory.stock.read">
      <div className="ui-card">
        <PageHeader
          title="Batch Tracking"
          description="Manage product batches, lot numbers, expiry dates, and usage status."
        />
        <ListView
          resource={batchResource}
          onCreate={() => setShowCreate(true)}
        />
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create Batch"
        >
          <FormView
            resource={batchResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
