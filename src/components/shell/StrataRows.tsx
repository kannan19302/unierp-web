"use client";

import React from "react";
import Link from "next/link";
import styles from "./strata-home.module.css";

export interface StrataRowItem {
  title: string;
  detail: string;
  tag?: string;
  href?: string;
}

interface StrataRowsProps {
  items: StrataRowItem[];
  /** Render inside a panel (no outer border) */
  insidePanel?: boolean;
  className?: string;
}

/**
 * Strata v2 row list — a bordered list of items with title, detail, and optional badge/link.
 * Matches the design's `.rows` / `.row` pattern exactly.
 */
export function StrataRows({ items, insidePanel, className }: StrataRowsProps) {
  return (
    <div
      className={`${styles.rows} ${insidePanel ? styles.panelRows : ""} ${className ?? ""}`}
    >
      {items.map((item, i) => {
        const content = (
          <>
            <div className={styles.rowContent}>
              <strong className={styles.rowTitle}>{item.title}</strong>
              <small className={styles.rowDetail}>{item.detail}</small>
            </div>
            <span className={styles.badge}>{item.tag || "View"}</span>
          </>
        );

        if (item.href) {
          const isExternal = item.href.startsWith("http");
          if (isExternal) {
            return (
              <a key={i} href={item.href} className={styles.row}>
                {content}
              </a>
            );
          }
          return (
            <Link key={i} href={item.href} className={styles.row}>
              {content}
            </Link>
          );
        }

        return (
          <div key={i} className={styles.row}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
