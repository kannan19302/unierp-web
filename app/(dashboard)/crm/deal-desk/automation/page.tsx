"use client";

import React, { useState, useEffect } from "react";
import { Card, PageHeader, Spinner, Badge, useToast, Button, Input, DataTable } from "@kannan19302/ui";
import { Settings, Plus, Trash2, Play, Edit3 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiSend } from "../../_components/api";

export default function DealAutomationPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerEvent: "STAGE_CHANGE",
    conditions: "[]",
    actions: "[]",
    priority: 0,
  });
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateOppId, setEvaluateOppId] = useState("");
  const toast = useToast();

  const loadRules = async () => {
    try {
      const data = await apiGet<any[]>("/crm/deal-desk/automation-rules");
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(
        "Could not load automation rules",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        conditions: JSON.parse(formData.conditions),
        actions: JSON.parse(formData.actions),
      };
      if (editingId) {
        await apiPut(`/crm/deal-desk/automation-rules/${editingId}`, payload);
        toast.success("Success", "Rule updated.");
      } else {
        await apiPost("/crm/deal-desk/automation-rules", payload);
        toast.success("Success", "Rule created.");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        triggerEvent: "STAGE_CHANGE",
        conditions: "[]",
        actions: "[]",
        priority: 0,
      });
      loadRules();
    } catch (err) {
      toast.error(
        "Error",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiSend(`/crm/deal-desk/automation-rules/${id}`, "DELETE");
      toast.success("Success", "Rule deleted.");
      loadRules();
    } catch (err) {
      toast.error(
        "Error",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiPut(`/crm/deal-desk/automation-rules/${id}`, {
        isActive: !isActive,
      });
      loadRules();
    } catch (err) {
      toast.error(
        "Error",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  };

  const handleEvaluate = async () => {
    if (!evaluateOppId) {
      toast.error("Validation", "Please enter an Opportunity ID");
      return;
    }
    setEvaluating(true);
    try {
      const result = await apiPost<any>(
        `/crm/deal-desk/automation-rules/evaluate/${evaluateOppId}`,
        {},
      );
      toast.success(
        "Evaluation Complete",
        `${result.rulesEvaluated} rules evaluated, ${result.rulesTriggered} triggered.`,
      );
    } catch (err) {
      toast.error(
        "Error",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setEvaluating(false);
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
        title="Automation Rules"
        description="Configure and manage deal desk automation rules"
        breadcrumbs={[
          { label: "Deal Desk", href: "/crm/deal-desk" },
          { label: "Automation" },
        ]}
      />

      <Card>
        <div className="ui-form-row">
          <div className="ui-form-group" style={{ maxWidth: 400 }}>
            <label className="ui-label">Evaluate Rules for Opportunity</label>
            <Input
              placeholder="Opportunity ID"
              value={evaluateOppId}
              onChange={(e) => setEvaluateOppId(e.target.value)}
            />
          </div>
          <div className="ui-form-group" style={{ alignSelf: "flex-end" }}>
            <Button
              variant="primary"
              onClick={handleEvaluate}
              disabled={evaluating}
            >
              <Play size={16} /> Evaluate
            </Button>
          </div>
          <div
            className="ui-form-group"
            style={{ alignSelf: "flex-end", marginLeft: "auto" }}
          >
            <Button
              variant="primary"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
            >
              <Plus size={16} /> New Rule
            </Button>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card title={editingId ? "Edit Rule" : "New Rule"}>
          <div className="ui-form-group">
            <label className="ui-label">Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Description</label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Trigger Event</label>
            <select
              className="ui-input"
              value={formData.triggerEvent}
              onChange={(e) =>
                setFormData({ ...formData, triggerEvent: e.target.value })
              }
            >
              <option value="STAGE_CHANGE">Stage Change</option>
              <option value="CLOSE_DATE_CHANGE">Close Date Change</option>
              <option value="AMOUNT_CHANGE">Amount Change</option>
              <option value="NEW_NOTE">New Note</option>
            </select>
          </div>
          <div className="ui-grid-2">
            <div className="ui-form-group">
              <label className="ui-label">Conditions (JSON array)</label>
              <textarea
                className="ui-input"
                rows={4}
                value={formData.conditions}
                onChange={(e) =>
                  setFormData({ ...formData, conditions: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Actions (JSON array)</label>
              <textarea
                className="ui-input"
                rows={4}
                value={formData.actions}
                onChange={(e) =>
                  setFormData({ ...formData, actions: e.target.value })
                }
              />
            </div>
          </div>
          <div className="ui-form-group">
            <label className="ui-label">Priority</label>
            <Input
              type="number"
              value={String(formData.priority)}
              onChange={(e) =>
                setFormData({ ...formData, priority: Number(e.target.value) })
              }
            />
          </div>
          <div className="ui-card-actions">
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Card title={`Rules (${rules.length})`}>
        <div className="ui-table-wrapper">
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Name", render: (r: any) => (<><strong>{r.name}</strong></>) },
                    { key: "col_1", header: "Trigger", render: (r: any) => (<><Badge variant="info">{r.triggerEvent}</Badge></>) },
                    { key: "col_2", header: "Conditions", render: (r: any) => (<>{Array.isArray(r.conditions)
                                        ? `${r.conditions.length} conditions`
                                        : "N/A"}</>) },
                    { key: "col_3", header: "Actions", render: (r: any) => (<>{Array.isArray(r.actions)
                                        ? `${r.actions.length} actions`
                                        : "N/A"}</>) },
                    { key: "col_4", header: "Priority", render: (r: any) => (<>{r.priority}</>) },
                    { key: "col_5", header: "Active", render: (r: any) => (<><input
                                        type="checkbox"
                                        checked={r.isActive}
                                        onChange={() => handleToggle(r.id, r.isActive)}
                                        style={{ cursor: "pointer" }}
                                      /></>) },
                    { key: "col_6", header: "Actions", render: (r: any) => (<><div className="ui-action-cell">
                                        <Button
                                          variant="ghost"
                                          onClick={() => {
                                            setEditingId(r.id);
                                            setFormData({
                                              name: r.name,
                                              description: r.description || "",
                                              triggerEvent: r.triggerEvent,
                                              conditions: JSON.stringify(r.conditions, null, 2),
                                              actions: JSON.stringify(r.actions, null, 2),
                                              priority: r.priority,
                                            });
                                            setShowForm(true);
                                          }}
                                        >
                                          <Edit3 size={16} />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          onClick={() => handleDelete(r.id)}
                                        >
                                          <Trash2 size={16} />
                                        </Button>
                                      </div></>) },
                  ];
                            return <DataTable columns={columns} data={rules} rowKey={(r: any) => r.id} />;
                          })()}</>
        </div>
      </Card>
    </div>
  );
}
