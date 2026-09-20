"use client";

import React from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

const SESSIONS: StrataRowItem[] = [
  {
    title: "Windows · Chrome 126",
    detail: "192.168.1.42 · Active now",
    tag: "Current",
  },
  {
    title: "macOS · Safari 17",
    detail: "10.0.0.15 · 2 hours ago",
    tag: "Review",
    href: "/account/devices",
  },
  {
    title: "iOS · UniERP Mobile",
    detail: "Mobile network · Yesterday",
    tag: "Review",
    href: "/account/devices",
  },
];

export default function DevicesPage() {
  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Account"
      breadcrumbHref="/account"
      title="Devices & activity"
      subtitle="Review active sessions and recent sign-in history."
      screenNumber="V2 / 10"
      actions={
        <>
          <button type="button" className={s.btnPrimary}>
            Sign out all other devices
          </button>
          <Link href="/account" className={s.btnSecondary}>
            Back to Account Center
          </Link>
        </>
      }
    >
      <StrataRows items={SESSIONS} />
    </StrataPageShell>
  );
}
