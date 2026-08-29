"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProgressHUD, type ProgressHUDItem } from "@kannan19302/ui/components";

export function HeaderOnboardingHUD() {
  const router = useRouter();
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadChecklist() {
      try {
        const res = await fetch("/api/v1/saas/onboarding/wizard/state", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setChecklist(data);
        }
      } catch (err) {
        // Degrades silently
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadChecklist();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !checklist || checklist.isCompleted) {
    return null;
  }

  const items: ProgressHUDItem[] = [
    {
      key: "ORGANIZATION_PROFILE",
      label: "Organization & Profile",
      isCompleted: checklist.completedSteps?.includes("ORGANIZATION_PROFILE") || Boolean(checklist.organization),
      actionLabel: "Setup",
      actionUrl: "/onboarding",
    },
    {
      key: "INDUSTRY_BLUEPRINT",
      label: "Industry Blueprint",
      isCompleted: checklist.completedSteps?.includes("INDUSTRY_BLUEPRINT") || Boolean(checklist.industryBlueprint),
      actionLabel: "Configure",
      actionUrl: "/onboarding",
    },
    {
      key: "LOCALIZATION_FINANCE",
      label: "Chart of Accounts",
      isCompleted: checklist.completedSteps?.includes("LOCALIZATION_FINANCE"),
      actionLabel: "Review",
      actionUrl: "/onboarding",
    },
    {
      key: "TEAM_INVITATION",
      label: "Invite Team Members",
      isCompleted: checklist.completedSteps?.includes("TEAM_INVITATION"),
      actionLabel: "Invite",
      actionUrl: "/onboarding",
    },
    {
      key: "DATA_INGESTION",
      label: "Master Data Import / Demo",
      isCompleted: checklist.completedSteps?.includes("DATA_INGESTION"),
      actionLabel: "Import",
      actionUrl: "/onboarding",
    },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <ProgressHUD
        percentComplete={checklist.percentComplete || 20}
        items={items}
        onActionClick={(item) => {
          if (item.actionUrl) router.push(item.actionUrl);
        }}
        title="Setup"
      />
    </div>
  );
}
