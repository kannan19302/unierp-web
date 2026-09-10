import React from "react";
import { FinanceShellV2 } from "@/components/shell/FinanceShellV2";
import { FinanceScopeProvider } from "@/components/shell/FinanceScopeContext";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-density="ultra-compact">
      <FinanceScopeProvider>
        <FinanceShellV2>{children}</FinanceShellV2>
      </FinanceScopeProvider>
    </div>
  );
}
