"use client";
import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { cycleCountScheduleResource } from "@/modules/inventory";

import { Package as InventoryModuleIcon } from "lucide-react";
export default function CycleCountSchedulesPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="inventory.stock.read">
      <div className="ui-card">
        <PageHeader
          title="Cycle Count Schedules"
          description="Schedule recurring blind or guided counts by warehouse zone and bin scope."
        />
        <ListView
          resource={cycleCountScheduleResource}
          onCreate={() => setShowCreate(true)}
        />
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Create Cycle Count Schedule"
        >
          <FormView
            resource={cycleCountScheduleResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
