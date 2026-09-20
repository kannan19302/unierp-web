"use client";

import React from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataPanel } from "@/components/shell/StrataPanel";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

const DISPLAY_SETTINGS: StrataRowItem[] = [
  {
    title: "Appearance",
    detail: "Strata light",
    tag: "Change",
    href: "/account/preferences",
  },
  {
    title: "Density",
    detail: "Comfortable",
    tag: "Change",
    href: "/account/preferences",
  },
  {
    title: "Reduce motion",
    detail: "Off",
    tag: "Toggle",
    href: "/account/preferences",
  },
];

const LOCALE_SETTINGS: StrataRowItem[] = [
  {
    title: "Language",
    detail: "English (US)",
    tag: "Change",
    href: "/account/preferences",
  },
  {
    title: "Date and number format",
    detail: "US conventions",
    tag: "Change",
    href: "/account/preferences",
  },
  {
    title: "Product updates",
    detail: "Receive feature announcements",
    tag: "Manage",
    href: "/notifications/preferences",
  },
];

export default function PreferencesPage() {
  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Account"
      breadcrumbHref="/account"
      title="Preferences"
      subtitle="Customize how UniERP looks and works for you."
      screenNumber="V2 / 13"
      actions={
        <>
          <button type="button" className={s.btnPrimary}>
            Save preferences
          </button>
          <Link href="/account" className={s.btnSecondary}>
            Cancel
          </Link>
        </>
      }
    >
      <div className={s.split}>
        <StrataPanel title="Display settings">
          <StrataRows items={DISPLAY_SETTINGS} insidePanel />
        </StrataPanel>

        <StrataPanel title="Language & updates">
          <StrataRows items={LOCALE_SETTINGS} insidePanel />
        </StrataPanel>
      </div>
    </StrataPageShell>
  );
}
