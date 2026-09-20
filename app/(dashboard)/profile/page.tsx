"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

export default function ProfileMenuPage() {
  const { claims } = useSession();

  const email =
    typeof (claims as Record<string, unknown> | null)?.email === "string"
      ? ((claims as Record<string, unknown>).email as string)
      : "alex@example.com";
  const userName =
    typeof (claims as Record<string, unknown> | null)?.name === "string"
      ? ((claims as Record<string, unknown>).name as string)
      : "Alex Rivera";
  const tenantName = claims?.tenantId ? "Acme Corp" : "My Organization";

  const PROFILE_MENU_ITEMS: StrataRowItem[] = [
    {
      title: "Account Center",
      detail: "Your identity, security and privacy",
      tag: "Open",
      href: "/account",
    },
    {
      title: "Availability",
      detail: "Available · Presence only",
      tag: "Change",
      href: "/account/preferences",
    },
    {
      title: "Switch organization",
      detail: `Current: ${tenantName}`,
      tag: "Switch",
      href: "/account/organizations",
    },
    {
      title: "Appearance & preferences",
      detail: "Strata light · Comfortable",
      tag: "Edit",
      href: "/account/preferences",
    },
    {
      title: "Help",
      detail: "Find documentation and support",
      tag: "Open",
      href: "/home/help",
    },
    {
      title: "Sign out",
      detail: "Choose this device or all sessions",
      tag: "Continue",
      href: "/auth/logout",
    },
  ];

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Profile"
      breadcrumbHref="/profile"
      title="Your profile menu"
      subtitle="Personal controls, separate from organization administration."
      screenNumber="V2 / 06"
      actions={
        <Link href="/home" className={s.btnPrimary}>
          Close menu
        </Link>
      }
    >
      <StrataPanel title={userName}>
        <p style={{ color: "var(--color-text-secondary, #475569)", marginTop: -8, marginBottom: 20 }}>
          {email}
        </p>
        <StrataRows items={PROFILE_MENU_ITEMS} insidePanel />
      </StrataPanel>

      <div
        style={{
          marginTop: 24,
          fontSize: 13,
          color: "var(--color-text-secondary, #475569)",
          lineHeight: 1.6,
        }}
      >
        This page is an expanded overlay specimen. Live menu restores focus to avatar on Escape; availability does not affect authentication or roles.
      </div>
    </StrataPageShell>
  );
}
