"use client";

import React from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

const ORGANIZATIONS: StrataRowItem[] = [
  {
    title: "Acme Corp",
    detail: "Production · Member since January 2026",
    tag: "Current",
  },
  {
    title: "Northstar Demo",
    detail: "Sandbox · Invited 3 days ago",
    tag: "Switch",
    href: "/account/organizations",
  },
  {
    title: "Global Partners Ltd",
    detail: "Pending invitation · Received today",
    tag: "Accept",
    href: "/account/organizations",
  },
];

export default function OrganizationsPage() {
  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Account"
      breadcrumbHref="/account"
      title="Organizations"
      subtitle="Your memberships and pending invitations."
      screenNumber="V2 / 11"
      actions={
        <Link href="/account" className={s.btnSecondary}>
          Back to Account Center
        </Link>
      }
    >
      <StrataRows items={ORGANIZATIONS} />
    </StrataPageShell>
  );
}
