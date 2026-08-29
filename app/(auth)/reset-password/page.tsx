"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { oidcConfig } from "@/lib/oidc-config";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  useEffect(() => {
    const issuer = oidcConfig.issuer || "http://localhost:3005";
    const returnTo = encodeURIComponent(window.location.origin + "/");
    const target = token
      ? `${issuer}/oidc/reset-password?token=${encodeURIComponent(token)}&return_to=${returnTo}`
      : `${issuer}/oidc/forgot-password?return_to=${returnTo}`;
    window.location.assign(target);
  }, [token]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--color-bg-base)", color: "var(--color-text-secondary)", fontFamily: "system-ui, sans-serif" }}>
      <p>Redirecting to password recovery…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
