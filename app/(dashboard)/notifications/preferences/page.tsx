"use client";
// @ts-nocheck
import { DataTable } from "@kannan19302/ui";

import { useState, useEffect } from "react";

interface Preference {
  id: string;
  channelName: string;
  eventType: string;
  isEnabled: boolean;
}

interface PreferenceGroup {
  category: string;
  items: { channel: string; enabled: boolean; prefId?: string }[];
}

const CATEGORIES = [
  "Order Updates",
  "Invoice Alerts",
  "Inventory Alerts",
  "HR Notifications",
  "CRM Updates",
  "System Alerts",
  "Security Events",
];
const CHANNELS = ["inApp", "email", "sms", "push"];

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r: any) => r.json())
      .then((data: any) => {
        setPreferences(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const togglePref = (eventType: string, channelName: string) => {
    setPreferences((prev: any) => {
      const existing = prev.find(
        (p: any) => p.eventType === eventType && p.channelName === channelName,
      );
      if (existing) {
        return prev.map((p: any) =>
          p.id === existing.id ? { ...p, isEnabled: !p.isEnabled } : p,
        );
      }
      return [...prev, { id: "", eventType, channelName, isEnabled: true }];
    });
  };

  const getPref = (eventType: string, channelName: string): boolean => {
    const pref = preferences.find(
      (p: any) => p.eventType === eventType && p.channelName === channelName,
    );
    if (pref !== undefined) return pref.isEnabled;
    return channelName === "inApp" || channelName === "email";
  };

  const saveAll = async () => {
    setSaving(true);
    const prefs =
      preferences.length > 0
        ? preferences
        : CATEGORIES.flatMap((cat: any) =>
            CHANNELS.map((ch: any) => ({
              channelName: ch,
              eventType: cat,
              isEnabled: getPref(cat, ch),
            })),
          );
    await fetch("/api/notifications/preferences/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: prefs.map((p: any) => ({
          channelName: p.channelName,
          eventType: p.eventType,
          isEnabled: p.isEnabled,
        })),
      }),
    });
    setSaving(false);
  };

  return (
    <div className="ui-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <button
          className="ui-btn ui-btn-primary"
          onClick={saveAll}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>
      {loading && <div className="text-gray-500">Loading...</div>}
      {!loading && (
        <>{(() => {
                      const columns = [
                { key: "col_0", header: "Category" , render: (cat: any) => (<>{cat}</>) },
                { key: "col_1", header: "{ch === \"inApp\" ? \"In-App\" : ch}" , render: (cat: any) => (<><input
                                    type="checkbox"
                                    className="toggle"
                                    checked={getPref(cat, ch)}
                                    onChange={() => togglePref(cat, ch)}
                                  /></>) },
              ];
                      return <DataTable columns={columns} data={CATEGORIES} rowKey={(cat: any) => cat} />;
                  })()}</>
      )}
    </div>
  );
}
