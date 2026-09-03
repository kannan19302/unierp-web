"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@kannan19302/ui";

/**
 * @deprecated RFC 9745 Deprecation Notice:
 * The standalone `/dashboard` application has been decommissioned and consolidated
 * into the canonical `/analytics` workspace (Executive Cockpit, Personal Workspace,
 * Operations Pulse, and Business Intelligence).
 *
 * All inbound traffic and deep links are automatically forwarded to `/analytics`.
 */
function DashboardRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString();
    const destination = qs ? `/analytics?${qs}` : "/analytics";
    router.replace(destination);
  }, [router, searchParams]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "var(--space-3)",
        color: "var(--color-text-secondary)",
      }}
    >
      <Spinner size="lg" />
      <span className="ui-text-sm">Redirecting to Analytics Cockpit…</span>
    </div>
  );
}

export default function DeprecatedDashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "50vh",
          }}
        >
          <Spinner size="lg" />
        </div>
      }
    >
      <DashboardRedirect />
    </Suspense>
  );
}
