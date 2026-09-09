"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { ALL_FINANCE_MODULES } from "@/navigation/finance-workspaces";
import styles from "./page.module.css";

export default function AdvancedFinanceWorkspaceHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const categories = [
    { id: "ALL", label: "All Modules" },
    { id: "CORE", label: "Core Accounting" },
    { id: "TREASURY", label: "Payables & Treasury" },
    { id: "TAX", label: "Tax & Compliance" },
    { id: "PLANNING", label: "Planning & Reporting" },
    { id: "OPERATIONS", label: "Revenue & Billing" },
    { id: "GOVERNANCE", label: "Governance & ESG" },
    { id: "AI", label: "AI Financial Intelligence" },
  ];

  const filteredModules = useMemo(() => {
    return ALL_FINANCE_MODULES.filter((mod) => {
      if (selectedCategory !== "ALL" && mod.category !== selectedCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        mod.label.toLowerCase().includes(q) ||
        mod.desc.toLowerCase().includes(q) ||
        mod.href.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Enterprise Finance Workspace Hub</h1>
          <p className={styles.subtitle}>
            Comprehensive operational suites, high-density Strata floorplans, and direct ledger integration.
          </p>
        </div>

        <div className={styles.liveBadge}>
          <div className={styles.liveDot} />
          <span>{ALL_FINANCE_MODULES.length} Finance workspaces</span>
        </div>
      </div>

      {/* Controls Bar: Search & Category Pills */}
      <div className={styles.controlsBar}>
        <div className={styles.searchBox}>
          <Search size={15} color="var(--color-text-secondary)" />
          <input
            type="text"
            className={styles.searchInput}
            aria-label="Search Finance workspaces"
            placeholder="Search Finance workspaces"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.categoryPills}>
          {categories.map((cat) => {
            const count =
              cat.id === "ALL"
                ? ALL_FINANCE_MODULES.length
                : ALL_FINANCE_MODULES.filter((m) => m.category === cat.id).length;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.pillBtn} ${isActive ? styles.pillBtnActive : ""}`}
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className={styles.pillCount}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredModules.length === 0 && <p role="status">No Finance workspaces match your search.</p>}

      {/* Modules Grid */}
      <div className={styles.modulesGrid}>
        {filteredModules.map((mod) => (
          <Link key={mod.href} href={mod.href} className={styles.moduleCard}>
            <div className={styles.cardLeft}>
              <div className={styles.cardIcon}>{mod.icon}</div>
              <div className={styles.cardMeta}>
                <span className={styles.cardLabel}>{mod.label}</span>
                <p className={styles.cardDesc}>{mod.desc}</p>
                <span className={styles.cardBadge}>
                  {mod.category === "CORE"
                    ? "Accounting"
                    : mod.category === "TREASURY"
                    ? "Treasury"
                    : mod.category === "TAX"
                    ? "Tax & Statutory"
                    : mod.category === "PLANNING"
                    ? "FP&A Planning"
                    : mod.category === "OPERATIONS"
                    ? "Billing / Ops"
                    : mod.category === "GOVERNANCE"
                    ? "Governance & ESG"
                    : "AI Intelligence"}
                </span>
              </div>
            </div>
            <ChevronRight size={15} className={styles.cardArrow} />
          </Link>
        ))}
      </div>
    </div>
  );
}
