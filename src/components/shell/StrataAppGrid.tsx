"use client";

import React from "react";
import Link from "next/link";
import styles from "./strata-home.module.css";

export interface AppTile {
  icon: string;
  name: string;
  description: string;
  href: string;
}

const DEFAULT_APPS: AppTile[] = [
  { icon: "F", name: "Finance", description: "Ledger & cash", href: "/finance" },
  { icon: "C", name: "CRM", description: "Customers & pipeline", href: "/crm" },
  { icon: "I", name: "Inventory", description: "Stock & fulfillment", href: "/inventory" },
  { icon: "S", name: "Sales", description: "Orders & revenue", href: "/sales" },
  { icon: "P", name: "Projects", description: "Plans & delivery", href: "/projects" },
  { icon: "A", name: "Analytics", description: "Reports & insights", href: "/analytics" },
];

interface StrataAppGridProps {
  apps?: AppTile[];
}

/**
 * Strata v2 app grid — 6-column icon tile grid with letter icons.
 * Matches the design's `.apps` / `.app` / `.app-icon` pattern.
 */
export function StrataAppGrid({ apps = DEFAULT_APPS }: StrataAppGridProps) {
  return (
    <div className={styles.appGrid}>
      {apps.map((app) => (
        <Link key={app.name} href={app.href} className={styles.appTile}>
          <span className={styles.appIcon}>{app.icon}</span>
          <strong className={styles.appTileLabel}>{app.name}</strong>
          <small className={styles.appTileDesc}>{app.description}</small>
        </Link>
      ))}
    </div>
  );
}
