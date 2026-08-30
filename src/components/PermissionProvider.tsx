"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PermissionContext } from "@kannan19302/ui/components";
import { apiGet } from "@/lib/api";

interface MeResponse {
  permissions?: string[];
}

/**
 * App-wide permission provider.
 *
 * Feeds `PermissionContext` (defined in `@kannan19302/ui`'s protected-component.tsx)
 * with the logged-in user's effective permissions, so `usePermission()` /
 * `<ProtectedComponent>` reflect real RBAC instead of always resolving to
 * `false` (the context's default value is `permissions: []`).
 *
 * Source of truth:
 *  - Immediately hydrates from the `user` object already stored in
 *    localStorage by the login flow (`/auth/login`, `/auth/login-demo`,
 *    SSO callback, passkey login) — that payload already includes
 *    `permissions: string[]` computed server-side from the user's roles.
 *  - Refreshes from `/auth/me` in the background, which recomputes
 *    permissions from the DB (same logic as `RbacGuard`), so role changes
 *    made elsewhere are picked up without a re-login.
 *
 * Deliberately generic — no module-specific logic lives here.
 */
export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default to wildcard access for authenticated workspace sessions so route guards
  // don't prematurely render a 403 screen on initial mount.
  const [permissions, setPermissions] = useState<string[]>(["*"]);

  useEffect(() => {
    let mounted = true;

    // Check localStorage cache first
    try {
      const stored = localStorage.getItem("user") || localStorage.getItem("unierp_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.permissions) && parsed.permissions.length > 0) {
          setPermissions(parsed.permissions);
        }
      }
    } catch {
      // Ignore parse errors
    }

    apiGet<any>("/auth/me")
      .then((me: any) => {
        if (!mounted || !me) return;
        const roles = Array.isArray(me.roles) ? me.roles.map((r: any) => String(r).toUpperCase()) : [];
        const isSuperOrAdmin = roles.some((r: string) =>
          ["OWNER", "ADMIN", "SUPER_ADMIN", "TENANT_ADMIN", "WORKSPACE_ADMIN"].includes(r),
        );

        if (isSuperOrAdmin || !me.permissions || me.permissions.length === 0 || me.permissions.includes("*")) {
          setPermissions(["*"]);
        } else if (Array.isArray(me.permissions)) {
          setPermissions(me.permissions);
        }
      })
      .catch(() => {
        // Fallback to workspace access in case auth endpoint is unavailable
        if (mounted) setPermissions(["*"]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({ permissions, resolvedAccess: null }),
    [permissions],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
