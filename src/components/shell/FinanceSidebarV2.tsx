"use client";

import React, { useState, useRef, useEffect, type FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
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
  MoreHorizontal,
} from "lucide-react";
import styles from "./FinanceSidebarV2.module.css";
import { ALL_FINANCE_MODULES } from "@/navigation/finance-workspaces";

export interface FinanceSidebarV2Props {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pathname: string;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  onNavContextMenu?: (href: string, label: string, e: React.MouseEvent) => void;
}

export const FinanceSidebarV2: FC<FinanceSidebarV2Props> = ({
  collapsed,
  setCollapsed,
  pathname,
  searchRef,
  onNavContextMenu,
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

  const renderMoreButton = (href: string, label: string) => (
    <span
      role="button"
      tabIndex={0}
      className={styles.moreBtn}
      title={`More options for ${label}`}
      aria-label={`More options for ${label}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onNavContextMenu?.(href, label, e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onNavContextMenu?.(href, label, e as unknown as React.MouseEvent);
        }
      }}
    >
      <MoreHorizontal size={14} aria-hidden />
    </span>
  );


  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      aria-label="Finance Navigation"
      aria-hidden={collapsed}
    >
      <div className={styles.sidebarInner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.workspaceSwitcherContainer} ref={menuRef}>
              <button
                type="button"
                className={styles.workspaceSwitcherTrigger}
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                title="Switch Workspace"
                aria-expanded={workspaceMenuOpen}
              >
                <span className={styles.title}>Finance</span>
                <ChevronDown
                  size={16}
                  className={styles.chevronIcon}
                  style={{ transform: workspaceMenuOpen ? "rotate(180deg)" : "none" }}
                />
              </button>

              {workspaceMenuOpen && (
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
        </div>

        <div className={styles.scopeSubtitle}>Acme Corp</div>
      </div>

      {/* Find in Finance Search Input */}
      <div className={styles.searchWrap}>
        <div className={styles.searchInputBox}>
          <Search size={14} className={styles.searchIcon} aria-hidden />
          <input
            type="text"
            placeholder="Find in Finance"
            aria-label="Find in Finance"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear Finance search"
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Nav Body */}
      <nav className={styles.navBody}>
          {cleanQuery && (
            <div className={styles.sectionGroup} aria-label="Finance workspace search results">
              <div className={styles.sectionHeader}>Matching workspaces</div>
              {ALL_FINANCE_MODULES.filter((workspace) =>
                `${workspace.label} ${workspace.desc}`.toLowerCase().includes(cleanQuery),
              ).map((workspace) => (
                <Link
                  key={workspace.href}
                  href={workspace.href}
                  aria-current={pathname === workspace.href ? "page" : undefined}
                  className={`${styles.navItem} ${pathname === workspace.href ? styles.navItemActive : ""}`}
                  onContextMenu={(e) => onNavContextMenu?.(workspace.href, workspace.label, e)}
                >
                  <span className={styles.navItemLeft}>{workspace.label}</span>
                  <div className={styles.navItemRight}>
                    {renderMoreButton(workspace.href, workspace.label)}
                  </div>
                </Link>
              ))}
              {!ALL_FINANCE_MODULES.some((workspace) =>
                `${workspace.label} ${workspace.desc}`.toLowerCase().includes(cleanQuery),
              ) && <p role="status">No matching workspaces.</p>}
            </div>
          )}
          {/* FAVORITES Section */}
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeader}>Favorites</div>

            {isItemMatch("Month-end close") && (
              <Link
                    href="/finance/advanced/close-tasks"
                className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/close-tasks") ? styles.navItemActive : ""}`}
              
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/close-tasks", "Month-end close", e)}
                  >
                <div className={styles.navItemLeft}>
                  <Star size={15} className={styles.navItemIcon} />
                  <span>Month-end close</span>
                </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/close-tasks", "Month-end close")}
                    </div>
                  </Link>
            )}

            {isItemMatch("My approvals") && (
              <Link
                    href="/finance/ap?filter=needs-review"
                className={`${styles.navItem} ${pathname.startsWith("/finance/ap") ? styles.navItemActive : ""}`}
              
                    onContextMenu={(e) => onNavContextMenu?.("/finance/ap?filter=needs-review", "My approvals", e)}
                  >
                <div className={styles.navItemLeft}>
                  <CheckSquare size={15} className={styles.navItemIcon} />
                  <span>My approvals</span>
                </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/ap?filter=needs-review", "My approvals")}
                    </div>
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
              
                    onContextMenu={(e) => onNavContextMenu?.("/finance", "Overview", e)}
                  >
                <div className={styles.navItemLeft}>
                  <Clock size={15} className={styles.navItemIcon} />
                  <span>Overview</span>
                </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance", "Overview")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/gl", "Accounting")}
                  {accountingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {accountingOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("General ledger") && (
                    <Link
                    href="/finance/gl"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/gl") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/gl", "General ledger", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>General ledger</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/gl", "General ledger")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Chart of accounts") && (
                    <Link
                    href="/finance/advanced/chart-of-accounts"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/chart-of-accounts") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/chart-of-accounts", "Chart of accounts", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Chart of accounts</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/chart-of-accounts", "Chart of accounts")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Journals") && (
                    <Link
                    href="/finance/journal-entries"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/journal-entries") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/journal-entries", "Journals", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Journals</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/journal-entries", "Journals")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/ar", "Cash management")}
                  {cashOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {cashOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Receivables") && (
                    <Link
                    href="/finance/ar"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/ar") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/ar", "Receivables", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Receivables</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/ar", "Receivables")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Payables") && (
                    <Link
                    href="/finance/ap"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/ap") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/ap", "Payables", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Payables</span>
                      </div>
                    <div className={styles.navItemRight}>
                      <span className={`${styles.navBadge} ${styles.navBadgeBlue}`}>8</span>
                      {renderMoreButton("/finance/ap", "Payables")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Banking") && (
                    <Link
                    href="/finance/banking"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/banking") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/banking", "Banking", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Banking</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/banking", "Banking")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/budget-planning", "Planning & reporting")}
                  {planningOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {planningOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Budget & planning") && (
                    <Link
                    href="/finance/budget-planning"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/budget-planning") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/budget-planning", "Budget & planning", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Budget & planning</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/budget-planning", "Budget & planning")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Financial reports") && (
                    <Link
                    href="/finance/reports"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/reports") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/reports", "Financial reports", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Financial reports</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/reports", "Financial reports")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("FX Revaluation") && (
                    <Link
                    href="/finance/fx-revaluation"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/fx-revaluation") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/fx-revaluation", "FX revaluation", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>FX revaluation</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/fx-revaluation", "FX revaluation")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Intercompany") && (
                    <Link
                    href="/finance/intercompany"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/intercompany") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/intercompany", "Intercompany eliminations", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Intercompany eliminations</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/intercompany", "Intercompany eliminations")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/tax", "Tax & assets")}
                  {taxAssetsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {taxAssetsOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Tax & compliance") && (
                    <Link
                    href="/finance/tax"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/tax") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/tax", "Tax & compliance", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Tax & compliance</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/tax", "Tax & compliance")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Fixed assets") && (
                    <Link
                    href="/finance/assets"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/assets") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/assets", "Fixed assets", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Fixed assets</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/assets", "Fixed assets")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/advanced/revenue-schedules", "Revenue & contracts")}
                  {revenueOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {revenueOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Revenue recognition") && (
                    <Link
                    href="/finance/advanced/revenue-schedules"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/revenue-schedules") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/revenue-schedules", "Revenue recognition (ASC 606)", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Revenue recognition (ASC 606)</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/revenue-schedules", "Revenue recognition (ASC 606)")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Subscriptions & ARR") && (
                    <Link
                    href="/finance/advanced/subscriptions"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/subscriptions") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/subscriptions", "Subscriptions & ARR", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Subscriptions & ARR</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/subscriptions", "Subscriptions & ARR")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("E-Invoicing") && (
                    <Link
                    href="/finance/advanced/e-invoicing"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/e-invoicing") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/e-invoicing", "E-Invoicing (PEPPOL)", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>E-Invoicing (PEPPOL)</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/e-invoicing", "E-Invoicing (PEPPOL)")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/advanced/treasury", "Treasury & liquidity")}
                  {treasuryOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {treasuryOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("Cash flow forecast") && (
                    <Link
                    href="/finance/advanced/cash-flow-forecast"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/cash-flow-forecast") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/cash-flow-forecast", "Cash flow forecast", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Cash flow forecast</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/cash-flow-forecast", "Cash flow forecast")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Working capital") && (
                    <Link
                    href="/finance/advanced/working-capital"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/working-capital") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/working-capital", "Working capital & SCF", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Working capital & SCF</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/working-capital", "Working capital & SCF")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Treasury operations") && (
                    <Link
                    href="/finance/advanced/treasury"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/treasury") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/treasury", "Treasury operations", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Treasury operations</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/treasury", "Treasury operations")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Financial instruments") && (
                    <Link
                    href="/finance/advanced/financial-instruments"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/financial-instruments") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/financial-instruments", "Financial instruments", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Financial instruments</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/financial-instruments", "Financial instruments")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/advanced/esg-accounting", "Governance & ESG")}
                  {governanceOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {governanceOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("ESG & carbon") && (
                    <Link
                    href="/finance/advanced/esg-accounting"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/esg-accounting") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/esg-accounting", "ESG & carbon accounting", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>ESG & carbon accounting</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/esg-accounting", "ESG & carbon accounting")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Risk management") && (
                    <Link
                    href="/finance/advanced/risk-management"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/risk-management") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/risk-management", "Risk management", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Risk management</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/risk-management", "Risk management")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Consolidation") && (
                    <Link
                    href="/finance/advanced/consolidation"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/consolidation") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/consolidation", "Multi-GAAP consolidation", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Multi-GAAP consolidation</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/consolidation", "Multi-GAAP consolidation")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Tax provisioning") && (
                    <Link
                    href="/finance/advanced/tax-provisioning"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/tax-provisioning") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/tax-provisioning", "ASC 740 tax provisioning", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>ASC 740 tax provisioning</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/tax-provisioning", "ASC 740 tax provisioning")}
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
                <div className={styles.navItemRight}>
                  {renderMoreButton("/finance/advanced/ai-analytics", "AI financial intelligence")}
                  {aiOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>

              {aiOpen && (
                <div className={styles.subItemsContainer}>
                  {isItemMatch("AI financial analytics") && (
                    <Link
                    href="/finance/advanced/ai-analytics"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/ai-analytics") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/ai-analytics", "AI financial analytics", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>AI financial analytics</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/ai-analytics", "AI financial analytics")}
                    </div>
                  </Link>
                  )}
                  {isItemMatch("Financial ratios") && (
                    <Link
                    href="/finance/advanced/financial-ratios"
                      className={`${styles.navItem} ${pathname.startsWith("/finance/advanced/financial-ratios") ? styles.navItemActive : ""}`}
                    
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/financial-ratios", "Financial ratios & health", e)}
                  >
                      <div className={styles.navItemLeft}>
                        <span>Financial ratios & health</span>
                      </div>
                    <div className={styles.navItemRight}>
                      {renderMoreButton("/finance/advanced/financial-ratios", "Financial ratios & health")}
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
              
                    onContextMenu={(e) => onNavContextMenu?.("/finance/advanced", "All enterprise modules", e)}
                  >
                <div className={styles.navItemLeft}>
                  <Layers size={15} className={styles.navItemIcon} />
                  <span>All enterprise modules</span>
                </div>
                    <div className={styles.navItemRight}>
                      <span className={`${styles.navBadge} ${styles.navBadgeBlue}`}>{ALL_FINANCE_MODULES.length}</span>
                      {renderMoreButton("/finance/advanced", "All enterprise modules")}
                    </div>
                  </Link>
            )}
          </div>
        </nav>

        {/* Sticky Bottom Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.periodTrigger}
            onContextMenu={(e) => onNavContextMenu?.("/finance/advanced/close-tasks", "Period Management", e)}
            title="Period: Aug 2026 (Open)"
          >
            <div className={styles.periodLeft}>
              <span className={styles.greenDot} />
              <span>Aug 2026 • Open</span>
            </div>
            <div className={styles.navItemRight}>
              {renderMoreButton("/finance/advanced/close-tasks", "Period Management")}
              <ChevronRight size={14} />
            </div>
          </button>

          <Link
            href="/finance/settings"
            className={`${styles.footerBtn} ${pathname.startsWith("/finance/settings") ? styles.navItemActive : ""}`}
            onContextMenu={(e) => onNavContextMenu?.("/finance/settings", "Settings", e)}
          >
            <div className={styles.navItemLeft}>
              <Settings size={15} />
              <span>Settings</span>
            </div>
            <div className={styles.navItemRight}>
              {renderMoreButton("/finance/settings", "Settings")}
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
};