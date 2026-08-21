"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@kannan19302/ui";

/**
 * P3's root sends every signed-in user to the Application Wizard.
 *
 * This page used to do two jobs: redirect authenticated users to `/apps`, and —
 * for anyone without a session — render the tenant's PUBLIC website through
 * `PublicPageRenderer`. That second job is why the platform's most sensitive
 * app was also its anonymous web host. It has moved to P4
 * (`tenant-sites`, :4004), which is the platform the register calls "Tenant
 * Websites" and which requires no sign-in by design.
 *
 * What is left is one job. There is no unauthenticated branch: the root layout
 * wraps this tree in `<RequireSession>`, so an anonymous visitor never reaches
 * this component — they are sent to the IdP. Keeping a "logged out" render path
 * here would be dead code that looks like a security boundary.
 *
 * `/apps` is the Application Wizard: every module installed for this tenant and
 * permitted for this user, sourced from `GET /saas/installed-apps`. Extensions,
 * plugins, third-party apps and anything built in the Developer Platform appear
 * there as tiles, and nowhere else — one landing surface, not several.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/apps");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-sunken)",
      }}
    >
      <Spinner size="lg" />
      <span className="sr-only">Opening your applications…</span>
    </div>
  );
}
