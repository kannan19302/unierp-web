"use client";

/**
 * Plane-2 Forbidden page — rendered when a non-admin tenant user attempts
 * to access a plane-2 administration route (/settings, /subscriptions,
 * /apps, /profile).
 *
 * D01 exit criterion: a tenant user without an admin grant receives 403 —
 * not a hidden menu item — on every plane-2 route.
 */

import React from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function ForbiddenPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.statusCode} aria-label="HTTP status 403">
          403
        </div>
        <h1 className={styles.heading}>Forbidden</h1>
        <p className={styles.description}>
          You do not have permission to access this page. This area is reserved
          for tenant administrators.
        </p>
        <p className={styles.hint}>
          If you believe this is a mistake, contact your administrator to
          request the appropriate access grant.
        </p>
        <Link href="/dashboard" className={styles.homeLink}>
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
