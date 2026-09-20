"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

const SECURITY_ITEMS: StrataRowItem[] = [
  {
    title: "Sign-in & recovery",
    detail: "Passkey and authenticator settings",
    tag: "Review",
    href: "/account/security",
  },
  {
    title: "Devices & activity",
    detail: "Review sessions and recent sign-ins",
    tag: "Manage",
    href: "/account/devices",
  },
  {
    title: "Organizations",
    detail: "Memberships and pending invitations",
    tag: "View",
    href: "/account/organizations",
  },
];

export default function AccountCenterPage() {
  const { claims } = useSession();

  const email =
    typeof (claims as Record<string, unknown> | null)?.email === "string"
      ? ((claims as Record<string, unknown>).email as string)
      : "alex@example.com";
  const userName =
    typeof (claims as Record<string, unknown> | null)?.name === "string"
      ? ((claims as Record<string, unknown>).name as string)
      : "Alex Rivera";

  const initials = userName
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Account"
      breadcrumbHref="/account"
      title="Account Center"
      subtitle="Your personal identity across every organization."
      screenNumber="V2 / 07"
      actions={
        <>
          <Link href="/account/privacy" className={s.btnPrimary}>
            Privacy & connected apps
          </Link>
          <Link href="/account/preferences" className={s.btnSecondary}>
            Preferences
          </Link>
        </>
      }
    >
      <div className={s.split}>
        {/* Profile Card */}
        <StrataPanel>
          <h2 className={s.panelTitle}>{userName}</h2>
          <div className={`${s.avatar} ${s.avatarLarge}`}>{initials}</div>
          <div style={{ marginTop: 20 }}>
            <strong
              style={{
                display: "block",
                fontSize: 18,
                fontWeight: 650,
                marginBottom: 8,
              }}
            >
              {userName}
            </strong>
            <span style={{ fontSize: 14, color: "var(--color-text-secondary, #475569)" }}>
              {email}
            </span>
            <span
              className={s.badge}
              style={{ marginLeft: 10 }}
            >
              Email verified
            </span>
          </div>
          <Link
            href="/account/personal"
            style={{
              display: "block",
              marginTop: 16,
              color: "var(--color-primary, #2563eb)",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Edit personal information
          </Link>
        </StrataPanel>

        {/* Security & Access */}
        <StrataPanel title="Security & access">
          <StrataRows items={SECURITY_ITEMS} insidePanel />
        </StrataPanel>
      </div>
    </StrataPageShell>
  );
}
