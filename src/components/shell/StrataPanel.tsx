"use client";

import React from "react";
import styles from "./strata-home.module.css";

interface StrataPanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Strata v2 panel — white elevated card with border and rounded corners.
 * Used throughout the Home/Account experience for content sections.
 */
export function StrataPanel({ title, children, className }: StrataPanelProps) {
  return (
    <section className={`${styles.panel} ${className ?? ""}`}>
      {title && <h2 className={styles.panelTitle}>{title}</h2>}
      {children}
    </section>
  );
}
