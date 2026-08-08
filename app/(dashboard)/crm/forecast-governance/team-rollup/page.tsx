"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, useToast, Button, Input, Badge, DataTable } from "@unerp/ui";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";
import { apiGet, apiPost } from "../../_components/api";

export default function TeamRollupPage() {
  const [loading, setLoading] = useState(true);
  const [rollups, setRollups] = useState<any[]>([]);
  const [managerId, setManagerId] = useState("");
  const [rollupData, setRollupData] = useState<any>(null);
  const toast = useToast();

  const loadData = async (mgrId?: string) => {
    try {
      const id = mgrId || managerId;
      if (!id) {
        setLoading(false);
        return;
      }
      const [rollupsData, rollup] = await Promise.all([
        apiGet<any[]>(`/crm/forecast-governance/team-rollups/${id}`),
        apiGet<any>(`/crm/forecast-governance/rollup/${id}`),
      ]);
      setRollups(Array.isArray(rollupsData) ? rollupsData : []);
      setRollupData(rollup);
    } catch (err) {
      toast.error(
        "Could not load team rollup data",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (managerId) loadData();
    else setLoading(false);
  }, [managerId]);

  const handleSaveRollup = async () => {
    if (!rollupData?.totals) return;
    try {
      await apiPost("/crm/forecast-governance/team-rollups", {
        managerId,
        period: new Date().toISOString().slice(0, 7),
        teamMembers: rollupData.team,
        totalCommit: rollupData.totals.commit,
        totalBestCase: rollupData.totals.bestCase,
        totalPipeline: rollupData.totals.pipeline,
        totalQuota: rollupData.totals.quota,
      });
      toast.success("Success", "Team rollup saved.");
      loadData();
    } catch (err) {
      toast.error(
        "Error saving rollup",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  if (loading)
    return (
      <div className="ui-page-loading">
        <Spinner />
      </div>
    );

  return (
    <div className="ui-page">
      <PageHeader
        title="Team Rollups"
        description="View and manage manager-level forecast rollups"
        breadcrumbs={[
          { label: "Forecast Governance", href: "/crm/forecast-governance" },
          { label: "Team Rollups" },
        ]}
      />

      <Card>
        <div className="ui-form-group" style={{ maxWidth: 400 }}>
          <label className="ui-label">Manager ID</label>
          <Input
            placeholder="Enter manager user ID"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
          />
          <Button
            variant="primary"
            onClick={() => loadData()}
            className="ui-mt-2"
          >
            Load Rollup
          </Button>
        </div>
      </Card>

      {rollupData && (
        <>
          <div className="ui-card-grid ui-grid-4">
            <Card className="ui-stat-card">
              <div className="ui-stat-icon">
                <DollarSign size={24} />
              </div>
              <div className="ui-stat-value">
                ${(rollupData.totals?.commit || 0).toLocaleString()}
              </div>
              <div className="ui-stat-label">Team Commit</div>
            </Card>
            <Card className="ui-stat-card">
              <div className="ui-stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="ui-stat-value">
                ${(rollupData.totals?.bestCase || 0).toLocaleString()}
              </div>
              <div className="ui-stat-label">Best Case</div>
            </Card>
            <Card className="ui-stat-card">
              <div className="ui-stat-icon">
                <Target size={24} />
              </div>
              <div className="ui-stat-value">
                ${(rollupData.totals?.pipeline || 0).toLocaleString()}
              </div>
              <div className="ui-stat-label">Pipeline</div>
            </Card>
            <Card className="ui-stat-card">
              <div className="ui-stat-icon">
                <Users size={24} />
              </div>
              <div className="ui-stat-value">
                ${(rollupData.totals?.quota || 0).toLocaleString()}
              </div>
              <div className="ui-stat-label">Quota</div>
            </Card>
          </div>

          <Card title="Team Members">
            <div className="ui-table-wrapper">
              <>{(() => {
                                    const columns = [
                            { key: "col_0", header: "Name", render: (m: any) => (<>{m.name}</>) },
                            { key: "col_1", header: "Commit", render: (m: any) => (<>${(m.commit || 0).toLocaleString()}</>) },
                            { key: "col_2", header: "Best Case", render: (m: any) => (<>${(m.bestCase || 0).toLocaleString()}</>) },
                            { key: "col_3", header: "Pipeline", render: (m: any) => (<>${(m.pipeline || 0).toLocaleString()}</>) },
                            { key: "col_4", header: "Quota", render: (m: any) => (<>${(m.quota || 0).toLocaleString()}</>) },
                            { key: "col_5", header: "Attainment", render: (m: any) => (<><Badge
                                                    variant={
                                                      m.quota > 0 && m.commit / m.quota >= 0.8
                                                        ? "success"
                                                        : "warning"
                                                    }
                                                  >
                                                    {m.quota > 0
                                                      ? Math.round((m.commit / m.quota) * 100)
                                                      : 0}
                                                    %
                                                  </Badge></>) },
                          ];
                                    return <DataTable columns={columns} data={rollupData.team} rowKey={(m: any) => m.userId} />;
                                  })()}</>
            </div>
            <div className="ui-card-actions">
              <Button variant="primary" onClick={handleSaveRollup}>
                Save Snapshot
              </Button>
            </div>
          </Card>

          {rollups.length > 0 && (
            <Card title="Saved Rollups">
              <div className="ui-table-wrapper">
                <>{(() => {
                                        const columns = [
                                { key: "col_0", header: "Period", render: (r: any) => (<>{r.period}</>) },
                                { key: "col_1", header: "Commit", render: (r: any) => (<>${Number(r.totalCommit || 0).toLocaleString()}</>) },
                                { key: "col_2", header: "Best Case", render: (r: any) => (<>${Number(r.totalBestCase || 0).toLocaleString()}</>) },
                                { key: "col_3", header: "Pipeline", render: (r: any) => (<>${Number(r.totalPipeline || 0).toLocaleString()}</>) },
                                { key: "col_4", header: "Quota", render: (r: any) => (<>${Number(r.totalQuota || 0).toLocaleString()}</>) },
                                { key: "col_5", header: "Attainment", render: (r: any) => (<><Badge
                                                          variant={
                                                            Number(r.attainmentPct) >= 80
                                                              ? "success"
                                                              : "warning"
                                                          }
                                                        >
                                                          {Number(r.attainmentPct).toFixed(1)}%
                                                        </Badge></>) },
                                { key: "col_6", header: "Saved", render: (r: any) => (<>{new Date(r.createdAt).toLocaleDateString()}</>) },
                              ];
                                        return <DataTable columns={columns} data={rollups} rowKey={(r: any) => r.id} />;
                                      })()}</>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
