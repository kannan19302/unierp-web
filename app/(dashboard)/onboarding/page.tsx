"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ChevronLeft, Building2, Layers, DollarSign, Users, Database, Sparkles, Plus, Trash2 } from "lucide-react";
import { MasterDataImportWizard } from "../../../src/components/onboarding/MasterDataImportWizard";
import styles from "./page.module.css";

interface OrgData {
  name: string;
  legalName: string;
  taxId: string;
  currency: string;
  timezone: string;
  fiscalYearStart: number;
}

interface TeamMember {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

const BLUEPRINTS = [
  {
    id: "manufacturing",
    name: "Discrete & Process Manufacturing",
    icon: "🏭",
    description: "BOM, Work Orders, Shop Floor, Quality Control, Supply Chain & Cost Accounting",
    apps: ["manufacturing", "inventory", "procurement", "finance", "quality"],
  },
  {
    id: "retail",
    name: "Retail, Wholesale & E-commerce",
    icon: "🛒",
    description: "POS, Omnichannel Orders, Inventory Multi-Warehouse, CRM, Invoicing",
    apps: ["pos", "sales", "inventory", "crm", "finance"],
  },
  {
    id: "services",
    name: "Professional & Technology Services",
    icon: "💼",
    description: "Timesheets, Project Billing, Retainers, Resource Scheduling, HR & Expenses",
    apps: ["projects", "hr", "finance", "timesheets", "crm"],
  },
  {
    id: "healthcare",
    name: "Healthcare & Life Sciences",
    icon: "🏥",
    description: "Patient Records, Equipment Maintenance, Compliance Audits, Procurement",
    apps: ["healthcare", "compliance", "inventory", "finance", "hr"],
  },
  {
    id: "distribution",
    name: "Logistics & Distribution",
    icon: "🚚",
    description: "Fleet Management, Dispatching, Warehouse Logistics, Sales Orders",
    apps: ["logistics", "inventory", "sales", "procurement", "finance"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Form State
  const [orgData, setOrgData] = useState<OrgData>({
    name: "",
    legalName: "",
    taxId: "",
    currency: "USD",
    timezone: "UTC",
    fiscalYearStart: 1,
  });

  const [selectedBlueprint, setSelectedBlueprint] = useState("manufacturing");
  const [coaTemplate, setCoaTemplate] = useState("GAAP_STANDARD");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { email: "", role: "Admin", firstName: "", lastName: "" },
  ]);
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Fetch initial wizard state
  useEffect(() => {
    async function fetchState() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/saas/onboarding/wizard/state", {
          credentials: "include",
        });
        if (res.ok) {
          const state = await res.json();
          if (state.organization) {
            setOrgData({
              name: state.organization.name || "",
              legalName: state.organization.legalName || "",
              taxId: state.organization.taxId || "",
              currency: state.organization.currency || "USD",
              timezone: state.organization.timezone || "UTC",
              fiscalYearStart: state.organization.fiscalYearStart || 1,
            });
          }
          if (state.industryBlueprint?.industry) {
            setSelectedBlueprint(state.industryBlueprint.industry);
          }
        }
      } catch (err) {
        console.error("Failed to load wizard state:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchState();
  }, []);

  const handleNext = async () => {
    setSaving(true);
    try {
      if (step === 1) {
        await fetch("/api/v1/saas/onboarding/wizard/step/ORGANIZATION_PROFILE", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(orgData),
        });
        setStep(2);
      } else if (step === 2) {
        const blueprint = BLUEPRINTS.find((b) => b.id === selectedBlueprint);
        await fetch("/api/v1/saas/onboarding/wizard/blueprint/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            industry: selectedBlueprint,
            apps: blueprint?.apps || [],
            chartOfAccountsTemplate: coaTemplate,
          }),
        });
        setStep(3);
      } else if (step === 3) {
        await fetch("/api/v1/saas/onboarding/wizard/step/LOCALIZATION_FINANCE", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ coaTemplate }),
        });
        setStep(4);
      } else if (step === 4) {
        const validInvites = teamMembers.filter((m) => m.email.trim().length > 0);
        if (validInvites.length > 0) {
          await fetch("/api/v1/saas/onboarding/wizard/invite-team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ invites: validInvites }),
          });
        }
        setStep(5);
      } else if (step === 5) {
        await fetch("/api/v1/saas/onboarding/wizard/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed to save step:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDemoData = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/v1/saas/onboarding/demo-data", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setDemoLoaded(true);
      }
    } catch (err) {
      console.error("Demo seeding failed:", err);
    } finally {
      setDemoLoading(false);
    }
  };

  const totalSteps = 5;
  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingCard}>
        {/* Progress Header */}
        <div className={styles.progressHeader}>
          <div className={styles.headerTop}>
            <span className={styles.brandTitle}>UniERP Setup Wizard</span>
            <span className={styles.stepIndicator}>
              Step {step} of {totalSteps} ({progressPercent}%)
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {step === 1 && (
            <div>
              <h2 className={styles.stepTitle}>Organization & Legal Profile</h2>
              <p className={styles.stepSubtitle}>
                Establish your legal business entity and baseline workspace configuration.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Organization Display Name</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Acme Global Inc."
                    value={orgData.name}
                    onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Legal Entity Name</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="Acme Enterprises LLC"
                    value={orgData.legalName}
                    onChange={(e) => setOrgData({ ...orgData, legalName: e.target.value })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Tax ID / VAT Registration #</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="EIN 12-3456789 / VAT 987654321"
                    value={orgData.taxId}
                    onChange={(e) => setOrgData({ ...orgData, taxId: e.target.value })}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Base Functional Currency</label>
                  <select
                    className={styles.selectField}
                    value={orgData.currency}
                    onChange={(e) => setOrgData({ ...orgData, currency: e.target.value })}
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                    <option value="SGD">SGD ($) - Singapore Dollar</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Primary Operating Timezone</label>
                  <select
                    className={styles.selectField}
                    value={orgData.timezone}
                    onChange={(e) => setOrgData({ ...orgData, timezone: e.target.value })}
                  >
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                    <option value="America/New_York">Eastern Time (US/New York)</option>
                    <option value="America/Chicago">Central Time (US/Chicago)</option>
                    <option value="America/Los_Angeles">Pacific Time (US/Los Angeles)</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Frankfurt">Frankfurt / Paris (CET)</option>
                    <option value="Asia/Singapore">Singapore / Hong Kong (SGT)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Fiscal Year Starts In</label>
                  <select
                    className={styles.selectField}
                    value={orgData.fiscalYearStart}
                    onChange={(e) => setOrgData({ ...orgData, fiscalYearStart: Number(e.target.value) })}
                  >
                    <option value={1}>January</option>
                    <option value={4}>April</option>
                    <option value={7}>July</option>
                    <option value={10}>October</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className={styles.stepTitle}>Industry & Module Blueprint</h2>
              <p className={styles.stepSubtitle}>
                Select your industry archetype to auto-configure business workflows and pre-install recommended ERP applications.
              </p>

              <div className={styles.blueprintGrid}>
                {BLUEPRINTS.map((bp) => {
                  const isSelected = selectedBlueprint === bp.id;
                  return (
                    <div
                      key={bp.id}
                      className={`${styles.blueprintCard} ${
                        isSelected ? styles.blueprintCardSelected : ""
                      }`}
                      onClick={() => setSelectedBlueprint(bp.id)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span className={styles.blueprintIcon}>{bp.icon}</span>
                        {isSelected && <Check size={18} color="var(--token-color-primary)" />}
                      </div>
                      <div className={styles.blueprintName}>{bp.name}</div>
                      <div className={styles.blueprintDesc}>{bp.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className={styles.stepTitle}>Financial Foundation & Chart of Accounts</h2>
              <p className={styles.stepSubtitle}>
                Set up standard accounting rules, ledger hierarchy, and taxation defaults.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--token-space-4)" }}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Chart of Accounts Standard Template</label>
                  <select
                    className={styles.selectField}
                    value={coaTemplate}
                    onChange={(e) => setCoaTemplate(e.target.value)}
                  >
                    <option value="GAAP_STANDARD">GAAP Standard Commercial (Recommended for US / North America)</option>
                    <option value="IFRS_STANDARD">IFRS Standard Multi-National (Recommended for EU / Global)</option>
                    <option value="MANUFACTURING_COGS">Manufacturing Standard (Detailed COGS & Direct Labor breakdown)</option>
                    <option value="SERVICES_HOURLY">Professional Services Standard (Direct Project Billing & Retainers)</option>
                  </select>
                </div>

                <div style={{ padding: "var(--token-space-4)", background: "var(--token-color-surface-secondary)", borderRadius: "var(--token-radius-md)" }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--token-text-xs)", marginBottom: "var(--token-space-2)" }}>
                    Template Includes Pre-Built Account Trees:
                  </div>
                  <ul style={{ fontSize: "var(--token-text-xs)", color: "var(--token-color-text-secondary)", margin: 0, paddingLeft: "var(--token-space-4)", lineHeight: 1.6 }}>
                    <li>1000–1999: Assets (Cash, Bank, Accounts Receivable, Inventory, Fixed Assets)</li>
                    <li>2000–2999: Liabilities (Accounts Payable, Accrued Expenses, Short/Long-Term Debt)</li>
                    <li>3000–3999: Equity (Common Stock, Retained Earnings, Owner Capital)</li>
                    <li>4000–4999: Revenue & Sales Invoicing</li>
                    <li>5000–5999: Cost of Goods Sold (COGS)</li>
                    <li>6000–7999: Operating, Administrative & Payroll Expenses</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className={styles.stepTitle}>Team Composition & Role Assignments</h2>
              <p className={styles.stepSubtitle}>
                Invite colleagues and department leads to collaborate with predefined RBAC permission packages.
              </p>

              {teamMembers.map((member, idx) => (
                <div key={idx} className={styles.teamRow}>
                  <input
                    type="text"
                    placeholder="First Name"
                    className={styles.inputField}
                    style={{ flex: 1 }}
                    value={member.firstName || ""}
                    onChange={(e) => {
                      const updated = [...teamMembers];
                      updated[idx].firstName = e.target.value;
                      setTeamMembers(updated);
                    }}
                  />
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    className={styles.inputField}
                    style={{ flex: 2 }}
                    value={member.email}
                    onChange={(e) => {
                      const updated = [...teamMembers];
                      updated[idx].email = e.target.value;
                      setTeamMembers(updated);
                    }}
                  />
                  <select
                    className={styles.selectField}
                    style={{ flex: 1 }}
                    value={member.role}
                    onChange={(e) => {
                      const updated = [...teamMembers];
                      updated[idx].role = e.target.value;
                      setTeamMembers(updated);
                    }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Operations Manager">Operations Manager</option>
                    <option value="Employee">Standard Employee</option>
                  </select>
                  {teamMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTeamMembers(teamMembers.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none", color: "var(--token-color-error)", cursor: "pointer" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className={styles.addMemberBtn}
                onClick={() =>
                  setTeamMembers([...teamMembers, { email: "", role: "Employee", firstName: "", lastName: "" }])
                }
              >
                <Plus size={14} /> Add Another Team Member
              </button>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className={styles.stepTitle}>Data Ingestion & Sandbox Setup</h2>
              <p className={styles.stepSubtitle}>
                Populate your workspace with real business data or test with instant 1-click sample records.
              </p>

              <div className={styles.dataOptionGrid}>
                <div className={styles.dataOptionCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-2)" }}>
                    <Sparkles size={18} color="var(--token-color-primary)" />
                    <span className={styles.dataOptionTitle}>1-Click Demo Sandbox</span>
                  </div>
                  <p className={styles.dataOptionText}>
                    Instantly load realistic test customers, catalog products, invoices, and work orders to explore UniERP immediately.
                  </p>
                  <button
                    type="button"
                    onClick={handleSeedDemoData}
                    disabled={demoLoading || demoLoaded}
                    style={{
                      padding: "var(--token-space-2) var(--token-space-4)",
                      borderRadius: "var(--token-radius-md)",
                      border: "1px solid var(--token-color-primary)",
                      background: demoLoaded ? "var(--token-color-surface-secondary)" : "var(--token-color-primary)",
                      color: demoLoaded ? "var(--token-color-success)" : "var(--token-color-text-inverse, #fff)",
                      fontWeight: 600,
                      cursor: demoLoaded ? "default" : "pointer",
                    }}
                  >
                    {demoLoading ? "Seeding..." : demoLoaded ? "✓ Demo Data Loaded" : "Seed Sample Data"}
                  </button>
                </div>

                <div className={styles.dataOptionCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-2)" }}>
                    <Database size={18} color="var(--token-color-primary)" />
                    <span className={styles.dataOptionTitle}>Import CSV Files</span>
                  </div>
                  <p className={styles.dataOptionText}>
                    Upload your customer list, vendor directory, or item inventory via standard CSV spreadsheets.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "var(--token-space-6)" }}>
                <MasterDataImportWizard />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className={styles.footerActions}>
          {step > 1 ? (
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setStep(step - 1)}
              disabled={saving}
            >
              <ChevronLeft size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Back
            </button>
          ) : (
            <button
              type="button"
              className={styles.exitBtn}
              onClick={() => router.push("/dashboard")}
            >
              Skip to Dashboard
            </button>
          )}

          <button
            type="button"
            className={styles.continueBtn}
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? "Saving..." : step === totalSteps ? "Finish & Launch Workspace" : "Save & Continue"}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
