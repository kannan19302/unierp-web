"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  Settings,
  Sparkles,
  ShoppingCart,
  Globe,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Home,
  CheckCircle2,
} from "lucide-react";
import styles from "./platforms.module.css";

interface PlatformDef {
  id: string;
  name: string;
  description: string;
  badge: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  isExternal: boolean;
}

const PLATFORMS: PlatformDef[] = [
  {
    id: "tenant-apps",
    name: "Business Applications (ERP Suite)",
    description: "Your daily operations — Finance, CRM, Inventory, Sales, HR, Procurement, and Industry Verticals.",
    badge: "Active",
    href: "/apps",
    icon: Layers,
    isExternal: false,
  },
  {
    id: "occ",
    name: "Organization Control Center (OCC)",
    description: "Administer Acme Corp security policies, tenant roles, audit logs, and SSO configuration.",
    badge: "Admin permission required",
    href: "http://localhost:4002",
    icon: Settings,
    isExternal: true,
  },
  {
    id: "developer",
    name: "Developer Platform",
    description: "API tokens, webhooks, custom schemas, SDK documentation, and extension sandbox.",
    badge: "Developer sandbox",
    href: "http://localhost:4005",
    icon: Sparkles,
    isExternal: true,
  },
  {
    id: "marketplace",
    name: "Marketplace & Ecosystem",
    description: "Discover certified third-party integrations, pre-built workflow templates, and cloud industry packs.",
    badge: "Verified apps",
    href: "http://localhost:4006",
    icon: ShoppingCart,
    isExternal: true,
  },
  {
    id: "web-studio",
    name: "Web Studio & CMS",
    description: "Visual landing page builder, digital storefront designer, and corporate content editor.",
    badge: "Authoring",
    href: "http://localhost:4004",
    icon: Globe,
    isExternal: true,
  },
  {
    id: "tenant-site",
    name: "Published Public Website",
    description: "View your published corporate website and customer portal as an external visitor.",
    badge: "Live production",
    href: "http://localhost:4004",
    icon: ExternalLink,
    isExternal: true,
  },
];

export default function PlatformsDirectoryPage() {
  return (
    <div className={styles.platformsContainer}>
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Workspace Atlas — Platforms Directory</h1>
        <p className={styles.subtitle}>
          One workspace. Clear destinations across the UniERP enterprise ecosystem.
        </p>
      </div>

      <div className={styles.notice} role="status">
        <AlertCircle size={16} />
        <span>
          Organization administration uses your verified tenant permissions. Provider Admin OS is isolated to platform operators and cannot be accessed from tenant workspaces.
        </span>
      </div>

      <div className={styles.grid}>
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          return (
            <a
              key={platform.id}
              href={platform.href}
              className={styles.card}
              {...(platform.isExternal ? { target: "_self" } : {})}
            >
              <div className={styles.cardLeft}>
                <div className={styles.iconWrap}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className={styles.info}>
                  <h2 className={styles.cardTitle}>{platform.name}</h2>
                  <span className={styles.cardDesc}>{platform.description}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                <span className={styles.cardBadge}>{platform.badge}</span>
                {platform.isExternal ? (
                  <ExternalLink size={14} style={{ color: "var(--color-text-secondary)" }} />
                ) : (
                  <ArrowRight size={14} style={{ color: "var(--color-primary)" }} />
                )}
              </div>
            </a>
          );
        })}
      </div>

      <div>
        <Link href="/home" className={styles.backBtn}>
          <Home size={14} />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
}
