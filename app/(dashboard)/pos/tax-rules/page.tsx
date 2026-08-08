"use client";
import React, { useState, useEffect } from "react";
import { Calculator, Plus, Edit2, Trash2 } from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { useToast, DataTable } from "@kannan19302/ui";

export default function POSTaxRulesPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    rate: 0,
    type: "INCLUSIVE",
    appliesTo: "ALL",
    isDefault: false,
    sortOrder: 0,
  });
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/pos/exp/tax-rules");
      setItems(Array.isArray(d) ? d : []);
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load tax rules";
      setLoadError(message);
      notifyError("Failed to load tax rules", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      if (editId) {
        await client.put(`/pos/exp/tax-rules/${editId}`, form);
      } else {
        await client.post("/pos/exp/tax-rules", form);
      }
      setShowModal(false);
      setEditId(null);
      load();
    } catch (err) {
      notifyError(
        "Failed to save tax rule",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  const remove = async (id: string) => {
    try {
      await client.delete(`/pos/exp/tax-rules/${id}`);
      load();
    } catch (err) {
      notifyError(
        "Failed to delete tax rule",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  return (
    <RouteGuard permission="pos.tax-rule.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <Calculator className="ui-text-primary" /> Tax Rules
            </h1>
            <p className="ui-text-sm-muted">
              Configure tax rates for POS transactions.
            </p>
          </div>
          <button
            className="ui-btn"
            onClick={() => {
              setEditId(null);
              setForm({
                name: "",
                rate: 0,
                type: "INCLUSIVE",
                appliesTo: "ALL",
                isDefault: false,
                sortOrder: 0,
              });
              setShowModal(true);
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {loadError && (
          <div className="ui-alert ui-alert-danger">
            Failed to load tax rules — {loadError}
          </div>
        )}
        <div className="ui-card">
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Name", render: (i: any) => (<>{i.name}</>) },
                    { key: "col_1", header: "Rate", render: (i: any) => (<>{i.rate}%</>) },
                    { key: "col_2", header: "Type", render: (i: any) => (<>{i.type}</>) },
                    { key: "col_3", header: "Applies To", render: (i: any) => (<>{i.appliesTo}</>) },
                    { key: "col_4", header: "Default", render: (i: any) => (<>{i.isDefault ? "Yes" : "-"}</>) },
                    { key: "col_5", header: "Actions", render: (i: any) => (<><button
                                          className="ui-btn-icon"
                                          onClick={() => {
                                            setEditId(i.id);
                                            setForm(i);
                                            setShowModal(true);
                                          }}
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <button
                                          className="ui-btn-icon ui-text-error"
                                          onClick={() => remove(i.id)}
                                        >
                                          <Trash2 size={14} />
                                        </button></>) },
                  ];
                            return <DataTable columns={columns} data={items} rowKey={(i: any) => i.id} />;
                          })()}</>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editId ? "Edit" : "Add"} Tax Rule</h2>
              <div className="ui-form-group">
                <label>Name</label>
                <input
                  className="ui-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="ui-input"
                  value={form.rate}
                  onChange={(e) =>
                    setForm({ ...form, rate: Number(e.target.value) })
                  }
                />
              </div>
              <div className="ui-form-group">
                <label>Type</label>
                <select
                  className="ui-input"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="INCLUSIVE">Inclusive</option>
                  <option value="EXCLUSIVE">Exclusive</option>
                </select>
              </div>
              <div className="ui-hstack-2 mt-4">
                <button className="ui-btn" onClick={save}>
                  Save
                </button>
                <button
                  className="ui-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
