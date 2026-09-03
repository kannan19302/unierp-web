"use client";

import { useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";
import ExpenseManagementPage from "../advanced/expense-reports/page";
import ExpensePoliciesPage from "../advanced/expense-policies/page";

const EXPENSES_TABS: SubTab[] = [
  {
    id: "reports",
    label: "Expense Reports",
    href: "/finance/expenses",
    icon: Receipt,
  },
  {
    id: "policies",
    label: "Policies & Rates",
    href: "/finance/expenses?tab=policies",
    icon: Receipt,
  },
];

export default function FinanceExpensesPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "reports";

  return (
    <div className="ui-stack-6">
      <SubTabBar tabs={EXPENSES_TABS} />
      {activeTab === "policies" ? (
        <ExpensePoliciesPage />
      ) : (
        <ExpenseManagementPage />
      )}
    </div>
  );
}
