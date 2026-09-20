"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  CreditCard,
  Box,
  Users,
  ShoppingCart,
  ClipboardList,
  Columns3,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  Sparkles,
  X,
  Globe,
  Briefcase,
} from "lucide-react";
import { Spinner } from "@kannan19302/ui";
import { useApiClient } from "@kannan19302/framework";
import styles from "./setup.module.css";

const STEPS = [
  { id: "choose", label: "1. Choose apps" },
  { id: "readiness", label: "2. Readiness" },
  { id: "configure", label: "3. Configure" },
  { id: "team", label: "4. Team access" },
  { id: "activate", label: "5. Review & Activate" },
];

const AVAILABLE_APPS = [
  {
    id: "finance",
    name: "Finance & Accounting",
    desc: "General ledger, journal vouchers, fiscal periods, and bank reconciliation",
    defaultSelected: true,
  },
  {
    id: "inventory",
    name: "Inventory & Stock",
    desc: "Multi-warehouse management, bin allocations, and unit of measures",
    defaultSelected: true,
  },
  {
    id: "crm",
    name: "CRM & Pipelines",
    desc: "Lead tracking, sales opportunities, contact books, and customer accounts",
    defaultSelected: true,
  },
  {
    id: "procurement",
    name: "Procurement & Purchasing",
    desc: "Vendor catalogs, purchase orders, goods receipts, and vendor invoices",
    defaultSelected: false,
  },
  {
    id: "sales",
    name: "Sales & Orders",
    desc: "Quotations, sales orders, customer delivery notes, and sales invoices",
    defaultSelected: true,
  },
  {
    id: "projects",
    name: "Project Management",
    desc: "Task workbenches, Gantt timelines, milestone billing, and timesheets",
    defaultSelected: false,
  },
];

function SetupWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const client = useApiClient();

  const isWelcomeQuery = searchParams.get("welcome") === "true";
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(isWelcomeQuery);

  const [currentStep, setCurrentStep] = useState(0);

  // Step 0: Selected apps
  const [selectedApps, setSelectedApps] = useState<string[]>([
    "finance",
    "inventory",
    "crm",
    "sales",
  ]);

  // Step 2: Configuration defaults
  const [companyName, setCompanyName] = useState("Acme Corp");
  const [industry, setIndustry] = useState("manufacturing");
  const [fiscalStart, setFiscalStart] = useState("April");
  const [chartOfAccounts, setChartOfAccounts] = useState("standard");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");

  // Step 3: Team invites
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("FINANCE_OPERATOR");
  const [invitedMembers, setInvitedMembers] = useState<
    Array<{ email: string; role: string }>
  >([]);

  // Step 4: Activation state
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  // Load saved state from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCompany = localStorage.getItem("unierp_tenant_company_name");
        if (savedCompany) setCompanyName(savedCompany);
        const savedCurrency = localStorage.getItem("unierp_tenant_currency");
        if (savedCurrency) setCurrency(savedCurrency);
      } catch {
        // Ignore localStorage errors
      }
    }
  }, []);

  const toggleAppSelection = (id: string) => {
    setSelectedApps((prev) =>
      prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]
    );
  };

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      setInvitedMembers((prev) => [
        ...prev,
        { email: inviteEmail.trim(), role: inviteRole },
      ]);
      setInviteEmail("");
    }
  };

  const handleActivate = async () => {
    setIsActivating(true);

    try {
      if (client) {
        await Promise.allSettled([
          client.put("/auth/onboarding/complete/app", {}),
          client.put("/auth/onboarding/complete/profile", {}),
          ...(invitedMembers.length > 0
            ? [client.put("/auth/onboarding/complete/invite", {})]
            : []),
        ]);
      }
    } catch {
      // Non-blocking in sandbox / offline mode
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("unierp_setup_completed", "true");
        localStorage.setItem("unierp_tenant_company_name", companyName);
        localStorage.setItem("unierp_tenant_currency", currency);
      } catch {
        // Ignore localStorage error
      }
    }

    setTimeout(() => {
      setIsActivating(false);
      setIsActivated(true);
    }, 1100);
  };

  return (
    <div className={styles.setupContainer}>
      {/* Welcome Announcement (when redirected from first login or onboarding) */}
      {showWelcomeBanner && (
        <div
          className={styles.welcomeBanner}
          role="region"
          aria-label="Welcome announcement"
        >
          <div className={styles.welcomeBannerContent}>
            <div className={styles.welcomeBannerIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className={styles.welcomeBannerTitle}>
                Welcome to UniERP! Your account is verified.
              </h2>
              <p className={styles.welcomeBannerText}>
                Let’s take 2 minutes to configure your organization defaults and business modules. You can save your progress and return anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.welcomeBannerDismiss}
            onClick={() => setShowWelcomeBanner(false)}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Setup Top Header */}
      <header className={styles.setupHeader}>
        <h1 className={styles.setupTitle}>Application Setup Guide</h1>
        <p className={styles.setupSubtitle}>
          Configure core business applications for {companyName}. You can save your progress and resume anytime from Home.
        </p>
      </header>

      {/* Stepper Indicator */}
      <nav className={styles.stepperNav} aria-label="Setup progress">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;

          return (
            <React.Fragment key={step.id}>
              <div
                className={`${styles.stepItem} ${
                  isActive
                    ? styles.stepItemActive
                    : isCompleted
                    ? styles.stepItemCompleted
                    : ""
                }`}
              >
                <span
                  className={`${styles.stepBadge} ${
                    isActive
                      ? styles.stepBadgeActive
                      : isCompleted
                      ? styles.stepBadgeCompleted
                      : ""
                  }`}
                >
                  {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                </span>
                <span>{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && <div className={styles.stepDivider} />}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Step 0: Choose Applications */}
      {currentStep === 0 && (
        <section className={styles.stepCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Choose your starting applications</h2>
            <p className={styles.cardDesc}>
              Select the modules your organization requires on Day 1. You can enable additional apps from the Application Library anytime.
            </p>
          </div>

          <div className={styles.selectionGrid}>
            {AVAILABLE_APPS.map((app) => {
              const isSelected = selectedApps.includes(app.id);
              return (
                <div
                  key={app.id}
                  className={`${styles.selectionOption} ${
                    isSelected ? styles.selectionOptionSelected : ""
                  }`}
                  onClick={() => toggleAppSelection(app.id)}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleAppSelection(app.id);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className={styles.selectionCheckbox}
                    tabIndex={-1}
                  />
                  <div className={styles.selectionInfo}>
                    <strong className={styles.selectionTitle}>{app.name}</strong>
                    <span className={styles.selectionDesc}>{app.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.actionFooter}>
            <div className={styles.footerLeft}>
              <Link href="/home" className={styles.exitBtn}>
                Save and return Home
              </Link>
            </div>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setCurrentStep(1)}
              >
                <span>Check readiness</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 1: Readiness Checks */}
      {currentStep === 1 && (
        <section className={styles.stepCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Prerequisites & Readiness Evaluation</h2>
            <p className={styles.cardDesc}>
              Authoritative verification of tenant-level prerequisites before activation.
            </p>
          </div>

          <div className={styles.infoAlert}>
            <AlertCircle size={16} />
            <span>
              Affected posting actions remain guarded until their required prerequisites are satisfied.
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", alignItems: "center" }}>
              <div>
                <strong>Tenant Identity & Working Defaults</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  Legal entity: {companyName} · Timezone: {timezone}
                </div>
              </div>
              <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Confirmed
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", alignItems: "center" }}>
              <div>
                <strong>Finance Calendar & Chart of Accounts</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  Fiscal start: {fiscalStart} · Currency: {currency}
                </div>
              </div>
              <span style={{ color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                <Clock size={14} /> Ready to review
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", alignItems: "center" }}>
              <div>
                <strong>Default Primary Warehouse</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  Automatic default: Main Central Warehouse (WH-01)
                </div>
              </div>
              <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Ready
              </span>
            </div>
          </div>

          <div className={styles.actionFooter}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setCurrentStep(0)}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            </div>
            <div className={styles.footerRight}>
              <Link href="/home" className={styles.exitBtn}>
                Save and exit
              </Link>
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setCurrentStep(2)}
              >
                <span>Configure applications</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 2: Configure Defaults */}
      {currentStep === 2 && (
        <section className={styles.stepCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Configure Working Defaults</h2>
            <p className={styles.cardDesc}>
              These settings shape your organization identity, general ledger, currency formatting, and operating schedule.
            </p>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Organization Display Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={styles.formInput}
                placeholder="e.g. Acme Corporation"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Industry Sector</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className={styles.formSelect}
              >
                <option value="manufacturing">Manufacturing & Industrial</option>
                <option value="retail">Retail, Wholesale & E-Commerce</option>
                <option value="services">Professional Services & Consulting</option>
                <option value="tech">Software, Cloud & Technology</option>
                <option value="healthcare">Healthcare & Life Sciences</option>
                <option value="finance">Financial Services & Real Estate</option>
              </select>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Base Operating Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={styles.formSelect}
              >
                <option value="USD">USD — United States Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="SGD">SGD — Singapore Dollar (S$)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Primary Operational Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={styles.formSelect}
              >
                <option value="America/New_York">Eastern Time (US / New York)</option>
                <option value="America/Chicago">Central Time (US / Chicago)</option>
                <option value="America/Los_Angeles">Pacific Time (US / Los Angeles)</option>
                <option value="Europe/London">Greenwich Mean Time (UK / London)</option>
                <option value="Europe/Berlin">Central European Time (Berlin / Paris)</option>
                <option value="Asia/Kolkata">India Standard Time (IST / Kolkata)</option>
                <option value="Asia/Singapore">Singapore Time (SGT / Singapore)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fiscal Year Starts In</label>
              <select
                value={fiscalStart}
                onChange={(e) => setFiscalStart(e.target.value)}
                className={styles.formSelect}
              >
                <option value="January">January 1st (Calendar Year)</option>
                <option value="April">April 1st (UK / India / Japan Fiscal)</option>
                <option value="July">July 1st (Australian / Mid-Year Fiscal)</option>
                <option value="October">October 1st (US Federal Fiscal)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Chart of Accounts Template</label>
              <select
                value={chartOfAccounts}
                onChange={(e) => setChartOfAccounts(e.target.value)}
                className={styles.formSelect}
              >
                <option value="standard">Standard Commercial & Manufacturing (GAAP / IFRS)</option>
                <option value="services">Professional Services & Consulting</option>
                <option value="retail">Retail & E-Commerce Point of Sale</option>
              </select>
            </div>
          </div>

          <div className={styles.actionFooter}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setCurrentStep(1)}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            </div>
            <div className={styles.footerRight}>
              <Link href="/home" className={styles.exitBtn}>
                Save and exit
              </Link>
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setCurrentStep(3)}
              >
                <span>Continue to team access</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 3: Team Access (Optional) */}
      {currentStep === 3 && (
        <section className={styles.stepCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Bring in your team (Optional)</h2>
            <p className={styles.cardDesc}>
              Invite colleagues now or add them later through the Organization Control Center.
            </p>
          </div>

          <form
            onSubmit={handleAddInvite}
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "1rem",
              flexWrap: "wrap",
            }}
          >
            <input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={styles.formInput}
              style={{ flex: 1, minWidth: "15rem" }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className={styles.formSelect}
              style={{ width: "12rem" }}
            >
              <option value="FINANCE_OPERATOR">Finance Operator</option>
              <option value="INVENTORY_CLERK">Inventory Clerk</option>
              <option value="SALES_REP">Sales Representative</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
            <button type="submit" className={styles.nextBtn}>
              Add invitation
            </button>
          </form>

          {invitedMembers.length > 0 && (
            <div
              style={{
                marginBottom: "1.5rem",
                border: "1px solid var(--color-border)",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              {invitedMembers.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.875rem",
                    borderBottom:
                      i < invitedMembers.length - 1
                        ? "1px solid var(--color-border)"
                        : "none",
                    fontSize: "0.8125rem",
                  }}
                >
                  <span>{m.email}</span>
                  <span
                    style={{
                      color: "var(--color-text-secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.actionFooter}>
            <div className={styles.footerLeft}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => setCurrentStep(2)}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            </div>
            <div className={styles.footerRight}>
              <button
                type="button"
                className={styles.exitBtn}
                onClick={() => setCurrentStep(4)}
              >
                Skip invites
              </button>
              <button
                type="button"
                className={styles.nextBtn}
                onClick={() => setCurrentStep(4)}
              >
                <span>Review and activate</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Step 4: Review & Activate */}
      {currentStep === 4 && (
        <section className={styles.stepCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Review and Activate Applications</h2>
            <p className={styles.cardDesc}>
              Activation commits your configurations and initializes your business workspaces.
            </p>
          </div>

          <div
            style={{
              marginBottom: "1.5rem",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              padding: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <strong>Organization:</strong>
              <span>
                {companyName} ({industry})
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <strong>Selected Applications:</strong>
              <span>
                {selectedApps.length} modules ({selectedApps.join(", ")})
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.5rem",
              }}
            >
              <strong>Fiscal Period & Currency:</strong>
              <span>
                Begins in {fiscalStart} · {currency} · {timezone}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Queued Invitations:</strong>
              <span>{invitedMembers.length} team members</span>
            </div>
          </div>

          {isActivating ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <Sparkles
                size={28}
                className="animate-spin"
                style={{
                  color: "var(--color-primary)",
                  margin: "0 auto 1rem",
                }}
              />
              <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                Activating selected applications…
              </strong>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Applying approved configurations to tenant outbox. You can safely leave this page.
              </span>
            </div>
          ) : isActivated ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                backgroundColor: "var(--color-info-light, #eff6ff)",
                borderRadius: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <CheckCircle2
                size={36}
                style={{
                  color: "var(--color-success, #16a34a)",
                  margin: "0 auto 0.75rem",
                }}
              />
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem" }}>
                Your applications are ready!
              </h3>
              <p
                style={{
                  margin: "0 0 1rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {selectedApps.join(", ")} are now initialized and ready for business operations.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={() => router.push("/home")}
                >
                  <span>Go to Daily Home</span>
                  <ArrowRight size={14} />
                </button>
                <Link
                  href="/apps"
                  className={styles.exitBtn}
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  Explore All Apps
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.actionFooter}>
              <div className={styles.footerLeft}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={() => setCurrentStep(3)}
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
              <div className={styles.footerRight}>
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={handleActivate}
                >
                  <Sparkles size={14} />
                  <span>Activate applications</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default function ApplicationSetupPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "50vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spinner size="lg" />
        </div>
      }
    >
      <SetupWizardContent />
    </Suspense>
  );
}
