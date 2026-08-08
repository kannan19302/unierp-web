"use client";
import { DataTable } from "@kannan19302/ui";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { ClipboardCheck, Plus, X, CheckCircle, XCircle } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

interface QCTemplate {
  id: string;
  name: string;
  code: string;
  category: string;
  isActive: boolean;
  checks: { name: string; type: string }[];
}

interface QCCheck {
  id: string;
  templateId: string;
  productId: string;
  workOrderId: string | null;
  status: string;
  checkedQty: number;
  passedQty: number;
  failedQty: number;
  notes: string | null;
  checkedAt: string | null;
  template: QCTemplate;
}

export default function QualityChecksPage() {
  const client = useApiClient();
  const [templates, setTemplates] = useState<QCTemplate[]>([]);
  const [checks, setChecks] = useState<QCCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"checks" | "templates">("checks");
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    code: "",
    description: "",
    category: "INSPECTION",
    checks: "",
  });
  const [newCheck, setNewCheck] = useState({
    templateId: "",
    productId: "",
    workOrderId: "",
    status: "PASSED",
    checkedQty: "1",
    passedQty: "1",
    failedQty: "0",
    notes: "",
  });

  useEffect(() => {
    fetchChecks();
    fetchTemplates();
  }, [client]);

  const fetchChecks = async () => {
    try {
      const data = await client.get<QCCheck[] | { data?: QCCheck[] }>(
        "/manufacturing/quality-checks",
      );
      setChecks(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await client.get<QCTemplate[] | { data?: QCTemplate[] }>(
        "/manufacturing/quality-templates",
      );
      setTemplates(Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const checks = JSON.parse(newTemplate.checks);
      await client.post("/manufacturing/quality-templates", {
        ...newTemplate,
        checks,
      });
      setIsTemplateOpen(false);
      setNewTemplate({
        name: "",
        code: "",
        description: "",
        category: "INSPECTION",
        checks: "",
      });
      fetchTemplates();
      alert("Template created!");
    } catch {
      alert("Invalid checks JSON");
    }
  };

  const handleCreateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/manufacturing/quality-checks", {
        ...newCheck,
        checkedQty: parseFloat(newCheck.checkedQty),
        passedQty: parseFloat(newCheck.passedQty),
        failedQty: parseFloat(newCheck.failedQty),
        workOrderId: newCheck.workOrderId || undefined,
      });
      setIsCheckOpen(false);
      setNewCheck({
        templateId: "",
        productId: "",
        workOrderId: "",
        status: "PASSED",
        checkedQty: "1",
        passedQty: "1",
        failedQty: "0",
        notes: "",
      });
      fetchChecks();
      alert("Quality check recorded!");
    } catch {
      alert("Failed to record check");
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className={styles.p1}>
            <ClipboardCheck size={28} className="ui-text-primary" /> Quality
            Control
          </h1>
          <p className={styles.p2}>
            Perform inspections and manage check templates
          </p>
        </div>
        <div className="ui-flex ui-gap-2">
          <button
            onClick={() => setIsCheckOpen(true)}
            className={styles.addBtn}
          >
            <Plus size={18} /> New Check
          </button>
          <button
            onClick={() => setIsTemplateOpen(true)}
            className={styles.addBtnSecondary}
          >
            + Template
          </button>
        </div>
      </div>
      <div className={styles.tabs}>
        <button
          className={tab === "checks" ? styles.activeTab : styles.tab}
          onClick={() => setTab("checks")}
        >
          Inspections
        </button>
        <button
          className={tab === "templates" ? styles.activeTab : styles.tab}
          onClick={() => setTab("templates")}
        >
          Templates
        </button>
      </div>
      {tab === "checks" && (
        <>{(() => {
                      const columns = [
                { key: "col_0", header: "Status" , render: (c: any) => (<>{c.status === "PASSED" ? (
                                  <CheckCircle size={16} className="ui-text-success" />
                                ) : (
                                  <XCircle size={16} className="ui-text-danger" />
                                )}</>) },
                { key: "col_1", header: "Template" , render: (c: any) => (<>{c.template?.name || c.templateId}</>) },
                { key: "col_2", header: "Product" , render: (c: any) => (<>{c.productId}</>) },
                { key: "col_3", header: "Qty" , render: (c: any) => (<>{c.checkedQty}</>) },
                { key: "col_4", header: "Passed" , render: (c: any) => (<>{c.passedQty}</>) },
                { key: "col_5", header: "Failed" , render: (c: any) => (<>{c.failedQty}</>) },
                { key: "col_6", header: "Notes" , render: (c: any) => (<>{c.notes || "-"}</>) },
                { key: "col_7", header: "Date" , render: (c: any) => (<>{c.checkedAt
                                  ? new Date(c.checkedAt).toLocaleDateString()
                                  : "-"}</>) },
              ];
                      return <DataTable columns={columns} data={checks} rowKey={(c: any) => c.id} />;
                  })()}</>
      )}
      {tab === "templates" && (
        <div className="ui-stack-3">
          {templates.map((t: any) => (
            <div key={t.id} className={styles.templateCard}>
              <div className="ui-flex-between">
                <div>
                  <h3 className={styles.templateName}>
                    {t.name} <span className={styles.code}>{t.code}</span>
                  </h3>
                  <p className={styles.templateMeta}>
                    {t.category} · {t.checks.length} checks
                  </p>
                </div>
                <span
                  className={
                    t.isActive ? styles.activeBadge : styles.inactiveBadge
                  }
                >
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {isTemplateOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>New Template</h3>
              <button
                onClick={() => setIsTemplateOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="ui-stack-3">
              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">Name</label>
                  <input
                    className="ui-input"
                    value={newTemplate.name}
                    onChange={(e: any) =>
                      setNewTemplate((p: any) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Code</label>
                  <input
                    className="ui-input"
                    value={newTemplate.code}
                    onChange={(e: any) =>
                      setNewTemplate((p: any) => ({ ...p, code: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Checks (JSON)</label>
                <textarea
                  className={styles.codeInput}
                  value={newTemplate.checks}
                  onChange={(e: any) =>
                    setNewTemplate((p: any) => ({ ...p, checks: e.target.value }))
                  }
                  placeholder='[{"name":"Visual inspection","type":"PASS_FAIL"}]'
                  rows={3}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Create
              </button>
            </form>
          </div>
        </div>
      )}
      {isCheckOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className="ui-flex-between">
              <h3>Record Inspection</h3>
              <button
                onClick={() => setIsCheckOpen(false)}
                className={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCheck} className="ui-stack-3">
              <div className="ui-form-group">
                <label className="ui-label">Template</label>
                <select
                  className="ui-input"
                  value={newCheck.templateId}
                  onChange={(e: any) =>
                    setNewCheck((p: any) => ({ ...p, templateId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select template</option>
                  {templates.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Product ID</label>
                <input
                  className="ui-input"
                  value={newCheck.productId}
                  onChange={(e: any) =>
                    setNewCheck((p: any) => ({ ...p, productId: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Work Order ID (optional)</label>
                <input
                  className="ui-input"
                  value={newCheck.workOrderId}
                  onChange={(e: any) =>
                    setNewCheck((p: any) => ({ ...p, workOrderId: e.target.value }))
                  }
                />
              </div>
              <div className="ui-grid-3">
                <div className="ui-form-group">
                  <label className="ui-label">Inspected Qty</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={newCheck.checkedQty}
                    onChange={(e: any) =>
                      setNewCheck((p: any) => ({ ...p, checkedQty: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Passed</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={newCheck.passedQty}
                    onChange={(e: any) =>
                      setNewCheck((p: any) => ({ ...p, passedQty: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Failed</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={newCheck.failedQty}
                    onChange={(e: any) =>
                      setNewCheck((p: any) => ({ ...p, failedQty: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="ui-form-group">
                <label className="ui-label">Notes</label>
                <textarea
                  className="ui-input"
                  value={newCheck.notes}
                  onChange={(e: any) =>
                    setNewCheck((p: any) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>
              <button type="submit" className={styles.submitBtn}>
                Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
