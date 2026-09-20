"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StrataPageShell } from "@/components/shell/StrataPageShell";
import { StrataRows, type StrataRowItem } from "@/components/shell/StrataRows";
import { StrataPanel } from "@/components/shell/StrataPanel";
import s from "@/components/shell/strata-home.module.css";

const HELP_TOPICS: StrataRowItem[] = [
  {
    title: "Start with UniERP Home",
    detail: "A guide to your first visit",
    tag: "Read",
    href: "/home/first-visit",
  },
  {
    title: "Set up an application",
    detail: "Readiness, access and activation",
    tag: "Read",
    href: "/setup",
  },
  {
    title: "Trouble signing in",
    detail: "Safe account recovery",
    tag: "Read",
    href: "/account/security",
  },
  {
    title: "Contact support",
    detail: "Include a safe reference, never passwords or records",
    tag: "Open",
    href: "mailto:support@unierp.com",
  },
  {
    title: "Personal settings & privacy",
    detail: "Manage identity, credentials and sessions in Account Center",
    tag: "Read",
    href: "/account",
  },
  {
    title: "Organizations & workspace switching",
    detail: "Switching context without leaking tenant cache",
    tag: "Read",
    href: "/account/organizations",
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");

  const filteredTopics = useMemo(() => {
    if (!query.trim()) return HELP_TOPICS;
    const q = query.toLowerCase();
    return HELP_TOPICS.filter(
      (topic) =>
        topic.title.toLowerCase().includes(q) ||
        topic.detail.toLowerCase().includes(q) ||
        (topic.tag && topic.tag.toLowerCase().includes(q))
    );
  }, [query]);

  return (
    <StrataPageShell
      breadcrumb="UniERP Home / Help"
      breadcrumbHref="/home/help"
      title="How can we help?"
      subtitle="Guidance without leaving your place in UniERP."
      screenNumber="V2 / 15"
      actions={
        <Link href="/home" className={s.btnPrimary}>
          Back to Home
        </Link>
      }
    >
      <div style={{ marginBottom: 24 }}>
        <label className={s.field}>
          Search help
          <input
            type="text"
            className={s.fieldInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What would you like to do?"
            autoComplete="off"
          />
        </label>
      </div>

      <StrataPanel title={query ? `Articles matching "${query}"` : "Help topics"}>
        {filteredTopics.length > 0 ? (
          <StrataRows items={filteredTopics} insidePanel />
        ) : (
          <div style={{ padding: "20px 0", color: "var(--color-text-secondary, #475569)" }}>
            No articles found matching &quot;{query}&quot;. Try different keywords or contact support.
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
        Support requests use minimized context and must never auto-attach sensitive records.
      </div>
    </StrataPageShell>
  );
}
