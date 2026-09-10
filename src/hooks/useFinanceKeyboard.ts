"use client";

import { useEffect, useCallback, type RefObject } from "react";

export interface ShortcutDescriptor {
  /** Display key combo, e.g. "Ctrl K" */
  keys: string;
  /** Human-readable description */
  label: string;
  /** Shortcut category for grouping in the help panel */
  group: "Navigation" | "Actions" | "View";
}

export interface UseFinanceKeyboardConfig {
  /** Open the command palette */
  onOpenSearch: () => void;
  /** Toggle AI copilot panel */
  onToggleCopilot: () => void;
  /** Toggle sidebar collapsed state */
  onToggleSidebar: () => void;
  /** Focus the sidebar "Find in Finance" input */
  sidebarSearchRef?: RefObject<HTMLInputElement | null>;
  /** Activate a tab by 1-based index */
  onActivateTab?: (index: number) => void;
  /** Open keyboard shortcuts help panel */
  onOpenHelp: () => void;
  /** True when any modal/overlay is open (suppresses ? shortcut) */
  isModalOpen?: boolean;
}

/** All Finance workspace keyboard shortcuts in canonical order */
export const FINANCE_SHORTCUTS: ShortcutDescriptor[] = [
  { keys: "Ctrl K", label: "Open command palette / search", group: "Navigation" },
  { keys: "Ctrl B", label: "Toggle sidebar", group: "View" },
  { keys: "Ctrl /", label: "Find in Finance (sidebar search)", group: "Navigation" },
  { keys: "Ctrl J", label: "Toggle AI Finance Copilot", group: "Actions" },
  { keys: "Alt 1–9", label: "Switch to tab 1–9", group: "Navigation" },
  { keys: "?", label: "Show keyboard shortcuts", group: "Navigation" },
  { keys: "Esc", label: "Close modal / palette / dropdown", group: "Actions" },
  { keys: "↑ ↓", label: "Navigate command palette results", group: "Navigation" },
  { keys: "↵", label: "Open selected result", group: "Navigation" },
];

/**
 * Registers all Finance-scoped keyboard shortcuts.
 * Must be mounted once at the FinanceShellV2 level.
 */
export function useFinanceKeyboard(config: UseFinanceKeyboardConfig) {
  const {
    onOpenSearch,
    onToggleCopilot,
    onToggleSidebar,
    sidebarSearchRef,
    onActivateTab,
    onOpenHelp,
    isModalOpen = false,
  } = config;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || tag === "select" ||
        (e.target as HTMLElement)?.isContentEditable;

      // Ctrl/Cmd+K → Command Palette
      if (modKey && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      // Ctrl/Cmd+B → Toggle Sidebar
      if (modKey && e.key === "b") {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // Ctrl/Cmd+J → Toggle AI Copilot
      if (modKey && e.key === "j") {
        e.preventDefault();
        onToggleCopilot();
        return;
      }

      // Ctrl/Cmd+/ → Focus "Find in Finance" sidebar search
      if (modKey && e.key === "/") {
        e.preventDefault();
        sidebarSearchRef?.current?.focus();
        return;
      }

      // Alt+1…9 → Activate tab N
      if (e.altKey && !modKey && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        onActivateTab?.(parseInt(e.key, 10) - 1);
        return;
      }

      // ? → Open keyboard shortcuts help (only when not typing and no modal open)
      if (!isTyping && !isModalOpen && e.key === "?") {
        e.preventDefault();
        onOpenHelp();
        return;
      }
    },
    [
      onOpenSearch,
      onToggleCopilot,
      onToggleSidebar,
      sidebarSearchRef,
      onActivateTab,
      onOpenHelp,
      isModalOpen,
    ],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: FINANCE_SHORTCUTS };
}
