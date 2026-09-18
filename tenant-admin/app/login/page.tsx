"use client";

import { useEffect } from "react";
import { useSession } from "@kannan19302/shared/auth-client/react";

/**
 * This app's own login form is retired.
 *
 * Before W6, this page collected a password directly (or, on marketplace,
 * faked doing so with a setTimeout) and posted it somewhere this app's own
 * code controlled. Credentials are now entered exactly once, at the OIDC
 * issuer's hosted login page (idp/src/modules/oidc/controllers/login.controller.ts)
 * — the whole reason that page exists is so ten platforms don't each need
 * their own password-handling, MFA and lockout logic to get right
 * independently, which is exactly what let one of them (the provider console)
 * ship a login-bypass server action before W0 found it.
 *
 * This route stays only so an old bookmark or link still goes somewhere
 * useful: straight into the real sign-in flow.
 */
export default function LoginPage() {
  const { status, signIn } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      void signIn({ returnTo: "/" });
    } else if (status === "authenticated") {
      window.location.assign("/");
    }
  }, [status, signIn]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <p>Redirecting to sign-in…</p>
    </div>
  );
}
