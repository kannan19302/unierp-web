"use client";
import { PageHeader } from "@kannan19302/ui";
import { ListView, RouteGuard } from "@kannan19302/framework";
import { stockLevelResource } from "@/modules/inventory";

import { Package as InventoryModuleIcon } from "lucide-react";
export default function StockLevelsPage() {
  return (
    <RouteGuard permission="inventory.stock.read">
      <div className="ui-card">
        <PageHeader
          title="Warehouse Stock Levels"
          description="Monitor quantities on hand across company storage depots and warehouses."
        />
        <ListView resource={stockLevelResource} />
      </div>
    </RouteGuard>
  );
}
