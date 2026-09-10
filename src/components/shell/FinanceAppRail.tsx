"use client";

import React, { useState, type FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  ShoppingCart,
  Package,
  BarChart3,
  HelpCircle,
  Users,
  RotateCcw,
} from "lucide-react";
import styles from "./FinanceAppRail.module.css";

export interface FinanceAppRailProps {
  activeApp?: string; // ignored — computed from pathname
  userInitials?: string;
  onOpenApps?: () => void;
  onOpenHelp?: () => void;
  onOpenUserMenu?: () => void;
  onToggleSidebar?: () => void;
}

interface AppItem {
  id: string;
  href: string;
  icon: any;
  label: string;
}

const APPS: AppItem[] = [
  { id: "finance",   href: "/finance",    icon: FileText,      label: "Finance" },
  { id: "sales",     href: "/sales",      icon: ShoppingCart,  label: "Sales" },
  { id: "inventory", href: "/inventory",  icon: Package,       label: "Inventory" },
  { id: "hr",        href: "/hr",         icon: Users,         label: "People" },
  { id: "analytics", href: "/analytics",  icon: BarChart3,     label: "Analytics" },
];

export const FinanceAppRail: FC<FinanceAppRailProps> = ({
  userInitials = "FM",
  onOpenApps,
  onOpenHelp,
  onOpenUserMenu,
  onToggleSidebar,
}) => {
  const pathname = usePathname();

  // Load custom app order from localStorage
  const [appsList, setAppsList] = useState<AppItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("unierp_app_rail_order");
        if (saved) {
          const ids: string[] = JSON.parse(saved);
          const ordered = ids
            .map((id) => APPS.find((a) => a.id === id))
            .filter(Boolean) as AppItem[];
          if (ordered.length === APPS.length) return ordered;
        }
      } catch {}
    }
    return [...APPS];
  });

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [railContextMenu, setRailContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Derive the active app from the current path
  const activeId: string =
    APPS.find((a) => pathname.startsWith(a.href))?.id ?? "finance";

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const items = [...appsList];
    const [moved] = items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, moved);
    setDraggedIdx(targetIdx);
    setAppsList(items);
    try {
      localStorage.setItem("unierp_app_rail_order", JSON.stringify(items.map((a) => a.id)));
    } catch {}
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const resetRailOrder = () => {
    setAppsList([...APPS]);
    try {
      localStorage.removeItem("unierp_app_rail_order");
    } catch {}
    setRailContextMenu(null);
  };

  return (
    <nav
      className={styles.rail}
      aria-label="Primary App Rail"
      onContextMenu={(e) => {
        e.preventDefault();
        setRailContextMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Top Section: App Switchers */}
      <div className={styles.topSection}>
        {/* Apps quick-launcher button */}
        <button
          type="button"
          className={`${styles.railItem} ${activeId === "apps" ? styles.railItemActive : ""}`}
          onClick={onOpenApps}
          title="All apps launcher"
          aria-label="All apps launcher"
          aria-pressed={activeId === "apps"}
        >
          <LayoutGrid size={18} aria-hidden />
          <span className={styles.railItemLabel}>Apps</span>
        </button>

        {/* Reorderable App Workspaces (VS Code style drag-and-drop) */}
        <div
          className={styles.navGroup}
          role="navigation"
          aria-label="App workspaces"
        >
          {appsList.map(({ id, href, icon: Icon, label }, idx) => {
            const isActive = id === activeId;
            const isDragging = draggedIdx === idx;
            return (
              <div
                key={id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`${styles.draggableWrap} ${isDragging ? styles.isDragging : ""}`}
              >
                <Link
                  href={href}
                  className={`${styles.railItem} ${isActive ? styles.railItemActive : ""}`}
                  title={`${label}${isActive ? " — toggle sidebar (Ctrl+B)" : ""} (Drag to reorder)`}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(e) => {
                    if (isActive && onToggleSidebar) {
                      e.preventDefault();
                      onToggleSidebar();
                    }
                  }}
                >
                  <Icon size={18} aria-hidden />
                  <span className={styles.railItemLabel}>{label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Help & User */}
      <div className={styles.bottomSection}>
        <button
          type="button"
          className={styles.railItem}
          onClick={onOpenHelp}
          title="Help & keyboard shortcuts (?)"
          aria-label="Help and keyboard shortcuts"
        >
          <HelpCircle size={18} aria-hidden />
          <span className={styles.railItemLabel}>Help</span>
        </button>

        <button
          type="button"
          className={styles.avatarButton}
          onClick={onOpenUserMenu}
          title="User profile & settings"
          aria-label={`User account: ${userInitials}`}
        >
          {userInitials}
        </button>
      </div>

      {/* Rail Customization Context Menu */}
      {railContextMenu && (
        <>
          <div
            className={styles.contextOverlay}
            onClick={() => setRailContextMenu(null)}
          />
          <div
            className={styles.railContextMenu}
            style={{
              top: Math.min(railContextMenu.y, typeof window !== "undefined" ? window.innerHeight - 80 : 400),
              left: railContextMenu.x + 8,
            }}
          >
            <div className={styles.railMenuTitle}>App Rail Options</div>
            <button
              type="button"
              className={styles.railMenuItem}
              onClick={resetRailOrder}
            >
              <RotateCcw size={13} />
              <span>Reset to default order</span>
            </button>
          </div>
        </>
      )}
    </nav>
  );
};
