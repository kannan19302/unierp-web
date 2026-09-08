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
  TrendingUp,
  Landmark,
  ShieldCheck,
  Brain,
  Layers,
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
  const [revenueOpen, setRevenueOpen] = useState(false);
  const [treasuryOpen, setTreasuryOpen] = useState(false);
  const [governanceOpen, setGovernanceOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

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

            {/* Revenue & Contracts Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setRevenueOpen(!revenueOpen)}
              >
                <div className={styles.navItemLeft}>
                  <TrendingUp size={15} className={styles.navItemIcon} />
                  <span>Revenue & contracts</span>
                </div>
                {revenueOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {revenueOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Revenue recognition") && (
                    <Link
                      href="/finance/advanced/revenue-schedules"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/revenue-schedules") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Revenue recognition (ASC 606)</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Subscriptions & ARR") && (
                    <Link
                      href="/finance/advanced/subscriptions"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/subscriptions") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Subscriptions & ARR</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("E-Invoicing") && (
                    <Link
                      href="/finance/advanced/e-invoicing"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/e-invoicing") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>E-Invoicing (PEPPOL)</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Treasury & Liquidity Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setTreasuryOpen(!treasuryOpen)}
              >
                <div className={styles.navItemLeft}>
                  <Landmark size={15} className={styles.navItemIcon} />
                  <span>Treasury & liquidity</span>
                </div>
                {treasuryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {treasuryOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Cash flow forecast") && (
                    <Link
                      href="/finance/advanced/cash-flow-forecast"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/cash-flow-forecast") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Cash flow forecast</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Working capital") && (
                    <Link
                      href="/finance/advanced/working-capital"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/working-capital") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Working capital & SCF</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Treasury operations") && (
                    <Link
                      href="/finance/advanced/treasury"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/treasury") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Treasury operations</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Financial instruments") && (
                    <Link
                      href="/finance/advanced/financial-instruments"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/financial-instruments") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Financial instruments</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Governance, Risk & ESG Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setGovernanceOpen(!governanceOpen)}
              >
                <div className={styles.navItemLeft}>
                  <ShieldCheck size={15} className={styles.navItemIcon} />
                  <span>Governance & ESG</span>
                </div>
                {governanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {governanceOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("ESG & carbon") && (
                    <Link
                      href="/finance/advanced/esg-accounting"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/esg-accounting") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>ESG & carbon accounting</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Risk management") && (
                    <Link
                      href="/finance/advanced/risk-management"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/risk-management") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Risk management</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Consolidation") && (
                    <Link
                      href="/finance/advanced/consolidation"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/consolidation") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Multi-GAAP consolidation</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Tax provisioning") && (
                    <Link
                      href="/finance/advanced/tax-provisioning"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/tax-provisioning") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>ASC 740 tax provisioning</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* AI Intelligence Group */}
            <div className={styles.expandableGroup}>
              <button
                type="button"
                className={styles.groupItemHeader}
                onClick={() => setAiOpen(!aiOpen)}
              >
                <div className={styles.navItemLeft}>
                  <Brain size={15} className={styles.navItemIcon} />
                  <span>AI financial intelligence</span>
                </div>
                {aiOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              {aiOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("AI financial analytics") && (
                    <Link
                      href="/finance/advanced/ai-analytics"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/ai-analytics") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>AI financial analytics</span>
                      </div>
                    </Link>
                  )}
                  {isItemMatch("Financial ratios") && (
                    <Link
                      href="/finance/advanced/financial-ratios"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/financial-ratios") ? styles.navItemActive : ""}`}
                    >
                      <div className={styles.navItemLeft}>
                        <span>Financial ratios & health</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* All Enterprise Modules Link */}
            {isItemMatch("All modules") && (
              <Link
                href="/finance/advanced"
                className={`${styles.navItem} ${pathname === "/finance/advanced" ? styles.navItemActive : ""}`}
              >
                <div className={styles.navItemLeft}>
                  <Layers size={15} className={styles.navItemIcon} />
                  <span>All enterprise modules</span>
                </div>
                <span className={`${styles.navBadge} ${styles.navBadgeBlue}`}>58</span>
              </Link>
            )}
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

          <Link
            href="/finance/advanced/revenue-schedules"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/advanced/revenue-schedules") ? styles.collapsedItemActive : ""}`}
            title="Revenue recognition (ASC 606)"
          >
            <TrendingUp size={18} />
          </Link>

          <Link
            href="/finance/advanced/treasury"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/advanced/treasury") ? styles.collapsedItemActive : ""}`}
            title="Treasury & liquidity"
          >
            <Landmark size={18} />
          </Link>

          <Link
            href="/finance/advanced/esg-accounting"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/advanced/esg-accounting") ? styles.collapsedItemActive : ""}`}
            title="Governance & ESG"
          >
            <ShieldCheck size={18} />
          </Link>

          <Link
            href="/finance/advanced/ai-analytics"
            className={`${styles.collapsedItem} ${pathname.startsWith("/finance/advanced/ai-analytics") ? styles.collapsedItemActive : ""}`}
            title="AI financial intelligence"
          >
            <Brain size={18} />
          </Link>

          <Link
            href="/finance/advanced"
            className={`${styles.collapsedItem} ${pathname === "/finance/advanced" ? styles.collapsedItemActive : ""}`}
            title="All enterprise modules (58)"
          >
            <Layers size={18} />
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
