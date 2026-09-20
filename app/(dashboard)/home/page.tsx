"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import { StrataBanner } from "@/components/shell/StrataBanner";
import { StrataAppGrid } from "@/components/shell/StrataAppGrid";
import s from "@/components/shell/strata-home.module.css";

/* ── Static Data (synthetic — design specimens) ─────────────────── */

const RECENT_WORK: StrataRowItem[] = [
  {
    title: "Journal JE-0842",
    detail: "Finance · Draft · 12 minutes ago",
    tag: "Resume",
    href: "/finance",
  },
  {
    title: "Q3 pipeline",
    detail: "CRM · Saved view · Yesterday",
    tag: "Open",
    href: "/crm",
  },
  {
    title: "Stock availability",
    detail: "Inventory · Saved view",
    tag: "Open",
    href: "/inventory",
  },
];

const ATTENTION_ITEMS: StrataRowItem[] = [
  {
    title: "3 approvals awaiting review",
    detail: "Purchase orders and expenses",
    tag: "Review",
    href: "/procurement",
  },
  {
    title: "1 import needs attention",
    detail: "Inventory · Stock import",
    tag: "Resolve",
    href: "/inventory",
  },
  {
    title: "Finish Finance setup",
    detail: "Fiscal calendar needs confirmation",
    tag: "Required",
    href: "/setup",
  },
];

const PLATFORM_DIRECTORY: StrataRowItem[] = [
  {
    title: "Developer",
    detail: "Build integrations and manage your applications",
    tag: "Open",
    href: "http://localhost:4005",
  },
  {
    title: "Marketplace",
    detail: "Discover apps, connectors and templates",
    tag: "Explore",
    href: "http://localhost:4007",
  },
  {
    title: "Organization control center",
    detail: "Manage Acme Corp policies and people",
    tag: "Manage",
    href: "http://localhost:4002",
  },
  {
    title: "Web Studio & tenant website",
    detail: "Author content or view your published website",
    tag: "Open",
    href: "http://localhost:4004",
  },
];

/* ── Component ──────────────────────────────────────────────────── */

export default function DailyHomePage() {
  const { claims } = useSession();

  const email =
    typeof (claims as Record<string, unknown> | null)?.email === "string"
      ? ((claims as Record<string, unknown>).email as string)
      : "";
  const userName =
    typeof (claims as Record<string, unknown> | null)?.name === "string"
      ? ((claims as Record<string, unknown>).name as string)
      : email
        ? email.split("@")[0]
        : "Alex";
  const tenantName = claims?.tenantId ? "Acme Corp" : "My Organization";

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
    }).format(new Date());
  }, []);

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Home"
      breadcrumbHref="/home"
      title={`${greeting}, ${userName}`}
      subtitle={`${formattedDate} · ${tenantName} · Production`}
      screenNumber="V2 / 01"
      actions={
        <>
          <Link href="/home" className={s.btnPrimary}>
            Customize Home
          </Link>
          <Link href="/apps" className={s.btnSecondary}>
            All applications
          </Link>
        </>
      }
    >
      {/* Pinned Applications */}
      <StrataPanel title="Pinned applications">
        <StrataAppGrid />
      </StrataPanel>

      {/* Split: Recent Work + Needs Attention */}
      <div className={s.split}>
        <StrataPanel title="Continue where you left off">
          <StrataRows items={RECENT_WORK} insidePanel />
        </StrataPanel>

        <StrataPanel title="Needs your attention">
          <StrataRows items={ATTENTION_ITEMS} insidePanel />
        </StrataPanel>
      </div>

      {/* Across UniERP */}
      <StrataPanel title="Across UniERP">
        <StrataRows items={PLATFORM_DIRECTORY} insidePanel />
      </StrataPanel>
    </StrataPageShell>
  );
}
