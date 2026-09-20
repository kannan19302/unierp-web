"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  PieChart,
  CreditCard,
  Users,
  Contact,
  Box,
  ShoppingCart,
  ClipboardList,
  Columns3,
  Sun,
  Network,
  Wrench,
  Store,
  Shield,
  Folder,
  MessageCircle,
  Sparkles,
  Activity,
  GraduationCap,
  Building2,
  Workflow,
} from "lucide-react";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataAppGrid, type AppTile } from "@/components/shell/StrataAppGrid";
import { StrataBanner } from "@/components/shell/StrataBanner";
import s from "@/components/shell/strata-home.module.css";

export interface AppIconConfig {
  id: string;
  name: string;
  displayName: string;
  category: "core" | "operations" | "productivity" | "verticals";
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  href: string;
}

export const APPS_CATALOG: AppIconConfig[] = [
  // Core ERP (9 apps)
  { id: "analytics", name: "Analytics", displayName: "Analytics", category: "core", icon: PieChart, href: "/analytics" },
  { id: "finance", name: "Finance", displayName: "Finance", category: "core", icon: CreditCard, href: "/finance" },
  { id: "hr", name: "HR", displayName: "HR", category: "core", icon: Users, href: "/hr" },
  { id: "crm", name: "CRM", displayName: "CRM", category: "core", icon: Contact, href: "/crm" },
  { id: "inventory", name: "Inventory", displayName: "Inventory", category: "core", icon: Box, href: "/inventory" },
  { id: "procurement", name: "Procurement", displayName: "Procurement", category: "core", icon: ShoppingCart, href: "/procurement" },
  { id: "sales", name: "Sales", displayName: "Sales", category: "core", icon: ClipboardList, href: "/sales" },
  { id: "projects", name: "Projects", displayName: "Projects", category: "core", icon: Columns3, href: "/projects" },
  { id: "manufacturing", name: "Manufacturing", displayName: "Manufacturing", category: "core", icon: Sun, href: "/manufacturing" },

  // Operations (4 apps)
  { id: "supply-chain", name: "Supply Chain", displayName: "Supply Chain", category: "operations", icon: Network, href: "/supply-chain" },
  { id: "field-service", name: "Field Service", displayName: "Field Service", category: "operations", icon: Wrench, href: "/field-service" },
  { id: "pos", name: "POS", displayName: "POS", category: "operations", icon: Store, href: "/pos" },
  { id: "blockchain", name: "Blockchain", displayName: "Blockchain", category: "operations", icon: Shield, href: "/blockchain" },

  // Productivity (4 apps)
  { id: "drive", name: "Drive", displayName: "Drive", category: "productivity", icon: Folder, href: "/drive" },
  { id: "communication", name: "Connect", displayName: "Connect", category: "productivity", icon: MessageCircle, href: "/connect" },
  { id: "workflow", name: "Workflow", displayName: "Workflow", category: "productivity", icon: Workflow, href: "/workflow" },
  { id: "ai", name: "AI Copilot", displayName: "AI Copilot", category: "productivity", icon: Sparkles, href: "/ai" },

  // Verticals (3 apps)
  { id: "healthcare", name: "Healthcare", displayName: "Healthcare", category: "verticals", icon: Activity, href: "/healthcare" },
  { id: "education", name: "Education", displayName: "Education", category: "verticals", icon: GraduationCap, href: "/education" },
  { id: "real-estate", name: "Real Estate", displayName: "Real Estate", category: "verticals", icon: Building2, href: "/real-estate" },
];

const ALL_APPS: AppTile[] = [
  { icon: "F", name: "Finance", description: "Ledger & cash", href: "/finance" },
  { icon: "C", name: "CRM", description: "Customers & pipeline", href: "/crm" },
  { icon: "I", name: "Inventory", description: "Stock & fulfillment", href: "/inventory" },
  { icon: "S", name: "Sales", description: "Orders & revenue", href: "/sales" },
  { icon: "P", name: "Projects", description: "Plans & delivery", href: "/projects" },
  { icon: "A", name: "Analytics", description: "Reports & insights", href: "/analytics" },
];

type FilterType = "all" | "ready" | "setup";

export default function ApplicationsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredApps = useMemo(() => {
    let apps = ALL_APPS;
    if (search) {
      const lower = search.toLowerCase();
      apps = apps.filter(
        (a) =>
          a.name.toLowerCase().includes(lower) ||
          a.description.toLowerCase().includes(lower),
      );
    }
    // Synthetic filter: "Needs setup" only shows Finance (requires fiscal calendar)
    if (filter === "setup") {
      apps = apps.filter((a) => a.name === "Finance");
    } else if (filter === "ready") {
      apps = apps.filter((a) => a.name !== "Finance");
    }
    return apps;
  }, [search, filter]);

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Home"
      breadcrumbHref="/home"
      title="Applications"
      subtitle="Your organization's tools, ready when you are."
      screenNumber="V2 / 03"
      actions={
        <>
          <Link href="/setup" className={s.btnPrimary}>
            Set up applications
          </Link>
          <Link href="/finance" className={s.btnSecondary}>
            Review Finance
          </Link>
        </>
      }
    >
      {/* Search */}
      <label className={s.field}>
        Find an application
        <input
          type="search"
          placeholder="Search by name or category"
          className={s.fieldInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {/* Filters */}
      <div className={s.chips}>
        {(["all", "ready", "setup"] as FilterType[]).map((f) => (
          <button
            key={f}
            type="button"
            className={`${s.chip} ${filter === f ? s.chipActive : ""}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All apps" : f === "ready" ? "Ready to use" : "Needs setup"}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <StrataPanel title="Business applications">
        <StrataAppGrid apps={filteredApps} />
      </StrataPanel>

      <StrataBanner>
        Finance needs a confirmed fiscal calendar before posting. You can still
        browse your workspace.
      </StrataBanner>
    </StrataPageShell>
  );
}
