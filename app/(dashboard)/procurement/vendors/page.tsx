"use client";

import { PageHeader } from "@kannan19302/ui";
import { ListView, RouteGuard } from "@kannan19302/framework";
import { vendorResource } from "@/modules/crm";

export default function ProcurementVendorsPage() {
  return (
    <RouteGuard permission="crm.vendor.read">
      <div className="ui-card">
        <PageHeader
          title="Procurement Vendors"
          description="Review the shared vendor master used by purchasing and supplier operations."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Procurement", href: "/procurement" },
            { label: "Vendors" },
          ]}
        />
        <ListView resource={vendorResource} />
      </div>
    </RouteGuard>
  );
}
