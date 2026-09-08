import React from "react";
import { FinanceShellV2 } from "@/components/shell/FinanceShellV2";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-density="ultra-compact">
      <FinanceShellV2>{children}</FinanceShellV2>
    </div>
  );
}
