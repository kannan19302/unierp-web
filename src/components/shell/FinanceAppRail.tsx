"use client";

import React, { type FC } from "react";
import Link from "next/link";
import {
  Layers,
  LayoutGrid,
  FileText,
  ShoppingCart,
  Package,
  BarChart3,
  HelpCircle,
} from "lucide-react";
import styles from "./FinanceAppRail.module.css";

export interface FinanceAppRailProps {
  activeApp?: string;
  userInitials?: string;
  onOpenApps?: () => void;
  onOpenHelp?: () => void;
  onOpenUserMenu?: () => void;
}

export const FinanceAppRail: FC<FinanceAppRailProps> = ({
  activeApp = "finance",
  userInitials = "FM",
  onOpenApps,
  onOpenHelp,
  onOpenUserMenu,
}) => {
  return (
    <nav className={styles.rail} aria-label="Primary App Rail">
      {/* Top Section: Mark & Apps */}
      <div className={styles.topSection}>
        {/* Layered UniERP Logo Mark */}
        <Link href="/finance" className={styles.logoButton} title="UniERP Home">
          <Layers size={22} className={styles.logoIcon} aria-label="UniERP" />
        </Link>

        {/* Core Workspace Switchers */}
        <nav className={styles.navGroup} aria-label="Workspaces">
          <button
            type="button"
            className={`${styles.railItem} ${activeApp === "apps" ? styles.railItemActive : ""}`}
            onClick={onOpenApps}
            title="Apps Launcher"
          >
            <LayoutGrid size={18} aria-hidden />
            <span className={styles.railItemLabel}>Apps</span>
          </button>

          <Link
            href="/finance"
            className={`${styles.railItem} ${activeApp === "finance" ? styles.railItemActive : ""}`}
            title="Finance & Accounting"
          >
            <FileText size={18} aria-hidden />
            <span className={styles.railItemLabel}>Finance</span>
          </Link>

          <Link
            href="/sales"
            className={`${styles.railItem} ${activeApp === "sales" ? styles.railItemActive : ""}`}
            title="Sales & Orders"
          >
            <ShoppingCart size={18} aria-hidden />
            <span className={styles.railItemLabel}>Sales</span>
          </Link>

          <Link
            href="/inventory"
            className={`${styles.railItem} ${activeApp === "inventory" ? styles.railItemActive : ""}`}
            title="Inventory & Stock"
          >
            <Package size={18} aria-hidden />
            <span className={styles.railItemLabel}>Inventory</span>
          </Link>

          <Link
            href="/analytics"
            className={`${styles.railItem} ${activeApp === "analytics" ? styles.railItemActive : ""}`}
            title="Analytics & Cockpit"
          >
            <BarChart3 size={18} aria-hidden />
            <span className={styles.railItemLabel}>Analytics</span>
          </Link>
        </nav>
      </div>

      {/* Bottom Section: Help & Profile */}
      <div className={styles.bottomSection}>
        <button
          type="button"
          className={styles.railItem}
          onClick={onOpenHelp}
          title="Help & Documentation"
          aria-label="Help"
        >
          <HelpCircle size={18} aria-hidden />
          <span className={styles.railItemLabel}>Help</span>
        </button>

        <button
          type="button"
          className={styles.avatarButton}
          onClick={onOpenUserMenu}
          title="User Account: Finance Manager"
          aria-label="User Account"
        >
          {userInitials}
        </button>
      </div>
    </nav>
  );
};
