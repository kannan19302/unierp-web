"use client";

import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@kannan19302/ui";
import { FormView, RouteGuard } from "@kannan19302/framework";
import { journalResource } from "@/modules/finance";

export default function NewJournalEntryPage() {
  const router = useRouter();

  return (
    <RouteGuard permission="finance.journal.create">
      <div className="ui-stack-6">
        <PageHeader
          title="New Journal Entry"
          description="Record and post financial transactions to general ledger accounts"
        />
        <Card className="p-6">
          <FormView
            resource={journalResource}
            onSuccess={() => router.push("/finance/advanced/journal-entries")}
            onCancel={() => router.push("/finance/advanced/journal-entries")}
          />
        </Card>
      </div>
    </RouteGuard>
  );
}
