"use client";

import React, { useEffect, useRef, type FC } from "react";
import { X, Keyboard } from "lucide-react";
import { FINANCE_SHORTCUTS } from "@/hooks/useFinanceKeyboard";
import styles from "./KeyboardShortcutsHelp.module.css";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Trap focus inside the dialog while open
  useEffect(() => {
    if (!isOpen) return;
    // Focus the close button on open
    setTimeout(() => closeRef.current?.focus(), 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      // Simple focus trap: if Tab reaches beyond dialog, wrap
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const groups = FINANCE_SHORTCUTS.reduce<
    Record<string, typeof FINANCE_SHORTCUTS>
  >((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Keyboard size={16} aria-hidden className={styles.titleIcon} />
            <h2 className={styles.title}>Keyboard shortcuts</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        {/* Shortcut groups */}
        <div className={styles.body}>
          {Object.entries(groups).map(([group, shortcuts]) => (
            <section key={group} className={styles.group}>
              <h3 className={styles.groupTitle}>{group}</h3>
              <table className={styles.table} role="table">
                <tbody>
                  {shortcuts.map((s) => (
                    <tr key={s.keys} className={styles.row}>
                      <td className={styles.keysCell}>
                        {s.keys.split(" ").map((k, i) => (
                          <React.Fragment key={k}>
                            {i > 0 && (
                              <span className={styles.keySep} aria-hidden>+</span>
                            )}
                            <kbd className={styles.kbd}>{k}</kbd>
                          </React.Fragment>
                        ))}
                      </td>
                      <td className={styles.labelCell}>{s.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        {/* Footer tip */}
        <div className={styles.footer}>
          Press <kbd className={styles.kbdInline}>?</kbd> anywhere (outside inputs) to toggle this panel
        </div>
      </div>
    </div>
  );
};
