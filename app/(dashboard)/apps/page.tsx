"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { AppWizardGrid, type WizardTile } from "@kannan19302/ui/shell";
import {
  KPIStrip,
  type KPICardItem,
  SegmentedControl,
  type SegmentedControlOption,
  Badge,
  Button,
} from "@kannan19302/ui/components";
import { useApiClient } from "@kannan19302/framework";
import { allApplications, KERNEL_APP_IDS } from "@/navigation";
import {
  Search,
  X,
  ShoppingBag,
  Sparkles,
  Layers,
  CheckCircle2,
  Building2,
  ExternalLink,
  Zap,
} from "lucide-react";
import Link from "next/link";
import styles from "./apps-wizard.module.css";

type AppCategory =
  | "all"
  | "core"
  | "operations"
  | "productivity"
  | "verticals"
  | "admin"
  | "favorites";

interface AppMetadata {
  description: string;
  category: "core" | "operations" | "productivity" | "verticals" | "admin";
  accent: string;
  accentDark?: string;
  badge?: string;
}

const APP_METADATA_MAP: Record<string, AppMetadata> = {
  finance: {
    description: "General Ledger, AP/AR, Invoicing, Tax & Multi-currency Accounting",
    category: "core",
    accent: "var(--chart-9, #059669)",
    accentDark: "#34d399",
  },
  hr: {
    description: "Employee Directory, Payroll, Attendance, Leaves & Onboarding",
    category: "core",
    accent: "var(--chart-3, #4f46e5)",
    accentDark: "#818cf8",
  },
  crm: {
    description: "Customer Accounts, Pipeline, Deals, Contact Leads & Sales Funnels",
    category: "core",
    accent: "var(--color-primary, #6366f1)",
    accentDark: "#a5b4fc",
  },
  inventory: {
    description: "Multi-warehouse, Stock Management, SKU Tracking & Barcodes",
    category: "core",
    accent: "var(--color-warning-hover, #d97706)",
    accentDark: "#fbbf24",
  },
  procurement: {
    description: "Purchase Orders, RFQ Tenders, Vendor Scorecards & Ingestion",
    category: "operations",
    accent: "var(--chart-6, #0284c7)",
    accentDark: "#38bdf8",
  },
  sales: {
    description: "Sales Orders, Quotations, Delivery Challans & POS Invoicing",
    category: "operations",
    accent: "var(--platform-apps, #047857)",
    accentDark: "#34d399",
  },
  "supply-chain": {
    description: "Logistics, Carrier Tracking, Fleet Routes & Supply Visibility",
    category: "operations",
    accent: "var(--chart-7, #ea580c)",
    accentDark: "#fb923c",
  },
  manufacturing: {
    description: "Work Orders, BOM Assemblies, Shop Floor Routing & MRP",
    category: "operations",
    accent: "var(--chart-8, #7c3aed)",
    accentDark: "#a78bfa",
  },
  analytics: {
    description: "Business Intelligence, KPI Dashboards, SQL Visualizer & Reports",
    category: "productivity",
    accent: "var(--chart-5, #ec4899)",
    accentDark: "#f472b6",
  },
  ai: {
    description: "Autonomous ERP Agent, Predictive Copilot & Automated Workflows",
    category: "productivity",
    accent: "var(--color-primary, #6366f1)",
    accentDark: "#c084fc",
    badge: "AI Powered",
  },
  drive: {
    description: "Secure Cloud Storage, Document Vault, Audit Logs & Sharing",
    category: "productivity",
    accent: "var(--color-info, #0ea5e9)",
    accentDark: "#38bdf8",
  },
  communication: {
    description: "Real-time Chat, Team Channels, Direct Messages & Video",
    category: "productivity",
    accent: "var(--color-success, #10b981)",
    accentDark: "#34d399",
  },
  pos: {
    description: "Point of Sale, Retail Registers, Barcode Scanners & Daily Cash",
    category: "operations",
    accent: "var(--chart-9, #059669)",
    accentDark: "#34d399",
  },
  ecommerce: {
    description: "Online Storefront, Product Catalog, Cart Checkout & Gateways",
    category: "operations",
    accent: "var(--chart-10, #2563eb)",
    accentDark: "#60a5fa",
  },
  education: {
    description: "Student Information, Course Curriculums, Grading & Attendance",
    category: "verticals",
    accent: "var(--color-info, #6366f1)",
    accentDark: "#a5b4fc",
  },
  "real-estate": {
    description: "Property Units, Tenant Leases, Rent Invoicing & Maintenance",
    category: "verticals",
    accent: "var(--color-warning, #f97316)",
    accentDark: "#fb923c",
  },
  "field-service": {
    description: "Technician Dispatch, Service Jobs, Equipment & SLA Tracking",
    category: "verticals",
    accent: "var(--chart-6, #06b6d4)",
    accentDark: "#22d3ee",
  },
  "saas-portal": {
    description: "Tenant Subscription Plans, Seat Licenses, Quotas & Invoices",
    category: "admin",
    accent: "var(--color-primary, #4f46e5)",
    accentDark: "#818cf8",
  },
  "app-store": {
    description: "Discover, Install & Configure Certified UniERP Extensions",
    category: "admin",
    accent: "var(--color-primary, #7c3aed)",
    accentDark: "#a78bfa",
    badge: "Marketplace",
  },
  builder: {
    description: "No-Code UI Builder, BPMN Engine & Custom Entity Modeler",
    category: "admin",
    accent: "var(--color-accent, #9333ea)",
    accentDark: "#c084fc",
  },
};

const CATEGORY_OPTIONS: SegmentedControlOption<AppCategory>[] = [
  { value: "all", label: "All Apps" },
  { value: "core", label: "Core ERP" },
  { value: "operations", label: "Operations" },
  { value: "productivity", label: "Productivity" },
  { value: "verticals", label: "Industry" },
  { value: "admin", label: "Platform & Dev" },
  { value: "favorites", label: "Favorites" },
];

const FAVORITES_STORAGE_KEY = "unierp.favorite_apps";

/**
 * The canonical tenant Application Wizard Landing Page (`/apps`).
 * Designed per UniERP DL 2.0 governance with strict subpath exports,
 * icon-based interactive grid, instant search, categories, favorites,
 * and workspace KPIs.
 */
export default function ApplicationWizardPage() {
  const client = useApiClient();
  const [installedApps, setInstalledApps] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<AppCategory>("all");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load user favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleFavorite = useCallback((appId: string, fav: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (fav) {
        next.add(appId);
      } else {
        next.delete(appId);
      }
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Fallback silently
      }
      return next;
    });
  }, []);

  // Fetch installed applications for the active tenant
  useEffect(() => {
    let cancelled = false;
    setError(null);
    client
      .get<string[]>("/saas/installed-apps")
      .then((list) => {
        if (!cancelled) setInstalledApps(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your applications");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, attempt]);

  // Filter and map all entitled applications to WizardTiles
  const tiles = useMemo<WizardTile[]>(() => {
    if (!installedApps) return [];

    return allApplications
      .filter((app) => KERNEL_APP_IDS.has(app.id) || installedApps.includes(app.id))
      .filter((app) => {
        const meta = APP_METADATA_MAP[app.id];
        const isFav = favorites.has(app.id);

        // Category filter
        if (activeCategory === "favorites" && !isFav) return false;
        if (activeCategory !== "all" && activeCategory !== "favorites") {
          if (!meta || meta.category !== activeCategory) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = app.name.toLowerCase().includes(q);
          const descMatch = meta?.description.toLowerCase().includes(q);
          const idMatch = app.id.toLowerCase().includes(q);
          if (!nameMatch && !descMatch && !idMatch) return false;
        }

        return true;
      })
      .map((app) => {
        const Icon = app.icon;
        const meta = APP_METADATA_MAP[app.id];
        const isFav = favorites.has(app.id);

        return {
          key: app.id,
          name: app.name,
          description: meta?.description || "Enterprise module application",
          href: app.href,
          icon: Icon ? <Icon size={20} /> : undefined,
          accent: meta?.accent,
          accentDark: meta?.accentDark,
          favorite: isFav,
          onFavoriteChange: (fav) => toggleFavorite(app.id, fav),
          badge: meta?.badge ? (
            <Badge variant="primary" size="sm">
              {meta.badge}
            </Badge>
          ) : undefined,
        };
      });
  }, [installedApps, activeCategory, searchQuery, favorites, toggleFavorite]);

  // Compute KPI Statistics
  const totalInstalled = installedApps ? installedApps.length + KERNEL_APP_IDS.size : 0;
  const coreCount = useMemo(() => {
    if (!installedApps) return 0;
    return allApplications.filter(
      (a) =>
        (KERNEL_APP_IDS.has(a.id) || installedApps.includes(a.id)) &&
        APP_METADATA_MAP[a.id]?.category === "core",
    ).length;
  }, [installedApps]);

  const kpiItems: KPICardItem[] = useMemo(
    () => [
      {
        id: "total_apps",
        label: "Installed Applications",
        value: installedApps === null ? "—" : totalInstalled,
        subtext: "Entitled to active tenant",
        icon: <Layers size={18} />,
      },
      {
        id: "core_erp",
        label: "Core ERP Modules",
        value: installedApps === null ? "—" : coreCount,
        subtext: "Finance, HR, CRM & Stock",
        icon: <Building2 size={18} />,
      },
      {
        id: "favorites_count",
        label: "Pinned Favorites",
        value: favorites.size,
        subtext: "Quick-launch shortcuts",
        icon: <Sparkles size={18} />,
      },
      {
        id: "platform_status",
        label: "Platform Engine",
        value: "Operational",
        trend: "up",
        subtext: "All services 100% healthy",
        icon: <CheckCircle2 size={18} />,
      },
    ],
    [installedApps, totalInstalled, coreCount, favorites.size],
  );

  return (
    <div className={styles.pageContainer}>
      {/* Hero Header Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.tenantBadgeRow}>
            <Badge variant="info" size="sm">
              Tenant Application Suite
            </Badge>
            <Badge variant="default" size="sm">
              Meridian v2.0
            </Badge>
          </div>
          <h1 className={styles.heroTitle}>Applications Workspace</h1>
          <p className={styles.heroDescription}>
            Launch, configure, and manage all enterprise applications, business workflows,
            and operational modules installed for your organization.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link href="/apps/store">
            <Button variant="primary" size="md">
              <ShoppingBag size={16} /> Marketplace
            </Button>
          </Link>
        </div>
      </section>

      {/* KPI Overview Strip */}
      <div className={styles.statsRow}>
        <KPIStrip items={kpiItems} />
      </div>

      {/* Interactive Controls Bar: Instant Search & Domain Filter */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search applications (e.g. Finance, CRM, Orders)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search installed applications"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.categoriesWrapper}>
          <SegmentedControl
            options={CATEGORY_OPTIONS}
            value={activeCategory}
            onChange={(cat) => setActiveCategory(cat)}
            size="sm"
            aria-label="Filter applications by category"
          />
        </div>
      </div>

      {/* Canonical App Wizard Grid */}
      <AppWizardGrid
        tiles={tiles}
        loading={installedApps === null && !error}
        loadingVariant="skeleton"
        error={error}
        onRetry={() => setAttempt((n) => n + 1)}
        emptyTitle={
          activeCategory === "favorites"
            ? "No favorite applications yet"
            : searchQuery
              ? `No applications matching "${searchQuery}"`
              : "No applications installed"
        }
        emptyDescription={
          activeCategory === "favorites"
            ? "Click the star icon on any application tile to add it to your quick-access favorites."
            : searchQuery
              ? "Try searching for a different keyword or select another category."
              : "Explore the UniERP Marketplace to discover and install applications for your organization."
        }
      />

      {/* Marketplace Promotion Banner */}
      <div className={styles.marketplaceBanner}>
        <div className={styles.marketplaceInfo}>
          <div className={styles.marketplaceIconWell}>
            <Zap size={22} />
          </div>
          <div className={styles.marketplaceText}>
            <h2 className={styles.marketplaceTitle}>Looking for specialized vertical capabilities?</h2>
            <p className={styles.marketplaceDesc}>
              Discover certified extensions for Healthcare, Education, Real Estate, and AI-driven automation.
            </p>
          </div>
        </div>

        <Link href="/apps/store">
          <Button variant="secondary" size="sm">
            Discover Extensions <ExternalLink size={13} style={{ marginLeft: 4 }} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
