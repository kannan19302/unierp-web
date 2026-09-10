"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FC,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Globe,
  Calendar,
  DollarSign,
  ChevronDown,
  Clock,
  BookOpen,
  FileText,
  BarChart3,
  Home,
  Wallet,
  PieChart,
  Calculator,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Brain,
  Settings,
  Layers,
  Plus,
  Check,
} from "lucide-react";
import { TabbedConsole } from "@kannan19302/ui/shell";
import { FinanceAppRail } from "./FinanceAppRail";
import { FinanceSidebarV2 } from "./FinanceSidebarV2";
import { FinanceCommandHeader } from "./FinanceCommandHeader";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { TabContextMenu, type ContextMenuTarget } from "./TabContextMenu";
import { FinanceTabProvider } from "./FinanceTabContext";
import { useFinanceKeyboard } from "@/hooks/useFinanceKeyboard";
import { useFinanceScope } from "./FinanceScopeContext";
import styles from "./FinanceShellV2.module.css";

export interface FinanceShellV2Props {
  children: ReactNode;
}

export interface FinanceTab {
  id: string;
  title: string;
  icon?: ReactNode;
  pinned?: boolean;
  isDirty?: boolean;
  draftLabel?: string;
  scope?: string;
  href: string;
  closable?: boolean;
}

// ── Route → tab metadata map ────────────────────────────────────────────────
type RouteEntry = {
  prefix: string;
  exact?: boolean;
  id: string;
  title: string;
  icon: ReactNode;
};

const ROUTE_MAP: RouteEntry[] = [
  { prefix: "/finance", exact: true, id: "tab-home",       title: "Overview",                  icon: <Home size={14} /> },
  { prefix: "/finance/gl",                  id: "tab-gl",         title: "General ledger",            icon: <BookOpen size={14} /> },
  { prefix: "/finance/journal-entries",     id: "tab-je",         title: "Journal entries",           icon: <FileText size={14} /> },
  { prefix: "/finance/ar",                  id: "tab-ar",         title: "Accounts receivable",       icon: <FileText size={14} /> },
  { prefix: "/finance/ap",                  id: "tab-ap",         title: "Accounts payable",          icon: <FileText size={14} /> },
  { prefix: "/finance/invoices",            id: "tab-invoices",   title: "Invoices",                  icon: <FileText size={14} /> },
  { prefix: "/finance/vendor-bills",        id: "tab-bills",      title: "Vendor bills",              icon: <FileText size={14} /> },
  { prefix: "/finance/banking",             id: "tab-banking",    title: "Banking",                   icon: <Wallet size={14} /> },
  { prefix: "/finance/assets",             id: "tab-assets",     title: "Fixed assets",              icon: <Building2 size={14} /> },
  { prefix: "/finance/tax",                 id: "tab-tax",        title: "Tax & compliance",          icon: <Globe size={14} /> },
  { prefix: "/finance/budget-planning",     id: "tab-budget",     title: "Budget & planning",         icon: <BarChart3 size={14} /> },
  { prefix: "/finance/reports",             id: "tab-reports",    title: "Financial reports",         icon: <BarChart3 size={14} /> },
  { prefix: "/finance/fx-revaluation",      id: "tab-fx",         title: "FX revaluation",            icon: <Globe size={14} /> },
  { prefix: "/finance/intercompany",        id: "tab-ic",         title: "Intercompany",              icon: <Building2 size={14} /> },
  { prefix: "/finance/recurring",           id: "tab-recurring",  title: "Recurring entries",         icon: <Clock size={14} /> },
  { prefix: "/finance/expenses",            id: "tab-expenses",   title: "Expenses",                  icon: <FileText size={14} /> },
  { prefix: "/finance/advanced/chart-of-accounts", id: "tab-coa", title: "Chart of accounts",        icon: <BookOpen size={14} /> },
  { prefix: "/finance/advanced/revenue-schedules",  id: "tab-rev", title: "Revenue recognition",     icon: <TrendingUp size={14} /> },
  { prefix: "/finance/advanced/subscriptions",      id: "tab-sub", title: "Subscriptions & ARR",     icon: <TrendingUp size={14} /> },
  { prefix: "/finance/advanced/cash-flow-forecast", id: "tab-cf",  title: "Cash flow forecast",      icon: <PieChart size={14} /> },
  { prefix: "/finance/advanced/working-capital",    id: "tab-wc",  title: "Working capital",         icon: <PieChart size={14} /> },
  { prefix: "/finance/advanced/treasury",           id: "tab-trs", title: "Treasury operations",     icon: <Landmark size={14} /> },
  { prefix: "/finance/advanced/financial-instruments", id: "tab-fi", title: "Financial instruments", icon: <Landmark size={14} /> },
  { prefix: "/finance/advanced/esg-accounting",     id: "tab-esg", title: "ESG & carbon",            icon: <ShieldCheck size={14} /> },
  { prefix: "/finance/advanced/risk-management",    id: "tab-risk", title: "Risk management",        icon: <ShieldCheck size={14} /> },
  { prefix: "/finance/advanced/consolidation",      id: "tab-cons", title: "Consolidation",          icon: <Layers size={14} /> },
  { prefix: "/finance/advanced/tax-provisioning",   id: "tab-taxp", title: "Tax provisioning",       icon: <Calculator size={14} /> },
  { prefix: "/finance/advanced/ai-analytics",       id: "tab-ai",  title: "AI analytics",            icon: <Brain size={14} /> },
  { prefix: "/finance/advanced/financial-ratios",   id: "tab-fr",  title: "Financial ratios",        icon: <Brain size={14} /> },
  { prefix: "/finance/advanced/bank-feeds",         id: "tab-bf",  title: "Bank feeds",              icon: <Wallet size={14} /> },
  { prefix: "/finance/advanced/intercompany",       id: "tab-ica", title: "Intercompany (advanced)", icon: <Building2 size={14} /> },
  { prefix: "/finance/advanced/close-tasks",        id: "tab-close", title: "Close management",      icon: <Clock size={14} /> },
  { prefix: "/finance/advanced/journal-entries",    id: "tab-adv-je", title: "Advanced journals",    icon: <FileText size={14} /> },
  { prefix: "/finance/advanced",                    id: "tab-adv",  title: "All enterprise modules", icon: <Layers size={14} /> },
  { prefix: "/finance/settings",                    id: "tab-settings", title: "Finance settings",   icon: <Settings size={14} /> },
];

function routeToTab(pathname: string): RouteEntry | undefined {
  let best: RouteEntry | undefined;
  let bestLen = -1;
  for (const entry of ROUTE_MAP) {
    if (entry.exact) {
      if (pathname === entry.prefix && entry.prefix.length > bestLen) {
        best = entry;
        bestLen = entry.prefix.length;
      }
    } else {
      if (pathname.startsWith(entry.prefix) && entry.prefix.length > bestLen) {
        best = entry;
        bestLen = entry.prefix.length;
      }
    }
  }
  return best;
}

const DEFAULT_HOME_TAB: FinanceTab = {
  id: "tab-home",
  title: "Overview",
  icon: <Home size={14} />,
  pinned: true,
  href: "/finance",
  closable: false,
};

export const FinanceShellV2: FC<FinanceShellV2Props> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth <= 768) return true;
      try {
        const saved = localStorage.getItem("unierp_finance_sidebar_collapsed");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  }, [pathname]);

  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  // ── Context Scope State ───────────────────────────────────────────────────
  const scope = useFinanceScope();
  const scopeEntity = scope.entity;
  const setScopeEntity = scope.setEntity;
  const scopeUnit = scope.unit;
  const setScopeUnit = scope.setUnit;
  const scopePeriod = scope.period;
  const setScopePeriod = scope.setPeriod;
  const scopeCurrency = scope.currency;
  const setScopeCurrency = scope.setCurrency;
  const periodStatus = scope.periodStatus;
  const setPeriodStatus = scope.setPeriodStatus;

  const [activeScopeDropdown, setActiveScopeDropdown] = useState<"entity" | "unit" | "period" | "currency" | "status" | null>(null);

  // ── Tab Management & Persistence ──────────────────────────────────────────
  const [tabs, setTabs] = useState<FinanceTab[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("unierp_finance_open_tabs");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item) => {
              const match = routeToTab(item.href.split("?")[0]);
              return {
                id: item.id,
                title: item.title || match?.title || "Workspace",
                icon: match?.icon ?? <FileText size={14} />,
                href: item.href,
                pinned: item.pinned ?? item.id === "tab-home",
                closable: item.closable ?? item.id !== "tab-home",
              };
            });
          }
        }
      } catch {}
    }
    return [DEFAULT_HOME_TAB];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const match = routeToTab(pathname);
    return match?.id ?? "tab-home";
  });

  // Sync open tabs to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const serialized = tabs.map((t) => ({
          id: t.id,
          title: t.title,
          href: t.href,
          pinned: t.pinned,
          closable: t.closable,
        }));
        sessionStorage.setItem("unierp_finance_open_tabs", JSON.stringify(serialized));
      } catch {}
    }
  }, [tabs]);

  // Open / activate a tab when pathname changes
  useEffect(() => {
    const match = routeToTab(pathname);
    if (!match) return;

    setTabs((prev) => {
      const exists = prev.find((t) => t.id === match.id);
      if (exists) {
        // Tab exists, update href if query params changed
        return prev.map((t) => (t.id === match.id ? { ...t, href: pathname } : t));
      }
      return [
        ...prev,
        {
          id: match.id,
          title: match.title,
          icon: match.icon,
          href: pathname,
          closable: match.id !== "tab-home",
        },
      ];
    });
    setActiveTabId(match.id);
  }, [pathname]);

  // Dedicated openAppTab API provided via context to all child pages
  const openAppTab = useCallback(
    ({
      id,
      href,
      title,
      icon,
    }: {
      id?: string;
      href: string;
      title: string;
      icon?: ReactNode;
    }) => {
      const syntheticPathname = href.split("?")[0];
      const match = routeToTab(syntheticPathname);
      const tabId = id ?? match?.id ?? `tab-${href.replace(/[^a-zA-Z0-9]/g, "-")}`;
      const tabTitle = title || match?.title || "Workspace";
      const tabIcon = icon ?? match?.icon ?? <FileText size={14} />;

      setTabs((prev) => {
        const existing = prev.find((t) => t.id === tabId || t.href === href);
        if (existing) {
          return prev.map((t) => (t.id === existing.id ? { ...t, href } : t));
        }
        return [
          ...prev,
          {
            id: tabId,
            title: tabTitle,
            icon: tabIcon,
            href,
            closable: true,
          },
        ];
      });

      setActiveTabId(tabId);
      router.push(href);
    },
    [router]
  );

  // Listen for custom event from NavContextMenu "Open in app tab"
  useEffect(() => {
    function handleOpenTab(e: Event) {
      const { href, label } = (e as CustomEvent<{ href: string; label: string }>).detail;
      openAppTab({ href, title: label });
    }
    window.addEventListener("finance:open-tab", handleOpenTab);
    return () => window.removeEventListener("finance:open-tab", handleOpenTab);
  }, [openAppTab]);

  const sidebarSearchRef = useRef<HTMLInputElement>(null);

  const handleToggleCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem("unierp_finance_sidebar_collapsed", JSON.stringify(collapsed));
    } catch {}
  };

  const handleTabChange = (tabId: string) => {
    const target = tabs.find((t) => t.id === tabId);
    if (target?.href) {
      setActiveTabId(tabId);
      router.push(target.href);
    }
  };

  // ── Recently Closed Tabs History for Reopen ──────────────────────────────
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<FinanceTab[]>([]);

  const recordClosedTabs = useCallback((closed: FinanceTab[]) => {
    const eligible = closed.filter((t) => t.closable !== false && t.id !== "tab-home");
    if (eligible.length > 0) {
      setRecentlyClosedTabs((prev) => [...prev, ...eligible].slice(-20));
    }
  }, []);

  // Fixed handleTabClose: compute navigation outside setState updater
  const handleTabClose = useCallback(
    (tabId: string) => {
      const tabToClose = tabs.find((t) => t.id === tabId);
      if (!tabToClose || tabToClose.closable === false || tabToClose.pinned) return;
      const closedIdx = tabs.findIndex((t) => t.id === tabId);
      const nextTabs = tabs.filter((t) => t.id !== tabId);
      setTabs(nextTabs);
      recordClosedTabs([tabToClose]);

      if (activeTabId === tabId && nextTabs.length > 0) {
        const newActiveIdx = Math.min(Math.max(0, closedIdx - 1), nextTabs.length - 1);
        const newActive = nextTabs[newActiveIdx];
        setActiveTabId(newActive.id);
        router.push(newActive.href);
      }
    },
    [tabs, activeTabId, router, recordClosedTabs]
  );

  const handleCloseOtherTabs = useCallback(
    (tabId: string) => {
      const closed = tabs.filter((t) => t.id !== tabId && t.closable !== false && !t.pinned);
      recordClosedTabs(closed);
      const target = tabs.find((t) => t.id === tabId);
      const nextTabs = tabs.filter((t) => t.id === tabId || !t.closable || t.pinned);
      setTabs(nextTabs);
      if (target && activeTabId !== tabId) {
        setActiveTabId(target.id);
        router.push(target.href);
      }
    },
    [tabs, activeTabId, router, recordClosedTabs]
  );

  const handleCloseTabsToRight = useCallback(
    (tabId: string) => {
      const idx = tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return;
      const closed = tabs.filter((t, i) => i > idx && t.closable !== false && !t.pinned);
      recordClosedTabs(closed);
      const nextTabs = tabs.filter((t, i) => i <= idx || !t.closable || t.pinned);
      setTabs(nextTabs);
      if (!nextTabs.some((t) => t.id === activeTabId)) {
        const target = tabs[idx];
        if (target) {
          setActiveTabId(target.id);
          router.push(target.href);
        }
      }
    },
    [tabs, activeTabId, router, recordClosedTabs]
  );

  const handleCloseTabsToLeft = useCallback(
    (tabId: string) => {
      const idx = tabs.findIndex((t) => t.id === tabId);
      if (idx <= 0) return;
      const closed = tabs.filter((t, i) => i < idx && t.closable !== false && !t.pinned);
      recordClosedTabs(closed);
      const nextTabs = tabs.filter((t, i) => i >= idx || !t.closable || t.pinned);
      setTabs(nextTabs);
      if (!nextTabs.some((t) => t.id === activeTabId)) {
        const target = tabs[idx];
        if (target) {
          setActiveTabId(target.id);
          router.push(target.href);
        }
      }
    },
    [tabs, activeTabId, router, recordClosedTabs]
  );

  const handleCloseAllTabs = useCallback(() => {
    const closed = tabs.filter((t) => t.closable !== false && !t.pinned);
    recordClosedTabs(closed);
    const nextTabs = tabs.filter((t) => !t.closable || t.pinned);
    const safeTabs = nextTabs.length > 0 ? nextTabs : [DEFAULT_HOME_TAB];
    setTabs(safeTabs);
    const target = safeTabs.find((t) => t.id === activeTabId) ?? safeTabs[0];
    setActiveTabId(target.id);
    router.push(target.href);
  }, [tabs, activeTabId, router, recordClosedTabs]);

  const handleReopenClosedTab = useCallback(() => {
    if (recentlyClosedTabs.length === 0) return;
    const lastClosed = recentlyClosedTabs[recentlyClosedTabs.length - 1];
    setRecentlyClosedTabs((prev) => prev.slice(0, -1));
    setTabs((prev) => {
      if (prev.some((t) => t.id === lastClosed.id)) {
        return prev;
      }
      return [...prev, lastClosed];
    });
    setActiveTabId(lastClosed.id);
    router.push(lastClosed.href);
  }, [recentlyClosedTabs, router]);

  const handleDuplicateTab = useCallback(
    (tabId: string) => {
      const tabToDup = tabs.find((t) => t.id === tabId);
      if (!tabToDup) return;
      const newId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newTab: FinanceTab = {
        ...tabToDup,
        id: newId,
        title: `${tabToDup.title} (2)`,
        pinned: false,
        closable: true,
      };
      const currentIdx = tabs.findIndex((t) => t.id === tabId);
      const nextTabs = [...tabs];
      nextTabs.splice(currentIdx + 1, 0, newTab);
      setTabs(nextTabs);
      setActiveTabId(newId);
      router.push(newTab.href);
    },
    [tabs, router]
  );

  const handleTogglePinTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        if (idx === -1) return prev;
        const target = prev[idx];
        const willPin = !target.pinned;
        const updated = {
          ...target,
          pinned: willPin,
          closable: willPin ? false : target.id !== "tab-home",
        };
        const without = prev.filter((_, i) => i !== idx);
        if (willPin) {
          let lastPinned = -1;
          for (let i = 0; i < without.length; i++) {
            if (without[i].pinned) lastPinned = i;
          }
          without.splice(lastPinned + 1, 0, updated);
          return without;
        } else {
          const firstUnpinned = without.findIndex((t) => !t.pinned);
          if (firstUnpinned === -1) {
            without.push(updated);
          } else {
            without.splice(firstUnpinned, 0, updated);
          }
          return without;
        }
      });
    },
    []
  );

  const handleMoveTab = useCallback(
    (tabId: string, direction: "left" | "right") => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        if (idx === -1) return prev;
        const newIdx = direction === "left" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= prev.length) return prev;
        const next = [...prev];
        const [item] = next.splice(idx, 1);
        next.splice(newIdx, 0, item);
        return next;
      });
    },
    []
  );

  const handleReloadTab = useCallback(
    (tabId: string) => {
      const target = tabs.find((t) => t.id === tabId);
      if (target?.href) {
        if (target.id === activeTabId) {
          router.refresh();
        } else {
          setActiveTabId(target.id);
          router.push(target.href);
        }
      }
    },
    [tabs, activeTabId, router]
  );

  const handleNewTab = () => {
    router.push("/finance");
  };

  // Keyboard shortcut Ctrl+Shift+T / Cmd+Shift+T for reopening closed tabs
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        handleReopenClosedTab();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReopenClosedTab]);

  // ── Right-click context menu ──────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{
    target: ContextMenuTarget;
    position: { x: number; y: number };
  } | null>(null);

  const openContextMenu = useCallback(
    (target: ContextMenuTarget, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ target, position: { x: e.clientX, y: e.clientY } });
    },
    []
  );

  const handleNavContextMenu = useCallback(
    (href: string, label: string, e: React.MouseEvent) => {
      openContextMenu({ type: "nav", href, label }, e);
    },
    [openContextMenu]
  );

  const handleTabStripContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const tabEl = (e.target as HTMLElement).closest('[role="tab"]');
      if (tabEl && tabEl.id) {
        const rawId = tabEl.id.startsWith("tab-") ? tabEl.id.slice(4) : tabEl.id;
        const clickedTab = tabs.find((t) => t.id === rawId || `tab-${t.id}` === tabEl.id);
        if (clickedTab) {
          const index = tabs.indexOf(clickedTab);
          openContextMenu(
            {
              type: "tab",
              tabId: clickedTab.id,
              tabTitle: clickedTab.title,
              tabHref: clickedTab.href,
              pinned: clickedTab.pinned ?? false,
              closable: clickedTab.closable !== false && clickedTab.id !== "tab-home",
              index,
              totalTabs: tabs.length,
            },
            e
          );
          return;
        }
      }

      // Empty area of tab strip clicked
      openContextMenu(
        {
          type: "tabstrip",
          canReopen: recentlyClosedTabs.length > 0,
          reopenTitle: recentlyClosedTabs[recentlyClosedTabs.length - 1]?.title,
        },
        e
      );
    },
    [tabs, recentlyClosedTabs, openContextMenu]
  );

  // Global right-click handler for the shell workspace
  const handleGlobalContextMenu = (e: React.MouseEvent) => {
    // Only open generic context menu if not clicking on an interactive control
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest("button") || targetEl.closest("a") || targetEl.closest("input")) {
      return;
    }
    openContextMenu({ type: "nav", href: pathname, label: "Current View" }, e);
  };

  // Close scope dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.contextBar}`)) {
        setActiveScopeDropdown(null);
      }
    }
    if (activeScopeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeScopeDropdown]);

  // Prefetch all tab routes after mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      ROUTE_MAP.forEach((entry) => router.prefetch(entry.prefix));
    }, 800);
    return () => clearTimeout(timer);
  }, [router]);

  // Global keyboard shortcuts
  const isAnyModalOpen = cmdPaletteOpen || shortcutsHelpOpen;

  useFinanceKeyboard({
    onOpenSearch: () => setCmdPaletteOpen(true),
    onToggleCopilot: () => setCopilotOpen((v) => !v),
    onToggleSidebar: () => handleToggleCollapse(!sidebarCollapsed),
    sidebarSearchRef,
    onActivateTab: (index) => {
      const closable = tabs.filter((t) => t.closable !== false);
      const target = closable[index];
      if (target) handleTabChange(target.id);
    },
    onOpenHelp: () => setShortcutsHelpOpen(true),
    isModalOpen: isAnyModalOpen,
  });

  return (
    <FinanceTabProvider
      value={{
        openAppTab,
        closeTab: handleTabClose,
        activeTabId,
        tabs,
      }}
    >
      <div
        className={styles.shellContainer}
        data-theme="strata"
        onContextMenu={handleGlobalContextMenu}
      >
        {/* Skip-to-main-content link (WCAG 2.4.1) */}
        <a href="#finance-main-content" className={styles.skipLink}>
          Skip to main content
        </a>

        {/* 52px Primary App Rail */}
        <FinanceAppRail
          userInitials="FM"
          onOpenApps={() => router.push("/apps")}
          onOpenHelp={() => setShortcutsHelpOpen(true)}
          onOpenUserMenu={() => router.push("/finance/settings")}
          onToggleSidebar={() => handleToggleCollapse(!sidebarCollapsed)}
        />

        {/* Expandable & Resizable Finance Navigation Pane */}
        <FinanceSidebarV2
          collapsed={sidebarCollapsed}
          setCollapsed={handleToggleCollapse}
          pathname={pathname}
          searchRef={sidebarSearchRef}
          onNavContextMenu={handleNavContextMenu}
        />

        {/* Mobile backdrop overlay to dismiss off-canvas drawer */}
        {!sidebarCollapsed && (
          <div
            className={styles.mobileBackdrop}
            onClick={() => handleToggleCollapse(true)}
            aria-hidden="true"
          />
        )}

        {/* Main Workspace Area */}
        <div className={styles.workspaceMain}>
          {/* 44px Global Command Header */}
          <FinanceCommandHeader
            onOpenCmdPalette={() => setCmdPaletteOpen(true)}
            copilotOpen={copilotOpen}
            onToggleCopilot={() => setCopilotOpen((v) => !v)}
            onOpenHelp={() => setShortcutsHelpOpen(true)}
            onOpenUserMenu={() => router.push("/finance/settings")}
            userInitials="FM"
            unreadNotifications={12}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => handleToggleCollapse(!sidebarCollapsed)}
          />

          {/* 38px In-App Workspace Document Tab Strip */}
          <div className={styles.tabStripWrapper} onContextMenu={handleTabStripContextMenu}>
            <TabbedConsole
              tabs={tabs as any}
              activeTabId={activeTabId}
              onTabChange={handleTabChange}
              onTabClose={handleTabClose}
              onNewTab={handleNewTab}
              canCreateTab={true}
              searchable={true}
              density="compact"
            />
          </div>

          {/* 30px Strata Operational Context Bar */}
          <header className={styles.contextBar} aria-label="Operational Context">
            <div className={styles.contextLeft}>
              {/* Entity Picker */}
              <div className={styles.contextDropdownWrap}>
                <button
                  type="button"
                  className={styles.contextBtn}
                  onClick={() =>
                    setActiveScopeDropdown((prev) => (prev === "entity" ? null : "entity"))
                  }
                  title="Operating Entity"
                >
                  <Building2 size={13} className={styles.contextIcon} aria-hidden />
                  <span>{scopeEntity}</span>
                  <ChevronDown size={11} aria-hidden />
                </button>
                {activeScopeDropdown === "entity" && (
                  <div className={styles.scopeMenu}>
                    {["Acme Corp", "Acme Global Holdings", "Acme EMEA Ltd", "Acme APAC Pte"].map(
                      (ent) => (
                        <button
                          key={ent}
                          type="button"
                          className={`${styles.scopeMenuItem} ${ent === scopeEntity ? styles.scopeMenuItemActive : ""}`}
                          onClick={() => {
                            setScopeEntity(ent);
                            setActiveScopeDropdown(null);
                          }}
                        >
                          <span>{ent}</span>
                          {ent === scopeEntity && <Check size={12} />}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <span className={styles.contextSep}>&gt;</span>

              {/* Operating Unit Picker */}
              <div className={styles.contextDropdownWrap}>
                <button
                  type="button"
                  className={styles.contextBtn}
                  onClick={() =>
                    setActiveScopeDropdown((prev) => (prev === "unit" ? null : "unit"))
                  }
                  title="Operating Unit"
                >
                  <Globe size={13} className={styles.contextIcon} aria-hidden />
                  <span>{scopeUnit}</span>
                  <ChevronDown size={11} aria-hidden />
                </button>
                {activeScopeDropdown === "unit" && (
                  <div className={styles.scopeMenu}>
                    {["US Operations", "UK & Ireland", "DACH Region", "Global Consolidated"].map(
                      (unit) => (
                        <button
                          key={unit}
                          type="button"
                          className={`${styles.scopeMenuItem} ${unit === scopeUnit ? styles.scopeMenuItemActive : ""}`}
                          onClick={() => {
                            setScopeUnit(unit);
                            setActiveScopeDropdown(null);
                          }}
                        >
                          <span>{unit}</span>
                          {unit === scopeUnit && <Check size={12} />}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <span className={styles.contextSep}>&gt;</span>

              {/* Fiscal Period Picker */}
              <div className={styles.contextDropdownWrap}>
                <button
                  type="button"
                  className={styles.contextBtn}
                  onClick={() =>
                    setActiveScopeDropdown((prev) => (prev === "period" ? null : "period"))
                  }
                  title="Fiscal Period"
                >
                  <Calendar size={13} className={styles.contextIcon} aria-hidden />
                  <span>{scopePeriod}</span>
                  <ChevronDown size={11} aria-hidden />
                </button>
                {activeScopeDropdown === "period" && (
                  <div className={styles.scopeMenu}>
                    {["Aug 2026", "Jul 2026", "Jun 2026", "Q2 2026", "FY 2026 YTD"].map(
                      (per) => (
                        <button
                          key={per}
                          type="button"
                          className={`${styles.scopeMenuItem} ${per === scopePeriod ? styles.scopeMenuItemActive : ""}`}
                          onClick={() => {
                            setScopePeriod(per);
                            setActiveScopeDropdown(null);
                          }}
                        >
                          <span>{per}</span>
                          {per === scopePeriod && <Check size={12} />}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <span className={styles.contextSep}>&gt;</span>

              {/* Presentation Currency Picker */}
              <div className={styles.contextDropdownWrap}>
                <button
                  type="button"
                  className={styles.contextBtn}
                  onClick={() =>
                    setActiveScopeDropdown((prev) => (prev === "currency" ? null : "currency"))
                  }
                  title="Presentation Currency"
                >
                  <DollarSign size={13} className={styles.contextIcon} aria-hidden />
                  <span className={styles.contextTerminal}>{scopeCurrency}</span>
                  <ChevronDown size={11} aria-hidden />
                </button>
                {activeScopeDropdown === "currency" && (
                  <div className={styles.scopeMenu}>
                    {["USD ($)", "EUR (€)", "GBP (£)", "CAD ($)", "AUD ($)", "JPY (¥)"].map(
                      (curr) => {
                        const code = curr.split(" ")[0];
                        return (
                          <button
                            key={curr}
                            type="button"
                            className={`${styles.scopeMenuItem} ${code === scopeCurrency ? styles.scopeMenuItemActive : ""}`}
                            onClick={() => {
                              setScopeCurrency(code);
                              setActiveScopeDropdown(null);
                            }}
                          >
                            <span>{curr}</span>
                            {code === scopeCurrency && <Check size={12} />}
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.contextRight}>
              <div className={styles.contextDropdownWrap}>
                <button
                  type="button"
                  className={styles.periodBadge}
                  onClick={() =>
                    setActiveScopeDropdown((prev) => (prev === "status" ? null : "status"))
                  }
                  title="Accounting period status"
                  aria-label={`Accounting period: ${periodStatus}`}
                >
                  <span
                    className={
                      periodStatus === "Open"
                        ? styles.greenDot
                        : periodStatus === "Closing"
                        ? styles.amberDot
                        : styles.redDot
                    }
                    aria-hidden
                  />
                  <span>Period: {periodStatus}</span>
                  <ChevronDown size={12} aria-hidden />
                </button>
                {activeScopeDropdown === "status" && (
                  <div className={styles.scopeMenuRight}>
                    {(["Open", "Closing", "Closed"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        className={`${styles.scopeMenuItem} ${st === periodStatus ? styles.scopeMenuItemActive : ""}`}
                        onClick={() => {
                          setPeriodStatus(st);
                          setActiveScopeDropdown(null);
                        }}
                      >
                        <span>Period: {st}</span>
                        {st === periodStatus && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Scrollable Page Content with unrestricted text selection */}
          <main className={styles.scrollArea} id="finance-main-content" tabIndex={-1}>
            {children}
          </main>
        </div>

        {/* Command Palette (Ctrl+K) */}
        <CommandPalette
          isOpen={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          GLOBAL_SEARCH_ITEMS={[
            { name: "Finance Overview", href: "/finance", icon: Home as any, type: "Page", slug: "finance" },
            { name: "General Ledger", href: "/finance/gl", icon: BookOpen as any, type: "Page", slug: "finance" },
            { name: "Journal Entries", href: "/finance/journal-entries", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Accounts Receivable", href: "/finance/ar", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Accounts Payable", href: "/finance/ap", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Invoices", href: "/finance/invoices", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Vendor Bills", href: "/finance/vendor-bills", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Banking & Feeds", href: "/finance/banking", icon: Wallet as any, type: "Page", slug: "finance" },
            { name: "Fixed Assets", href: "/finance/assets", icon: Building2 as any, type: "Page", slug: "finance" },
            { name: "Tax & Compliance", href: "/finance/tax", icon: Globe as any, type: "Page", slug: "finance" },
            { name: "Budget & Planning", href: "/finance/budget-planning", icon: BarChart3 as any, type: "Page", slug: "finance" },
            { name: "Financial Reports", href: "/finance/reports", icon: BarChart3 as any, type: "Page", slug: "finance" },
            { name: "Close Management", href: "/finance/advanced/close-tasks", icon: Clock as any, type: "Page", slug: "finance" },
            { name: "Chart of Accounts", href: "/finance/advanced/chart-of-accounts", icon: BookOpen as any, type: "Page", slug: "finance" },
            { name: "Subscriptions & ARR", href: "/finance/advanced/subscriptions", icon: TrendingUp as any, type: "Page", slug: "finance" },
            { name: "Cash Flow Forecast", href: "/finance/advanced/cash-flow-forecast", icon: PieChart as any, type: "Page", slug: "finance" },
            { name: "Treasury Operations", href: "/finance/advanced/treasury", icon: Landmark as any, type: "Page", slug: "finance" },
            { name: "ESG Accounting", href: "/finance/advanced/esg-accounting", icon: ShieldCheck as any, type: "Page", slug: "finance" },
            { name: "AI Financial Analytics", href: "/finance/advanced/ai-analytics", icon: Brain as any, type: "Page", slug: "finance" },
            { name: "Finance Settings", href: "/finance/settings", icon: Settings as any, type: "Page", slug: "finance" },
            { name: "Post Journal Entry", href: "/finance/gl?action=new", icon: Plus as any, type: "Action", slug: "finance" },
            { name: "Create Customer Invoice", href: "/finance/invoices?action=new", icon: Plus as any, type: "Action", slug: "finance" },
            { name: "Create Vendor Bill", href: "/finance/vendor-bills?action=new", icon: Plus as any, type: "Action", slug: "finance" },
            { name: "Register Fixed Asset", href: "/finance/assets?action=new", icon: Plus as any, type: "Action", slug: "finance" },
            { name: "Import Bank Statement", href: "/finance/banking?action=new", icon: Plus as any, type: "Action", slug: "finance" },
          ]}
        />

        {/* Keyboard Shortcuts Help (? key) */}
        <KeyboardShortcutsHelp
          isOpen={shortcutsHelpOpen}
          onClose={() => setShortcutsHelpOpen(false)}
        />

        {/* Right-click Context Menu */}
        <TabContextMenu
          target={contextMenu?.target ?? null}
          position={contextMenu?.position ?? null}
          onClose={() => setContextMenu(null)}
          onCloseTab={handleTabClose}
          onCloseOtherTabs={handleCloseOtherTabs}
          onCloseTabsToRight={handleCloseTabsToRight}
          onCloseTabsToLeft={handleCloseTabsToLeft}
          onCloseAllTabs={handleCloseAllTabs}
          onDuplicateTab={handleDuplicateTab}
          onTogglePinTab={handleTogglePinTab}
          onMoveTab={handleMoveTab}
          onReloadTab={handleReloadTab}
          onReopenClosedTab={handleReopenClosedTab}
          onNewTab={handleNewTab}
        />
      </div>
    </FinanceTabProvider>
  );
};
