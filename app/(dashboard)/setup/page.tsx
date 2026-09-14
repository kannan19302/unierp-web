"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
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

export default function ApplicationSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 0: Selected apps
  const [selectedApps, setSelectedApps] = useState<string[]>([
    "finance",
    "inventory",
    "crm",
    "sales",
  ]);

  // Step 2: Configuration
  const [fiscalStart, setFiscalStart] = useState("April");
  const [chartOfAccounts, setChartOfAccounts] = useState("standard");
  const [currency, setCurrency] = useState("USD");

  // Step 3: Team invites
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("FINANCE_OPERATOR");
  const [invitedMembers, setInvitedMembers] = useState<
    Array<{ email: string; role: string }>
  >([]);

  // Step 4: Activation state
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

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

  const handleActivate = () => {
    setIsActivating(true);
    setTimeout(() => {
      setIsActivating(false);
      setIsActivated(true);
    }, 1200);
  };

  return (
    <div className={styles.setupContainer}>
      {/* Setup Top Header */}
      <header className={styles.setupHeader}>
        <h1 className={styles.setupTitle}>Application Setup Guide</h1>
        <p className={styles.setupSubtitle}>
          Configure your core business applications for Acme Corp. You can save your progress and resume anytime from Home.
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
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Legal entity: Acme Corp · Registered country: United States</div>
              </div>
              <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                <CheckCircle2 size={14} /> Confirmed
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", alignItems: "center" }}>
              <div>
                <strong>Finance Calendar & Chart of Accounts</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Requires fiscal start month and account hierarchy template</div>
              </div>
              <span style={{ color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                <Clock size={14} /> Pending next step
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", alignItems: "center" }}>
              <div>
                <strong>Default Primary Warehouse</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Automatic default: Main Central Warehouse (WH-01)</div>
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
              These settings shape your general ledger, currency formatting, and inventory tracking.
            </p>
          </div>

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

          <form onSubmit={handleAddInvite} style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
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
            <div style={{ marginBottom: "1.5rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", overflow: "hidden" }}>
              {invitedMembers.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.625rem 0.875rem",
                    borderBottom: i < invitedMembers.length - 1 ? "1px solid var(--color-border)" : "none",
                    fontSize: "0.8125rem",
                  }}
                >
                  <span>{m.email}</span>
                  <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>{m.role}</span>
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

          <div style={{ marginBottom: "1.5rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <strong>Selected Applications:</strong>
              <span>{selectedApps.length} modules selected ({selectedApps.join(", ")})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <strong>Fiscal Period:</strong>
              <span>Begins in {fiscalStart} · Currency {currency}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Queued Invitations:</strong>
              <span>{invitedMembers.length} team members</span>
            </div>
          </div>

          {isActivating ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <Sparkles size={28} className="animate-spin" style={{ color: "var(--color-primary)", margin: "0 auto 1rem" }} />
              <strong style={{ display: "block", marginBottom: "0.5rem" }}>Activating selected applications…</strong>
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                Applying approved configurations to tenant outbox. You can safely leave this page.
              </span>
            </div>
          ) : isActivated ? (
            <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "var(--color-info-light)", borderRadius: "0.5rem", marginBottom: "1.5rem" }}>
              <CheckCircle2 size={36} style={{ color: "var(--color-success, #16a34a)", margin: "0 auto 0.75rem" }} />
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem" }}>Your applications are ready!</h3>
              <p style={{ margin: "0 0 1rem", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                Finance, CRM, and Inventory are now fully active and ready for business transactions.
              </p>
              <button
                type="button"
                className={styles.nextBtn}
                style={{ margin: "0 auto" }}
                onClick={() => router.push("/home")}
              >
                <span>Go to Daily Home</span>
                <ArrowRight size={14} />
              </button>
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
