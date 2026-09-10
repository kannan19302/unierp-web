"use client";

import React, { useEffect, useRef } from "react";
import {
  ExternalLink,
  Copy,
  FileCode,
  Check,
  LucideIcon,
} from "lucide-react";
import styles from "./RowContextMenu.module.css";

export interface ContextMenuAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface RowContextMenuProps {
  x: number;
  y: number;
  recordId?: string;
  recordTitle?: string;
  recordData?: Record<string, any>;
  onOpenInTab?: () => void;
  customActions?: ContextMenuAction[];
  onClose: () => void;
}

export const RowContextMenu: React.FC<RowContextMenuProps> = ({
  x,
  y,
  recordId,
  recordTitle,
  recordData,
  onOpenInTab,
  customActions = [],
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [copiedType, setCopiedType] = React.useState<"id" | "json" | null>(null);

  // Position adjustments to ensure menu stays within viewport
  const [adjustedPos, setAdjustedPos] = React.useState({ x, y });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let posX = x;
    let posY = y;

    if (posX + rect.width > viewportW - 12) {
      posX = viewportW - rect.width - 12;
    }
    if (posY + rect.height > viewportH - 12) {
      posY = viewportH - rect.height - 12;
    }

    setAdjustedPos({ x: Math.max(12, posX), y: Math.max(12, posY) });
  }, [x, y]);

  // Click outside and Escape listener
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recordId) return;
    navigator.clipboard.writeText(recordId);
    setCopiedType("id");
    setTimeout(() => {
      setCopiedType(null);
      onClose();
    }, 600);
  };

  const handleCopyJson = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recordData) return;
    navigator.clipboard.writeText(JSON.stringify(recordData, null, 2));
    setCopiedType("json");
    setTimeout(() => {
      setCopiedType(null);
      onClose();
    }, 600);
  };

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{
        left: `${adjustedPos.x}px`,
        top: `${adjustedPos.y}px`,
      }}
      role="menu"
      aria-label="Row Actions Context Menu"
    >
      {recordTitle && (
        <div className={styles.header}>
          <span className={styles.headerTitle}>{recordTitle}</span>
          {recordId && <span className={styles.headerId}>{recordId}</span>}
        </div>
      )}

      <div className={styles.group}>
        {onOpenInTab && (
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              onOpenInTab();
              onClose();
            }}
            role="menuitem"
          >
            <ExternalLink size={14} className={styles.itemIcon} />
            <span>Open in new tab</span>
          </button>
        )}

        {recordId && (
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleCopyId}
            role="menuitem"
          >
            {copiedType === "id" ? (
              <Check size={14} className={styles.successIcon} />
            ) : (
              <Copy size={14} className={styles.itemIcon} />
            )}
            <span>{copiedType === "id" ? "Copied ID!" : "Copy identifier"}</span>
          </button>
        )}

        {recordData && (
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleCopyJson}
            role="menuitem"
          >
            {copiedType === "json" ? (
              <Check size={14} className={styles.successIcon} />
            ) : (
              <FileCode size={14} className={styles.itemIcon} />
            )}
            <span>{copiedType === "json" ? "Copied JSON!" : "Copy row as JSON"}</span>
          </button>
        )}
      </div>

      {customActions.length > 0 && (
        <>
          <div className={styles.separator} />
          <div className={styles.group}>
            {customActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.menuItem} ${action.destructive ? styles.itemDestructive : ""}`}
                  onClick={() => {
                    action.onClick();
                    onClose();
                  }}
                  disabled={action.disabled}
                  role="menuitem"
                >
                  {ActionIcon && <ActionIcon size={14} className={styles.itemIcon} />}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
