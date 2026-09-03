"use client";
import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { listingResource } from "@/modules/ecommerce";

export default function ProductListingsPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <RouteGuard permission="ecommerce.listing.read">
      <div className="ui-card">
        <PageHeader
          title="Product Listings"
          description="Publish inventory products to the storefront with pricing and category controls."
        />
        <ListView
          resource={listingResource}
          onCreate={() => setShowCreate(true)}
        />
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New Product Listing"
        >
          <FormView
            resource={listingResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
