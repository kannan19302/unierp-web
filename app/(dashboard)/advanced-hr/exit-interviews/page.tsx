"use client";
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { LogOut, Heart, ThumbsUp, BarChart3 } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AdvancedHrExitInterviewPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [iData, insData] = await Promise.all([
        client.get<any[]>("/advanced-hr/exit-interview-deep/interviews"),
        client.get<any>("/advanced-hr/exit-interview-deep/insights"),
      ]);
      setInterviews(Array.isArray(iData) ? iData : []);
      setInsights(insData);
    } catch (err) {
      toast.error(
        "Failed to load exit data",
        err instanceof Error ? err.message : "Error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
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

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Exit Interview Intelligence & Attrition Root Cause Analyzer"
        description="Conduct structured exit interviews, track satisfaction scores, rehire eligibility, and surface attrition patterns."
      />

      {insights && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "var(--space-4)",
            margin: "var(--space-6) 0",
          }}
        >
          {[
            {
              label: "Total Exits",
              value: insights.totalExits,
              icon: <LogOut size={18} />,
              color: "var(--chart-4)",
            },
            {
              label: "Avg Satisfaction",
              value: `${insights.avgSatisfaction}/10`,
              icon: <Heart size={18} />,
              color: "var(--chart-3)",
            },
            {
              label: "Would Rehire",
              value: `${insights.rehireRate}%`,
              icon: <ThumbsUp size={18} />,
              color: "var(--chart-9)",
            },
          ].map((kpi: any, i: any) => (
            <Card
              key={i}
              style={{
                padding: "var(--space-5)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-4)",
              }}
            >
              <div
                style={{
                  background: `${kpi.color}18`,
                  borderRadius: "var(--space-3)",
                  padding: "var(--space-3)",
                  color: kpi.color,
                }}
              >
                {kpi.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-secondary)",
                    margin: 0,
                  }}
                >
                  {kpi.label}
                </p>
                <h3 style={{ fontSize: "var(--space-6)", fontWeight: 700, margin: 0 }}>
                  {kpi.value}
                </h3>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card style={{ padding: "var(--space-6)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-4)" }}>
          Exit Interview Records
        </h3>
        {interviews.length === 0 ? (
          <p
            style={{
              color: "var(--color-text-secondary)",
              textAlign: "center",
              padding: "var(--space-8) 0",
            }}
          >
            No exit interviews recorded.
          </p>
        ) : (
          <>{(() => {
                              const columns = [
                        { key: "col_0", header: "Employee" , render: (e: any) => (<>{e.employeeId}</>) },
                        { key: "col_1", header: "Exit Reason" , render: (e: any) => (<><Badge variant="warning">{e.exitReason}</Badge></>) },
                        { key: "col_2", header: "Satisfaction" , render: (e: any) => (<>{e.satisfactionScore}/10</>) },
                        { key: "col_3", header: "Would Rehire" , render: (e: any) => (<><Badge variant={e.wouldRehire ? "success" : "danger"}>
                                            {e.wouldRehire ? "Yes" : "No"}
                                          </Badge></>) },
                      ];
                              return <DataTable columns={columns} data={interviews} rowKey={(e: any) => e.id ?? Math.random().toString()} />;
                          })()}</>
        )}
      </Card>
    </div>
  );
}
