"use client";

/**
 * `SUBSCRIPTIONS_TABS` / `SubscriptionsTabLayout` — same gap as
 * SettingsTabLayout.tsx (see that file's comment): missing entirely, would
 * have failed the whole subscriptions subtree's layout rather than one leaf
 * page, generated from the real directory structure rather than hand-curated.
 */
import { ModuleTabLayout, type ModuleTab } from "@kannan19302/ui";

export const SUBSCRIPTIONS_TABS: ModuleTab[] = [
  { id: "overview", label: "Overview", href: "/subscriptions" },
  { id: "coupons", label: "Coupons", href: "/subscriptions/coupons" },
  { id: "credit-notes", label: "Credit Notes", href: "/subscriptions/credit-notes" },
  { id: "dunning", label: "Dunning", href: "/subscriptions/dunning" },
  { id: "migrations", label: "Migrations", href: "/subscriptions/migrations" },
  { id: "plans", label: "Plans", href: "/subscriptions/plans" },
  { id: "tiers", label: "Tiers", href: "/subscriptions/tiers" },
  { id: "usage", label: "Usage", href: "/subscriptions/usage" },
];

export { ModuleTabLayout as SubscriptionsTabLayout };
