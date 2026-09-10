"use client";

import React, { useState, useRef, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Menu,
  ChevronLeft,
  ChevronDown,
  Search,
  X,
  Compass,
  Star,
  Plus,
  LayoutGrid,
} from "lucide-react";
import { useResolvedNav } from "@/navigation/useResolvedNav";
import { ALL_APPLICATION_PAGES } from "@/navigation";
import type { ModuleNav, SidebarItem } from "@/navigation";
import styles from "./AppSidebar.module.css";

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  appNav: ModuleNav;
  pathname: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  } | null;
}

/** Recursively flattens sidebar items to extract all navigable links */
function extractNavigableItems(items: SidebarItem[]): SidebarItem[] {
  const result: SidebarItem[] = [];
  for (const item of items) {
    if (item.href) {
      result.push(item);
    }
    if (item.items && item.items.length > 0) {
      result.push(...extractNavigableItems(item.items));
    }
  }
  return result;
}

function getQuickAction(href: string): { title: string; href: string } | null {
  if (href === "/finance/gl") {
    return { title: "New Journal Entry", href: "/finance/gl?action=new" };
  }
  if (href === "/finance/ar" || href === "/finance/invoices") {
    return { title: "New Invoice", href: "/finance/invoices?action=new" };
  }
  if (href === "/finance/ap" || href === "/finance/vendor-bills") {
    return { title: "New Bill", href: "/finance/vendor-bills?action=new" };
  }
  if (href === "/finance/assets") {
    return { title: "New Asset", href: "/finance/assets?action=new" };
  }
  if (href === "/finance/banking") {
    return { title: "Import Feed", href: "/finance/banking?action=new" };
  }
  return null;
}

function SidebarNavigation({
  appNav,
  pathname,
  collapsed,
  searchQuery,
  setSearchQuery,
}: {
  appNav: ModuleNav;
  pathname: string;
  collapsed: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const searchParams = useSearchParams();
  const enhancedItems = useResolvedNav(appNav, pathname);

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Extract all navigable items in the current module
  const allInModuleItems = useMemo(
    () => extractNavigableItems(enhancedItems),
    [enhancedItems],
  );

  // Favorites state (persisted to localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unierp_finance_favorites");
        if (saved) return JSON.parse(saved);
      } catch {
        /* fallback to defaults */
      }
    }
    return ["/finance", "/finance/gl"];
  });

  // Collapsed sections state (persisted to localStorage)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unierp_sidebar_sections");
        if (saved) return JSON.parse(saved);
      } catch {
        /* fallback */
      }
    }
    return {};
  });

  const toggleFavorite = (href: string) => {
    setFavorites((prev) => {
      const next = prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href];
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("unierp_finance_favorites", JSON.stringify(next));
        } catch {
          /* ignore storage error */
        }
      }
      return next;
    });
  };

  const toggleSection = (sectionName: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionName]: !prev[sectionName] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("unierp_sidebar_sections", JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  // Filter in-module items when search query is present
  const filteredInModuleItems = useMemo(() => {
    if (!cleanQuery) return [];
    return allInModuleItems.filter(
      (item) =>
        item.name.toLowerCase().includes(cleanQuery) ||
        (item.description && item.description.toLowerCase().includes(cleanQuery)),
    );
  }, [allInModuleItems, cleanQuery]);

  // Filter cross-application pages when search query is present
  const crossAppMatches = useMemo(() => {
    if (!cleanQuery) return [];
    const inModuleHrefs = new Set(allInModuleItems.map((i) => i.href).filter(Boolean));

    return ALL_APPLICATION_PAGES.filter((page) => {
      // Avoid duplicating items already present in the current module
      if (inModuleHrefs.has(page.href)) return false;

      const nameMatch = page.name.toLowerCase().includes(cleanQuery);
      const moduleMatch = page.module.toLowerCase().includes(cleanQuery);
      const keywordMatch = page.keywords?.some((k) => k.toLowerCase().includes(cleanQuery));

      return nameMatch || moduleMatch || keywordMatch;
    }).slice(0, 10);
  }, [cleanQuery, allInModuleItems]);

  // Extract favorited items
  const starredItems = useMemo(() => {
    return allInModuleItems.filter((i) => i.href && favorites.includes(i.href));
  }, [allInModuleItems, favorites]);

  const renderItem = (item: SidebarItem, isSub = false, index = 0) => {
    const itemKey = item.href ?? `header-${item.name}-${index}`;
    if (item.isHeader) {
      if (collapsed) {
        return (
          <React.Fragment key={itemKey}>
            <div className={styles.subHeaderDivider} />
            {item.items?.map((sub: any, subIdx: any) => renderItem(sub, true, subIdx))}
          </React.Fragment>
        );
      }

      const isSecCollapsed = Boolean(collapsedSections[item.name]);
      return (
        <div key={itemKey} className={styles.sectionGroup}>
          <button
            type="button"
            onClick={() => toggleSection(item.name)}
            className={styles.sectionHeaderBtn}
            aria-expanded={!isSecCollapsed}
            aria-label={`Toggle ${item.name} section`}
          >
            <ChevronDown
              size={12}
              className={`${styles.chevron} ${isSecCollapsed ? styles.chevronCollapsed : ""}`}
              aria-hidden="true"
            />
            <span className={styles.sectionTitle}>{item.name}</span>
            <span className={styles.sectionCount}>{item.items?.length || 0}</span>
          </button>
          {!isSecCollapsed && (
            <div className={`${styles.sectionBody} ${isSub ? styles.treeRail : ""}`}>
              {item.items?.map((sub: any, subIdx: any) => renderItem(sub, true, subIdx))}
            </div>
          )}
        </div>
      );
    }

    const href = item.href || "#";
    const isActive = (() => {
      const parts = href.split("?");
      const itemPath = parts[0] || "";
      const itemQuery = parts[1] || "";

      const isPathMatch =
        itemPath === "/inventory" ||
        itemPath === "/builder" ||
        itemPath === "/dashboard" ||
        itemPath === "/drive" ||
        itemPath === "/storage" ||
        itemPath === "/analytics"
          ? pathname === itemPath
          : pathname === itemPath || pathname.startsWith(itemPath + "/");

      if (!isPathMatch) return false;

      if (itemPath === "/drive") {
        const activeView = searchParams.get("view") || "personal";
        const itemParams = new URLSearchParams(itemQuery);
        const itemView = itemParams.get("view") || "personal";
        return activeView === itemView;
      }

      if (
        (itemPath.includes("/hr/advanced") ||
          itemPath.includes("/inventory/advanced")) &&
        itemQuery
      ) {
        const activeTab =
          searchParams.get("tab") ||
          (itemPath.includes("/hr/advanced") ? "payroll" : "entries");
        const itemParams = new URLSearchParams(itemQuery);
        const itemTab = itemParams.get("tab");
        return pathname === itemPath && activeTab === itemTab;
      }

      return true;
    })();

    const Icon = item.icon;
    const isFav = favorites.includes(href);
    const quickAction = getQuickAction(href);

    return (
      <div key={itemKey} className={styles.itemWrapper}>
        <Link
          href={href}
          title={item.description ?? (collapsed ? item.name : undefined)}
          aria-current={isActive ? "page" : undefined}
          className={`${styles.navItem} ${isActive ? styles.navItemActive : ""} ${collapsed ? styles.navItemCollapsed : styles.navItemExpanded}`}
          style={{
            paddingLeft:
              isSub && !collapsed ? "var(--space-4)" : "var(--space-3)",
          }}
          onClick={() => {
            if (cleanQuery) setSearchQuery("");
          }}
        >
          {Icon && (
            <Icon
              size={18}
              style={{
                flexShrink: 0,
                color: isActive ? "var(--color-primary)" : "inherit",
              }}
            />
          )}
          {!collapsed && <span className={styles.navItemText}>{item.name}</span>}
        </Link>

        {!collapsed && href !== "#" && (
          <div className={styles.itemTrailing}>
            {quickAction && (
              <Link
                href={quickAction.href}
                className={styles.quickActionBtn}
                title={quickAction.title}
                aria-label={quickAction.title}
                onClick={(e) => {
                  e.stopPropagation();
                  if (cleanQuery) setSearchQuery("");
                }}
              >
                <Plus size={12} />
              </Link>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(href);
              }}
              className={`${styles.starBtn} ${isFav ? styles.starActive : ""}`}
              aria-label={isFav ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
              title={isFav ? "Starred" : "Star page"}
            >
              <Star size={12} className={isFav ? styles.starFilled : ""} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // If search query is active, render filtered search results
  if (cleanQuery) {
    const hasModuleMatches = filteredInModuleItems.length > 0;
    const hasCrossMatches = crossAppMatches.length > 0;

    if (!hasModuleMatches && !hasCrossMatches) {
      return (
        <div className={styles.emptyState}>
          <Search size={22} style={{ opacity: 0.4 }} />
          <span>No pages found matching &ldquo;{searchQuery}&rdquo;</span>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className={styles.emptyResetBtn}
          >
            Clear search
          </button>
        </div>
      );
    }

    return (
      <>
        {hasModuleMatches && (
          <div className={styles.subHeader}>
            <div className={styles.subHeaderTitle}>
              {appNav.title} Pages ({filteredInModuleItems.length})
            </div>
            {filteredInModuleItems.map((item, idx) => renderItem(item, false, idx))}
          </div>
        )}

        {hasCrossMatches && (
          <div className={styles.subHeader}>
            <div className={styles.subHeaderTitle}>
              All Applications ({crossAppMatches.length})
            </div>
            {crossAppMatches.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={styles.globalResultItem}
                title={`${page.name} (${page.module})`}
                onClick={() => setSearchQuery("")}
              >
                <Compass
                  size={16}
                  style={{
                    flexShrink: 0,
                    color: "var(--color-text-tertiary)",
                  }}
                />
                <span className={styles.globalResultName}>{page.name}</span>
                <span className={styles.moduleBadge}>{page.module}</span>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // Standard hierarchy navigation with Atlassian-style Starred Section
  return (
    <>
      {!collapsed && starredItems.length > 0 && (
        <div className={styles.starredGroup}>
          <div className={styles.starredHeader}>
            <Star size={12} className={styles.starHeaderIcon} aria-hidden="true" />
            <span className={styles.sectionTitle}>Starred</span>
            <span className={styles.sectionCount}>{starredItems.length}</span>
          </div>
          <div className={styles.sectionBody}>
            {starredItems.map((item, idx) => renderItem(item, false, idx))}
          </div>
        </div>
      )}
      {enhancedItems.map((item: any, idx: any) => renderItem(item, false, idx))}
    </>
  );
}

export function AppSidebar({
  collapsed,
  setCollapsed,
  appNav,
  pathname,
  user,
}: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global "/" hotkey to focus search bar, "[" to toggle collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "/" && !isInputFocused) {
        e.preventDefault();
        if (collapsed) {
          setCollapsed(false);
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }

      if ((e.key === "[" || (e.ctrlKey && e.key === "[")) && !isInputFocused) {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, setCollapsed]);

  const initials = (() => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "SU";
  })();

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    : "Super Admin";

  const displayEmail = user?.email || "admin@uni-erp.com";

  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {!collapsed && (
        <div className={styles.backdrop} onClick={() => setCollapsed(true)} />
      )}

      <aside
        className={`${styles.sidebar} ${!collapsed ? styles.sidebarOpen : ""}`}
        style={{
          width: collapsed
            ? "var(--sidebar-collapsed-width)"
            : "var(--sidebar-width)",
        }}
      >
        {/* Sidebar Header / Brand Logo & App Launcher */}
        <div
          className={`${styles.header} ${collapsed ? styles.headerCollapsed : styles.headerExpanded}`}
        >
          <div className={styles.logoWrapper}>
            <Link
              href="/apps"
              className={styles.appLauncherBtn}
              title="App Launcher (All Applications)"
              aria-label="App Launcher"
            >
              <LayoutGrid size={18} />
            </Link>
            {!collapsed && (
              <>
                <appNav.icon size={20} className="ui-text-primary" />
                <span>{appNav.title}</span>
              </>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={styles.toggleBtn}
            aria-label={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
            title={collapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Enterprise Search Bar */}
        {collapsed ? (
          <div className={styles.searchCollapsedWrapper}>
            <button
              type="button"
              onClick={() => {
                setCollapsed(false);
                setTimeout(() => searchInputRef.current?.focus(), 60);
              }}
              className={styles.searchCollapsedBtn}
              title="Search all pages (/)"
              aria-label="Search all pages"
            >
              <Search size={16} />
            </button>
          </div>
        ) : (
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <span className={styles.searchIcon}>
                <Search size={14} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (searchQuery) {
                      setSearchQuery("");
                    } else {
                      searchInputRef.current?.blur();
                    }
                  }
                }}
                placeholder="Search pages..."
                className={styles.searchInput}
                aria-label="Search pages across UniERP"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className={styles.searchClearBtn}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              ) : (
                <kbd className={styles.searchKbd} title="Press / to search">
                  /
                </kbd>
              )}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav aria-label="Module navigation" className={styles.nav}>
          <Suspense fallback={<div className="flex-1" />}>
            <SidebarNavigation
              appNav={appNav}
              pathname={pathname}
              collapsed={collapsed}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </Suspense>
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`${styles.footer} ${collapsed ? styles.footerCollapsed : styles.footerExpanded}`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className={styles.toggleBtn}
              aria-label="Expand sidebar"
            >
              <Menu size={20} />
            </button>
          ) : (
            <div className={styles.userContainer}>
              <div className={styles.avatar} aria-hidden="true">
                {initials}
              </div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{displayName}</p>
                <p className={styles.userEmail}>{displayEmail}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
