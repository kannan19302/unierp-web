"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Home,
  CreditCard,
  Users,
  Contact,
  Box,
  ShoppingCart,
  ClipboardList,
  Columns3,
  Sun,
  Network,
  Wrench,
  Store,
  Shield,
  Folder,
  MessageCircle,
  PieChart,
  Sparkles,
  Activity,
  GraduationCap,
  Building2,
  LogOut,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import styles from "./apps-wizard.module.css";

export interface AppIconConfig {
  id: string;
  name: string;
  displayName: string;
  category: "core" | "operations" | "productivity" | "verticals";
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  href: string;
}

export const APPS_CATALOG: AppIconConfig[] = [
  // Row 1 (Core ERP - 7 apps)
  {
    id: "analytics",
    name: "Analytics",
    displayName: "Analytics",
    category: "core",
    icon: PieChart,
    href: "/analytics",
  },
  {
    id: "finance",
    name: "Finance",
    displayName: "Finance",
    category: "core",
    icon: CreditCard,
    href: "/finance",
  },
  {
    id: "hr",
    name: "HR",
    displayName: "HR",
    category: "core",
    icon: Users,
    href: "/hr",
  },
  {
    id: "crm",
    name: "CRM",
    displayName: "CRM",
    category: "core",
    icon: Contact,
    href: "/crm",
  },
  {
    id: "inventory",
    name: "Inventory",
    displayName: "Inventory",
    category: "core",
    icon: Box,
    href: "/inventory",
  },
  {
    id: "procurement",
    name: "Procurement",
    displayName: "Procurement",
    category: "core",
    icon: ShoppingCart,
    href: "/procurement",
  },
  {
    id: "sales",
    name: "Sales",
    displayName: "Sales",
    category: "core",
    icon: ClipboardList,
    href: "/sales",
  },

  // Row 2 (Core ERP & Operations - 7 apps)
  {
    id: "projects",
    name: "Projects",
    displayName: "Projects",
    category: "core",
    icon: Columns3,
    href: "/projects",
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    displayName: "Manufacturing",
    category: "core",
    icon: Sun,
    href: "/manufacturing",
  },
  {
    id: "supply-chain",
    name: "Supply Chain",
    displayName: "Supply Chain",
    category: "operations",
    icon: Network,
    href: "/supply-chain",
  },
  {
    id: "field-service",
    name: "Field Service",
    displayName: "Field Service",
    category: "operations",
    icon: Wrench,
    href: "/field-service",
  },
  {
    id: "pos",
    name: "POS",
    displayName: "POS",
    category: "operations",
    icon: Store,
    href: "/pos",
  },
  {
    id: "blockchain",
    name: "Blockchain",
    displayName: "Blockchain",
    category: "operations",
    icon: Shield,
    href: "/blockchain",
  },
  {
    id: "drive",
    name: "Drive",
    displayName: "Drive",
    category: "productivity",
    icon: Folder,
    href: "/drive",
  },

  // Row 3 (Productivity & Verticals - 6 apps)
  {
    id: "communication",
    name: "Connect",
    displayName: "Connect",
    category: "productivity",
    icon: MessageCircle,
    href: "/connect",
  },
  {
    id: "workflow",
    name: "Workflow",
    displayName: "Workflow",
    category: "productivity",
    icon: Workflow,
    href: "/workflow",
  },
  {
    id: "ai",
    name: "AI Copilot",
    displayName: "AI Copilot",
    category: "productivity",
    icon: Sparkles,
    href: "/ai",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    displayName: "Healthcare",
    category: "verticals",
    icon: Activity,
    href: "/healthcare",
  },
  {
    id: "education",
    name: "Education",
    displayName: "Education",
    category: "verticals",
    icon: GraduationCap,
    href: "/education",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    displayName: "Real Estate",
    category: "verticals",
    icon: Building2,
    href: "/real-estate",
  },
];

type CategoryFilter = "all" | "core" | "operations" | "productivity" | "verticals";

const CATEGORIES: Array<{ id: CategoryFilter; label: string; count: number }> = [
  { id: "all", label: "All", count: 20 },
  { id: "core", label: "Core ERP", count: 9 },
  { id: "operations", label: "Operations", count: 4 },
  { id: "productivity", label: "Productivity", count: 4 },
  { id: "verticals", label: "Industry", count: 3 },
];

export default function ApplicationWizardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' or 'Cmd/Ctrl+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" || (e.ctrlKey && e.key === "k") || (e.metaKey && e.key === "k")) &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredApps = useMemo(() => {
    return APPS_CATALOG.filter((app) => {
      // Category filter
      if (category !== "all" && app.category !== category) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = app.name.toLowerCase().includes(q);
        const displayMatch = app.displayName.toLowerCase().includes(q);
        const idMatch = app.id.toLowerCase().includes(q);
        if (!nameMatch && !displayMatch && !idMatch) return false;
      }

      return true;
    });
  }, [category, searchQuery]);

  return (
    <div className={styles.launcherBackdrop}>
      <main className={styles.launcherCard}>
        {/* Top Hero Section: Left Title/Subtitle & Right Search Bar */}
        <section className={styles.heroSection}>
          <div className={styles.heroLeft}>
            <h1 className={styles.launcherTitle}>Select an app to continue</h1>
            <p className={styles.launcherSubtitle}>
              Choose an operational workspace application to launch.
            </p>
          </div>

          {/* Compact Search Bar with '/' Shortcut */}
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search apps — Finance, CRM, Payroll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search applications"
            />
            {searchQuery ? (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={11} />
              </button>
            ) : (
              <kbd className={styles.searchKbdShortcut} title="Press '/' to focus search">
                /
              </kbd>
            )}
          </div>
        </section>

        {/* Category Tabs Filter Bar */}
        <div className={styles.tabsBar} role="tablist" aria-label="Application categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={category === c.id}
              className={`${styles.tabBtn} ${category === c.id ? styles.tabBtnActive : ""}`}
              onClick={() => setCategory(c.id)}
            >
              <span className={styles.tabLabel}>{c.label}</span>
              <span className={styles.tabCount}>{c.count}</span>
            </button>
          ))}
        </div>

        {/* App Icons Grid (7 columns per row) */}
        {filteredApps.length === 0 ? (
          <div className={styles.emptyState}>
            <SlidersHorizontal size={20} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No applications matching &ldquo;{searchQuery}&rdquo;</p>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => {
                setSearchQuery("");
                setCategory("all");
              }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className={styles.appGrid} role="list">
            {filteredApps.map((app) => {
              const Icon = app.icon;

              return (
                <Link
                  key={app.id}
                  href={app.href}
                  className={styles.appTile}
                  role="listitem"
                  data-app={app.id}
                  title={`Launch ${app.name}`}
                >
                  <div className={styles.iconSquircle}>
                    <Icon size={20} className={styles.iconGlyph} strokeWidth={2} />
                  </div>

                  <span className={styles.appName}>{app.displayName}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer with clean space from bottom border */}
        <footer className={styles.launcherFooter}>
          <div className={styles.footerLeft}>
            <span>UniERP Workspace Atlas • Enterprise Edition</span>
          </div>
          <div className={styles.footerRight}>
            <Link href="/auth/logout" className={styles.footerLink}>
              <LogOut size={11} />
              <span>Logout</span>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
