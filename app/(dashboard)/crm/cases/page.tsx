"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader } from "@kannan19302/ui";
import { ListView, FormView, RouteGuard } from "@kannan19302/framework";
import { caseResource } from "@/modules/crm";

export default function CasesPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="crm.cases.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Cases"
          description="Track customer support and operations cases"
        />

        <ListView
          resource={caseResource}
          onRowClick={(row: any) => router.push(`/crm/cases/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />

        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New Case"
        >
          <FormView
            resource={caseResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
