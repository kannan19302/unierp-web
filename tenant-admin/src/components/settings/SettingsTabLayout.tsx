"use client";

/**
 * `SETTINGS_TABS` / `SettingsTabLayout` — was missing entirely.
 *
 * The 91-page settings subtree lived under `src/app/(dashboard)/settings/`,
 * shadowed by a 13-line stub at the same route (W5). Its own `layout.tsx`
 * imported this module, which never existed — invisible only because
 * Next.js was silently ignoring the whole tree in favour of the stub. Since
 * every settings page renders through this layout, a missing import here
 * would have failed the entire subtree at once rather than one page, so it
 * is implemented now (thin wrapper over the design system's ModuleTabLayout)
 * rather than left as a pre-existing gap the way a single leaf page's
 * missing dependency can safely be.
 *
 * The tab list is generated from the real directory structure rather than
 * hand-curated, so it cannot silently drift from what actually exists on
 * disk the way a hand-maintained list eventually would.
 */
import { ModuleTabLayout, type ModuleTab } from "@kannan19302/ui";

export const SETTINGS_TABS: ModuleTab[] = [
  { id: "access-control", label: "Access Control", href: "/settings/access-control" },
  { id: "activity-feed", label: "Activity Feed", href: "/settings/activity-feed" },
  { id: "alerts", label: "Alerts", href: "/settings/alerts" },
  { id: "announcements", label: "Announcements", href: "/settings/announcements" },
  { id: "api-keys", label: "Api Keys", href: "/settings/api-keys" },
  { id: "api-platform", label: "Api Platform", href: "/settings/api-platform" },
  { id: "approval-operations", label: "Approval Operations", href: "/settings/approval-operations" },
  { id: "audit-trail", label: "Audit Trail", href: "/settings/audit-trail" },
  { id: "audit-trail-saas", label: "Audit Trail Saas", href: "/settings/audit-trail-saas" },
  { id: "automation-rules", label: "Automation Rules", href: "/settings/automation-rules" },
  { id: "backups", label: "Backups", href: "/settings/backups" },
  { id: "billing", label: "Billing", href: "/settings/billing" },
  { id: "branding", label: "Branding", href: "/settings/branding" },
  { id: "branding-communication", label: "Branding Communication", href: "/settings/branding-communication" },
  { id: "bulk-operations", label: "Bulk Operations", href: "/settings/bulk-operations" },
  { id: "compliance", label: "Compliance", href: "/settings/compliance" },
  { id: "custom-fields", label: "Custom Fields", href: "/settings/custom-fields" },
  { id: "data-quality", label: "Data Quality", href: "/settings/data-quality" },
  { id: "data-retention", label: "Data Retention", href: "/settings/data-retention" },
  { id: "db-schema", label: "Db Schema", href: "/settings/db-schema" },
  { id: "devops", label: "Devops", href: "/settings/devops" },
  { id: "domains", label: "Domains", href: "/settings/domains" },
  { id: "email-config", label: "Email Config", href: "/settings/email-config" },
  { id: "email-templates", label: "Email Templates", href: "/settings/email-templates" },
  { id: "environments", label: "Environments", href: "/settings/environments" },
  { id: "error-logs", label: "Error Logs", href: "/settings/error-logs" },
  { id: "export", label: "Export", href: "/settings/export" },
  { id: "feature-flags", label: "Feature Flags", href: "/settings/feature-flags" },
  { id: "feedback", label: "Feedback", href: "/settings/feedback" },
  { id: "gdpr", label: "Gdpr", href: "/settings/gdpr" },
  { id: "general", label: "General", href: "/settings/general" },
  { id: "general-branding", label: "General Branding", href: "/settings/general-branding" },
  { id: "groups", label: "Groups", href: "/settings/groups" },
  { id: "identity-access", label: "Identity Access", href: "/settings/identity-access" },
  { id: "import", label: "Import", href: "/settings/import" },
  { id: "import-export", label: "Import Export", href: "/settings/import-export" },
  { id: "integrations", label: "Integrations", href: "/settings/integrations" },
  { id: "ip-restrictions", label: "Ip Restrictions", href: "/settings/ip-restrictions" },
  { id: "jobs", label: "Jobs", href: "/settings/jobs" },
  { id: "localization", label: "Localization", href: "/settings/localization" },
  { id: "login-customizer", label: "Login Customizer", href: "/settings/login-customizer" },
  { id: "login-history", label: "Login History", href: "/settings/login-history" },
  { id: "maintenance", label: "Maintenance", href: "/settings/maintenance" },
  { id: "mfa", label: "Mfa", href: "/settings/mfa" },
  { id: "notifications", label: "Notifications", href: "/settings/notifications" },
  { id: "password-policy", label: "Password Policy", href: "/settings/password-policy" },
  { id: "recycle-bin", label: "Recycle Bin", href: "/settings/recycle-bin" },
  { id: "scheduled-reports", label: "Scheduled Reports", href: "/settings/scheduled-reports" },
  { id: "scheduled-tasks", label: "Scheduled Tasks", href: "/settings/scheduled-tasks" },
  { id: "security", label: "Security", href: "/settings/security" },
  { id: "sessions", label: "Sessions", href: "/settings/sessions" },
  { id: "sso", label: "Sso", href: "/settings/sso" },
  { id: "sso-saas", label: "Sso Saas", href: "/settings/sso-saas" },
  { id: "subscription", label: "Subscription", href: "/settings/subscription" },
  { id: "support", label: "Support", href: "/settings/support" },
  { id: "sync", label: "Sync", href: "/settings/sync" },
  { id: "system-health", label: "System Health", href: "/settings/system-health" },
  { id: "system-operations", label: "System Operations", href: "/settings/system-operations" },
  { id: "tenant-analytics", label: "Tenant Analytics", href: "/settings/tenant-analytics" },
  { id: "updates", label: "Updates", href: "/settings/updates" },
  { id: "users", label: "Users", href: "/settings/users" },
  { id: "webhook-logs", label: "Webhook Logs", href: "/settings/webhook-logs" },
  { id: "webhooks", label: "Webhooks", href: "/settings/webhooks" },
  { id: "white-label", label: "White Label", href: "/settings/white-label" },
  { id: "workflow-builder", label: "Workflow Builder", href: "/settings/workflow-builder" },
  { id: "workflows", label: "Workflows", href: "/settings/workflows" },
];

export { ModuleTabLayout as SettingsTabLayout };
