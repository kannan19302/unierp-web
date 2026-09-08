"use client";

import React, { useState, useEffect, type FC, type ReactNode } from "react";
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
} from "lucide-react";
import { TabbedConsole, type ConsoleTab } from "@kannan19302/ui/shell";
import { FinanceAppRail } from "./FinanceAppRail";
import { FinanceSidebarV2 } from "./FinanceSidebarV2";
import { FinanceCommandHeader } from "./FinanceCommandHeader";
import { CommandPalette } from "./CommandPalette";
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

export const FinanceShellV2: FC<FinanceShellV2Props> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unierp_finance_sidebar_collapsed");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return false;
  });

  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  const handleToggleCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    try {
      localStorage.setItem("unierp_finance_sidebar_collapsed", JSON.stringify(collapsed));
    } catch {}
  };

  // Pre-configured tabs reflecting the active v2 workspace state
  const [tabs, setTabs] = useState<FinanceTab[]>([
    {
      id: "tab-home",
      title: "Home",
      icon: <Home size={14} />,
      pinned: true,
      href: "/finance",
      closable: false,
    },
    {
      id: "tab-overview",
      title: "Finance overview",
      icon: <Clock size={14} />,
      href: "/finance",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-gl",
      title: "General ledger",
      icon: <BookOpen size={14} />,
      href: "/finance/gl",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-je-draft",
      title: "JE-2026-0842",
      icon: <FileText size={14} />,
      href: "/finance/journal-entries?id=JE-2026-0842",
      isDirty: true,
      draftLabel: "Draft",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-inv-0821",
      title: "Invoice INV-0821",
      icon: <FileText size={14} />,
      href: "/finance/ar?id=INV-0821",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-cash-forecast",
      title: "Cash forecast",
      icon: <BarChart3 size={14} />,
      href: "/finance/banking?tab=forecast",
      scope: "UK Operations",
      closable: true,
    },
    {
      id: "tab-payables",
      title: "Payables",
      icon: <FileText size={14} />,
      href: "/finance/ap",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-assets",
      title: "Fixed assets",
      icon: <Building2 size={14} />,
      href: "/finance/assets",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-tax",
      title: "Tax & compliance",
      icon: <Globe size={14} />,
      href: "/finance/tax",
      scope: "ALL ENTITIES",
      closable: true,
    },
    {
      id: "tab-budget",
      title: "Budget & planning",
      icon: <BarChart3 size={14} />,
      href: "/finance/budget-planning",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-reports",
      title: "Financial reports",
      icon: <FileText size={14} />,
      href: "/finance/reports",
      scope: "US Operations",
      closable: true,
    },
    {
      id: "tab-fx",
      title: "FX Revaluation",
      icon: <Globe size={14} />,
      href: "/finance/fx-revaluation",
      scope: "ALL ENTITIES",
      closable: true,
    },
    {
      id: "tab-intercompany",
      title: "Intercompany",
      icon: <Building2 size={14} />,
      href: "/finance/intercompany",
      scope: "ALL ENTITIES",
      closable: true,
    },
    {
      id: "tab-settings",
      title: "Finance settings",
      icon: <Clock size={14} />,
      href: "/finance/settings",
      scope: "US Operations",
      closable: true,
    },
  ]);

  // Compute active tab ID from current pathname
  const activeTabId = React.useMemo(() => {
    if (pathname === "/finance" || pathname === "/finance/") return "tab-overview";
    if (pathname.startsWith("/finance/gl")) return "tab-gl";
    if (pathname.startsWith("/finance/journal-entries")) return "tab-je-draft";
    if (pathname.startsWith("/finance/ar")) return "tab-inv-0821";
    if (pathname.startsWith("/finance/ap")) return "tab-payables";
    if (pathname.startsWith("/finance/banking")) return "tab-cash-forecast";
    if (pathname.startsWith("/finance/assets")) return "tab-assets";
    if (pathname.startsWith("/finance/tax")) return "tab-tax";
    if (pathname.startsWith("/finance/budget-planning")) return "tab-budget";
    if (pathname.startsWith("/finance/reports")) return "tab-reports";
    if (pathname.startsWith("/finance/fx-revaluation")) return "tab-fx";
    if (pathname.startsWith("/finance/intercompany")) return "tab-intercompany";
    if (pathname.startsWith("/finance/settings")) return "tab-settings";
    return "tab-overview";
  }, [pathname]);

  const handleTabChange = (tabId: string) => {
    const targetTab = tabs.find(
      (t) => t.id === tabId || `tab-${t.id}` === tabId || t.id === `tab-${tabId}`
    );
    if (targetTab && targetTab.href) {
      router.push(targetTab.href);
    }
  };

  const handleTabClose = (tabId: string) => {
    setTabs((current) => current.filter((t) => t.id !== tabId));
  };

  // Proactively prefetch all finance tab routes in background idle time
  // so tab switching is instantaneous (<100ms) without on-demand compile delays.
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        tabs.forEach((tab) => {
          if (tab.href && tab.href.startsWith("/finance")) {
            router.prefetch(tab.href);
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tabs, router]);

  const handleNewTab = () => {
    router.push("/finance/gl");
  };

  return (
    <div className={styles.shellContainer} data-theme="strata">
      {/* 52px Primary App Rail */}
      <FinanceAppRail
        activeApp="finance"
        userInitials="FM"
        onOpenApps={() => router.push("/apps")}
      />

      {/* 232px Expandable Finance Navigation Pane */}
      <FinanceSidebarV2
        collapsed={sidebarCollapsed}
        setCollapsed={handleToggleCollapse}
        pathname={pathname}
      />

      {/* Main Workspace Area */}
      <div className={styles.workspaceMain}>
        {/* 44px Global Command Header */}
        <FinanceCommandHeader
          onOpenCmdPalette={() => setCmdPaletteOpen(true)}
          userInitials="FM"
          unreadNotifications={12}
        />

        {/* 38px In-App Workspace Document Tab Strip */}
        <div className={styles.tabStripWrapper}>
          <TabbedConsole
            {...({
              tabs: tabs as any,
              activeTabId,
              onTabChange: handleTabChange,
              onTabClose: handleTabClose,
              onNewTab: handleNewTab,
              canCreateTab: true,
              searchable: true,
              density: "compact",
            } as any)}
          />
        </div>

        {/* 30px Strata Operational Context Bar */}
        <header className={styles.contextBar} aria-label="Operational Context">
          <div className={styles.contextLeft}>
            <div className={styles.contextSegment}>
              <Building2 size={13} className={styles.contextIcon} aria-hidden />
              <span>Acme Corp</span>
            </div>
            <span className={styles.contextSep}>&gt;</span>
            <div className={styles.contextSegment}>
              <Globe size={13} className={styles.contextIcon} aria-hidden />
              <span>US Operations</span>
            </div>
            <span className={styles.contextSep}>&gt;</span>
            <div className={styles.contextSegment}>
              <Calendar size={13} className={styles.contextIcon} aria-hidden />
              <span>Aug 2026</span>
            </div>
            <span className={styles.contextSep}>&gt;</span>
            <div className={styles.contextSegment}>
              <DollarSign size={13} className={styles.contextIcon} aria-hidden />
              <span className={styles.contextTerminal}>USD</span>
            </div>
          </div>

          <div className={styles.contextRight}>
            <button
              type="button"
              className={styles.periodBadge}
              title="Accounting period status"
            >
              <span className={styles.greenDot} />
              <span>Period: Open</span>
              <ChevronDown size={12} aria-hidden />
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className={styles.scrollArea} id="finance-main-content">
          {children}
        </main>
      </div>

      {/* Command Palette (Ctrl+K) */}
      {cmdPaletteOpen && (
        <CommandPalette
          isOpen={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          GLOBAL_SEARCH_ITEMS={[
            { name: "Finance Overview", href: "/finance", icon: Clock as any, type: "Page", slug: "finance" },
            { name: "General Ledger", href: "/finance/gl", icon: BookOpen as any, type: "Page", slug: "finance" },
            { name: "Accounts Receivable", href: "/finance/ar", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Accounts Payable", href: "/finance/ap", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Banking & Treasury", href: "/finance/banking", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Fixed Assets", href: "/finance/assets", icon: Building2 as any, type: "Page", slug: "finance" },
            { name: "Tax & Compliance", href: "/finance/tax", icon: FileText as any, type: "Page", slug: "finance" },
            { name: "Budget & Planning", href: "/finance/budget-planning", icon: BarChart3 as any, type: "Page", slug: "finance" },
            { name: "Financial Reports", href: "/finance/reports", icon: BarChart3 as any, type: "Page", slug: "finance" },
            { name: "Finance Settings", href: "/finance/settings", icon: Building2 as any, type: "Page", slug: "finance" },
          ]}
        />
      )}
    </div>
  );
};
