"use client";

import React, { useState, useRef, useEffect, type FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Bell,
  HelpCircle,
  Plus,
  Sparkles,
  FileText,
  CreditCard,
  Building2,
} from "lucide-react";
import styles from "./FinanceCommandHeader.module.css";

export interface FinanceCommandHeaderProps {
  onOpenCmdPalette?: () => void;
  userInitials?: string;
  unreadNotifications?: number;
}

export const FinanceCommandHeader: FC<FinanceCommandHeaderProps> = ({
  onOpenCmdPalette,
  userInitials = "FM",
  unreadNotifications = 12,
}) => {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    if (createOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [createOpen]);

  return (
    <header className={styles.header} aria-label="Global Command Header">
      {/* Left: Breadcrumb */}
      <div className={styles.leftSection}>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/apps" className={styles.breadcrumbRoot}>
            UniERP
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <button type="button" className={styles.breadcrumbCurrent}>
            <span>Finance</span>
            <ChevronDown size={14} aria-hidden />
          </button>
        </nav>
      </div>

      {/* Center: Command Palette Trigger */}
      <div className={styles.centerSection}>
        <button
          type="button"
          className={styles.searchBox}
          onClick={onOpenCmdPalette}
          title="Search anything (Ctrl+K)"
        >
          <div className={styles.searchLeft}>
            <Search size={14} className={styles.searchIcon} aria-hidden />
            <span>Search anything</span>
          </div>
          <span className={styles.shortcutBadge}>Ctrl K</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className={styles.rightSection}>
        {/* Create Dropdown */}
        <div className={styles.createContainer} ref={createRef}>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setCreateOpen(!createOpen)}
            aria-expanded={createOpen}
            title="Create new finance record"
          >
            <span>Create</span>
            <ChevronDown size={14} aria-hidden />
          </button>

          {createOpen && (
            <div className={styles.createMenu} role="menu">
              <Link
                href="/finance/gl?action=new"
                className={styles.createMenuItem}
                onClick={() => setCreateOpen(false)}
              >
                <FileText size={14} />
                <span>New journal entry</span>
              </Link>
              <Link
                href="/finance/ar?action=new"
                className={styles.createMenuItem}
                onClick={() => setCreateOpen(false)}
              >
                <CreditCard size={14} />
                <span>New invoice</span>
              </Link>
              <Link
                href="/finance/ap?action=new"
                className={styles.createMenuItem}
                onClick={() => setCreateOpen(false)}
              >
                <Building2 size={14} />
                <span>New bill</span>
              </Link>
            </div>
          )}
        </div>

        {/* AI Copilot Toggle */}
        <button
          type="button"
          className={styles.iconBtn}
          title="Toggle AI Finance Copilot (Ctrl+J)"
          aria-label="AI Copilot"
        >
          <Sparkles size={16} aria-hidden />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className={styles.iconBtn}
          title={`${unreadNotifications} unread notifications`}
          aria-label="Notifications"
        >
          <Bell size={16} aria-hidden />
          {unreadNotifications > 0 && (
            <span className={styles.notifBadge}>{unreadNotifications}</span>
          )}
        </button>

        {/* Help */}
        <button
          type="button"
          className={styles.iconBtn}
          title="Help & Documentation"
          aria-label="Help"
        >
          <HelpCircle size={16} aria-hidden />
        </button>

        {/* User Avatar */}
        <button
          type="button"
          className={styles.userProfileBtn}
          title="Finance Manager"
          aria-label="User Account"
        >
          <div className={styles.avatar}>
            {userInitials}
            <span className={styles.presenceDot} />
          </div>
        </button>
      </div>
    </header>
  );
};
