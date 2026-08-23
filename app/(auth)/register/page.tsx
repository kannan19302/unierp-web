"use client";

import { useEffect } from "react";
import { oidcConfig } from "@/lib/oidc-config";

/**
 * Tenant apps registration is centralized at the OIDC Issuer.
 * Redirects users to the hosted organization registration portal.
 */
export default function RegisterPage() {
  useEffect(() => {
    const issuer = oidcConfig.issuer || "http://localhost:3005";
    const returnTo = encodeURIComponent(window.location.origin + "/");
    window.location.assign(`${issuer}/oidc/register?return_to=${returnTo}`);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#090d16", color: "#94a3b8", fontFamily: "system-ui, sans-serif" }}>
      <p>Redirecting to organization registration…</p>
    </div>
  );
}
