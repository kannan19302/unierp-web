"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import { StrataPanel } from "@/components/shell/StrataPanel";
import s from "@/components/shell/strata-home.module.css";

const ALL_SEARCH_ITEMS: StrataRowItem[] = [
  {
    title: "Finance",
    detail: "Application · Acme Corp",
    tag: "App",
    href: "/apps",
  },
  {
    title: "Journal JE-0842",
    detail: "Draft · Updated today",
    tag: "Recent work",
    href: "/finance",
  },
  {
    title: "Set up Finance",
    detail: "Guide · Fiscal calendar and accounts",
    tag: "Help",
    href: "/home/help",
  },
  {
    title: "CRM",
    detail: "Application · Acme Corp",
    tag: "App",
    href: "/apps",
  },
  {
    title: "Q3 pipeline",
    detail: "Saved view · CRM",
    tag: "Recent work",
    href: "/crm",
  },
  {
    title: "Inventory",
    detail: "Application · Acme Corp",
    tag: "App",
    href: "/apps",
  },
  {
    title: "Stock availability",
    detail: "Saved view · Inventory",
    tag: "Recent work",
    href: "/inventory",
  },
  {
    title: "Start with UniERP Home",
    detail: "Guide · A guide to your first visit",
    tag: "Help",
    href: "/home/first-visit",
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("Finance");

  const filteredItems = useMemo(() => {
    if (!query.trim()) return ALL_SEARCH_ITEMS.slice(0, 3);
    const q = query.toLowerCase();
    const matches = ALL_SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        (item.tag && item.tag.toLowerCase().includes(q))
    );
    return matches.length > 0 ? matches : [];
  }, [query]);

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Search"
      breadcrumbHref="/home/search"
      title="Search UniERP"
      subtitle="Find permitted apps, work and help in Acme Corp."
      screenNumber="V2 / 14"
      actions={
        <Link href="/home/help" className={s.btnPrimary}>
          View help
        </Link>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <label className={s.field}>
          Search apps, work, and people
          <input
            type="text"
            className={s.fieldInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, work, and people"
            autoComplete="off"
            autoFocus
          />
        </label>
      </div>

      <StrataPanel title={query ? `Results for "${query}"` : "Suggested search results"}>
        {filteredItems.length > 0 ? (
          <StrataRows items={filteredItems} insidePanel />
        ) : (
          <div style={{ padding: "20px 0", color: "var(--color-text-secondary, #475569)" }}>
            No results found matching &quot;{query}&quot;. Try searching for an application name like &quot;Finance&quot; or &quot;CRM&quot;.
          </div>
        )}
      </StrataPanel>

      <div
        style={{
          marginTop: 24,
          fontSize: 13,
          color: "var(--color-text-secondary, #475569)",
          lineHeight: 1.6,
        }}
      >
        Ctrl/Cmd+K opens the live command palette. Filter results server-side by current tenant and record permission; no cross-tenant snippets.
      </div>
    </StrataPageShell>
  );
}
