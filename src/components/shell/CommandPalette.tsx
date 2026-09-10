"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Zap,
  LogOut,
  Palette,
  Database,
  type LucideIcon,
} from "lucide-react";
import { useTheme, type ThemeSetting } from "@kannan19302/ui/theme";
import { useApiClient } from "@kannan19302/framework";
import { allApplications, getAppSpecificNavigation } from "@/navigation";
import styles from "./CommandPalette.module.css";

// ─────────────────────────────────────────────────
// Global command palette (Ctrl/Cmd+K):
//  • Apps        — top-level applications
//  • Pages       — every sidebar entry of every installed app
//  • Actions     — theme switching, sign out, …
//  • Records     — live tenant-scoped entity search via /search/global
// ─────────────────────────────────────────────────

interface PaletteItem {
  key: string;
  name: string;
  group: string;
  subtitle?: string;
  icon:
    | LucideIcon
    | React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  run: () => void;
}

interface SearchHit {
  entity: string;
  group: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  GLOBAL_SEARCH_ITEMS: any[];
  onLogout?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  GLOBAL_SEARCH_ITEMS,
  onLogout,
}: CommandPaletteProps) {
  const router = useRouter();
  const client = useApiClient();
  const { setTheme, themes } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [entityHits, setEntityHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  // Track the element that triggered the palette so we can restore focus on close
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Capture the current active element to restore on close
      triggerRef.current = document.activeElement;
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIdx(0);
      setEntityHits([]);
    } else {
      // Restore focus to the triggering element
      if (triggerRef.current && "focus" in triggerRef.current) {
        (triggerRef.current as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  // Scroll selected item into view on arrow navigation
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  // Static index: apps, every nav page of every app, and shell actions.
  const staticItems = useMemo<PaletteItem[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
    };

    const apps: PaletteItem[] = GLOBAL_SEARCH_ITEMS.map((item: any) => ({
      key: `app:${item.href}`,
      name: item.name,
      group: "Apps",
      icon: item.icon,
      run: go(item.href),
    }));

    const seen = new Set<string>();
    const pages: PaletteItem[] = [];
    for (const app of allApplications) {
      const nav = getAppSpecificNavigation(app.href);
      const walk = (items: any[], section?: string) => {
        for (const it of items) {
          if (it.isHeader && it.items) {
            walk(it.items, it.name);
            continue;
          }
          if (!it.href || seen.has(it.href) || it.href === app.href) continue;
          seen.add(it.href);
          pages.push({
            key: `page:${it.href}`,
            name: it.name,
            group: "Pages",
            subtitle: section ? `${app.name} · ${section}` : app.name,
            icon: it.icon ?? FileText,
            run: go(it.href),
          });
        }
      };
      walk(nav.items);
    }

    const actions: PaletteItem[] = [
      ...themes.map((t: ThemeSetting) => ({
        key: `action:theme:${t}`,
        name: `Switch theme to ${t}`,
        group: "Actions",
        subtitle: "Appearance",
        icon: Palette,
        run: () => setTheme(t),
      })),
      {
        key: "action:theme:system",
        name: "Switch theme to system",
        group: "Actions",
        subtitle: "Follow OS light/dark preference",
        icon: Palette,
        run: () => setTheme("system"),
      },
      ...(onLogout
        ? [
            {
              key: "action:logout",
              name: "Sign out",
              group: "Actions",
              subtitle: "End this session",
              icon: LogOut,
              run: onLogout,
            },
          ]
        : []),
    ];

    return [...apps, ...pages, ...actions];
  }, [GLOBAL_SEARCH_ITEMS, router, themes, setTheme, onLogout]);

  // Live entity search, debounced per keystroke.
  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setEntityHits([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await client.get<{ data: SearchHit[] }>(
          `/search/global?q=${encodeURIComponent(query.trim())}`,
        );
        if (!cancelled) setEntityHits(res?.data ?? []);
      } catch {
        if (!cancelled) setEntityHits([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, isOpen, client]);

  const q = query.trim().toLowerCase();
  const filteredStatic = staticItems
    .filter(
      (item: any) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q),
    )
    .slice(0, q ? 10 : 12);

  const recordItems: PaletteItem[] = entityHits.map((hit: any) => ({
    key: `record:${hit.entity}:${hit.id}`,
    name: hit.title,
    group: hit.group,
    subtitle: hit.subtitle,
    icon: Database,
    run: () => {
      router.push(hit.href);
    },
  }));

  const flatItems = [...filteredStatic, ...recordItems];

  // Group for rendering while keeping one flat keyboard-nav order.
  const grouped: Array<{
    group: string;
    items: Array<{ item: PaletteItem; idx: number }>;
  }> = [];
  flatItems.forEach((item: any, idx: any) => {
    const bucket = grouped.find((g: any) => g.group === item.group);
    if (bucket) bucket.items.push({ item, idx });
    else grouped.push({ group: item.group, items: [{ item, idx }] });
  });

  const activate = (item: PaletteItem) => {
    item.run();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i: any) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i: any) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatItems[selectedIdx];
      if (target) activate(target);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Announcement text for screen readers
  const announcementText =
    flatItems.length > 0
      ? `${flatItems.length} result${flatItems.length === 1 ? "" : "s"}`
      : q.length >= 2
        ? "No results"
        : "";

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette — search apps, pages, records and actions"
        className={styles.modalCard}
        onClick={(e: any) => e.stopPropagation()}
      >
        {/* Screen-reader live region for result count */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={styles.srOnly}
        >
          {announcementText}
        </div>

        {/* Search header input */}
        <div className={styles.searchHeader}>
          <Search
            size={18}
            style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
            aria-hidden
          />
          <input
            ref={inputRef}
            id="cmd-palette-input"
            type="text"
            role="combobox"
            aria-expanded={flatItems.length > 0}
            aria-autocomplete="list"
            aria-controls="cmd-palette-results"
            aria-activedescendant={
              flatItems[selectedIdx] ? `cmd-item-${flatItems[selectedIdx].key}` : undefined
            }
            placeholder="Search apps, pages, records, actions…"
            value={query}
            onChange={(e: any) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          {searching && (
            <Zap
              size={14}
              style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
              aria-hidden
            />
          )}
          <kbd className={styles.kbd} aria-hidden>ESC</kbd>
        </div>

        {/* Results Area */}
        <div
          id="cmd-palette-results"
          ref={listRef}
          className={styles.resultsArea}
          role="listbox"
          aria-label="Command palette results"
        >
          {flatItems.length === 0 ? (
            <div className={styles.noResults}>
              {q.length >= 2
                ? "No matching apps, pages, or records"
                : "Type to search everything…"}
            </div>
          ) : (
            grouped.map(({ group, items }: any) => (
              <div key={group} role="group" aria-label={group}>
                <div className={styles.groupLabel} aria-hidden>
                  {group}
                </div>
                {items.map(({ item, idx }: any) => {
                  const isActive = idx === selectedIdx;
                  const Icon = item.icon;
                  const btnClass = `${styles.resultBtn} ${isActive ? styles.resultBtnActive : styles.resultBtnInactive}`;
                  return (
                    <button
                      key={item.key}
                      id={`cmd-item-${item.key}`}
                      role="option"
                      aria-selected={isActive}
                      ref={isActive ? selectedItemRef : undefined}
                      onClick={() => activate(item)}
                      className={btnClass}
                      onMouseEnter={() => setSelectedIdx(idx)}
                    >
                      <Icon
                        size={16}
                        style={{
                          color:
                            item.group === "Apps"
                              ? "var(--color-primary)"
                              : "var(--color-text-secondary)",
                          flexShrink: 0,
                        }}
                        aria-hidden
                      />
                      <div className={styles.resultTextWrapper}>
                        <div className={styles.resultName}>{item.name}</div>
                        {item.subtitle && (
                          <div className={styles.resultSubtitle}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      <span className={styles.resultType} aria-hidden>{item.group}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer tips */}
        <div className={styles.footer} aria-hidden>
          <span>
            <kbd className={styles.footerKbd}>↑↓</kbd> navigate
          </span>
          <span>
            <kbd className={styles.footerKbd}>↵</kbd> open
          </span>
          <span>
            <kbd className={styles.footerKbd}>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
