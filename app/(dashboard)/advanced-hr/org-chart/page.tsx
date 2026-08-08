"use client";
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Button, Spinner, useToast, Badge, DataTable } from "@kannan19302/ui";
import { GitBranch, Users, Building2, Plus } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function AdvancedHrOrgChartPage() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [deptCounts, setDeptCounts] = useState<any[]>([]);
  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [nodesData, countsData] = await Promise.all([
        client.get<any[]>("/advanced-hr/org-chart-deep/nodes"),
        client.get<any[]>("/advanced-hr/org-chart-deep/department-headcounts"),
      ]);
      setNodes(Array.isArray(nodesData) ? nodesData : []);
      setDeptCounts(Array.isArray(countsData) ? countsData : []);
    } catch (err) {
      toast.error(
        "Failed to load org chart",
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
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        title="Live Organizational Chart & Reporting Hierarchy Visualizer"
        description="Browse the real-time org chart tree, view span-of-control, and audit headcount by department."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
          marginTop: "24px",
        }}
      >
        <Card style={{ padding: "24px" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Org Chart Nodes
          </h3>
          {nodes.length === 0 ? (
            <p
              style={{
                color: "var(--color-text-secondary)",
                textAlign: "center",
                padding: "32px 0",
              }}
            >
              No org chart nodes defined.
            </p>
          ) : (
            <>{(() => {
                                  const columns = [
                            { key: "col_0", header: "Job Title" , render: (n: any) => (<>{n.reportingLevel > 1 ? "└ " : ""}{n.jobTitle}</>) },
                            { key: "col_1", header: "Department" , render: (n: any) => (<>{n.department}</>) },
                            { key: "col_2", header: "Level" , render: (n: any) => (<><Badge variant="info">L{n.reportingLevel}</Badge></>) },
                            { key: "col_3", header: "Headcount" , render: (n: any) => (<>{n.headcount}</>) },
                          ];
                                  return <DataTable columns={columns} data={nodes} rowKey={(n: any) => n.id ?? i} />;
                              })()}</>
          )}
        </Card>

        <Card style={{ padding: "24px" }}>
          <h3
            style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}
          >
            Headcount by Department
          </h3>
          {deptCounts.length === 0 ? (
            <p
              style={{
                color: "var(--color-text-secondary)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No data.
            </p>
          ) : (
            deptCounts.map((d: any, i: any) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Building2 size={14} color="var(--chart-5)" />
                  <span style={{ fontWeight: 600 }}>{d.department}</span>
                </div>
                <span
                  style={{ fontWeight: 700, color: "var(--color-primary)" }}
                >
                  {d.totalHeadcount}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
