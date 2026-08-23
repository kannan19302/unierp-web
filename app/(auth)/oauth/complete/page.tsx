"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@kannan19302/ui";

/**
 * Landing pad after the legacy OAuth callback.
 *
 * With the unified OIDC flow (W6), the primary sign-in path is
 * /auth/callback which handles the PKCE code exchange via the shared
 * OidcClient. This page exists only for backward compatibility with
 * the social-login OAuth callback (`oauth.controller.ts`), which sets
 * httpOnly session cookies directly — no localStorage is needed.
 *
 * Previously this page wrote the token to localStorage, which is the
 * exact XSS exposure the shared auth-client was designed to prevent.
 * The httpOnly cookie set by the OAuth callback is already enough for
 * the API to authenticate requests.
 */
export default function OAuthCompletePage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // The OAuth callback has already set the httpOnly auth_token and
    // refresh_token cookies. Verify the session is valid by calling /me,
    // then redirect to the workspace. No token is written to localStorage.
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`session check failed (${res.status})`);
        router.replace("/apps");
      })
      .catch(() => {
        setFailed(true);
        setTimeout(
          () =>
            router.replace(
              `/login?error=${encodeURIComponent("Sign-in could not be completed. Please try again.")}`,
            ),
          1500,
        );
      });
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 16,
      }}
    >
      <Spinner size="lg" />
      <p style={{ color: "var(--color-text-muted)" }}>
        {failed
          ? "Sign-in failed — returning to login…"
          : "Completing sign-in…"}
      </p>
    </div>
  );
}
