"use client";

import React from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

const CONNECTED_SERVICES: StrataRowItem[] = [
  {
    title: "Google Workspace",
    detail: "Calendar and contacts sync · Connected",
    tag: "Manage",
    href: "/account/privacy",
  },
  {
    title: "Microsoft 365",
    detail: "Not connected",
    tag: "Connect",
    href: "/account/privacy",
  },
];

const PRIVACY_ITEMS: StrataRowItem[] = [
  {
    title: "Data export",
    detail: "Download a copy of your personal data",
    tag: "Request",
    href: "/account/privacy",
  },
  {
    title: "Data deletion",
    detail: "Request removal of your personal data",
    tag: "Request",
    href: "/account/privacy",
  },
];

const COMMUNICATION: StrataRowItem[] = [
  {
    title: "Product updates",
    detail: "Feature announcements and release notes",
    tag: "Manage",
    href: "/notifications/preferences",
  },
  {
    title: "Security alerts",
    detail: "Sign-in notifications and policy changes",
    tag: "Always on",
  },
];

export default function PrivacyPage() {
  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Account"
      breadcrumbHref="/account"
      title="Privacy & connected apps"
      subtitle="Control your data, connected services and communication preferences."
      screenNumber="V2 / 12"
      actions={
        <Link href="/account" className={s.btnSecondary}>
          Back to Account Center
        </Link>
      }
    >
      <StrataPanel title="Connected services">
        <StrataRows items={CONNECTED_SERVICES} insidePanel />
      </StrataPanel>

      <StrataPanel title="Privacy & data">
        <StrataRows items={PRIVACY_ITEMS} insidePanel />
      </StrataPanel>

      <StrataPanel title="Communication choices">
        <StrataRows items={COMMUNICATION} insidePanel />
      </StrataPanel>
    </StrataPageShell>
  );
}
