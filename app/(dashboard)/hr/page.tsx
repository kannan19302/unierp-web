"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PageHeader } from "@kannan19302/ui";
import { Users } from "lucide-react";
import { FormView, ListView, RouteGuard } from "@kannan19302/framework";
import { employeeResource } from "@/modules/hr";

export default function HrPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="hr.employee.read">
      <div className="ui-card">
        <PageHeader
          title={
            <div className="flex items-center gap-2 text-[var(--chart-3)]">
              <div className="p-2 bg-[var(--color-surface)] rounded-lg">
                <Users size={20} />
              </div>
              <span className="text-[var(--color-text)]">Human Resources</span>
            </div>
          }
          description="Manage employee records, departments, employment types, and workforce status."
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Human Resources" },
          ]}
        />
        <ListView
          resource={employeeResource}
          onRowClick={(row: any) => router.push(`/hr/employees/${row.id}`)}
          onCreate={() => setShowCreate(true)}
        />
        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="Onboard Employee"
        >
          <FormView
            resource={employeeResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
