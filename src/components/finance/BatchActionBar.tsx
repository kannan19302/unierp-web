"use client";

import React from "react";
import { X, LucideIcon } from "lucide-react";
import styles from "./BatchActionBar.module.css";

export interface BatchAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export interface BatchActionBarProps {
  selectedCount: number;
  itemTypeLabel?: string;
  actions: BatchAction[];
  onClearSelection: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  itemTypeLabel = "items",
  actions,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={styles.container} role="toolbar" aria-label="Batch Actions Toolbar">
      <div className={styles.content}>
        <div className={styles.selectionInfo}>
          <span className={styles.badge}>{selectedCount}</span>
          <span className={styles.selectionLabel}>
            {selectedCount === 1 ? itemTypeLabel.replace(/s$/, "") : itemTypeLabel} selected
          </span>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={onClearSelection}
            title="Clear selection (Escape)"
          >
            <X size={12} />
            <span>Deselect all</span>
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.actions}>
          {actions.map((action, idx) => {
            const Icon = action.icon;
            const variantClass =
              action.variant === "primary"
                ? styles.btnPrimary
                : action.variant === "danger"
                ? styles.btnDanger
                : styles.btnSecondary;

            return (
              <button
                key={idx}
                type="button"
                className={`${styles.actionBtn} ${variantClass}`}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {Icon && <Icon size={14} className={styles.actionIcon} />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
