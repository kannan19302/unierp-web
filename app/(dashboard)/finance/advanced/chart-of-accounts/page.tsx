"use client";

import { useState } from "react";
import { Modal, PageHeader } from "@kannan19302/ui";
import { ListView, FormView, RouteGuard } from "@kannan19302/framework";
import { accountResource } from "@/modules/finance";

export default function ChartOfAccountsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <RouteGuard permission="finance.account.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Chart of Accounts"
          description="Manage general ledger accounts, hierarchy, and financial categories"
        />

        <ListView
          resource={accountResource}
          onCreate={() => setShowCreate(true)}
        />

        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New Account"
        >
          <FormView
            resource={accountResource}
            onSuccess={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
