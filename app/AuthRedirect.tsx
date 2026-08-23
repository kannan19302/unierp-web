"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Auth redirect — checks if the user has an active session (via httpOnly
 * cookie) and redirects to the workspace. No localStorage is touched.
 *
 * If the session check fails, the OIDC provider's RequireSession guard
 * will handle redirecting to the hosted login page — we don't need to
 * manually clear localStorage tokens anymore.
 */
export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/v1/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) {
          router.push("/apps");
        }
        // If not ok, do nothing — the page will render its default content
        // and the user can navigate to login via normal UI paths.
      })
      .catch(() => {
        // Network error — leave the user on the current page
      });
  }, [router]);

  return null;
}
