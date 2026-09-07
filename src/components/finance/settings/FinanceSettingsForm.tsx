"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  StatusBadge,
  useToast,
} from "@kannan19302/ui";
import {
  Save,
  RotateCcw,
  ShieldCheck,
  DollarSign,
  Calendar,
  Layers,
  Scale,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface FinanceSettingsState {
  baseCurrency: string;
  accountingStandard: "GAAP" | "IFRS";
  fiscalYearStartMonth: number;
  lockDate: string;
  autoPostRecurring: boolean;
  requireMakerChecker: boolean;
  priceMatchTolerancePct: number;
  qtyMatchTolerancePct: number;
  defaultPaymentTermsDays: number;
  managerApprovalLimit: number;
  controllerApprovalLimit: number;
  autoFxSync: boolean;
  fxSyncFrequency: "DAILY" | "WEEKLY" | "MANUAL";
  soxSegregationOfDuties: boolean;
  irs1099Threshold: number;
}

const DEFAULT_SETTINGS: FinanceSettingsState = {
  baseCurrency: "USD",
  accountingStandard: "GAAP",
  fiscalYearStartMonth: 1, // January
  lockDate: "2025-12-31",
  autoPostRecurring: true,
  requireMakerChecker: true,
  priceMatchTolerancePct: 2.0,
  qtyMatchTolerancePct: 0.0,
  defaultPaymentTermsDays: 30,
  managerApprovalLimit: 10000,
  controllerApprovalLimit: 50000,
  autoFxSync: true,
  fxSyncFrequency: "DAILY",
  soxSegregationOfDuties: true,
  irs1099Threshold: 600,
};

const STORAGE_KEY = "unierp_finance_enterprise_settings";

export function FinanceSettingsForm() {
  const { success, error: notifyError } = useToast();
  const [settings, setSettings] = useState<FinanceSettingsState>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch {
      // Fallback to default
    }
  }, []);

  const handleChange = <K extends keyof FinanceSettingsState>(
    key: K,
    val: FinanceSettingsState[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Persist to local storage & mock save
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      await new Promise((resolve) => setTimeout(resolve, 400));
      setSavedAt(new Date().toLocaleTimeString());
      success("Configuration Saved", "Finance enterprise settings updated successfully.");
    } catch (err: any) {
      notifyError("Save Failed", err?.message || "Failed to update finance settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset finance settings to standard enterprise defaults?")) {
      setSettings(DEFAULT_SETTINGS);
      localStorage.removeItem(STORAGE_KEY);
      success("Settings Reset", "Restored standard enterprise default configuration.");
    }
  };

  return (
    <form onSubmit={handleSave} className="ui-stack-4">
      {/* Top Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "var(--space-3)",
          borderBottom: "1px solid var(--color-border-subtle)",
        }}
      >
        <div>
          <h2 className="ui-heading-sm" style={{ margin: 0 }}>
            Enterprise Financial Governance &amp; Controls
          </h2>
          <p className="ui-text-xs-muted" style={{ margin: 0 }}>
            Manage accounting standards, multi-currency ledger preferences, matching tolerances, and approval thresholds.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
          {savedAt && (
            <span className="ui-text-xs-muted" style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
              <CheckCircle2 size={14} style={{ color: "var(--color-success)" }} />
              Saved at {savedAt}
            </span>
          )}
          <Button variant="secondary" size="sm" type="button" onClick={handleReset}>
            <RotateCcw size={14} style={{ marginRight: "var(--space-1)" }} />
            Reset Defaults
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving}>
            <Save size={14} style={{ marginRight: "var(--space-1)" }} />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "var(--space-4)",
        }}
      >
        {/* Section 1: Accounting Standards & Base Ledger */}
        <Card padding="md" className="ui-stack-3">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Scale size={18} style={{ color: "var(--color-brand)" }} />
            <h3 className="ui-heading-sm" style={{ margin: 0 }}>
              Accounting Standards &amp; Base Ledger
            </h3>
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Primary Accounting Standard
            </label>
            <select
              className="ui-input"
              value={settings.accountingStandard}
              onChange={(e) => handleChange("accountingStandard", e.target.value as "GAAP" | "IFRS")}
            >
              <option value="GAAP">US GAAP (ASC 606 / ASC 842)</option>
              <option value="IFRS">IFRS (IFRS 15 / IFRS 16)</option>
            </select>
            <p className="ui-text-xs-muted">
              Governs revenue recognition schedules, lease present-value discounting, and multi-book reporting.
            </p>
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Base Operational Currency
            </label>
            <select
              className="ui-input"
              value={settings.baseCurrency}
              onChange={(e) => handleChange("baseCurrency", e.target.value)}
            >
              <option value="USD">USD - United States Dollar ($)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="GBP">GBP - British Pound Sterling (£)</option>
              <option value="JPY">JPY - Japanese Yen (¥)</option>
              <option value="CAD">CAD - Canadian Dollar (C$)</option>
              <option value="AUD">AUD - Australian Dollar (A$)</option>
            </select>
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Fiscal Year Start Month
            </label>
            <select
              className="ui-input"
              value={settings.fiscalYearStartMonth}
              onChange={(e) => handleChange("fiscalYearStartMonth", Number(e.target.value))}
            >
              <option value={1}>January (Calendar Year)</option>
              <option value={2}>February</option>
              <option value={4}>April (UK / Commonwealth Standard)</option>
              <option value={7}>July (US Federal / State Fiscal)</option>
              <option value={10}>October</option>
            </select>
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Accounting Period Lock Date
            </label>
            <input
              type="date"
              className="ui-input"
              value={settings.lockDate}
              onChange={(e) => handleChange("lockDate", e.target.value)}
            />
            <p className="ui-text-xs-muted">
              Transactions dated on or before this date cannot be created, posted, or modified.
            </p>
          </div>
        </Card>

        {/* Section 2: AP Matching & Tolerance Controls */}
        <Card padding="md" className="ui-stack-3">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Layers size={18} style={{ color: "var(--color-primary)" }} />
            <h3 className="ui-heading-sm" style={{ margin: 0 }}>
              3-Way AP Matching &amp; Tolerances
            </h3>
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              3-Way Match Price Tolerance (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="20"
              className="ui-input"
              value={settings.priceMatchTolerancePct}
              onChange={(e) => handleChange("priceMatchTolerancePct", parseFloat(e.target.value) || 0)}
            />
            <p className="ui-text-xs-muted">
              Auto-approve vendor invoices if unit price variance against PO is within this percentage.
            </p>
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Quantity Tolerance (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              className="ui-input"
              value={settings.qtyMatchTolerancePct}
              onChange={(e) => handleChange("qtyMatchTolerancePct", parseFloat(e.target.value) || 0)}
            />
            <p className="ui-text-xs-muted">
              Maximum allowable billed quantity exceeding received goods quantity (typically 0.0%).
            </p>
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Default Vendor Payment Terms (Days)
            </label>
            <select
              className="ui-input"
              value={settings.defaultPaymentTermsDays}
              onChange={(e) => handleChange("defaultPaymentTermsDays", Number(e.target.value))}
            >
              <option value={15}>Net 15 Days</option>
              <option value={30}>Net 30 Days (Standard)</option>
              <option value={45}>Net 45 Days</option>
              <option value={60}>Net 60 Days</option>
              <option value={90}>Net 90 Days</option>
            </select>
          </div>
        </Card>

        {/* Section 3: SOX Governance & Maker-Checker Matrix */}
        <Card padding="md" className="ui-stack-3">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <ShieldCheck size={18} style={{ color: "var(--color-success)" }} />
            <h3 className="ui-heading-sm" style={{ margin: 0 }}>
              Governance &amp; SOX 404 Controls
            </h3>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="ui-text-xs" style={{ fontWeight: 600, margin: 0 }}>
                Enforce Maker-Checker Invariant
              </p>
              <p className="ui-text-xs-muted" style={{ margin: 0 }}>
                Prevent journal creators from approving or posting their own vouchers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.requireMakerChecker}
              onChange={(e) => handleChange("requireMakerChecker", e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="ui-text-xs" style={{ fontWeight: 600, margin: 0 }}>
                SOX Toxic Role Conflict Detection
              </p>
              <p className="ui-text-xs-muted" style={{ margin: 0 }}>
                Block users with AP creation roles from holding bank disbursement rights.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.soxSegregationOfDuties}
              onChange={(e) => handleChange("soxSegregationOfDuties", e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Finance Manager Single-Sign-Off Limit ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              className="ui-input"
              value={settings.managerApprovalLimit}
              onChange={(e) => handleChange("managerApprovalLimit", Number(e.target.value))}
            />
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              Controller Single-Sign-Off Limit ($)
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              className="ui-input"
              value={settings.controllerApprovalLimit}
              onChange={(e) => handleChange("controllerApprovalLimit", Number(e.target.value))}
            />
            <p className="ui-text-xs-muted">
              Amounts above ${settings.controllerApprovalLimit.toLocaleString()} require executive dual authorization (CFO + CEO).
            </p>
          </div>
        </Card>

        {/* Section 4: FX & Tax Automation */}
        <Card padding="md" className="ui-stack-3">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Zap size={18} style={{ color: "var(--color-warning)" }} />
            <h3 className="ui-heading-sm" style={{ margin: 0 }}>
              Automation &amp; Tax Compliance
            </h3>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="ui-text-xs" style={{ fontWeight: 600, margin: 0 }}>
                Auto-Sync Daily Foreign Exchange Rates
              </p>
              <p className="ui-text-xs-muted" style={{ margin: 0 }}>
                Fetch published ECB/Fed central bank rates every 24 hours.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoFxSync}
              onChange={(e) => handleChange("autoFxSync", e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p className="ui-text-xs" style={{ fontWeight: 600, margin: 0 }}>
                Auto-Post Recurring Journal Entries
              </p>
              <p className="ui-text-xs-muted" style={{ margin: 0 }}>
                Trigger scheduled depreciation runs and prepaid amortization without manual approval.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoPostRecurring}
              onChange={(e) => handleChange("autoPostRecurring", e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
          </div>

          <div className="ui-stack-2">
            <label className="ui-text-xs" style={{ fontWeight: 600 }}>
              IRS 1099-NEC Reporting Threshold ($)
            </label>
            <input
              type="number"
              min="0"
              className="ui-input"
              value={settings.irs1099Threshold}
              onChange={(e) => handleChange("irs1099Threshold", Number(e.target.value))}
            />
            <p className="ui-text-xs-muted">
              Federal annual contractor cumulative threshold requiring Form 1099-NEC issuance.
            </p>
          </div>
        </Card>
      </div>
    </form>
  );
}
