"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader } from "@kannan19302/ui";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { invoiceResource } from "@/modules/finance";

export default function InvoicesPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.invoice.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Invoices"
          description="Create, issue, and track customer invoices"
        />
        <ListView
          resource={invoiceResource}
          onRowClick={(row: { id: string }) => router.push(`/finance/invoices/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New invoice">
          <FormView
            resource={invoiceResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
