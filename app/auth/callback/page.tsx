"use client";

import { useEffect, useRef, useState } from "react";
import { createOidcClient } from "@/lib/oidc-config";
import { Spinner } from "@kannan19302/ui";

/**
 * The OIDC callback for unierp-tenant-apps. Same pattern as the Global Platform
 * Wizard (W4): completes the code exchange, hands the refresh token to the
 * server-side session route, and resumes whatever deep link started the flow.
 */
export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const client = createOidcClient();
        const { tokens, returnTo } = await client.handleCallback(window.location.href);

        if (tokens.refreshToken) {
          await fetch("/api/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
            credentials: "include",
          });
        }

        window.location.assign(returnTo || "/apps");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      }
    })();
  }, []);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 16,
        }}
        suppressHydrationWarning
      >
        <p style={{ color: "var(--color-text-danger, #ef4444)" }}>Sign-in failed: {error}</p>
        <button
          onClick={() => window.location.assign("/")}
          style={{
            padding: "8px 16px",
            borderRadius: "6px",
            background: "var(--color-primary, #6366f1)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: 12,
        background: "var(--color-bg-sunken, #f9fafb)",
      }}
      suppressHydrationWarning
    >
      <Spinner size="lg" />
      <p style={{ color: "var(--color-text-secondary, #6b7280)", fontSize: "0.9375rem" }}>
        Completing sign-in…
      </p>
    </div>
  );
}
