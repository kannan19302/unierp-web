"use client";

import { FrameworkProvider } from "@kannan19302/framework";
import type { ReactNode } from "react";
import { registeredModules } from "@/modules";
import { useSession } from "@kannan19302/shared/auth-client/react";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

/**
 * Provides the authenticated API context to the framework.
 *
 * Previously read the access token from `localStorage.getItem("token")`
 * and tenant info from `localStorage.getItem("user")`. Both are now
 * sourced from the OIDC session context — the in-memory token from
 * `useSession()` and the tenantId from the token's claims.
 */
export function AppFrameworkProvider({ children }: { children: ReactNode }) {
  const { getAccessToken, claims } = useSession();

  return (
    <FrameworkProvider
      api={{
        baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
        getToken: () => getAccessToken(),
        getCsrfToken: () => readCookie("csrf_token"),
        getTenantId: () => claims?.tenantId ?? null,
      }}
      modules={registeredModules}
    >
      {children}
    </FrameworkProvider>
  );
}
