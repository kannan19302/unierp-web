"use client";

import React from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

const SECURITY_ROWS: StrataRowItem[] = [
  {
    title: "Passkeys",
    detail: "Use your device biometrics or security key",
    tag: "Manage",
    href: "/account/security",
  },
  {
    title: "Authenticator app",
    detail: "Time-based one-time codes",
    tag: "Set up",
    href: "/account/security",
  },
  {
    title: "Recovery methods",
    detail: "Backup codes and recovery email",
    tag: "Review",
    href: "/account/security",
  },
  {
    title: "Password",
    detail: "Last changed 3 months ago",
    tag: "Change",
    href: "/account/security",
  },
];

export default function SecurityPage() {
  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Account"
      breadcrumbHref="/account"
      title="Sign-in & recovery"
      subtitle="Manage how you authenticate and recover access."
      screenNumber="V2 / 09"
      actions={
        <Link href="/account" className={s.btnSecondary}>
          Back to Account Center
        </Link>
      }
    >
      <StrataRows items={SECURITY_ROWS} />
    </StrataPageShell>
  );
}
