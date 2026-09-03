"use client";

import { PageHeader } from "@kannan19302/ui";
import { ListView, RouteGuard } from "@kannan19302/framework";
import { financeAuditResource } from "@/modules/finance-audit";

export default function FinanceAuditTrailPage() {
  return (
    <RouteGuard permission="finance.audit.read">
      <div className="ui-card">
        <PageHeader
          title="Finance Audit Trail"
          description="Track changes to financial records for compliance and auditing."
        />
        <ListView resource={financeAuditResource} />
      </div>
    </RouteGuard>
  );
}
