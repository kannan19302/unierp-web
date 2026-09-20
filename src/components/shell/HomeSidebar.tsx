"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Diamond,
  Bell,
  Grid3X3,
  Puzzle,
  ShoppingBag,
  CircleDot,
  Globe,
  CircleUser,
  HelpCircle,
} from "lucide-react";
import styles from "./HomeSidebar.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  external?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Applications", href: "/apps", icon: LayoutGrid },
  { label: "Application setup", href: "/setup", icon: Diamond },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

const PLATFORM_NAV: NavItem[] = [
  { label: "Explore UniERP", href: "/platforms", icon: Grid3X3 },
  { label: "Developer", href: "http://localhost:4004", icon: Puzzle, external: true },
  { label: "Marketplace", href: "http://localhost:4007", icon: ShoppingBag, external: true },
  { label: "Organization control center", href: "http://localhost:4002", icon: CircleDot, external: true },
  { label: "Web Studio & website", href: "http://localhost:4004", icon: Globe, external: true },
];

const PERSONAL_NAV: NavItem[] = [
  { label: "Account Center", href: "/account", icon: CircleUser },
  { label: "Help", href: "/home/help", icon: HelpCircle },
];

interface HomeSidebarProps {
  isOpen?: boolean;
  tenantName?: string;
  environment?: string;
}

/**
 * Strata v2 Home sidebar — dedicated navigation for Home/Account/Setup screens.
 * Matches the v2 design left-nav with primary, platform, and personal sections.
 */
export function HomeSidebar({
  isOpen,
  tenantName = "Acme Corp",
  environment = "Production",
}: HomeSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/apps") return pathname === "/apps";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = !item.external && isActive(item.href);
    const className = `${styles.navLink} ${active ? styles.navLinkActive : ""}`;

    if (item.external) {
      return (
        <a
          key={item.label}
          href={item.href}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon size={18} className={styles.navIcon} />
          {item.label}
        </a>
      );
    }

    return (
      <Link key={item.label} href={item.href} className={className}>
        <Icon size={18} className={styles.navIcon} />
        {item.label}
      </Link>
    );
  };

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      aria-label="Home navigation"
    >
      <div>
        <nav className={styles.nav}>{PRIMARY_NAV.map(renderNavItem)}</nav>

        <hr className={styles.separator} />

        <nav className={styles.nav}>{PLATFORM_NAV.map(renderNavItem)}</nav>

        <hr className={styles.separator} />

        <nav className={styles.nav}>{PERSONAL_NAV.map(renderNavItem)}</nav>
      </div>

      <div className={styles.scope}>
        {tenantName}
        <small className={styles.scopeDetail}>{environment}</small>
      </div>
    </aside>
  );
}
