"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, ChevronDown, Sparkles } from "lucide-react";
import styles from "./HeaderOnboardingHUD.module.css";

export interface OnboardingHUDItem {
  key: string;
  label: string;
  isCompleted: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export function HeaderOnboardingHUD() {
  const router = useRouter();
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadChecklist() {
      try {
        const res = await fetch("/api/v1/saas/onboarding/wizard/state", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setChecklist(data);
        }
      } catch {
        // Degrades silently
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadChecklist();
    return () => {
      isMounted = false;
    };
  }, []);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (loading || !checklist || checklist.isCompleted) {
    return null;
  }

  const items: OnboardingHUDItem[] = [
    {
      key: "ORGANIZATION_PROFILE",
      label: "Organization & Profile",
      isCompleted: checklist.completedSteps?.includes("ORGANIZATION_PROFILE") || Boolean(checklist.organization),
      actionLabel: "Setup",
      actionUrl: "/onboarding",
    },
    {
      key: "INDUSTRY_BLUEPRINT",
      label: "Industry Blueprint",
      isCompleted: checklist.completedSteps?.includes("INDUSTRY_BLUEPRINT") || Boolean(checklist.industryBlueprint),
      actionLabel: "Configure",
      actionUrl: "/onboarding",
    },
    {
      key: "LOCALIZATION_FINANCE",
      label: "Chart of Accounts",
      isCompleted: checklist.completedSteps?.includes("LOCALIZATION_FINANCE"),
      actionLabel: "Review",
      actionUrl: "/onboarding",
    },
    {
      key: "TEAM_INVITATION",
      label: "Invite Team Members",
      isCompleted: checklist.completedSteps?.includes("TEAM_INVITATION"),
      actionLabel: "Invite",
      actionUrl: "/onboarding",
    },
    {
      key: "DATA_INGESTION",
      label: "Master Data Import / Demo",
      isCompleted: checklist.completedSteps?.includes("DATA_INGESTION"),
      actionLabel: "Import",
      actionUrl: "/onboarding",
    },
  ];

  const percentComplete = checklist.percentComplete || 20;
  const isAllComplete = percentComplete >= 100;
  const radius = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percentComplete)) / 100) * circumference;

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.pill} ${isOpen ? styles.pillActive : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Onboarding Progress Indicator"
      >
        <div className={styles.gaugeWrapper}>
          <svg className={styles.gaugeSvg} viewBox="0 0 18 18">
            <circle
              className={styles.gaugeBg}
              cx="9"
              cy="9"
              r={radius}
            />
            <circle
              className={styles.gaugeProgress}
              cx="9"
              cy="9"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
        </div>

        <span className={styles.title}>Setup</span>
        <span className={styles.percent}>{percentComplete}%</span>

        {isAllComplete ? (
          <Sparkles size={13} color="var(--color-success)" />
        ) : (
          <ChevronDown
            size={13}
            className={`${styles.chevron} ${isOpen ? styles.chevronRotated : ""}`}
          />
        )}
      </button>

      {isOpen && (
        <div
          className={styles.drawer}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.drawerHeader}>
            <span className={styles.drawerTitle}>Onboarding Milestones</span>
            <span className={styles.drawerPercent}>{percentComplete}% Completed</span>
          </div>

          <ul className={styles.list}>
            {items.map((item) => (
              <li
                key={item.key}
                className={`${styles.item} ${item.isCompleted ? styles.itemCompleted : ""}`}
              >
                <div className={styles.itemLeft}>
                  {item.isCompleted ? (
                    <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0 }} />
                  ) : (
                    <Circle size={14} color="var(--color-text-tertiary)" style={{ flexShrink: 0 }} />
                  )}
                  <span>{item.label}</span>
                </div>

                {!item.isCompleted && item.actionLabel && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.actionUrl) router.push(item.actionUrl);
                    }}
                  >
                    {item.actionLabel}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

