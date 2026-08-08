"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Badge, Table, DataTable } from "@unerp/ui";
import { Trophy, Award, Flame, Target } from "lucide-react";
import { useApiClient } from "@unerp/framework";

export default function SalesGamificationPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const data = await client.get<any>("/sales/gamification/leaderboard");
        setLeaderboardData(data);
      } catch (err) {
        toast.error(
          "Failed to load Sales Gamification leaderboard",
          err instanceof Error ? err.message : "Error",
        );
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  const leaderboards = leaderboardData?.leaderboards || [];

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Sales Gamification & Leaderboards"
        description="Real-time sales competitions, quota attainment, achievement badges, and deal streak tracking."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Current Leader
            </span>
            <Trophy size={20} color="var(--chart-3)" />
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "8px" }}
          >
            {leaderboards[0]?.name || "N/A"}
          </div>
          <span style={{ fontSize: "13px", color: "var(--chart-9)" }}>
            ${(leaderboards[0]?.score || 0).toLocaleString()} booked
          </span>
        </Card>
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Top Deal Streak
            </span>
            <Flame size={20} color="var(--chart-4)" />
          </div>
          <div
            style={{ fontSize: "24px", fontWeight: "bold", marginTop: "8px" }}
          >
            {leaderboardData?.streakData?.streakCount || 0} Deals
          </div>
          <span
            style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}
          >
            Rep: {leaderboardData?.streakData?.currentTopStreakRep}
          </span>
        </Card>
        <Card style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}
            >
              Active Period
            </span>
            <Target size={20} color="var(--color-primary)" />
          </div>
          <div
            style={{ fontSize: "20px", fontWeight: "bold", marginTop: "8px" }}
          >
            {leaderboardData?.period || "Q3-2026"}
          </div>
        </Card>
      </div>

      <Card style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Rep Rankings & Leaderboard
        </h3>
        <>{(() => {
                      const columns = [
                { key: "col_0", header: "Rank" , render: (rep: any) => (<>{rep.rank === 1
                                  ? "🥇 #1"
                                  : rep.rank === 2
                                    ? "🥈 #2"
                                    : rep.rank === 3
                                      ? "🥉 #3"
                                      : `#${rep.rank}`}</>) },
                { key: "col_1", header: "Sales Rep" , render: (rep: any) => (<>{rep.name}</>) },
                { key: "col_2", header: "Total Score / Value" , render: (rep: any) => (<>${(rep.score || 0).toLocaleString()}</>) },
                { key: "col_3", header: "Deals Closed" , render: (rep: any) => (<>{rep.deals}deals</>) },
                { key: "col_4", header: "Streak" , render: (rep: any) => (<><Badge variant="warning">🔥 {rep.streak} streak</Badge></>) },
              ];
                      return <DataTable columns={columns} data={leaderboards} rowKey={(rep: any) => rep.salesRepId} />;
                  })()}</>
      </Card>
    </div>
  );
}
