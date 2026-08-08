"use client";
// @ts-nocheck
import { useState, useEffect } from "react";
import { ProtectedComponent, DataTable } from "@kannan19302/ui";

const BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const api = {
  get: async (p: string) => {
    const r = await fetch(`${BASE}${p}`, { credentials: "include" });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  post: async (p: string, b?: unknown) => {
    const r = await fetch(`${BASE}${p}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: b ? JSON.stringify(b) : undefined,
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
import { Plus, Loader2, AlertTriangle } from "lucide-react";

export default function HealthcarePharmacyPage() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "inventory" | "batches" | "controlled"
  >("inventory");
  const [showDrugForm, setShowDrugForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [drugForm, setDrugForm] = useState({ name: "", isControlled: false });
  const [batchForm, setBatchForm] = useState({
    drugId: "",
    batchNumber: "",
    quantity: "0",
    expiryDate: "",
    unitCost: "0",
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [dispenseForm, setDispenseForm] = useState({
    drugId: "",
    patientId: "",
    quantity: "1",
    administeredBy: "",
  });
  const [controlledLogs, setControlledLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    api
      .get("/ext/healthcare/patients")
      .then((r: any) => setPatients(r.data || []))
      .catch(() => {});
  }, []);
  async function loadData() {
    setLoading(true);
    try {
      const [d, l] = await Promise.all([
        api.get("/ext/healthcare/deep/drugs"),
        api.get("/ext/healthcare/deep/pharmacy/controlled-logs"),
      ]);
      setDrugs(d.data || []);
      setControlledLogs(l.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }
  async function createDrug() {
    try {
      await api.post("/ext/healthcare/deep/drugs", drugForm);
      setShowDrugForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function createBatch() {
    try {
      await api.post("/ext/healthcare/deep/pharmacy/batches", batchForm);
      setShowBatchForm(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }
  async function dispenseDrug() {
    try {
      await api.post("/ext/healthcare/deep/pharmacy/dispense", dispenseForm);
      loadData();
    } catch (e: any) {
      alert(e.message || "Error");
    }
  }

  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <h1 className="ui-page-title">Pharmacy</h1>
        <div className="flex gap-2">
          <ProtectedComponent permission="healthcare.pharmacy.create">
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => setShowDrugForm(true)}
            >
              <Plus className="w-4 h-4" /> New Drug
            </button>
          </ProtectedComponent>
          <ProtectedComponent permission="healthcare.pharmacy.create">
            <button
              className="ui-btn ui-btn-outline"
              onClick={() => setShowBatchForm(true)}
            >
              <Plus className="w-4 h-4" /> Add Batch
            </button>
          </ProtectedComponent>
        </div>
      </div>
      <div className="flex gap-1 mb-4 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "inventory" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory ({drugs.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "batches" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("batches")}
        >
          Batches
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === "controlled" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}
          onClick={() => setActiveTab("controlled")}
        >
          Controlled Substance Log
        </button>
      </div>
      {showDrugForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">New Drug</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Name</label>
              <input
                className="ui-input"
                value={drugForm.name}
                onChange={(e: any) =>
                  setDrugForm({ ...drugForm, name: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={drugForm.isControlled}
                  onChange={(e: any) =>
                    setDrugForm({ ...drugForm, isControlled: e.target.checked })
                  }
                />{" "}
                Controlled Substance
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createDrug}>
              Save
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowDrugForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showBatchForm && (
        <div className="ui-card p-4 mb-4">
          <h3 className="font-semibold mb-3">Add Batch</h3>
          <div className="ui-grid-3">
            <div className="ui-form-group">
              <label className="ui-label">Drug</label>
              <select
                className="ui-input"
                value={batchForm.drugId}
                onChange={(e: any) =>
                  setBatchForm({ ...batchForm, drugId: e.target.value })
                }
              >
                <option value="">Select</option>
                {drugs.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Batch #</label>
              <input
                className="ui-input"
                value={batchForm.batchNumber}
                onChange={(e: any) =>
                  setBatchForm({ ...batchForm, batchNumber: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Quantity</label>
              <input
                className="ui-input"
                type="number"
                value={batchForm.quantity}
                onChange={(e: any) =>
                  setBatchForm({ ...batchForm, quantity: e.target.value })
                }
              />
            </div>
            <div className="ui-form-group">
              <label className="ui-label">Expiry Date</label>
              <input
                className="ui-input"
                type="date"
                value={batchForm.expiryDate}
                onChange={(e: any) =>
                  setBatchForm({ ...batchForm, expiryDate: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="ui-btn ui-btn-primary" onClick={createBatch}>
              Save
            </button>
            <button
              className="ui-btn ui-btn-ghost"
              onClick={() => setShowBatchForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="ui-card">
          {activeTab === "inventory" && (
            <>
              <>{(() => {
                                      const columns = [
                                { key: "col_0", header: "Drug" , render: (d: any) => (<>{d.name}</>) },
                                { key: "col_1", header: "Stock" , render: (d: any) => (<><span
                                                        className={
                                                          d.quantity < 10 ? "text-red-600 font-semibold" : ""
                                                        }
                                                      >
                                                        {d.quantity}
                                                      </span></>) },
                                { key: "col_2", header: "Controlled" , render: (d: any) => (<>{d.isControlled ? (
                                                        <span className="ui-badge ui-badge-danger">Yes</span>
                                                      ) : (
                                                        <span className="ui-badge ui-badge-info">No</span>
                                                      )}</>) },
                                { key: "col_3", header: "Batches" , render: (d: any) => (<>{d.batches?.length || 0}</>) },
                                { key: "col_4", header: "Actions" , render: (d: any) => (<><div className="flex gap-1">
                                                        {d.quantity > 0 && (
                                                          <button
                                                            className="ui-btn ui-btn-sm ui-btn-outline"
                                                            onClick={() => {
                                                              setDispenseForm({
                                                                ...dispenseForm,
                                                                drugId: d.id,
                                                              });
                                                            }}
                                                          >
                                                            Dispense
                                                          </button>
                                                        )}
                                                      </div></>) },
                              ];
                                      return <DataTable columns={columns} data={drugs} rowKey={(d: any) => d.id} />;
                                  })()}</>
              {dispenseForm.drugId && (
                <div className="mt-4 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Dispense{" "}
                    {drugs.find((d: any) => d.id === dispenseForm.drugId)?.name}
                  </h4>
                  <div className="ui-grid-3">
                    <div className="ui-form-group">
                      <label className="ui-label">Patient</label>
                      <select
                        className="ui-input"
                        value={dispenseForm.patientId}
                        onChange={(e: any) =>
                          setDispenseForm({
                            ...dispenseForm,
                            patientId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select</option>
                        {patients.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Quantity</label>
                      <input
                        className="ui-input"
                        type="number"
                        value={dispenseForm.quantity}
                        onChange={(e: any) =>
                          setDispenseForm({
                            ...dispenseForm,
                            quantity: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="ui-form-group">
                      <label className="ui-label">Administered By</label>
                      <input
                        className="ui-input"
                        value={dispenseForm.administeredBy}
                        onChange={(e: any) =>
                          setDispenseForm({
                            ...dispenseForm,
                            administeredBy: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <button
                    className="ui-btn ui-btn-primary mt-2"
                    onClick={dispenseDrug}
                  >
                    Dispense
                  </button>
                </div>
              )}
            </>
          )}
          {activeTab === "batches" && (
            <>{(() => {
                                    const columns = [
                            { key: "col_0", header: "Drug", render: (b: any) => (<>{d.name}</>) },
                            { key: "col_1", header: "Batch #", render: (b: any) => (<>{b.batchNumber}</>) },
                            { key: "col_2", header: "Qty", render: (b: any) => (<>{b.quantity}</>) },
                            { key: "col_3", header: "Remaining", render: (b: any) => (<>{b.remainingQty}</>) },
                            { key: "col_4", header: "Expiry", render: (b: any) => (<>{b.expiryDate
                                                    ? new Date(b.expiryDate).toLocaleDateString()
                                                    : "-"}</>) },
                            { key: "col_5", header: "Status", render: (b: any) => (<><span
                                                    className={`ui-badge ${b.status === "ACTIVE" ? "ui-badge-success" : "ui-badge-danger"}`}
                                                  >
                                                    {b.status}
                                                  </span></>) },
                          ];
                                    return <DataTable columns={columns} data={(d.batches || [])} rowKey={(b: any) => b.id} />;
                                  })()}</>
          )}
          {activeTab === "controlled" && (
            <>{(() => {
                                  const columns = [
                            { key: "col_0", header: "Drug" , render: (l: any) => (<>{l.drug?.name}</>) },
                            { key: "col_1", header: "Action" , render: (l: any) => (<><span className="ui-badge ui-badge-warning">
                                                  {l.action}
                                                </span></>) },
                            { key: "col_2", header: "Qty" , render: (l: any) => (<>{l.quantity}</>) },
                            { key: "col_3", header: "Administered By" , render: (l: any) => (<>{l.administeredBy}</>) },
                            { key: "col_4", header: "Date" , render: (l: any) => (<>{new Date(l.loggedAt).toLocaleString()}</>) },
                          ];
                                  return <DataTable columns={columns} data={controlledLogs} rowKey={(l: any) => l.id} />;
                              })()}</>
          )}
        </div>
      )}
    </div>
  );
}
