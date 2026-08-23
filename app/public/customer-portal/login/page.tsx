"use client";

import { useEffect } from "react";
import { useSession } from "@kannan19302/shared/auth-client/react";

/**
 * Customer portal login — now unified through the OIDC flow.
 *
 * Previously this page collected email/password directly and POSTed to
 * `/portal/auth/login`, completely bypassing the centralized IDP. That
 * meant no MFA, no rate limiting, no lockout, no SSO — a completely
 * separate security surface for tenant customers.
 *
 * Now: customer portal users authenticate through the same OIDC flow as
 * every other platform. Once authenticated, the customer portal pages
 * check the user's role/permissions to show the customer-facing views.
 * The `/portal/auth/login` endpoint is retired.
 */
export default function CustomerPortalLoginPage() {
  const { status, signIn } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      void signIn({ returnTo: "/public/customer-portal/dashboard" });
    }
  }, [status, signIn]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p>Redirecting to sign-in…</p>
    </div>
  );
}
