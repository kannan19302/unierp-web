"use client";

import React from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import { StrataBanner } from "@/components/shell/StrataBanner";
import s from "@/components/shell/strata-home.module.css";

const DESTINATIONS: StrataRowItem[] = [
  {
    title: "Tenant applications",
    detail: "Your daily ERP and CRM work",
    tag: "Open",
    href: "/apps",
  },
  {
    title: "Organization control center",
    detail: "Acme Corp administration · permission required",
    tag: "Continue",
    href: "http://localhost:4002",
  },
  {
    title: "Developer platform",
    detail: "Integrations, extensions and sandbox",
    tag: "Continue",
    href: "http://localhost:4005",
  },
  {
    title: "Marketplace",
    detail: "Apps, connectors and industry packs",
    tag: "Continue",
    href: "http://localhost:4007",
  },
  {
    title: "Web Studio",
    detail: "Create and manage organization websites",
    tag: "Continue",
    href: "http://localhost:4004",
  },
  {
    title: "Published tenant website",
    detail: "View the website as a visitor",
    tag: "Continue",
    href: "http://localhost:4004",
  },
];

export default function PlatformsPage() {
  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Home"
      breadcrumbHref="/home"
      title="Explore UniERP"
      subtitle="One workspace. Clear destinations."
      screenNumber="V2 / 04"
      actions={
        <Link href="/home" className={s.btnPrimary}>
          Back to Home
        </Link>
      }
    >
      <StrataRows items={DESTINATIONS} />

      <StrataBanner>
        Organization administration uses your tenant permissions. Personal
        settings are in{" "}
        <Link
          href="/account"
          style={{
            color: "inherit",
            fontWeight: 600,
            textDecoration: "underline",
          }}
        >
          Account Center
        </Link>
        .
      </StrataBanner>
    </StrataPageShell>
  );
}
