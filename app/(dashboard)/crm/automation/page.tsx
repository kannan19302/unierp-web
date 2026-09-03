"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Settings,
  Zap,
  Users,
  BarChart3,
  Target,
} from "lucide-react";
import { PageHeader, Button, Card, Spinner, KPICard } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

const AUTOMATION_TABS = [
  { id: "overview", label: "Overview" },
  { id: "assignment-rules", label: "Assignment Rules" },
  { id: "escalation-rules", label: "Escalation Rules" },
  { id: "scoring-models", label: "Scoring Models" },
  { id: "sequences", label: "Sequences" },
];

export default function CrmAutomationPage() {
  const api = useApiClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/sales-automation/dashboard")
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <RouteGuard permission="crm.read">
      <PageHeader
        title="Sales Automation"
        description="Auto-assignment, escalation rules, scoring models, and sequences"
      />
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          marginBottom: "var(--space-4)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "var(--space-2)",
        }}
      >
        {AUTOMATION_TABS.map((tab: any) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="ui-btn"
            style={{
              background:
                activeTab === tab.id ? "var(--color-primary)" : "transparent",
              color:
                activeTab === tab.id ? "var(--color-text-inverse)" : "inherit",
              border: "none",
              padding: "var(--space-1) var(--space-3)",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div className="ui-grid-4" style={{ marginBottom: "var(--space-4)" }}>
          <KPICard
            icon={<Zap className="w-5 h-5 text-primary" />}
            value={dashboard?.totalRules ?? 0}
            title="Total Rules"
          />
          <KPICard
            icon={<Activity className="w-5 h-5 text-primary" />}
            value={dashboard?.activeRules ?? 0}
            title="Active Rules"
          />
          <KPICard
            icon={<Target className="w-5 h-5 text-primary" />}
            value={dashboard?.totalSequences ?? 0}
            title="Sequences"
          />
          <KPICard
            icon={<Users className="w-5 h-5 text-primary" />}
            value={dashboard?.totalAssignments ?? 0}
            title="Assignments"
          />
        </div>
      )}
      {activeTab === "overview" && (
        <Card padding="lg">
          <p className="ui-text-muted">
            Sales automation overview dashboard. Configure assignment rules,
            escalation policies, scoring models, and sales sequences.
          </p>
        </Card>
      )}
    </RouteGuard>
  );
}
