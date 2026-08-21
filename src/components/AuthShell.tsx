"use client";

import { UniErpAuthProvider, RequireSession } from "@kannan19302/shared/auth-client/react";
import { oidcConfig } from "@/lib/oidc-config";
import type { TokenSet } from "@kannan19302/shared/auth-client";

/**
 * Client-side auth boundary — same reasoning as every other platform's
 * AuthShell.tsx (see marketplace's, the first one written): kept out of the
 * root layout so `app/layout.tsx` can stay a server component with its
 * `metadata` export intact.
 *
 * tenant-apps carries plane-2 admin routes that middleware.ts already
 * boundary-checks by decoding (not verifying) the auth_token cookie — this
 * provider does not replace that check, it replaces the LOGIN mechanism and
 * the localStorage-based token storage that check's own cookie previously
 * came from. See middleware.ts's own comment for that boundary's scope.
 */
async function restoreSession(): Promise<TokenSet | null> {
  const res = await fetch("/api/session", { credentials: "include" });
  if (!res.ok) return null;
  const body = await res.json();
  return {
    accessToken: body.accessToken,
    idToken: body.idToken,
    expiresAt: body.expiresAt,
    scope: body.scope,
  };
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <UniErpAuthProvider
      config={oidcConfig}
      restoreSession={restoreSession}
      defaultPostLogoutRedirectUri="http://localhost:4000/"
    >
      <RequireSession>{children}</RequireSession>
    </UniErpAuthProvider>
  );
}
