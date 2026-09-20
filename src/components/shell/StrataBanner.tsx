"use client";

import React from "react";
import styles from "./strata-home.module.css";

interface StrataBannerProps {
  children: React.ReactNode;
  tone?: "info" | "warning" | "danger";
  role?: "status" | "alert";
}

/**
 * Strata v2 banner — info/warning/danger notification strip with left border accent.
 * Matches the design's `.banner` pattern.
 */
export function StrataBanner({
  children,
  tone = "info",
  role = "status",
}: StrataBannerProps) {
  const toneClass =
    tone === "warning"
      ? styles.bannerWarning
      : tone === "danger"
        ? styles.bannerDanger
        : "";

  return (
    <div className={`${styles.banner} ${toneClass}`} role={role}>
      {children}
    </div>
  );
}
