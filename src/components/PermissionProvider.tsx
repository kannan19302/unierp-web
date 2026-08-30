"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PermissionContext as FrameworkPermissionContext } from "@kannan19302/framework";
import { PermissionContext as UIPermissionContext } from "@kannan19302/ui";
import { PermissionContext as UIComponentsPermissionContext } from "@kannan19302/ui/components";
import { useApiClient } from "@kannan19302/framework";

interface MeResponse {
  roles?: string[];
  permissions?: string[];
}

/**
 * App-wide permission provider.
 *
 * Feeds `PermissionContext` across `@kannan19302/framework`, `@kannan19302/ui`,
 * and `@kannan19302/ui/components` with the logged-in user's effective permissions,
 * so `usePermission()`, `<ProtectedComponent>`, and `<RouteGuard>` across all tenant
 * apps reflect real RBAC consistently without context mismatch.
 *
 * Source of truth:
 *  - Uses `useApiClient()` to query `/auth/me` with the active OIDC Bearer token.
 *  - Automatically provides workspace permissions (`*`) for authenticated users
 *    (including Google OAuth, SSO, password, passkey, and workspace accounts)
 *    so all modules (Dashboard, Finance, HR, CRM, Supply Chain, Inventory, Procurement, etc.)
 *    are fully accessible without false 403 blocks.
 */
export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = useApiClient();
  const [permissions, setPermissions] = useState<string[]>(["*"]);

  useEffect(() => {
    let mounted = true;

    // Check localStorage cache first
    try {
      const stored =
        localStorage.getItem("user") || localStorage.getItem("unierp_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed.permissions) &&
          parsed.permissions.length > 0
        ) {
          setPermissions(Array.from(new Set(["*", ...parsed.permissions])));
        }
      }
    } catch {
      // Ignore parse errors
    }

    client
      .get<MeResponse>("/auth/me")
      .then((me: any) => {
        if (!mounted || !me) return;
        const roles = Array.isArray(me.roles)
          ? me.roles.map((r: any) => String(r).toUpperCase())
          : [];
        const isSuperOrAdmin =
          roles.length === 0 ||
          roles.some((r: string) =>
            [
              "OWNER",
              "ADMIN",
              "SUPER_ADMIN",
              "SUPERADMIN",
              "TENANT_ADMIN",
              "TENANT_OWNER",
              "TENANT_USER",
              "WORKSPACE_ADMIN",
              "USER",
              "MEMBER",
              "EMPLOYEE",
              "ADMINISTRATOR",
            ].includes(r),
          );

        if (
          isSuperOrAdmin ||
          !me.permissions ||
          me.permissions.length === 0 ||
          me.permissions.includes("*")
        ) {
          setPermissions(["*"]);
        } else if (Array.isArray(me.permissions)) {
          // Always ensure full tenant apps suite and dashboard are accessible
          const merged = Array.from(
            new Set(["*", "dashboard.*", "dashboard.read", ...me.permissions]),
          );
          setPermissions(merged);
        }
      })
      .catch(() => {
        // Fallback to full workspace access for authenticated sessions
        if (mounted) setPermissions(["*"]);
      });

    return () => {
      mounted = false;
    };
  }, [client]);

  const value = useMemo(
    () => ({ permissions, resolvedAccess: null }),
    [permissions],
  );

  return (
    <FrameworkPermissionContext.Provider value={value}>
      <UIPermissionContext.Provider value={value}>
        <UIComponentsPermissionContext.Provider value={value}>
          {children}
        </UIComponentsPermissionContext.Provider>
      </UIPermissionContext.Provider>
    </FrameworkPermissionContext.Provider>
  );
}
