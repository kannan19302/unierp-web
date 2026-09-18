"use client";

import { Settings } from "lucide-react";
import {
  SettingsTabLayout,
  SETTINGS_TABS,
} from "@/components/settings/SettingsTabLayout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsTabLayout
      tabs={SETTINGS_TABS}
      moduleId="settings"
      moduleLabel="System Settings"
      moduleIcon={Settings}
      moduleDescription="Global system administration, security, and settings"
    >
      {children}
    </SettingsTabLayout>
  );
}
