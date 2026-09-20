"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import { StrataBanner } from "@/components/shell/StrataBanner";
import s from "@/components/shell/strata-home.module.css";

const NEXT_STEPS: StrataRowItem[] = [
  {
    title: "Confirm your organization",
    detail: "Legal name, region and working defaults",
    tag: "Required",
    href: "/setup",
  },
  {
    title: "Set up your applications",
    detail: "Choose the tools your team needs first",
    tag: "Required for use",
    href: "/apps",
  },
  {
    title: "Invite your team",
    detail: "You can do this later",
    tag: "Optional",
    href: "/setup",
  },
  {
    title: "Protect your account",
    detail: "Review the security policy for your account",
    tag: "Review",
    href: "/account/security",
  },
];

export default function FirstVisitPage() {
  const { claims } = useSession();

  const userName =
    typeof (claims as Record<string, unknown> | null)?.name === "string"
      ? ((claims as Record<string, unknown>).name as string)
      : "Alex";

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Home"
      breadcrumbHref="/home"
      title={`Welcome to UniERP, ${userName}`}
      subtitle="Your account is ready. Let's make Acme Corp work for your team."
      screenNumber="V2 / 02"
      actions={
        <>
          <Link href="/setup" className={s.btnPrimary}>
            Continue setup
          </Link>
          <Link href="/home" className={s.btnSecondary}>
            Go to Home
          </Link>
        </>
      }
    >
      <StrataBanner>
        Organization created. Business readiness is tracked separately below.
      </StrataBanner>

      <div className={s.split}>
        <StrataPanel title="Your next steps">
          <StrataRows items={NEXT_STEPS} insidePanel />
        </StrataPanel>

        <StrataPanel title="Start with what matters">
          <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 650 }}>
            A clear place to begin
          </h3>
          <p style={{ fontSize: 14, color: "var(--color-text-secondary, #475569)", lineHeight: 1.7, margin: "0 0 24px" }}>
            Your setup stays available from Home. Explore your entitled apps now;
            affected transactions remain unavailable until their prerequisites are
            complete.
          </p>
          <Link href="/apps" className={s.btnSecondary}>
            Explore applications
          </Link>
        </StrataPanel>
      </div>
    </StrataPageShell>
  );
}
