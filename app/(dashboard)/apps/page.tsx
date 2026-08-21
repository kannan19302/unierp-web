"use client";

import { useEffect, useMemo, useState } from "react";
import { AppWizardGrid, type WizardTile } from "@kannan19302/ui/shell";
import { useApiClient } from "@kannan19302/framework";
import { allApplications, KERNEL_APP_IDS } from "@/navigation";

/**
 * The tenant Application Wizard — promoted to a first-class page per the
 * plan's "Two wizards, strictly separated" design: this lists only modules
 * installed for THIS tenant and permitted for this user, sourced from
 * `GET /saas/installed-apps`. It never lists platforms — that's the Global
 * Platform Wizard's job (infra/platform-wizard, port 4000), a different app
 * entirely.
 *
 * Reuses `allApplications` (src/navigation/registry.tsx) for presentation —
 * name, icon, href — the same source the sidebar `AppSwitcher` already
 * renders from, so the wizard and the switcher can never show a different
 * app list from each other. Only the entitlement check (which apps are
 * actually shown) is server-derived, matching exactly what
 * `app/(dashboard)/layout.tsx`'s own `activeApps` filter already does.
 */
export default function ApplicationWizardPage() {
  const client = useApiClient();
  const [installedApps, setInstalledApps] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    client
      .get<string[]>("/saas/installed-apps")
      .then((list) => {
        if (!cancelled) setInstalledApps(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your applications");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, attempt]);

  const tiles = useMemo<WizardTile[]>(() => {
    if (!installedApps) return [];
    return allApplications
      .filter((app) => KERNEL_APP_IDS.has(app.id) || installedApps.includes(app.id))
      .map((app) => {
        const Icon = app.icon;
        return {
          key: app.id,
          name: app.name,
          href: app.href,
          icon: Icon ? <Icon size={20} /> : undefined,
        };
      });
  }, [installedApps]);

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>
          Applications
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
          Everything installed for your organisation.
        </p>
      </div>
      <AppWizardGrid
        tiles={tiles}
        loading={installedApps === null && !error}
        error={error}
        onRetry={() => setAttempt((n) => n + 1)}
        emptyTitle="No applications installed"
        emptyDescription="Ask a tenant administrator to install applications from the Marketplace."
      />
    </div>
  );
}
