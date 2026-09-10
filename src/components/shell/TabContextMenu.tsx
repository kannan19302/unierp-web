"use client";

import React, { useEffect, useRef, type FC } from "react";
import { createPortal } from "react-dom";
import {
  X,
  PlusSquare,
  ChevronRight,
  ChevronLeft,
  Copy,
  ExternalLink,
  Minus,
  RefreshCw,
  Star,
  Pin,
  PinOff,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Trash2,
} from "lucide-react";
import styles from "./TabContextMenu.module.css";

export type ContextMenuTarget =
  | {
      type: "tab";
      tabId: string;
      tabTitle: string;
      tabHref: string;
      pinned?: boolean;
      closable?: boolean;
      index?: number;
      totalTabs?: number;
    }
  | {
      type: "tabstrip";
      canReopen?: boolean;
      reopenTitle?: string;
    }
  | {
      type: "nav";
      href: string;
      label: string;
    };

export interface TabContextMenuProps {
  target: ContextMenuTarget | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onCloseTab?: (tabId: string) => void;
  onCloseOtherTabs?: (tabId: string) => void;
  onCloseTabsToRight?: (tabId: string) => void;
  onCloseTabsToLeft?: (tabId: string) => void;
  onCloseAllTabs?: () => void;
  onDuplicateTab?: (tabId: string) => void;
  onTogglePinTab?: (tabId: string) => void;
  onMoveTab?: (tabId: string, direction: "left" | "right") => void;
  onReloadTab?: (tabId: string) => void;
  onReopenClosedTab?: () => void;
  onNewTab?: () => void;
}

export const TabContextMenu: FC<TabContextMenuProps> = ({
  target,
  position,
  onClose,
  onCloseTab,
  onCloseOtherTabs,
  onCloseTabsToRight,
  onCloseTabsToLeft,
  onCloseAllTabs,
  onDuplicateTab,
  onTogglePinTab,
  onMoveTab,
  onReloadTab,
  onReopenClosedTab,
  onNewTab,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!target || !position) return;

    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [target, position, onClose]);

  // Focus first item when menu opens
  useEffect(() => {
    if (target && position) {
      const first = menuRef.current?.querySelector<HTMLButtonElement>("button, a");
      first?.focus();
    }
  }, [target, position]);

  if (!target || !position) return null;

  // Clamp to viewport
  const menuWidth = 240;
  const menuHeight = target.type === "tab" ? 440 : 180;
  const x = Math.max(8, Math.min(position.x, window.innerWidth - menuWidth - 8));
  const y = Math.max(8, Math.min(position.y, window.innerHeight - menuHeight - 8));

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    onClose();
  };

  const openInNewBrowserTab = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
    onClose();
  };

  const menu = (
    <div
      ref={menuRef}
      role="menu"
      aria-label={
        target.type === "tab"
          ? `Tab options for ${target.tabTitle}`
          : target.type === "tabstrip"
          ? "Tab strip options"
          : `Options for ${target.label}`
      }
      className={styles.menu}
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {target.type === "tab" ? (
        <>
          <div className={styles.menuHeader}>
            <span className={styles.menuLabel} title={target.tabTitle}>
              {target.tabTitle}
            </span>
            {target.pinned && (
              <span className={styles.badgePinned}>
                <Pin size={10} aria-hidden /> Pinned
              </span>
            )}
          </div>
          <div className={styles.divider} aria-hidden />

          {/* Tab lifecycle & state actions */}
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              onReloadTab?.(target.tabId);
              onClose();
            }}
          >
            <RefreshCw size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Reload tab</span>
            <span className={styles.shortcut}>Ctrl+R</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              if (onDuplicateTab) {
                onDuplicateTab(target.tabId);
              } else {
                window.dispatchEvent(
                  new CustomEvent("finance:open-tab", {
                    detail: { href: target.tabHref, label: `${target.tabTitle} (2)` },
                  })
                );
              }
              onClose();
            }}
          >
            <PlusSquare size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Duplicate tab</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              onTogglePinTab?.(target.tabId);
              onClose();
            }}
          >
            {target.pinned ? (
              <>
                <PinOff size={14} aria-hidden className={styles.menuItemIcon} />
                <span>Unpin tab</span>
              </>
            ) : (
              <>
                <Pin size={14} aria-hidden className={styles.menuItemIcon} />
                <span>Pin tab</span>
              </>
            )}
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={target.index === 0}
            className={`${styles.menuItem} ${target.index === 0 ? styles.menuItemDisabled : ""}`}
            onClick={() => {
              onMoveTab?.(target.tabId, "left");
              onClose();
            }}
          >
            <ArrowLeft size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Move tab left</span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={
              target.index !== undefined &&
              target.totalTabs !== undefined &&
              target.index >= target.totalTabs - 1
            }
            className={`${styles.menuItem} ${
              target.index !== undefined &&
              target.totalTabs !== undefined &&
              target.index >= target.totalTabs - 1
                ? styles.menuItemDisabled
                : ""
            }`}
            onClick={() => {
              onMoveTab?.(target.tabId, "right");
              onClose();
            }}
          >
            <ArrowRight size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Move tab right</span>
          </button>

          <div className={styles.divider} aria-hidden />

          {/* Close actions */}
          <button
            type="button"
            role="menuitem"
            disabled={target.closable === false || target.pinned}
            className={`${styles.menuItem} ${styles.menuItemDanger} ${
              target.closable === false || target.pinned ? styles.menuItemDisabled : ""
            }`}
            onClick={() => {
              onCloseTab?.(target.tabId);
              onClose();
            }}
          >
            <X size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Close tab</span>
            <span className={styles.shortcut}>Ctrl+W</span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={target.totalTabs !== undefined && target.totalTabs <= 1}
            className={`${styles.menuItem} ${
              target.totalTabs !== undefined && target.totalTabs <= 1 ? styles.menuItemDisabled : ""
            }`}
            onClick={() => {
              onCloseOtherTabs?.(target.tabId);
              onClose();
            }}
          >
            <Minus size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Close other tabs</span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={
              target.index !== undefined &&
              target.totalTabs !== undefined &&
              target.index >= target.totalTabs - 1
            }
            className={`${styles.menuItem} ${
              target.index !== undefined &&
              target.totalTabs !== undefined &&
              target.index >= target.totalTabs - 1
                ? styles.menuItemDisabled
                : ""
            }`}
            onClick={() => {
              onCloseTabsToRight?.(target.tabId);
              onClose();
            }}
          >
            <ChevronRight size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Close tabs to the right</span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={target.index === 0}
            className={`${styles.menuItem} ${target.index === 0 ? styles.menuItemDisabled : ""}`}
            onClick={() => {
              onCloseTabsToLeft?.(target.tabId);
              onClose();
            }}
          >
            <ChevronLeft size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Close tabs to the left</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            onClick={() => {
              onCloseAllTabs?.();
              onClose();
            }}
          >
            <Trash2 size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Close all tabs</span>
          </button>

          <div className={styles.divider} aria-hidden />

          {/* History restoration */}
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              onReopenClosedTab?.();
              onClose();
            }}
          >
            <RotateCcw size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Reopen closed tab</span>
            <span className={styles.shortcut}>Ctrl+Shift+T</span>
          </button>

          <div className={styles.divider} aria-hidden />

          {/* External / sharing actions */}
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => copyToClipboard(window.location.origin + target.tabHref)}
          >
            <Copy size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Copy tab link</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => openInNewBrowserTab(target.tabHref)}
          >
            <ExternalLink size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Open in new window</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("finance:favorite-tab", {
                  detail: { href: target.tabHref, title: target.tabTitle },
                })
              );
              onClose();
            }}
          >
            <Star size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Bookmark tab</span>
          </button>
        </>
      ) : target.type === "tabstrip" ? (
        <>
          <div className={styles.menuHeader}>
            <span className={styles.menuLabel}>Tab Strip Options</span>
          </div>
          <div className={styles.divider} aria-hidden />

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              onNewTab?.();
              onClose();
            }}
          >
            <PlusSquare size={14} aria-hidden className={styles.menuItemIcon} />
            <span>New tab</span>
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={!target.canReopen}
            className={`${styles.menuItem} ${!target.canReopen ? styles.menuItemDisabled : ""}`}
            onClick={() => {
              onReopenClosedTab?.();
              onClose();
            }}
          >
            <RotateCcw size={14} aria-hidden className={styles.menuItemIcon} />
            <span>
              {target.reopenTitle ? `Reopen: ${target.reopenTitle}` : "Reopen closed tab"}
            </span>
            <span className={styles.shortcut}>Ctrl+Shift+T</span>
          </button>

          <div className={styles.divider} aria-hidden />

          <button
            type="button"
            role="menuitem"
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            onClick={() => {
              onCloseAllTabs?.();
              onClose();
            }}
          >
            <Trash2 size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Close all tabs</span>
          </button>
        </>
      ) : (
        <>
          <div className={styles.menuHeader}>
            <span className={styles.menuLabel}>{target.label}</span>
          </div>
          <div className={styles.divider} aria-hidden />

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("finance:open-tab", {
                  detail: { href: target.href, label: target.label },
                })
              );
              onClose();
            }}
          >
            <PlusSquare size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Open in new app tab</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => copyToClipboard(window.location.origin + target.href)}
          >
            <Copy size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Copy link address</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => openInNewBrowserTab(target.href)}
          >
            <ExternalLink size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Open in new window</span>
          </button>

          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("finance:favorite-tab", {
                  detail: { href: target.href, title: target.label },
                })
              );
              onClose();
            }}
          >
            <Star size={14} aria-hidden className={styles.menuItemIcon} />
            <span>Bookmark to favorites</span>
          </button>
        </>
      )}
    </div>
  );

  // Render into body so z-index is not clipped by stacking contexts
  if (typeof document === "undefined") return null;
  return createPortal(menu, document.body);
};
