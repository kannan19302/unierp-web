"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Settings,
  Users,
  BarChart3,
  Target,
  Heart,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import { PageHeader, Button, Card, Spinner, KPICard } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

const CS_TABS = [
  { id: "overview", label: "Overview" },
  { id: "health-scores", label: "Health Scores" },
  { id: "nps-surveys", label: "NPS Surveys" },
  { id: "onboarding", label: "Onboarding" },
  { id: "retention", label: "Retention" },
];

export default function CrmCustomerSuccessPage() {
  const api = useApiClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/crm/customer-success/dashboard")
      .then(setDashboard)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <RouteGuard permission="crm.read">
      <PageHeader
        title="Customer Success"
        description="Health scores, NPS surveys, onboarding checklists, and retention campaigns"
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
        {CS_TABS.map((tab: any) => (
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
            icon={<Heart className="w-5 h-5 text-primary" />}
            value={dashboard?.avgHealthScore?.toFixed(1) ?? 0}
            title="Avg Health Score"
          />
          <KPICard
            icon={<MessageSquare className="w-5 h-5 text-primary" />}
            value={dashboard?.totalSurveys ?? 0}
            title="NPS Surveys"
          />
          <KPICard
            icon={<ClipboardList className="w-5 h-5 text-primary" />}
            value={dashboard?.activeChecklists ?? 0}
            title="Active Onboarding"
          />
          <KPICard
            icon={<Target className="w-5 h-5 text-primary" />}
            value={dashboard?.retentionRate?.toFixed(1) ?? 0}
            title="Retention Rate %"
          />
        </div>
      )}
      {activeTab === "overview" && (
        <Card padding="lg">
          <p className="ui-text-muted">
            Customer success dashboard. Manage health score configurations, NPS
            surveys, onboarding checklists, and retention campaigns.
          </p>
        </Card>
      )}
    </RouteGuard>
  );
}
