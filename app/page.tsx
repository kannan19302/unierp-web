"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@kannan19302/ui";

/**
 * Smart Root Dispatcher for UniERP Enterprise Home.
 *
 * Dispatches authenticated sessions based on intent and lifecycle:
 * 1. welcome=true -> /setup (Guided Setup)
 * 2. next=<safe-path> -> resumes permitted protected deep link
 * 3. Default -> /home (All-in-One Daily Action Workspace)
 */
function RootDispatcher() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const isWelcome = searchParams.get("welcome") === "true";
    const next = searchParams.get("next");

    if (isWelcome) {
      router.replace("/setup");
    } else if (next && next.startsWith("/") && !next.startsWith("//")) {
      router.replace(next);
    } else {
      router.replace("/home");
    }
  }, [router, searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-sunken)",
      }}
    >
      <Spinner size="lg" />
      <span className="sr-only">Opening UniERP Home…</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-bg-sunken)",
          }}
        >
          <Spinner size="lg" />
        </div>
      }
    >
      <RootDispatcher />
    </Suspense>
  );
}
