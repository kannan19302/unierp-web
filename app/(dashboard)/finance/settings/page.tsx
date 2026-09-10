"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Shield,
  Clock,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import { FinanceErrorState } from "@/components/finance/FinanceErrorBoundary";
import styles from "./page.module.css";

interface SettingsData {
  accounting: {
    baseCurrency: string;
    baseCurrencyName: string;
    isCurrencyLocked: boolean;
    fiscalYear: string;
    postingPrecision: number;
    currentPeriod: string;
    currentPeriodStatus: string;
    latestLockedPeriod: string;
    latestLockedPeriodStatus: string;
  };
  approvals: {
    twoPersonJournalApproval: boolean;
    isTwoPersonLocked: boolean;
    backdatedPostingRequiresApproval: boolean;
  };
  policyContext: {
    scope: string;
    lastReviewed: string;
    policyOwner: string;
  };
}

export default function FinanceSettingsPage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<string>("accounting");
  const [fiscalYear, setFiscalYear] = useState<string>("January – December");
  const [postingPrecision, setPostingPrecision] = useState<number>(2);
  const [backdatedApproval, setBackdatedApproval] = useState<boolean>(true);

  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<SettingsData>({
    queryKey: ["finance-settings-overview"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/settings/overview");
      return (res?.data || res) as SettingsData;
    },
    refetchInterval: 30000,
  });

  React.useEffect(() => {
    if (data?.accounting) {
      setFiscalYear(data.accounting.fiscalYear || "January – December");
      setPostingPrecision(data.accounting.postingPrecision ?? 2);
    }
    if (data?.approvals) {
      setBackdatedApproval(data.approvals.backdatedPostingRequiresApproval ?? true);
    }
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await apiClient.patch("/finance/settings/overview", {
        accounting: {
          fiscalYear,
          postingPrecision,
        },
        approvals: {
          backdatedPostingRequiresApproval: backdatedApproval,
        },
      });
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-settings-overview"] });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save Finance settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (data?.accounting) {
      setFiscalYear(data.accounting.fiscalYear || "January – December");
      setPostingPrecision(data.accounting.postingPrecision ?? 2);
    } else {
      setFiscalYear("January – December");
      setPostingPrecision(2);
    }
    if (data?.approvals) {
      setBackdatedApproval(data.approvals.backdatedPostingRequiresApproval ?? true);
    } else {
      setBackdatedApproval(true);
    }
    setHasChanges(false);
  };

  const accounting = data?.accounting;
  const approvals = data?.approvals;
  const policy = data?.policyContext;

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Finance settings</h1>
          <p className={styles.subtitle}>
            Configure accounting policies, currencies, posting controls, and segregation of duties.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            {!isError && data ? (
              <>
                <div className={styles.liveDot} />
                <span>Live database</span>
              </>
            ) : isError ? (
              <>
                <div className={styles.liveDot} style={{ background: "var(--color-danger, #ef4444)" }} />
                <span>Connection error</span>
              </>
            ) : (
              <>
                <div className={styles.liveDot} style={{ background: "var(--color-warning, #f59e0b)" }} />
                <span>Connecting...</span>
              </>
            )}
            <button
              type="button"
              className={`${styles.refreshBtn} ${isFetching ? styles.refreshSpin : ""}`}
              onClick={() => refetch()}
              title="Refresh settings"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>

      {isError && (
        <FinanceErrorState
          error={error}
          onRetry={() => refetch()}
          moduleName="Finance Settings"
        />
      )}

      {saveError && <div role="alert" className={styles.warningBanner}>{saveError}</div>}

      {/* 3-Column Settings Layout */}
      <div className={styles.settingsLayout}>
        {/* Left: Vertical Section Nav */}
        <nav className={styles.sectionNav} aria-label="Settings Sections">
          <button
            type="button"
            className={`${styles.sectionNavItem} ${activeSection === "accounting" ? styles.sectionNavItemActive : ""}`}
            onClick={() => setActiveSection("accounting")}
          >
            Accounting
          </button>
          <button
            type="button"
            className={`${styles.sectionNavItem} ${activeSection === "fiscal-periods" ? styles.sectionNavItemActive : ""}`}
            onClick={() => setActiveSection("fiscal-periods")}
          >
            Fiscal periods
          </button>
          <button
            type="button"
            className={`${styles.sectionNavItem} ${activeSection === "currencies" ? styles.sectionNavItemActive : ""}`}
            onClick={() => setActiveSection("currencies")}
          >
            Currencies
          </button>
          <button
            type="button"
            className={`${styles.sectionNavItem} ${activeSection === "approvals" ? styles.sectionNavItemActive : ""}`}
            onClick={() => setActiveSection("approvals")}
          >
            Approvals
          </button>
          <button
            type="button"
            className={`${styles.sectionNavItem} ${activeSection === "tax-policies" ? styles.sectionNavItemActive : ""}`}
            onClick={() => setActiveSection("tax-policies")}
          >
            Tax policies
          </button>
          <button
            type="button"
            className={`${styles.sectionNavItem} ${activeSection === "audit-history" ? styles.sectionNavItemActive : ""}`}
            onClick={() => setActiveSection("audit-history")}
          >
            Audit history
          </button>
        </nav>

        {/* Center: Main Form Surface */}
        <div className={styles.formSurface}>
          <div className={styles.surfaceHeader}>
            <span>Core Accounting & Posting Policies</span>
          </div>

          {/* Base Currency (Locked) */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingTitle}>
                Base Currency
                <Lock size={12} color="var(--color-text-muted)" />
              </span>
              <span className={styles.settingDesc}>
                Primary ledger reporting currency. Permanently locked after initial journal posting.
              </span>
            </div>
            <div className={styles.settingControl}>
              <div className={styles.valueLocked}>
                <span>{accounting?.baseCurrency || "USD"} — {accounting?.baseCurrencyName || "US Dollar"}</span>
              </div>
            </div>
          </div>

          {/* Fiscal Year */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingTitle}>Fiscal Year Schedule</span>
              <span className={styles.settingDesc}>
                Defines the 12-month accounting calendar cycle for reporting.
              </span>
            </div>
            <div className={styles.settingControl}>
              <select
                className={styles.selectInput}
                value={fiscalYear}
                onChange={(e) => {
                  setFiscalYear(e.target.value);
                  setHasChanges(true);
                }}
              >
                <option value="January – December">January – December (Calendar)</option>
                <option value="April – March">April – March</option>
                <option value="October – September">October – September</option>
              </select>
            </div>
          </div>

          {/* Posting Precision */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingTitle}>Posting Precision</span>
              <span className={styles.settingDesc}>
                Decimal places used for balance sheet and general ledger transaction lines.
              </span>
            </div>
            <div className={styles.settingControl}>
              <select
                className={styles.selectInput}
                value={postingPrecision}
                onChange={(e) => {
                  setPostingPrecision(parseInt(e.target.value));
                  setHasChanges(true);
                }}
              >
                <option value={2}>2 Decimal places (0.01)</option>
                <option value={4}>4 Decimal places (0.0001)</option>
              </select>
            </div>
          </div>

          {/* Current Period State */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingTitle}>Active Period Status</span>
              <span className={styles.settingDesc}>
                Current financial period status and latest closed period lock.
              </span>
            </div>
            <div className={styles.settingControl}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-success)", fontWeight: 600 }}>
                ● {accounting?.currentPeriod || "Aug 2026"} ({accounting?.currentPeriodStatus || "Open"})
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                | Locked: {accounting?.latestLockedPeriod || "Jul 2026"} ({accounting?.latestLockedPeriodStatus || "Closed"})
              </span>
            </div>
          </div>

          {/* Two-Person Journal Approval */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingTitle}>
                Two-Person Journal Approval
                <Lock size={12} color="var(--color-text-muted)" />
              </span>
              <span className={styles.settingDesc}>
                Segregation of Duties: Creator cannot approve or post their own manual vouchers.
              </span>
            </div>
            <div className={styles.settingControl}>
              <div className={styles.valueLocked}>
                <Shield size={12} color="var(--color-primary)" />
                <span>Required (Enforced)</span>
              </div>
            </div>
          </div>

          {/* Backdated Posting Controls */}
          <div className={styles.settingRow}>
            <div className={styles.settingInfo}>
              <span className={styles.settingTitle}>Backdated Posting Control</span>
              <span className={styles.settingDesc}>
                Require explicit supervisor approval to post entries to prior open periods.
              </span>
            </div>
            <div className={styles.settingControl}>
              <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={backdatedApproval}
                  onChange={(e) => {
                    setBackdatedApproval(e.target.checked);
                    setHasChanges(true);
                  }}
                />
                <span style={{ fontSize: "var(--font-size-xs)" }}>Requires approval</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Policy Context Inspector */}
        <div className={styles.inspectorPanel}>
          <div className={styles.inspectorHeader}>
            <span className={styles.inspectorTitle}>Policy Context</span>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>Governance</span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Operating Scope</span>
            <span className={styles.inspectorFieldValue} style={{ fontWeight: 600 }}>
              {policy?.scope || "Acme Corp / US Operations"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Last Reviewed Date</span>
            <span className={`${styles.inspectorFieldValue} ${styles.tdMono}`}>
              {policy?.lastReviewed || "01 Aug 2026"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Policy Owner</span>
            <span className={styles.inspectorFieldValue}>
              {policy?.policyOwner || "Finance operations"}
            </span>
          </div>

          <div className={styles.inspectorField}>
            <span className={styles.inspectorFieldLabel}>Audit Compliance</span>
            <span className={styles.inspectorFieldValue} style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>
              Changes to policies create immutable audit records under SOC-1 / SOX Section 404 controls.
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      {hasChanges && (
        <div className={styles.stickyBottomBar}>
          <div className={styles.barLeft}>
            <span className={styles.barChangesBadge}>Unsaved policy changes</span>
            <span className={styles.barNote}>
              Changes require review before taking effect across ledger entities.
            </span>
          </div>

          <div className={styles.barActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleDiscard}
            >
              <RotateCcw size={13} />
              <span>Discard</span>
            </button>

            <button
              type="button"
              className={styles.btnPrimary}
              disabled={isSaving}
              onClick={handleSave}
            >
              <Save size={13} />
              <span>{isSaving ? "Saving..." : saveSuccess ? "Saved ✓" : "Review & save changes"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
