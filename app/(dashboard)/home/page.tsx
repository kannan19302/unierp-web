"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Users,
  Box,
  ShoppingCart,
  ClipboardList,
  Columns3,
  PieChart,
  Settings,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Clock,
  AlertCircle,
  FileText,
  Search,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  HelpCircle,
  Globe,
  Compass,
  X,
  BookOpen,
} from "lucide-react";
import styles from "./home.module.css";
import { useSession } from "@kannan19302/shared/auth-client/react";

interface PinnedApp {
  id: string;
  name: string;
  category: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  color?: string;
}

const DEFAULT_PINNED_APPS: PinnedApp[] = [
  {
    id: "finance",
    name: "Finance",
    category: "Ledger & Cash",
    href: "/finance",
    icon: CreditCard,
  },
  {
    id: "crm",
    name: "CRM",
    category: "Customers & Pipeline",
    href: "/crm",
    icon: Users,
  },
  {
    id: "inventory",
    name: "Inventory",
    category: "Stock & Fulfillment",
    href: "/inventory",
    icon: Box,
  },
  {
    id: "sales",
    name: "Sales",
    category: "Orders & Revenue",
    href: "/sales",
    icon: ClipboardList,
  },
  {
    id: "projects",
    name: "Projects",
    category: "Plans & Delivery",
    href: "/projects",
    icon: Columns3,
  },
  {
    id: "analytics",
    name: "Analytics",
    category: "Reports & Insights",
    href: "/analytics",
    icon: PieChart,
  },
];

interface RecentWorkItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeType: "draft" | "normal";
  href: string;
}

const RECENT_WORK_ITEMS: RecentWorkItem[] = [
  {
    id: "1",
    title: "General Ledger Journal JE-0842",
    subtitle: "Finance · Unposted Draft · Edited 12 mins ago",
    badge: "Draft",
    badgeType: "draft",
    href: "/finance",
  },
  {
    id: "2",
    title: "Enterprise Q3 Pipeline Deal View",
    subtitle: "CRM · Saved Filter View · Yesterday",
    badge: "Saved view",
    badgeType: "normal",
    href: "/crm",
  },
  {
    id: "3",
    title: "Warehouse North Bin Stock Matrix",
    subtitle: "Inventory · 420 SKUs Active · 2 hours ago",
    badge: "Active",
    badgeType: "normal",
    href: "/inventory",
  },
  {
    id: "4",
    title: "Commercial Quotation QT-1049",
    subtitle: "Sales · Acme Industrial Supplies · Pending signature",
    badge: "Quotation",
    badgeType: "normal",
    href: "/sales",
  },
];

interface AttentionItem {
  id: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  actionType: "action" | "required" | "normal";
  href: string;
}

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-1",
    title: "3 Purchase Orders Awaiting Approval",
    subtitle: "Finance & Procurement · Amount $14,250 · Pending review",
    actionLabel: "Review",
    actionType: "action",
    href: "/procurement",
  },
  {
    id: "att-2",
    title: "1 Stock Import Batch Needs Attention",
    subtitle: "Inventory · 4 SKU rows need unit-of-measure mapping",
    actionLabel: "Resolve",
    actionType: "action",
    href: "/inventory",
  },
  {
    id: "att-3",
    title: "Confirm Fiscal Calendar for Period 2026-Q4",
    subtitle: "Finance Setup · Required before next month end closing",
    actionLabel: "Setup",
    actionType: "required",
    href: "/setup",
  },
];

interface PlatformEntry {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
}

const PLATFORM_DIRECTORY: PlatformEntry[] = [
  {
    id: "apps",
    title: "Business Applications Library",
    description: "Launch all 20+ installed operational apps, CRM, and verticals",
    actionLabel: "Explore",
    href: "/apps",
    icon: Box,
  },
  {
    id: "occ",
    title: "Organization Control Center",
    description: "Manage tenant policies, security controls, audit logs, and members",
    actionLabel: "Manage",
    href: "http://localhost:4002",
    icon: Settings,
  },
  {
    id: "developer",
    title: "Developer Platform",
    description: "API access, webhooks, extensions, SDK keys, and schema designer",
    actionLabel: "Console",
    href: "http://localhost:4005",
    icon: Sparkles,
  },
  {
    id: "marketplace",
    title: "Marketplace & Ecosystem",
    description: "Discover verified add-ons, industry cloud packs, and connectors",
    actionLabel: "Browse",
    href: "http://localhost:4006",
    icon: ShoppingCart,
  },
  {
    id: "web-studio",
    title: "Web Studio",
    description: "Visual builder for customer-facing portals and e-commerce stores",
    actionLabel: "Design",
    href: "http://localhost:4004",
    icon: Globe,
  },
  {
    id: "setup",
    title: "Application Guided Setup",
    description: "Multi-step configuration wizard for Finance, Inventory, and team roles",
    actionLabel: "Setup",
    href: "/setup",
    icon: CheckCircle2,
  },
];

export default function DailyHomePage() {
  const { claims } = useSession();

  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pinnedAppIds, setPinnedAppIds] = useState<string[]>(
    DEFAULT_PINNED_APPS.map((a) => a.id),
  );

  const activePinnedApps = useMemo(
    () => DEFAULT_PINNED_APPS.filter((a) => pinnedAppIds.includes(a.id)),
    [pinnedAppIds],
  );

  const email = typeof (claims as Record<string, unknown> | null)?.email === "string"
    ? (claims as Record<string, unknown>).email as string
    : "";
  const userName =
    typeof (claims as Record<string, unknown> | null)?.name === "string"
      ? (claims as Record<string, unknown>).name as string
      : email
      ? email.split("@")[0]
      : "Alex";
  const tenantName = claims?.tenantId ? "Acme Corp" : "My Organization";

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  const togglePin = (id: string) => {
    setPinnedAppIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className={styles.homeContainer}>
      {/* Top Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroLeft}>
          <h1 className={styles.greetingTitle}>
            {greeting}, {userName}
          </h1>
          <div className={styles.contextMeta}>
            <span>{formattedDate}</span>
            <span>·</span>
            <span className={styles.tenantBadge}>
              <Building2 size={12} aria-hidden="true" />
              {tenantName}
            </span>
            <span className={styles.envTag}>Production</span>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/apps" className={styles.secondaryBtn}>
            <Search size={14} aria-hidden="true" />
            <span>Search apps</span>
          </Link>
          <Link href="/platforms" className={styles.secondaryBtn}>
            <Compass size={14} aria-hidden="true" />
            <span>Workspace Atlas</span>
          </Link>
          <Link href="/account" className={styles.secondaryBtn}>
            <Users size={14} aria-hidden="true" />
            <span>Account Center</span>
          </Link>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className={styles.secondaryBtn}
          >
            <HelpCircle size={14} aria-hidden="true" />
            <span>Help</span>
          </button>
          <Link href="/setup" className={styles.primaryBtn}>
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Guided Setup</span>
          </Link>
        </div>
      </section>

      {/* Info Notice Banner */}
      <div className={styles.noticeBanner} role="status">
        <AlertCircle size={16} aria-hidden="true" />
        <span>
          Welcome to your unified workspace. Organization controls are managed through Organization Control Center (OCC); personal preferences are in{" "}
          <Link href="/account" className={styles.noticeLink}>
            Account Center
          </Link>.
        </span>
      </div>

      {/* Pinned Applications Matrix */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span>Pinned applications</span>
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button
              type="button"
              onClick={() => setCustomizeOpen(true)}
              className={styles.secondaryBtn}
              style={{
                height: "var(--space-7)",
                padding: "0 var(--space-2-5)",
                fontSize: "var(--text-xs)",
              }}
            >
              <SlidersHorizontal size={13} aria-hidden="true" />
              <span>Customize</span>
            </button>
            <Link href="/apps" className={styles.sectionActionLink}>
              <span>All applications</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className={styles.pinnedGrid}>
          {activePinnedApps.map((app) => {
            const Icon = app.icon;
            return (
              <Link key={app.id} href={app.href} className={styles.appTile}>
                <div className={styles.appIconWrap}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <strong className={styles.appName}>{app.name}</strong>
                <small className={styles.appCategory}>{app.category}</small>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Split Layout: Continue where you left off + Needs your attention */}
      <div className={styles.splitLayout}>
        {/* Left: Continue where you left off */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Clock size={16} aria-hidden="true" />
              <span>Continue where you left off</span>
            </h2>
            <span className={styles.contextMeta}>Recent records</span>
          </div>

          <div className={styles.rowList}>
            {RECENT_WORK_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} className={styles.dataRow}>
                <div className={styles.rowMain}>
                  <span className={styles.rowTitle}>{item.title}</span>
                  <span className={styles.rowSubtitle}>{item.subtitle}</span>
                </div>
                <span
                  className={`${styles.rowBadge} ${
                    item.badgeType === "draft" ? styles.badgeDraft : ""
                  }`}
                >
                  {item.badge}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Right: Needs your attention */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <AlertCircle size={16} aria-hidden="true" />
              <span>Needs your attention</span>
            </h2>
            <Link href="/notifications" className={styles.sectionActionLink}>
              <span>All notifications</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className={styles.rowList}>
            {ATTENTION_ITEMS.map((item) => (
              <Link key={item.id} href={item.href} className={styles.dataRow}>
                <div className={styles.rowMain}>
                  <span className={styles.rowTitle}>{item.title}</span>
                  <span className={styles.rowSubtitle}>{item.subtitle}</span>
                </div>
                <span
                  className={`${styles.rowBadge} ${
                    item.actionType === "action"
                      ? styles.badgeAction
                      : item.actionType === "required"
                      ? styles.badgeRequired
                      : ""
                  }`}
                >
                  {item.actionLabel}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Across UniERP — Platform Directory */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <Compass size={16} aria-hidden="true" />
            <span>Across UniERP — Platform Directory</span>
          </h2>
          <Link href="/platforms" className={styles.sectionActionLink}>
            <span>View directory details</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.directoryList}>
          {PLATFORM_DIRECTORY.map((platform) => {
            const Icon = platform.icon;
            const isExternal = platform.href.startsWith("http");
            return (
              <a
                key={platform.id}
                href={platform.href}
                className={styles.directoryItem}
                {...(isExternal ? { target: "_self" } : {})}
              >
                <div className={styles.directoryItemLeft}>
                  <div className={styles.directoryIcon}>
                    <Icon size={18} />
                  </div>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>{platform.title}</span>
                    <span className={styles.rowSubtitle}>{platform.description}</span>
                  </div>
                </div>
                <span className={styles.secondaryBtn}>
                  <span>{platform.actionLabel}</span>
                  {isExternal ? <ExternalLink size={12} /> : <ArrowRight size={12} />}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* MODAL: Customize Home (Screen 56) */}
      {customizeOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="customize-title">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="customize-title" className={styles.modalTitle}>
                Customize Home Pinned Applications
              </h3>
              <button
                type="button"
                onClick={() => setCustomizeOpen(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                Select which applications are pinned to your daily action matrix. Changes apply to your personal workspace preferences.
              </p>
              {DEFAULT_PINNED_APPS.map((app) => {
                const Icon = app.icon;
                const isPinned = pinnedAppIds.includes(app.id);
                return (
                  <div key={app.id} className={styles.toggleRow}>
                    <div className={styles.toggleLabel}>
                      <Icon size={16} />
                      <span>{app.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePin(app.id)}
                      className={isPinned ? styles.primaryBtn : styles.secondaryBtn}
                      style={{ height: "var(--space-7)", padding: "0 var(--space-3)", fontSize: "var(--text-xs)" }}
                    >
                      {isPinned ? "Pinned" : "Pin"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setCustomizeOpen(false)}
                className={styles.primaryBtn}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Help & Guidance (Screen 15 & 36) */}
      {helpOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 id="help-title" className={styles.modalTitle}>
                How can we help?
              </h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className={styles.modalCloseBtn}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.directoryList} style={{ gridTemplateColumns: "1fr" }}>
                <Link
                  href="/setup"
                  onClick={() => setHelpOpen(false)}
                  className={styles.directoryItem}
                >
                  <div className={styles.directoryItemLeft}>
                    <div className={styles.directoryIcon}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>Application Guided Setup</span>
                      <span className={styles.rowSubtitle}>Readiness gates, team permissions, and account activation</span>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/account"
                  onClick={() => setHelpOpen(false)}
                  className={styles.directoryItem}
                >
                  <div className={styles.directoryItemLeft}>
                    <div className={styles.directoryIcon}>
                      <Users size={16} />
                    </div>
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>Account Center & Security</span>
                      <span className={styles.rowSubtitle}>Passkeys, MFA, active sessions, and data exports</span>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href="/platforms"
                  onClick={() => setHelpOpen(false)}
                  className={styles.directoryItem}
                >
                  <div className={styles.directoryItemLeft}>
                    <div className={styles.directoryIcon}>
                      <Compass size={16} />
                    </div>
                    <div className={styles.rowMain}>
                      <span className={styles.rowTitle}>Workspace Atlas</span>
                      <span className={styles.rowSubtitle}>Discover platforms across ERP, OCC, Dev, and Web Studio</span>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className={styles.secondaryBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
