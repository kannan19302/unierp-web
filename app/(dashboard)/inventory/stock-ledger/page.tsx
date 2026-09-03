"use client";
import { PageHeader } from "@kannan19302/ui";
import { ListView, RouteGuard } from "@kannan19302/framework";
import { stockLedgerResource } from "@/modules/inventory";

import { Package as InventoryModuleIcon } from "lucide-react";
export default function StockLedgerPage() {
  return (
    <RouteGuard permission="inventory.stock.read">
      <div className="ui-card">
        <PageHeader
          title="Stock Ledger"
          description="Review inventory movements, valuation changes, and running balances."
        />
        <ListView resource={stockLedgerResource} />
      </div>
    </RouteGuard>
  );
}
