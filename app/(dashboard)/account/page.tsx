"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  Shield,
  Smartphone,
  Building2,
  Lock,
  Sliders,
  Mail,
  CheckCircle2,
  AlertCircle,
  Download,
  Key,
  Globe,
  Trash2,
  ExternalLink,
  Laptop,
  Check,
  RefreshCw,
} from "lucide-react";
import styles from "./account.module.css";
import { useSession } from "@kannan19302/shared/auth-client/react";

type AccountTab =
  | "overview"
  | "personal"
  | "security"
  | "devices"
  | "organizations"
  | "privacy"
  | "preferences";

export default function AccountCenterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { claims } = useSession();

  const initialTab = (searchParams.get("tab") as AccountTab) || "overview";
  const [activeTab, setActiveTab] = useState<AccountTab>(initialTab);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get("tab") as AccountTab;
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    router.replace(`/account?tab=${tab}`);
  };

  const email =
    typeof (claims as Record<string, unknown> | null)?.email === "string"
      ? ((claims as Record<string, unknown>).email as string)
      : "test.agent@unierp.com";

  const rawName =
    typeof (claims as Record<string, unknown> | null)?.name === "string"
      ? ((claims as Record<string, unknown>).name as string)
      : "Alex Rivera";

  const initials = rawName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Personal info state
  const [givenName, setGivenName] = useState(rawName.split(" ")[0] || "Alex");
  const [familyName, setFamilyName] = useState(rawName.split(" ")[1] || "Rivera");
  const [displayName, setDisplayName] = useState(rawName);
  const [jobTitle, setJobTitle] = useState("Enterprise Administrator");
  const [department, setDepartment] = useState("Platform Operations");

  // Preferences state
  const [appearance, setAppearance] = useState("Strata light");
  const [density, setDensity] = useState("Standard");
  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [reduceMotion, setReduceMotion] = useState(false);

  // Devices state
  const [sessions, setSessions] = useState([
    {
      id: "s1",
      device: "This Windows workstation",
      location: "Bengaluru, India · Chrome 132",
      activeNow: true,
      lastActive: "Active now",
    },
    {
      id: "s2",
      device: "Mobile Browser (Safari)",
      location: "Bengaluru, India · iOS 18",
      activeNow: false,
      lastActive: "Yesterday at 18:42 IST",
    },
  ]);

  const handleSave = (sectionName: string) => {
    setSaveToast(`${sectionName} saved successfully.`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleExportData = () => {
    const exportPayload = {
      principal: {
        id: claims?.sub || "00000000-0000-0000-0000-000000000001",
        name: displayName,
        email,
        jobTitle,
        department,
        roles: claims?.roles || ["SUPER_ADMIN"],
      },
      preferences: { appearance, density, language, timezone, reduceMotion },
      exportedAt: new Date().toISOString(),
      formatVersion: "2.0.0",
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unierp-personal-account-export.json";
    a.click();
    URL.revokeObjectURL(url);
    handleSave("Personal data archive");
  };

  return (
    <div className={styles.accountContainer}>
      {/* Top Header */}
      <section className={styles.headerSection}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.avatarCircle} aria-hidden="true">
              {initials}
            </div>
            <div className={styles.titleGroup}>
              <h1 className={styles.principalName}>
                {displayName}
                <span className={styles.verifiedBadge}>
                  <CheckCircle2 size={12} aria-hidden="true" />
                  Email verified
                </span>
              </h1>
              <div className={styles.principalMeta}>
                <span>{email}</span>
                <span>·</span>
                <span>Primary Identity</span>
                <span>·</span>
                <span>Tenant: Acme Corp</span>
              </div>
            </div>
          </div>

          <div className={styles.headerLeft}>
            <Link href="/home" className={styles.btnSecondary}>
              Back to Home
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className={styles.navTabs} aria-label="Account sections">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.activeTab : ""}`}
          >
            <User size={15} aria-hidden="true" />
            Overview
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("personal")}
            className={`${styles.tabButton} ${activeTab === "personal" ? styles.activeTab : ""}`}
          >
            <User size={15} aria-hidden="true" />
            Personal information
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("security")}
            className={`${styles.tabButton} ${activeTab === "security" ? styles.activeTab : ""}`}
          >
            <Shield size={15} aria-hidden="true" />
            Sign-in & recovery
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("devices")}
            className={`${styles.tabButton} ${activeTab === "devices" ? styles.activeTab : ""}`}
          >
            <Laptop size={15} aria-hidden="true" />
            Devices & activity
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("organizations")}
            className={`${styles.tabButton} ${activeTab === "organizations" ? styles.activeTab : ""}`}
          >
            <Building2 size={15} aria-hidden="true" />
            Organizations
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("privacy")}
            className={`${styles.tabButton} ${activeTab === "privacy" ? styles.activeTab : ""}`}
          >
            <Lock size={15} aria-hidden="true" />
            Privacy & apps
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("preferences")}
            className={`${styles.tabButton} ${activeTab === "preferences" ? styles.activeTab : ""}`}
          >
            <Sliders size={15} aria-hidden="true" />
            Preferences
          </button>
        </nav>
      </section>

      {/* Save Notification Toast */}
      {saveToast && (
        <div className={styles.infoBanner} role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW (Screen 07) */}
      {activeTab === "overview" && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Account Center Overview</h2>
            <p className={styles.cardDescription}>
              Your central personal profile across all authorized organizations in UniERP.
            </p>
          </div>

          <div className={styles.overviewGrid}>
            <button
              type="button"
              onClick={() => handleTabChange("personal")}
              className={styles.overviewCard}
            >
              <div className={styles.overviewCardHeader}>
                <span className={styles.overviewCardTitle}>Personal Information</span>
                <User size={18} aria-hidden="true" />
              </div>
              <p className={styles.overviewCardDesc}>
                Manage your name, contact details, display preferences, and job role across workspaces.
              </p>
              <span className={styles.overviewCardAction}>Edit details →</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("security")}
              className={styles.overviewCard}
            >
              <div className={styles.overviewCardHeader}>
                <span className={styles.overviewCardTitle}>Sign-in & Recovery</span>
                <Shield size={18} aria-hidden="true" />
              </div>
              <p className={styles.overviewCardDesc}>
                Review registered passkeys, multi-factor authenticators, and single-use recovery codes.
              </p>
              <span className={styles.overviewCardAction}>Manage security →</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("devices")}
              className={styles.overviewCard}
            >
              <div className={styles.overviewCardHeader}>
                <span className={styles.overviewCardTitle}>Devices & Sessions</span>
                <Laptop size={18} aria-hidden="true" />
              </div>
              <p className={styles.overviewCardDesc}>
                {sessions.length} active sessions registered. Review and revoke access from lost devices.
              </p>
              <span className={styles.overviewCardAction}>Inspect sessions →</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("organizations")}
              className={styles.overviewCard}
            >
              <div className={styles.overviewCardHeader}>
                <span className={styles.overviewCardTitle}>Your Organizations</span>
                <Building2 size={18} aria-hidden="true" />
              </div>
              <p className={styles.overviewCardDesc}>
                Acme Corp (Current production) and Northstar Demo (Sandbox). Switch or join new teams.
              </p>
              <span className={styles.overviewCardAction}>Switch workspace →</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("privacy")}
              className={styles.overviewCard}
            >
              <div className={styles.overviewCardHeader}>
                <span className={styles.overviewCardTitle}>Privacy & Data</span>
                <Lock size={18} aria-hidden="true" />
              </div>
              <p className={styles.overviewCardDesc}>
                Control third-party connectors and download a full JSON copy of your personal data archive.
              </p>
              <span className={styles.overviewCardAction}>Export data →</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("preferences")}
              className={styles.overviewCard}
            >
              <div className={styles.overviewCardHeader}>
                <span className={styles.overviewCardTitle}>System Preferences</span>
                <Sliders size={18} aria-hidden="true" />
              </div>
              <p className={styles.overviewCardDesc}>
                Appearance mode, high contrast, interface density, language, and timezone settings.
              </p>
              <span className={styles.overviewCardAction}>Customize UI →</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFORMATION (Screen 08) */}
      {activeTab === "personal" && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Personal Information</h2>
            <p className={styles.cardDescription}>
              Choose how your name and identity appear across UniERP collaborative features.
            </p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="givenName" className={styles.label}>
                Given name
              </label>
              <input
                id="givenName"
                type="text"
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="familyName" className={styles.label}>
                Family name
              </label>
              <input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label htmlFor="displayName" className={styles.label}>
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label htmlFor="workEmail" className={styles.label}>
                Primary work email
              </label>
              <input
                id="workEmail"
                type="email"
                value={email}
                readOnly
                className={`${styles.input} ${styles.inputReadOnly}`}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="jobTitle" className={styles.label}>
                Job title
              </label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="department" className={styles.label}>
                Department
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.infoBanner} role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              Changing your verified work email requires recent authentication and confirmation through your identity provider.
            </span>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              onClick={() => handleTabChange("overview")}
              className={styles.btnSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave("Personal information")}
              className={styles.btnPrimary}
            >
              Save changes
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SIGN-IN & RECOVERY (Screen 09) */}
      {activeTab === "security" && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Sign-in & Recovery</h2>
            <p className={styles.cardDescription}>
              Protect your account with modern passwordless credentials and backup authenticators.
            </p>
          </div>

          <div className={styles.itemList}>
            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemIconBox}>
                  <Key size={18} aria-hidden="true" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>Hardware Passkeys (WebAuthn / FIDO2)</span>
                  <span className={styles.itemSubtitle}>
                    1 registered security key · Windows Hello biometric active
                  </span>
                </div>
              </div>
              <span className={styles.badgeActive}>Active</span>
            </div>

            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemIconBox}>
                  <Smartphone size={18} aria-hidden="true" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>Time-based Authenticator App (TOTP)</span>
                  <span className={styles.itemSubtitle}>
                    Configured with Google Authenticator / 1Password
                  </span>
                </div>
              </div>
              <span className={styles.badgeActive}>Configured</span>
            </div>

            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemIconBox}>
                  <Lock size={18} aria-hidden="true" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>Emergency Recovery Codes</span>
                  <span className={styles.itemSubtitle}>
                    10 single-use hashed recovery codes generated
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSave("Recovery codes re-generated")}
                className={styles.btnSecondary}
              >
                Regenerate codes
              </button>
            </div>
          </div>

          <div className={styles.infoBanner} role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              Tenant security policies (e.g. required MFA, session lifetime) are defined by organization administrators in OCC. Personal credentials remain under your sovereign control.
            </span>
          </div>
        </div>
      )}

      {/* TAB 4: DEVICES & ACTIVITY (Screen 10) */}
      {activeTab === "devices" && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Devices & Activity</h2>
            <p className={styles.cardDescription}>
              Review every active browser and mobile session associated with your account.
            </p>
          </div>

          <div className={styles.itemList}>
            {sessions.map((sess) => (
              <div key={sess.id} className={styles.itemRow}>
                <div className={styles.itemLeft}>
                  <div className={styles.itemIconBox}>
                    {sess.activeNow ? (
                      <Laptop size={18} aria-hidden="true" />
                    ) : (
                      <Smartphone size={18} aria-hidden="true" />
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{sess.device}</span>
                    <span className={styles.itemSubtitle}>
                      {sess.location} · {sess.lastActive}
                    </span>
                  </div>
                </div>
                {sess.activeNow ? (
                  <span className={styles.badgeActive}>Current device</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSessions((prev) => prev.filter((s) => s.id !== sess.id));
                      handleSave(`Revoked session for ${sess.device}`);
                    }}
                    className={styles.btnDanger}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              onClick={() => {
                setSessions((prev) => prev.filter((s) => s.activeNow));
                handleSave("Revoked all other active sessions");
              }}
              className={styles.btnSecondary}
            >
              Revoke all other sessions
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: YOUR ORGANIZATIONS (Screen 11) */}
      {activeTab === "organizations" && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Your Organizations</h2>
            <p className={styles.cardDescription}>
              Select the workspace you wish to access or manage invitations.
            </p>
          </div>

          <div className={styles.itemList}>
            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemIconBox}>
                  <Building2 size={18} aria-hidden="true" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>Acme Corp</span>
                  <span className={styles.itemSubtitle}>
                    Production Environment · Tenant ID: 00000000-0000-0000-0000-000000000001
                  </span>
                </div>
              </div>
              <span className={styles.badgeActive}>Current workspace</span>
            </div>

            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemIconBox}>
                  <Building2 size={18} aria-hidden="true" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>Northstar Demo</span>
                  <span className={styles.itemSubtitle}>
                    Sandbox & Testing Environment · Standard Member
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSave("Switched context to Northstar Demo")}
                className={styles.btnSecondary}
              >
                Switch workspace
              </button>
            </div>
          </div>

          <div className={styles.infoBanner} role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              Switching organizations refreshes all tenant-scoped data, permissions, and available applications. Your personal Account Center identity remains unified across tenants.
            </span>
          </div>
        </div>
      )}

      {/* TAB 6: CONNECTED APPS & PRIVACY (Screen 12) */}
      {activeTab === "privacy" && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Connected Apps & Privacy</h2>
            <p className={styles.cardDescription}>
              Exercise your data rights and monitor personal API authorizations.
            </p>
          </div>

          <div className={styles.itemList}>
            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemIconBox}>
                  <Globe size={18} aria-hidden="true" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>Calendar Connector</span>
                  <span className={styles.itemSubtitle}>
                    Read calendar free/busy availability · Granted personal consent
                  </span>
                </div>
              </div>
              <span className={styles.badgeMuted}>Connected</span>
            </div>

            <div className={styles.itemRow}>
              <div className={styles.itemLeft}>
                <div className={styles.itemIconBox}>
                  <Download size={18} aria-hidden="true" />
                </div>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>Download Personal Data Archive</span>
                  <span className={styles.itemSubtitle}>
                    Export an authenticated JSON copy of your profile, preferences, and activity logs.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                className={styles.btnPrimary}
              >
                <Download size={14} aria-hidden="true" />
                Export data (.json)
              </button>
            </div>
          </div>

          <div className={styles.infoBanner} role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <span>
              Organizational accounting and ERP records are governed by your company's data retention policies. Personal data export complies with GDPR and CCPA privacy standards.
            </span>
          </div>
        </div>
      )}

      {/* TAB 7: PREFERENCES (Screen 13) */}
      {activeTab === "preferences" && (
        <div className={styles.contentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>System Preferences</h2>
            <p className={styles.cardDescription}>
              Fine-tune the Strata design experience to match your personal accessibility and regional requirements.
            </p>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="appearanceSelect" className={styles.label}>
                Visual appearance
              </label>
              <select
                id="appearanceSelect"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className={styles.input}
              >
                <option value="Strata light">Strata light</option>
                <option value="Strata dark">Strata dark</option>
                <option value="High contrast">High contrast</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="densitySelect" className={styles.label}>
                Display density
              </label>
              <select
                id="densitySelect"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                className={styles.input}
              >
                <option value="Comfortable">Comfortable</option>
                <option value="Standard">Standard</option>
                <option value="Compact">Compact</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="languageSelect" className={styles.label}>
                Language
              </label>
              <select
                id="languageSelect"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={styles.input}
              >
                <option value="English">English (en-US)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tzSelect" className={styles.label}>
                Time zone
              </label>
              <select
                id="tzSelect"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={styles.input}
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
              </select>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              onClick={() => handleTabChange("overview")}
              className={styles.btnSecondary}
            >
              Reset to defaults
            </button>
            <button
              type="button"
              onClick={() => handleSave("Preferences")}
              className={styles.btnPrimary}
            >
              Save preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
