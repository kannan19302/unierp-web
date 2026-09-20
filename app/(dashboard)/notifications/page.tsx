"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import s from "@/components/shell/strata-home.module.css";

const ALL_NOTIFICATIONS: Array<StrataRowItem & { actionNeeded?: boolean }> = [
  {
    title: "Purchase order awaiting review",
    detail: "Finance · Acme Corp · 09:20",
    tag: "Unread",
    href: "/finance",
    actionNeeded: false,
  },
  {
    title: "Stock import needs attention",
    detail: "Inventory · 4 rows need correction · 09:05",
    tag: "Action needed",
    href: "/inventory",
    actionNeeded: true,
  },
  {
    title: "You were mentioned in Launch plan",
    detail: "Projects · Yesterday",
    tag: "Unread",
    href: "/projects",
    actionNeeded: false,
  },
];

type FilterType = "all" | "action";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered =
    filter === "action"
      ? ALL_NOTIFICATIONS.filter((n) => n.actionNeeded)
      : ALL_NOTIFICATIONS;

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Home"
      breadcrumbHref="/home"
      title="Notifications"
      subtitle="Keep up with work across your applications."
      screenNumber="V2 / 05"
      actions={
        <Link href="/notifications/preferences" className={s.btnPrimary}>
          Notification preferences
        </Link>
      }
    >
      {/* Filters */}
      <div className={s.chips}>
        <button
          type="button"
          className={`${s.chip} ${filter === "all" ? s.chipActive : ""}`}
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`${s.chip} ${filter === "action" ? s.chipActive : ""}`}
          aria-pressed={filter === "action"}
          onClick={() => setFilter("action")}
        >
          Action needed
        </button>
        <button type="button" className={s.btnSecondary}>
          Mark all as read
        </button>
      </div>

      <StrataRows items={filtered} />
    </StrataPageShell>
  );
}
