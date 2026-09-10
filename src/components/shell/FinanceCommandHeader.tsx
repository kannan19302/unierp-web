"use client";

import React, { useState, useRef, useEffect, type FC } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  ChevronDown,
  Bell,
  HelpCircle,
  Sparkles,
  FileText,
  CreditCard,
  Building2,
  Plus,
  Landmark,
  Wallet,
  BarChart3,
  Check,
  Package,
  ShoppingCart,
  Users,
  BookOpen,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import styles from "./FinanceCommandHeader.module.css";

export interface FinanceCommandHeaderProps {
  onOpenCmdPalette?: () => void;
  copilotOpen?: boolean;
  onToggleCopilot?: () => void;
  onOpenHelp?: () => void;
  onOpenUserMenu?: () => void;
  userInitials?: string;
  unreadNotifications?: number;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const ROUTE_NAMES: Record<string, { title: string; section?: string }> = {
  "/finance": { title: "Overview", section: "Finance" },
  "/finance/gl": { title: "General ledger", section: "Accounting" },
  "/finance/journal-entries": { title: "Journal entries", section: "Accounting" },
  "/finance/ar": { title: "Accounts receivable", section: "Cash management" },
  "/finance/ap": { title: "Accounts payable", section: "Cash management" },
  "/finance/invoices": { title: "Invoices", section: "Cash management" },
  "/finance/vendor-bills": { title: "Vendor bills", section: "Cash management" },
  "/finance/banking": { title: "Banking", section: "Cash management" },
  "/finance/assets": { title: "Fixed assets", section: "Tax & assets" },
  "/finance/tax": { title: "Tax & compliance", section: "Tax & assets" },
  "/finance/budget-planning": { title: "Budget & planning", section: "Planning & reporting" },
  "/finance/reports": { title: "Financial reports", section: "Planning & reporting" },
  "/finance/settings": { title: "Settings", section: "Administration" },
  "/finance/advanced/close-tasks": { title: "Close management", section: "Accounting" },
  "/finance/advanced/chart-of-accounts": { title: "Chart of accounts", section: "Accounting" },
};

export const FinanceCommandHeader: FC<FinanceCommandHeaderProps> = ({
  onOpenCmdPalette,
  copilotOpen = false,
  onToggleCopilot,
  onOpenHelp,
  onOpenUserMenu,
  userInitials = "FM",
  unreadNotifications = 12,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const createRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (createRef.current && !createRef.current.contains(target)) {
        setCreateOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(target)) {
        setWorkspaceMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setCreateOpen(false);
        setWorkspaceMenuOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine current page & section for breadcrumbs
  const currentRouteInfo =
    ROUTE_NAMES[pathname] ||
    Object.entries(ROUTE_NAMES).find(([prefix]) => prefix !== "/finance" && pathname.startsWith(prefix))?.[1] || {
      title: "Workspace",
      section: "Finance",
    };

  const workspaces = [
    { id: "finance", name: "Finance", href: "/finance", icon: BookOpen },
    { id: "sales", name: "Sales", href: "/sales", icon: ShoppingCart },
    { id: "inventory", name: "Inventory", href: "/inventory", icon: Package },
    { id: "people", name: "People", href: "/hr", icon: Users },
    { id: "analytics", name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <header className={styles.header} aria-label="Global Command Header">
      {/* Left: Sidebar Toggle (= 3 lines) + UniERP Logo Glyph + Interactive Breadcrumb */}
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.sidebarToggleBtn}
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-label={sidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          aria-expanded={!sidebarCollapsed}
        >
          <Menu size={16} aria-hidden />
        </button>

        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link
            href="/apps"
            className={styles.breadcrumbBrand}
            title="UniERP — Enterprise Platform Launcher"
            aria-label="UniERP app launcher"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={styles.brandGlyph}
              aria-hidden="true"
            >
              <rect width="100" height="100" rx="28" fill="var(--color-primary, #2563eb)" />
              <path
                d="M36 30V58C36 66.284 42.716 73 51 73C59.284 73 66 66.284 66 58V48"
                stroke="var(--color-white, #ffffff)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="66" cy="30" r="7.5" fill="var(--color-primary-subtle, #38bdf8)" />
            </svg>
            <span className={styles.breadcrumbRoot}>UniERP</span>
          </Link>
          <span className={styles.breadcrumbSep} aria-hidden>/</span>

          {/* Finance Workspace Switcher Dropdown */}
          <div className={styles.breadcrumbDropdownWrap} ref={workspaceRef}>
            <button
              type="button"
              className={styles.breadcrumbCurrent}
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              aria-expanded={workspaceMenuOpen}
              title="Switch enterprise workspace"
            >
              <span>Finance</span>
              <ChevronDown size={13} aria-hidden />
            </button>

            {workspaceMenuOpen && (
              <div className={styles.workspaceMenu} role="menu">
                <div className={styles.menuHeader}>Workspaces</div>
                {workspaces.map((ws) => {
                  const isSelected = ws.id === "finance";
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      className={`${styles.workspaceMenuItem} ${isSelected ? styles.workspaceMenuItemActive : ""}`}
                      onClick={() => {
                        setWorkspaceMenuOpen(false);
                        router.push(ws.href);
                      }}
                    >
                      <ws.icon size={14} className={styles.wsIcon} />
                      <span className={styles.wsName}>{ws.name}</span>
                      {isSelected && <Check size={13} className={styles.checkIcon} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {currentRouteInfo.title !== "Overview" && (
            <>
              <span className={styles.breadcrumbSep} aria-hidden>/</span>
              <span className={styles.breadcrumbLeaf} title={currentRouteInfo.title}>
                {currentRouteInfo.title}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className={styles.centerSection}>
        <div role="search" className={styles.searchWrapper}>
          <button
            type="button"
            className={styles.searchBox}
            onClick={onOpenCmdPalette}
            aria-label="Search apps, pages, records and actions"
            aria-keyshortcuts="Control+k"
            title="Search anything (Ctrl+K)"
          >
            <div className={styles.searchLeft}>
              <Search size={14} className={styles.searchIcon} aria-hidden />
              <span aria-hidden>Search anything</span>
            </div>
            <kbd className={styles.shortcutBadge} aria-hidden>Ctrl K</kbd>
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className={styles.rightSection}>
        {/* Create Dropdown */}
        <div className={styles.createContainer} ref={createRef}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setCreateOpen(!createOpen)}
            aria-expanded={createOpen}
            aria-haspopup="menu"
            title="Create new finance transaction or voucher"
          >
            <Plus size={14} aria-hidden />
            <span>Create</span>
            <ChevronDown size={13} aria-hidden />
          </button>

          {createOpen && (
            <div id="header-create-menu" className={styles.createMenu} role="menu">
              <div className={styles.menuHeader}>Transactions & Vouchers</div>
              <Link
                href="/finance/gl?action=new"
                className={styles.createMenuItem}
                role="menuitem"
                onClick={() => setCreateOpen(false)}
              >
                <FileText size={14} className={styles.itemIcon} aria-hidden />
                <div className={styles.createItemInfo}>
                  <span className={styles.createItemTitle}>Journal entry</span>
                  <span className={styles.createItemDesc}>Post general ledger voucher</span>
                </div>
              </Link>
              <Link
                href="/finance/invoices?action=new"
                className={styles.createMenuItem}
                role="menuitem"
                onClick={() => setCreateOpen(false)}
              >
                <CreditCard size={14} className={styles.itemIcon} aria-hidden />
                <div className={styles.createItemInfo}>
                  <span className={styles.createItemTitle}>Customer invoice</span>
                  <span className={styles.createItemDesc}>Accounts receivable billing</span>
                </div>
              </Link>
              <Link
                href="/finance/vendor-bills?action=new"
                className={styles.createMenuItem}
                role="menuitem"
                onClick={() => setCreateOpen(false)}
              >
                <Building2 size={14} className={styles.itemIcon} aria-hidden />
                <div className={styles.createItemInfo}>
                  <span className={styles.createItemTitle}>Vendor bill</span>
                  <span className={styles.createItemDesc}>Accounts payable entry</span>
                </div>
              </Link>
              <Link
                href="/finance/assets?action=new"
                className={styles.createMenuItem}
                role="menuitem"
                onClick={() => setCreateOpen(false)}
              >
                <Landmark size={14} className={styles.itemIcon} aria-hidden />
                <div className={styles.createItemInfo}>
                  <span className={styles.createItemTitle}>Fixed asset</span>
                  <span className={styles.createItemDesc}>Capitalize asset & schedule</span>
                </div>
              </Link>
              <Link
                href="/finance/banking?action=new"
                className={styles.createMenuItem}
                role="menuitem"
                onClick={() => setCreateOpen(false)}
              >
                <Wallet size={14} className={styles.itemIcon} aria-hidden />
                <div className={styles.createItemInfo}>
                  <span className={styles.createItemTitle}>Payment voucher</span>
                  <span className={styles.createItemDesc}>Cash disbursement or receipt</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* AI Copilot Toggle */}
        <button
          type="button"
          className={`${styles.iconBtn} ${copilotOpen ? styles.iconBtnActive : ""}`}
          title="Toggle AI Finance Copilot (Ctrl+J)"
          aria-label="AI Finance Copilot"
          aria-keyshortcuts="Control+j"
          aria-pressed={copilotOpen}
          onClick={onToggleCopilot}
        >
          <Sparkles size={16} aria-hidden />
        </button>

        {/* Notifications Popover */}
        <div className={styles.dropdownWrap} ref={notifRef}>
          <button
            type="button"
            className={`${styles.iconBtn} ${notifOpen ? styles.iconBtnActive : ""}`}
            title="Notifications"
            aria-label={`${unreadNotifications} unread notifications`}
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell size={16} aria-hidden />
            {unreadNotifications > 0 && (
              <span className={styles.notifBadge} aria-label={`${unreadNotifications} unread`}>
                {unreadNotifications}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.popoverMenu} role="dialog" aria-label="Notifications list">
              <div className={styles.popoverHeader}>
                <span className={styles.popoverTitle}>Financial Notifications</span>
                <span className={styles.badgePill}>{unreadNotifications} new</span>
              </div>
              <div className={styles.notifList}>
                <div className={styles.notifItem}>
                  <div className={styles.notifDot} />
                  <div className={styles.notifContent}>
                    <span className={styles.notifHeading}>12 Unposted Journals</span>
                    <span className={styles.notifText}>Review required for pending manual journal vouchers.</span>
                    <span className={styles.notifTime}>10m ago</span>
                  </div>
                </div>
                <div className={styles.notifItem}>
                  <div className={styles.notifDot} />
                  <div className={styles.notifContent}>
                    <span className={styles.notifHeading}>Month-End Close: Aug 2026</span>
                    <span className={styles.notifText}>Checklist tasks ready for supervisor signoff.</span>
                    <span className={styles.notifTime}>1h ago</span>
                  </div>
                </div>
                <div className={styles.notifItem}>
                  <div className={styles.notifDot} />
                  <div className={styles.notifContent}>
                    <span className={styles.notifHeading}>Overdue Customer Invoices</span>
                    <span className={styles.notifText}>3 enterprise invoices have passed net-30 terms.</span>
                    <span className={styles.notifTime}>3h ago</span>
                  </div>
                </div>
              </div>
              <div className={styles.popoverFooter}>
                <button
                  type="button"
                  className={styles.popoverActionBtn}
                  onClick={() => {
                    setNotifOpen(false);
                    router.push("/finance/invoices?status=OVERDUE");
                  }}
                >
                  View all exceptions &gt;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          type="button"
          className={styles.iconBtn}
          title="Keyboard shortcuts & Help (?)"
          aria-label="Help and Documentation"
          onClick={onOpenHelp}
        >
          <HelpCircle size={16} aria-hidden />
        </button>

        {/* User Profile Menu */}
        <div className={styles.dropdownWrap} ref={profileRef}>
          <button
            type="button"
            className={styles.userProfileBtn}
            onClick={() => setProfileOpen(!profileOpen)}
            title="Finance Manager account & tenant options"
            aria-label={`User account: ${userInitials}`}
          >
            <div className={styles.avatar} aria-hidden>
              {userInitials}
              <span className={styles.presenceDot} />
            </div>
          </button>

          {profileOpen && (
            <div className={styles.profileDropdown} role="menu">
              <div className={styles.profileHeader}>
                <div className={styles.profileAvatarLarge}>{userInitials}</div>
                <div className={styles.profileText}>
                  <div className={styles.profileName}>Finance Manager</div>
                  <div className={styles.profileEmail}>test.agent@unierp.com</div>
                  <div className={styles.roleBadge}>
                    <ShieldCheck size={11} />
                    <span>SUPER_ADMIN</span>
                  </div>
                </div>
              </div>

              <div className={styles.tenantInfo}>
                <span className={styles.tenantLabel}>TENANT SCOPE</span>
                <span className={styles.tenantName}>Acme Corp (Default)</span>
              </div>

              <div className={styles.menuDivider} />

              <Link
                href="/finance/settings"
                className={styles.profileMenuItem}
                onClick={() => setProfileOpen(false)}
              >
                <Settings size={14} />
                <span>Finance Settings</span>
              </Link>
              <Link
                href="/apps"
                className={styles.profileMenuItem}
                onClick={() => setProfileOpen(false)}
              >
                <ExternalLink size={14} />
                <span>Switch Application</span>
              </Link>

              <div className={styles.menuDivider} />

              <button
                type="button"
                className={`${styles.profileMenuItem} ${styles.profileLogoutItem}`}
                onClick={() => {
                  setProfileOpen(false);
                  router.push("/login");
                }}
              >
                <LogOut size={14} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
