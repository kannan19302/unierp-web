"use client";

import React, { useState, useRef, useEffect, type FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Star,
  CheckSquare,
  Clock,
  BookOpen,
  Wallet,
  Building2,
  FileText,
  PieChart,
  Calculator,
  Settings,
  X,
  Check,
  LayoutGrid,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Sliders,
} from "lucide-react";
import styles from "./FinanceSidebarV2.module.css";

export interface FinanceSidebarV2Props {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pathname: string;
}

export const FinanceSidebarV2: FC<FinanceSidebarV2Props> = ({
  collapsed,
  setCollapsed,
  pathname,
}) => {
  const router = useRouter();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Expandable group states
  const [accountingOpen, setAccountingOpen] = useState(true);
  const [cashOpen, setCashOpen] = useState(true);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [taxAssetsOpen, setTaxAssetsOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    }
    if (workspaceMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [workspaceMenuOpen]);

  const workspaces = [
    { id: "finance", name: "Finance", href: "/finance", icon: BookOpen },
    { id: "sales", name: "Sales", href: "/sales", icon: ShoppingCart },
    { id: "inventory", name: "Inventory", href: "/inventory", icon: Package },
    { id: "people", name: "People", href: "/hr", icon: Users },
    { id: "analytics", name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(workspaceSearch.toLowerCase())
  );

  const cleanQuery = searchQuery.trim().toLowerCase();

  const isItemMatch = (label: string) => {
    if (!cleanQuery) return true;
    return label.toLowerCase().includes(cleanQuery);
  };

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      aria-label="Finance Navigation"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.workspaceSwitcherContainer} ref={menuRef}>
            <button
              type="button"
              className={styles.workspaceSwitcherTrigger}
              onClick={() => !collapsed && setWorkspaceMenuOpen(!workspaceMenuOpen)}
              title="Switch Workspace"
              aria-expanded={workspaceMenuOpen}
            >
              {!collapsed && <span className={styles.title}>Finance</span>}
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={styles.chevronIcon}
                  style={{ transform: workspaceMenuOpen ? "rotate(180deg)" : "none" }}
                />
              )}
            </button>

            {workspaceMenuOpen && !collapsed && (
              <div className={styles.workspaceMenu} role="menu">
                <div className={styles.menuSearchWrap}>
                  <Search size={14} className={styles.searchIcon} aria-hidden />
                  <input
                    type="text"
                    placeholder="Find a workspace"
                    className={styles.menuSearchInput}
                    value={workspaceSearch}
                    onChange={(e) => setWorkspaceSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className={styles.workspaceList}>
                  {filteredWorkspaces.map((ws) => {
                    const isSelected = ws.id === "finance";
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        className={`${styles.workspaceOption} ${isSelected ? styles.workspaceOptionActive : ""}`}
                        onClick={() => {
                          setWorkspaceMenuOpen(false);
                          router.push(ws.href);
                        }}
                      >
                        <div className={styles.workspaceOptionLeft}>
                          <ws.icon size={15} />
                          <span>{ws.name}</span>
                        </div>
                        {isSelected && <Check size={14} className={styles.checkIcon} />}
                      </button>
                    );
                  })}
                </div>
                <div className={styles.menuDivider} />
                <button
                  type="button"
                  className={styles.manageWorkspacesBtn}
                  onClick={() => {
                    setWorkspaceMenuOpen(false);
                    router.push("/apps");
                  }}
                >
                  <Sliders size={14} />
                  <span>Manage workspaces</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.collapseButton}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        {!collapsed && <div className={styles.scopeSubtitle}>Acme Corp</div>}
      </div>

      {/* Find in Finance Search Input */}
      {!collapsed && (
        <div className={styles.searchWrap}>
          <div className={styles.searchInputBox}>
            <Search size={14} className={styles.searchIcon} aria-hidden />
            <input
              type="text"
              placeholder="Find in Finance"
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Nav Body */}
      {!collapsed ? (
        <nav className={styles.navBody}>
          {/* FAVORITES Section */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>Favorites</div>

            {isItemMatch("Month-end close") && (
              <Link
                href="/finance/advanced/close-tasks"
                className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/close-tasks") ? styles.navItemActive : ""}`}
              >
                <div className={styles.navItemLeft}>
                  <Star size={15} className={styles.navItemIcon} />
                  <span>Month-end close</span>
                </div>
              </Link>
            )}

            {isItemMatch("My approvals") && (
              <Link
                href="/finance/ap?filter=needs-review"
                className={`${styles.navItem} ${pathname.startsWith("/finance/ap") ? styles.navItemActive : ""}`}
              >
                <div className={styles.navItemLeft}>
                  <CheckSquare size={15} className={styles.navItemIcon} />
                  <span>My approvals</span>
                </div>
                <span className={`${styles.navBadge} ${styles.navBadgeBlue}`}>8</span>
              </Link>
            )}
          </div>

          {/* WORKSPACE Section */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>Workspace</div>

            {/* Overview */}
            {isItemMatch("Overview") && (
              <Link
                href="/finance"
                className={`${styles.navItem} ${pathname === "/finance" ? styles.navItemActive : ""}`}
              >
                <div className={styles.navItemLeft}>
                  <Clock size={15} className={styles.navItemIcon} />
                  <span>Overview</span>
                </div>
              </Link>
            )}

            {/* Accounting Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setAccountingOpen(!accountingOpen)}
              >
                <div className={styles.navItemLeft}>
                  <BookOpen size={15} className={styles.navItemIcon} />
                  <span>Accounting</span>
                </div>
                {accountingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {accountingOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("General ledger") && (
                    <Link
                      href="/finance/gl"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/gl") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>General ledger</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Chart of accounts") && (
                    <Link
                      href="/finance/advanced/chart-of-accounts"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/chart-of-accounts") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Chart of accounts</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Journals") && (
                    <Link
                      href="/finance/journal-entries"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/journal-entries") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Journals</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Cash Management Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setCashOpen(!cashOpen)}
              >
                <div className={styles.navItemLeft}>
                  <Wallet size={15} className={styles.navItemIcon} />
                  <span>Cash management</span>
                </div>
                {cashOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {cashOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Receivables") && (
                    <Link
                      href="/finance/ar"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/ar") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Receivables</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Payables") && (
                    <Link
                      href="/finance/ap"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/ap") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Payables</span>
                      </div>
                      <span className={`${styles.navBadge} ${styles.navBadgeBlue}`}>8</span>
                    </Link>
                  )}
                  {isItemMatch("Banking") && (
                    <Link
                      href="/finance/banking"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/banking") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Banking</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Planning & Reporting Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setPlanningOpen(!planningOpen)}
              >
                <div className={styles.navItemLeft}>
                  <PieChart size={15} className={styles.navItemIcon} />
                  <span>Planning & reporting</span>
                </div>
                {planningOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {planningOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Budget & planning") && (
                    <Link
                      href="/finance/budget-planning"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/budget-planning") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Budget & planning</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Financial reports") && (
                    <Link
                      href="/finance/reports"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/reports") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Financial reports</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("FX Revaluation") && (
                    <Link
                      href="/finance/fx-revaluation"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/fx-revaluation") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>FX revaluation</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Intercompany") && (
                    <Link
                      href="/finance/intercompany"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/intercompany") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Intercompany eliminations</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Tax & Assets Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setTaxAssetsOpen(!taxAssetsOpen)}
              >
                <div className={styles.navItemLeft}>
                  <Calculator size={15} className={styles.navItemIcon} />
                  <span>Tax & assets</span>
                </div>
                {taxAssetsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {taxAssetsOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Tax & compliance") && (
                    <Link
                      href="/finance/tax"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/tax") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Tax & compliance</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Fixed assets") && (
                    <Link
                      href="/finance/assets"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/assets") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Fixed assets</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      ) : (
        /* Collapsed Icon-Only Mode */
        <nav className={styles.collapsedNav}>
          <Link
            href="/finance"
            className={`${styles.collapsedItem} ${pathname === "/finance" ? styles.collapsedItemActive : ""}`}
            title="Overview"
          >
            <Clock size={18} />
          </Link>

          <Link
            href="/finance/gl"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/gl") ? styles.collapsedItemActive : ""}`}
            title="General ledger"
          >
            <BookOpen size={18} />
          </Link>

          <Link
            href="/finance/ar"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/ar") ? styles.collapsedItemActive : ""}`}
            title="Receivables"
          >
            <FileText size={18} />
          </Link>

          <Link
            href="/finance/ap"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/ap") ? styles.collapsedItemActive : ""}`}
            title="Payables"
          >
            <CheckSquare size={18} />
            <span className={styles.collapsedBadge}>8</span>
          </Link>

          <Link
            href="/finance/banking"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/banking") ? styles.collapsedItemActive : ""}`}
            title="Banking"
          >
            <Wallet size={18} />
          </Link>

          <Link
            href="/finance/reports"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/reports") ? styles.collapsedItemActive : ""}`}
            title="Financial reports"
          >
            <BarChart3 size={18} />
          </Link>

          <Link
            href="/finance/assets"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/assets") ? styles.collapsedItemActive : ""}`}
            title="Fixed assets"
          >
            <Building2 size={18} />
          </Link>
        </nav>
      )}

      {/* Sticky Bottom Footer */}
      <div className={styles.footer}>
        {!collapsed ? (
          <>
            <button
              type="button"
              className={styles.periodTrigger}
              title="Period: Aug 2026 (Open)"
            >
              <div className={styles.periodLeft}>
                <span className={styles.greenDot} />
                <span>Aug 2026 • Open</span>
              </div>
              <ChevronRight size={14} />
            </button>

            <Link
              href="/finance/settings"
              className={`${styles.footerBtn} ${pathname.startsWith("/finance/settings") ? styles.navItemActive : ""}`}
            >
              <Settings size={15} />
              <span>Settings</span>
            </Link>

            <button
              type="button"
              className={styles.footerBtn}
              onClick={() => setCollapsed(true)}
            >
              <ChevronsLeft size={15} />
              <span>Hide sidebar</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className={styles.collapsedItem}
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
          >
            <ChevronsRight size={18} />
          </button>
        )}
      </div>
    </aside>
  );
};
