"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { oidcConfig } from "@/lib/oidc-config";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    const issuer = oidcConfig.issuer || "http://localhost:3005";
    const returnTo = encodeURIComponent(window.location.origin + "/");
    const target = token
      ? `${issuer}/oidc/verify-email?token=${encodeURIComponent(token)}&return_to=${returnTo}`
      : `${issuer}/oidc/verify-email?return_to=${returnTo}`;
    window.location.assign(target);
  }, [token]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--color-bg-base)", color: "var(--color-text-secondary)", fontFamily: "system-ui, sans-serif" }}>
      <p>Redirecting to email verification…</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
