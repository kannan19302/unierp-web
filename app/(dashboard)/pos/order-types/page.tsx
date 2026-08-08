"use client";
import React, { useState, useEffect } from "react";
import { ListOrdered, Plus, Edit2 } from "lucide-react";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { useToast, DataTable } from "@kannan19302/ui";

export default function POSOrderTypesPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    isDefault: false,
    sortOrder: 0,
  });
  useEffect(() => {
    load();
  }, []);
  const load = async () => {
    setLoading(true);
    try {
      const d = await client.get<any>("/pos/exp/order-types");
      setItems(Array.isArray(d) ? d : []);
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load order types";
      setLoadError(message);
      notifyError("Failed to load order types", message);
    }
    setLoading(false);
  };
  const save = async () => {
    try {
      if (editId) {
        await client.put(`/pos/exp/order-types/${editId}`, form);
      } else {
        await client.post("/pos/exp/order-types", form);
      }
      setShowModal(false);
      setEditId(null);
      load();
    } catch (err) {
      notifyError(
        "Failed to save order type",
        err instanceof Error ? err.message : undefined,
      );
    }
  };
  return (
    <RouteGuard permission="pos.order-type.read">
      <div className="ui-stack-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl ui-hstack-2">
              <ListOrdered className="ui-text-primary" /> Order Types
            </h1>
            <p className="ui-text-sm-muted">
              Configure POS order types (Dine-in, Takeaway, Delivery, etc.).
            </p>
          </div>
          <button
            className="ui-btn"
            onClick={() => {
              setEditId(null);
              setForm({
                name: "",
                code: "",
                description: "",
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
            Failed to load order types — {loadError}
          </div>
        )}
        <div className="ui-card">
          <>{(() => {
                            const columns = [
                    { key: "col_0", header: "Name", render: (i: any) => (<>{i.name}</>) },
                    { key: "col_1", header: "Code", render: (i: any) => (<>{i.code}</>) },
                    { key: "col_2", header: "Default", render: (i: any) => (<>{i.isDefault ? "Yes" : "-"}</>) },
                    { key: "col_3", header: "Active", render: (i: any) => (<>{i.isActive ? "Yes" : "No"}</>) },
                    { key: "col_4", header: "Order", render: (i: any) => (<>{i.sortOrder}</>) },
                    { key: "col_5", header: "Actions", render: (i: any) => (<><button
                                          className="ui-btn-icon"
                                          onClick={() => {
                                            setEditId(i.id);
                                            setForm(i);
                                            setShowModal(true);
                                          }}
                                        >
                                          <Edit2 size={14} />
                                        </button></>) },
                  ];
                            return <DataTable columns={columns} data={items} rowKey={(i: any) => i.id} />;
                          })()}</>
        </div>
        {showModal && (
          <div className="ui-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ui-modal" onClick={(e: any) => e.stopPropagation()}>
              <h2>{editId ? "Edit" : "Add"} Order Type</h2>
              <div className="ui-form-group">
                <label>Name</label>
                <input
                  className="ui-input"
                  value={form.name}
                  onChange={(e: any) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Code</label>
                <input
                  className="ui-input"
                  value={form.code}
                  onChange={(e: any) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="ui-form-group">
                <label>Description</label>
                <textarea
                  className="ui-input"
                  value={form.description}
                  onChange={(e: any) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e: any) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                />{" "}
                Set as default
              </label>
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
