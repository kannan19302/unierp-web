"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@kannan19302/ui";

export default function AnalyticsCustomDashboardsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analytics/dashboards");
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "calc(var(--space-12) * 5)",
        gap: "var(--space-3)",
      }}
    >
      <Spinner size="lg" />
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
        Redirecting to Curated Dashboards...
      </span>
    </div>
  );
}
