"use client";

import React from "react";
import Link from "next/link";
import styles from "./strata-home.module.css";

interface StrataPageShellProps {
  breadcrumb?: string;
  breadcrumbHref?: string;
  title: string;
  subtitle?: string;
  screenNumber?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Strata v2 page wrapper — provides consistent breadcrumb, heading,
 * subtitle, screen number and content layout for all Home/Account pages.
 */
export function StrataPageShell({
  breadcrumb = "UniERP Home / Home",
  breadcrumbHref,
  title,
  subtitle,
  screenNumber,
  actions,
  children,
}: StrataPageShellProps) {
  return (
    <div className={styles.pageShell}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        {breadcrumbHref ? (
          <Link href={breadcrumbHref}>{breadcrumb}</Link>
        ) : (
          breadcrumb
        )}
      </nav>

      <div className={styles.heading}>
        <div>
          <h1 className={styles.pageTitle}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {screenNumber && (
          <span className={styles.screenNumber}>{screenNumber}</span>
        )}
      </div>

      {children}

      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
