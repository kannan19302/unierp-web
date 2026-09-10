"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Send,
  Wrench,
  RefreshCw,
  Plus,
  Building,
  Trash2,
  CheckCircle2,
  User,
  MapPin,
} from "lucide-react";
import { Card, Button, ChangeHistory, ProtectedComponent, ListPageTemplate, type ListColumn, Modal } from "@kannan19302/ui";
import { apiGet, apiPost } from "@/lib/api";

interface AssetDepreciation {
  id: string;
  date: string;
  amount: number;
  periodName: string | null;
  accumulatedDepreciation: number;
  bookValue: number;
  status: string;
  journalId: string | null;
}

interface AssetTransferLog {
  id: string;
  transferDate: string;
  fromLocation?: { name: string } | null;
  toLocation?: { name: string } | null;
  fromCustodian?: { name: string } | null;
  toCustodian?: { name: string } | null;
  reason: string | null;
  performedBy: string;
}

interface AssetMaintenanceLog {
  id: string;
  maintenanceDate: string;
  type: string;
  description: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate: string | null;
}

interface FixedAsset {
  id: string;
  name: string;
  assetCode: string;
  status: string;
  purchaseValue: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: string;
  depreciationRate: number | null;
  currentValue: number;
  purchaseDate: string;
  accountId: string;
  accumDepAccountId: string;
  category?: { name: string } | null;
  location?: { name: string } | null;
  custodian?: { name: string } | null;
  depreciations: AssetDepreciation[];
  transfers: AssetTransferLog[];
  maintenanceLogs: AssetMaintenanceLog[];
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export default function FixedAssetDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [asset, setAsset] = useState<FixedAsset | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "depreciation" | "transfers" | "maintenance" | "disposal"
  >("depreciation");

  // Disposal Modal State
  const [showDisposalModal, setShowDisposalModal] = useState(false);
  const [disposalForm, setDisposalForm] = useState({
    disposalDate: new Date().toISOString().split("T")[0],
    disposalType: "SALE",
    salePrice: "",
    reason: "End-of-life asset disposal under ASC 360",
  });
  const [disposalSubmitting, setDisposalSubmitting] = useState(false);
  const [disposalError, setDisposalError] = useState("");

  // Impairment Modal State
  const [showImpairmentModal, setShowImpairmentModal] = useState(false);
  const [impairmentForm, setImpairmentForm] = useState({
    impairmentDate: new Date().toISOString().split("T")[0],
    recoverableAmount: "",
    reason: "Fair value reduction / technological obsolescence (IAS 36)",
  });
  const [impairmentSubmitting, setImpairmentSubmitting] = useState(false);
  const [impairmentError, setImpairmentError] = useState("");

  // Disposal & Impairment History
  const [disposalsHistory, setDisposalsHistory] = useState<any[]>([]);

  // Sub-Forms
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    transferDate: new Date().toISOString().split("T")[0],
    toLocationId: "",
    toCustodianId: "",
    reason: "",
  });

  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    maintenanceDate: new Date().toISOString().split("T")[0],
    type: "PREVENTIVE",
    description: "",
    cost: "0",
    performedBy: "",
    nextMaintenanceDate: "",
  });

  const [depPeriod, setDepPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [depRunning, setDepRunning] = useState(false);

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    setLoading(true);
    try {
      const [assetData, warehousesRes, employeesRes, disposalsRes] = await Promise.all([
        apiGet<FixedAsset>(`/advanced-finance/fixed-assets/${id}`),
        apiGet<any>("/inventory/warehouses"),
        apiGet<any>("/hr/employees"),
        apiGet<any[]>(`/advanced-finance/fixed-assets/disposals?assetId=${id}`).catch(() => []),
      ]);

      setAsset(assetData);
      setWarehouses(warehousesRes?.data || []);
      setEmployees(employeesRes?.data || []);
      setDisposalsHistory(Array.isArray(disposalsRes) ? disposalsRes : (disposalsRes as any)?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisposalSubmitting(true);
    setDisposalError("");
    try {
      await apiPost(`/advanced-finance/fixed-assets/disposals`, {
        assetId: id,
        disposalDate: disposalForm.disposalDate,
        disposalType: disposalForm.disposalType,
        salePrice: disposalForm.salePrice ? parseFloat(disposalForm.salePrice) : undefined,
        reason: disposalForm.reason,
        approvedBy: "finance-admin",
      });
      setShowDisposalModal(false);
      fetchAssetDetails();
    } catch (err: any) {
      setDisposalError(err.message || "Failed to dispose asset");
    } finally {
      setDisposalSubmitting(false);
    }
  };

  const handleImpairmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImpairmentSubmitting(true);
    setImpairmentError("");
    try {
      await apiPost(`/advanced-finance/fixed-assets/impairments`, {
        assetId: id,
        impairmentDate: impairmentForm.impairmentDate,
        carryingAmount: Number(asset?.currentValue ?? 0),
        recoverableAmount: parseFloat(impairmentForm.recoverableAmount || "0"),
        reason: impairmentForm.reason,
      });
      setShowImpairmentModal(false);
      fetchAssetDetails();
    } catch (err: any) {
      setImpairmentError(err.message || "Failed to record impairment");
    } finally {
      setImpairmentSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        transferDate: transferFormData.transferDate,
        toLocationId: transferFormData.toLocationId || null,
        toCustodianId: transferFormData.toCustodianId || null,
        reason: transferFormData.reason || null,
      };

      await apiPost(`/advanced-finance/fixed-assets/transfers`, { assetId: id, ...payload });
      setShowTransferForm(false);
      setTransferFormData({
        transferDate: new Date().toISOString().split("T")[0],
        toLocationId: "",
        toCustodianId: "",
        reason: "",
      });
      fetchAssetDetails();
    } catch (err: any) {
      alert(err.message || "Error recording transfer.");
    }
  };

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        maintenanceDate: maintenanceFormData.maintenanceDate,
        type: maintenanceFormData.type as
          | "PREVENTIVE"
          | "CORRECTIVE"
          | "CALIBRATION",
        description: maintenanceFormData.description,
        cost: parseFloat(maintenanceFormData.cost || "0"),
        performedBy: maintenanceFormData.performedBy,
        nextMaintenanceDate: maintenanceFormData.nextMaintenanceDate || null,
      };

      await apiPost(`/advanced-finance/fixed-assets/maintenance`, { assetId: id, ...payload });
      setShowMaintenanceForm(false);
      setMaintenanceFormData({
        maintenanceDate: new Date().toISOString().split("T")[0],
        type: "PREVENTIVE",
        description: "",
        cost: "0",
        performedBy: "",
        nextMaintenanceDate: "",
      });
      fetchAssetDetails();
    } catch (err: any) {
      alert(err.message || "Error recording maintenance.");
    }
  };

  const handleRunSingleDepreciation = async () => {
    setDepRunning(true);
    try {
      await apiPost(`/advanced-finance/fixed-assets/depreciation/run`, { assetId: id,
        periodName: depPeriod,
      });
      fetchAssetDetails();
    } catch (err: any) {
      alert(err.message || "Depreciation run failed.");
    } finally {
      setDepRunning(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.s1}>
        <RefreshCw className={`animate-spin ${styles.s2}`} />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={styles.s3}>
        <Building className={styles.s4} />
        <h3>Asset Registry Entry Not Found</h3>
        <Link href="/finance/advanced/fixed-assets" className="ui-text-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.s5}>
      {/* Header */}
      <div className="ui-flex-between">
        <div className="ui-hstack-3">
          <Link
            href="/finance/advanced/fixed-assets/assets"
            className="ui-btn ui-btn-secondary p-2"
          >
            <ArrowLeft className={styles.s6} />
          </Link>
          <div>
            <div className="ui-hstack-2">
              <h1 className="text-3xl">{asset.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  asset.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : asset.status === "UNDER_MAINTENANCE"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {asset.status}
              </span>
            </div>
            <p className="ui-text-muted mt-1">
              Asset Code: <span className={styles.s7}>{asset.assetCode}</span> ·
              Category: {asset.category?.name || "Unassigned"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {asset.status === "ACTIVE" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowImpairmentModal(true)}
              >
                Record Impairment
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDisposalModal(true)}
              >
                Dispose Asset
              </Button>
            </>
          )}
          {asset.status === "DISPOSED" && (
            <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-semibold rounded">
              Derecognized under ASC 360 / IAS 36
            </span>
          )}
        </div>
      </div>

      {/* Asset Valuation Stats */}
      <div className="ui-grid-3">
        <Card>
          <div className="p-5">
            <p className={styles.s8}>Purchase Value</p>
            <h3 className={styles.s9}>
              ${Number(asset.purchaseValue).toFixed(2)}
            </h3>
            <p className="ui-text-xs-muted mt-1">
              Acquired: {new Date(asset.purchaseDate).toLocaleDateString()} ·
              Salvage: ${Number(asset.salvageValue).toFixed(2)}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <p className={styles.s8}>Current Book Value</p>
            <h3 className={styles.s10}>
              ${Number(asset.currentValue).toFixed(2)}
            </h3>
            <p className="ui-text-xs-muted mt-1">
              Method: {asset.depreciationMethod} · Useful Life:{" "}
              {asset.usefulLifeYears}y
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <p className={styles.s8}>Custody & Location</p>
            <h3 className={styles.s11}>
              {asset.location?.name || "In-Transit Store"}
            </h3>
            <p className="ui-text-xs-muted mt-1">
              Custodian: {asset.custodian?.name || "General Corporate"}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div className={styles.s12}>
        <button
          onClick={() => setActiveTab("depreciation")}
          style={{
            borderBottom:
              activeTab === "depreciation"
                ? "2px solid var(--color-primary)"
                : "none",
            color:
              activeTab === "depreciation"
                ? "var(--color-primary)"
                : "var(--color-text-secondary)",
          }}
          className={styles.s13}
        >
          Depreciation Schedule
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          style={{
            borderBottom:
              activeTab === "transfers"
                ? "2px solid var(--color-primary)"
                : "none",
            color:
              activeTab === "transfers"
                ? "var(--color-primary)"
                : "var(--color-text-secondary)",
          }}
          className={styles.s13}
        >
          Custody & Transfers
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          style={{
            borderBottom:
              activeTab === "maintenance"
                ? "2px solid var(--color-primary)"
                : "none",
            color:
              activeTab === "maintenance"
                ? "var(--color-primary)"
                : "var(--color-text-secondary)",
          }}
          className={styles.s13}
        >
          Maintenance Logs
        </button>
        <button
          onClick={() => setActiveTab("disposal")}
          style={{
            borderBottom:
              activeTab === "disposal"
                ? "2px solid var(--color-primary)"
                : "none",
            color:
              activeTab === "disposal"
                ? "var(--color-primary)"
                : "var(--color-text-secondary)",
          }}
          className={styles.s13}
        >
          Disposal &amp; Impairments
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "depreciation" && (
        <div className="ui-stack-4">
          <div className="ui-flex-between">
            <h3 className="font-bold">Calculations Registry</h3>
            <div className="ui-hstack-2">
              <input
                type="month"
                className={`ui-input ${styles.s14}`}
                value={depPeriod}
                onChange={(e: any) => setDepPeriod(e.target.value)}
              />
              <ProtectedComponent permission="assets.depreciation.post">
                <Button
                  onClick={handleRunSingleDepreciation}
                  disabled={depRunning || asset.status !== "ACTIVE"}
                >
                  {depRunning ? (
                    <RefreshCw className="animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="mr-2" />
                  )}
                  Run Single Depreciation
                </Button>
              </ProtectedComponent>
            </div>
          </div>

          <Card>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "periodName",
                    header: "Period",
                    render: (v: any) => (
                      <span className="font-semibold">
                        {String(v || "N/A")}
                      </span>
                    ),
                  },
                  {
                    key: "date",
                    header: "Date",
                    render: (v: any) => new Date(String(v)).toLocaleDateString(),
                  },
                  {
                    key: "amount",
                    header: "Depreciation Amount",
                    render: (v: any) => `-$${Number(v).toFixed(2)}`,
                  },
                  {
                    key: "accumulatedDepreciation",
                    header: "Accumulated Depreciation",
                    render: (v: any) => `$${Number(v).toFixed(2)}`,
                  },
                  {
                    key: "bookValue",
                    header: "Net Book Value",
                    render: (v: any) => (
                      <span className="font-semibold">
                        ${Number(v).toFixed(2)}
                      </span>
                    ),
                  },
                  {
                    key: "journalId",
                    header: "Journal Reference",
                    render: (v: any) => (
                      <span className="ui-text-primary">
                        {String(v || "Manual Entry")}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (v: any) => (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        {String(v)}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={asset.depreciations as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No depreciation records"
              emptyDescription="No depreciation records posted yet."
            />
          </Card>
        </div>
      )}

      {activeTab === "transfers" && (
        <div className="ui-stack-4">
          <div className="ui-flex-between">
            <h3 className="font-bold">Custody Transfer Log</h3>
            <Button onClick={() => setShowTransferForm(!showTransferForm)}>
              <Plus className="mr-2" />
              Transfer Asset
            </Button>
          </div>

          {showTransferForm && (
            <Card>
              <form onSubmit={handleTransfer} className="p-5 ui-stack-4">
                <h4 className="font-semibold">
                  Log Custody / Location Transfer
                </h4>
                <div className="ui-grid-3">
                  <div className="ui-stack-1">
                    <label className="text-xs">Transfer Date</label>
                    <input
                      type="date"
                      required
                      className="ui-input"
                      value={transferFormData.transferDate}
                      onChange={(e: any) =>
                        setTransferFormData({
                          ...transferFormData,
                          transferDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="ui-stack-1">
                    <label className="text-xs">To Warehouse/Location</label>
                    <select
                      className="ui-input"
                      value={transferFormData.toLocationId}
                      onChange={(e: any) =>
                        setTransferFormData({
                          ...transferFormData,
                          toLocationId: e.target.value,
                        })
                      }
                    >
                      <option value="">No Location / In-Transit</option>
                      {warehouses.map((w: any) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ui-stack-1">
                    <label className="text-xs">To Custodian Employee</label>
                    <select
                      className="ui-input"
                      value={transferFormData.toCustodianId}
                      onChange={(e: any) =>
                        setTransferFormData({
                          ...transferFormData,
                          toCustodianId: e.target.value,
                        })
                      }
                    >
                      <option value="">No Custodian / General Corporate</option>
                      {employees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ui-stack-1">
                  <label className="text-xs">Reason for Transfer</label>
                  <input
                    className="ui-input"
                    placeholder="Department relocation, custodian swap..."
                    value={transferFormData.reason}
                    onChange={(e: any) =>
                      setTransferFormData({
                        ...transferFormData,
                        reason: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTransferForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Complete Transfer</Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "transferDate",
                    header: "Transfer Date",
                    render: (v: any) => new Date(String(v)).toLocaleDateString(),
                  },
                  {
                    key: "fromLocation",
                    header: "From Location",
                    render: (v: any) =>
                      String((v as any)?.name || "Corporate Store"),
                  },
                  {
                    key: "toLocation",
                    header: "To Location",
                    render: (v: any) => (
                      <span className={styles.s15}>
                        {String((v as any)?.name || "Corporate Store")}
                      </span>
                    ),
                  },
                  {
                    key: "fromCustodian",
                    header: "From Custodian",
                    render: (v: any) => String((v as any)?.name || "Unassigned"),
                  },
                  {
                    key: "toCustodian",
                    header: "To Custodian",
                    render: (v: any) => (
                      <span className="font-semibold">
                        {String((v as any)?.name || "Unassigned")}
                      </span>
                    ),
                  },
                  {
                    key: "reason",
                    header: "Reason",
                    render: (v: any) => (
                      <span className="ui-text-muted">
                        {String(v || "N/A")}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={asset.transfers as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No transfers"
              emptyDescription="No asset transfers recorded."
            />
          </Card>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="ui-stack-4">
          <div className="ui-flex-between">
            <h3 className="font-bold">Maintenance Records</h3>
            <Button
              onClick={() => setShowMaintenanceForm(!showMaintenanceForm)}
            >
              <Plus className="mr-2" />
              Log Maintenance
            </Button>
          </div>

          {showMaintenanceForm && (
            <Card>
              <form onSubmit={handleMaintenance} className="p-5 ui-stack-4">
                <h4 className="font-semibold">Log Asset Maintenance</h4>

                <div className="ui-grid-3">
                  <div className="ui-stack-1">
                    <label className="text-xs">Maintenance Date</label>
                    <input
                      type="date"
                      required
                      className="ui-input"
                      value={maintenanceFormData.maintenanceDate}
                      onChange={(e: any) =>
                        setMaintenanceFormData({
                          ...maintenanceFormData,
                          maintenanceDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="ui-stack-1">
                    <label className="text-xs">Maintenance Type</label>
                    <select
                      className="ui-input"
                      value={maintenanceFormData.type}
                      onChange={(e: any) =>
                        setMaintenanceFormData({
                          ...maintenanceFormData,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="PREVENTIVE">PREVENTIVE</option>
                      <option value="CORRECTIVE">CORRECTIVE</option>
                      <option value="CALIBRATION">CALIBRATION</option>
                    </select>
                  </div>

                  <div className="ui-stack-1">
                    <label className="text-xs">Service Provider</label>
                    <input
                      required
                      className="ui-input"
                      placeholder="Apple Store, internal tech desk..."
                      value={maintenanceFormData.performedBy}
                      onChange={(e: any) =>
                        setMaintenanceFormData({
                          ...maintenanceFormData,
                          performedBy: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="ui-grid-2">
                  <div className="ui-stack-1">
                    <label className="text-xs">Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="ui-input"
                      value={maintenanceFormData.cost}
                      onChange={(e: any) =>
                        setMaintenanceFormData({
                          ...maintenanceFormData,
                          cost: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="ui-stack-1">
                    <label className="text-xs">
                      Next Scheduled Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="ui-input"
                      value={maintenanceFormData.nextMaintenanceDate}
                      onChange={(e: any) =>
                        setMaintenanceFormData({
                          ...maintenanceFormData,
                          nextMaintenanceDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="ui-stack-1">
                  <label className="text-xs">Work Description</label>
                  <textarea
                    required
                    className={`ui-input ${styles.s16}`}
                    placeholder="Provide details about actions taken during maintenance..."
                    value={maintenanceFormData.description}
                    onChange={(e: any) =>
                      setMaintenanceFormData({
                        ...maintenanceFormData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="ui-flex-end ui-gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMaintenanceForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Submit Maintenance Log</Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <ListPageTemplate
              columns={
                [
                  {
                    key: "maintenanceDate",
                    header: "Date",
                    render: (v: any) => new Date(String(v)).toLocaleDateString(),
                  },
                  {
                    key: "type",
                    header: "Type",
                    render: (v: any) => (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${v === "PREVENTIVE" ? "bg-green-100 text-green-700" : v === "CORRECTIVE" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {String(v)}
                      </span>
                    ),
                  },
                  { key: "description", header: "Description" },
                  {
                    key: "cost",
                    header: "Cost",
                    render: (v: any) => `$${Number(v).toFixed(2)}`,
                  },
                  { key: "performedBy", header: "Performed By" },
                  {
                    key: "nextMaintenanceDate",
                    header: "Next Schedule",
                    render: (v: any) => (
                      <span className="ui-text-muted">
                        {v ? new Date(String(v)).toLocaleDateString() : "N/A"}
                      </span>
                    ),
                  },
                ] as ListColumn[]
              }
              data={
                asset.maintenanceLogs as unknown as Record<string, unknown>[]
              }
              loading={false}
              emptyTitle="No maintenance logs"
              emptyDescription="No maintenance events logged for this asset."
            />
          </Card>
        </div>
      )}

      {/* Disposal & Impairment Tab */}
      {activeTab === "disposal" && (
        <div className="ui-stack-4">
          <div className="ui-flex-between">
            <h3 className="font-bold">ASC 360 / IAS 36 Derecognition &amp; Valuation Registry</h3>
            {asset.status === "ACTIVE" && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImpairmentModal(true)}
                >
                  Record Impairment
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDisposalModal(true)}
                >
                  Dispose Asset
                </Button>
              </div>
            )}
          </div>

          <Card className="p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider ui-text-muted mb-3">
              Historical Disposals &amp; Derecognitions
            </h4>
            <ListPageTemplate
              columns={[
                {
                  key: "disposalDate",
                  header: "Date",
                  render: (v: any) =>
                    v ? new Date(String(v)).toLocaleDateString() : "—",
                },
                {
                  key: "disposalType",
                  header: "Type",
                  render: (v: any) => (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 dark:bg-gray-800">
                      {String(v)}
                    </span>
                  ),
                },
                {
                  key: "salePrice",
                  header: "Proceeds",
                  render: (v: any) => (
                    <span className={styles.tabularNum}>
                      {v != null ? `$${Number(v).toFixed(2)}` : "—"}
                    </span>
                  ),
                },
                {
                  key: "bookValueAtDisposal",
                  header: "NBV Derecognized",
                  render: (v: any) => (
                    <span className={styles.tabularNum}>
                      {v != null ? `$${Number(v).toFixed(2)}` : "—"}
                    </span>
                  ),
                },
                {
                  key: "gainLoss",
                  header: "Gain / (Loss)",
                  render: (v: any) => {
                    if (v == null) return "—";
                    const num = Number(v);
                    const isGain = num >= 0;
                    return (
                      <span
                        className={`${styles.tabularNum} font-semibold ${isGain ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {isGain ? `+$${num.toFixed(2)}` : `-$${Math.abs(num).toFixed(2)}`}
                      </span>
                    );
                  },
                },
                {
                  key: "journalId",
                  header: "GL Journal",
                  render: (v: any) =>
                    v ? (
                      <span className="font-mono text-xs text-blue-600">
                        {String(v).slice(0, 12)}…
                      </span>
                    ) : (
                      <span className="ui-text-muted text-xs">N/A</span>
                    ),
                },
                {
                  key: "reason",
                  header: "Reason / Notes",
                  render: (v: any) => (
                    <span className="ui-text-muted text-xs">
                      {String(v || "—")}
                    </span>
                  ),
                },
              ]}
              data={disposalsHistory as unknown as Record<string, unknown>[]}
              loading={false}
              emptyTitle="No disposals"
              emptyDescription="This asset is active and has no derecognition records."
            />
          </Card>
        </div>
      )}

      {/* Change History Timeline */}
      <Card>
        <div className="p-6">
          <h3 className={styles.s17}>Asset Audit Trail &amp; Edit Timeline</h3>
          <ChangeHistory entityType="FixedAsset" entityId={id} />
        </div>
      </Card>

      {/* Asset Disposal Modal */}
      {showDisposalModal && (
        <Modal
          open={showDisposalModal}
          onClose={() => setShowDisposalModal(false)}
          title={`Dispose Fixed Asset — ${asset.assetCode}`}
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowDisposalModal(false)}
                disabled={disposalSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDisposeSubmit}
                disabled={disposalSubmitting}
              >
                {disposalSubmitting ? "Derecognizing…" : "Confirm Derecognition"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {disposalError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-600">
                {disposalError}
              </div>
            )}
            <p className="text-xs ui-text-muted">
              Derecognize the asset under ASC 360 / IAS 36. This will zero out the net book value, write off accumulated depreciation against cost basis, and automatically post any gain or loss to the general ledger.
            </p>

            <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] rounded text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="ui-text-muted">Current Carrying Value:</span>
                <span className={`block font-semibold ${styles.tabularNum}`}>
                  ${Number(asset.currentValue).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="ui-text-muted">Original Acquisition Cost:</span>
                <span className={`block font-semibold ${styles.tabularNum}`}>
                  ${Number(asset.purchaseValue).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium ui-text-primary mb-1">
                  Disposal Type *
                </label>
                <select
                  className="ui-input w-full text-sm"
                  value={disposalForm.disposalType}
                  onChange={(e) =>
                    setDisposalForm((prev) => ({
                      ...prev,
                      disposalType: e.target.value as any,
                    }))
                  }
                >
                  <option value="SALE">Sale (Third-Party Buyer)</option>
                  <option value="SCRAP">Scrap / Write-off</option>
                  <option value="DONATION">Charitable Donation</option>
                  <option value="THEFT">Casualty / Theft Loss</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium ui-text-primary mb-1">
                  Disposal / Derecognition Date *
                </label>
                <input
                  type="date"
                  className="ui-input w-full text-sm"
                  value={disposalForm.disposalDate}
                  onChange={(e) =>
                    setDisposalForm((prev) => ({
                      ...prev,
                      disposalDate: e.target.value,
                    }))
                  }
                />
              </div>

              {disposalForm.disposalType === "SALE" && (
                <div>
                  <label className="block text-xs font-medium ui-text-primary mb-1">
                    Sale Proceeds / Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="ui-input w-full text-sm"
                    value={disposalForm.salePrice}
                    onChange={(e) =>
                      setDisposalForm((prev) => ({
                        ...prev,
                        salePrice: e.target.value,
                      }))
                    }
                  />
                  {disposalForm.salePrice && (
                    <p className="text-xs mt-1 ui-text-muted">
                      Estimated Gain / (Loss):{" "}
                      <span className={`font-semibold ${styles.tabularNum}`}>
                        ${(
                          Number(disposalForm.salePrice) -
                          Number(asset.currentValue)
                        ).toFixed(2)}
                      </span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium ui-text-primary mb-1">
                  Disposal Rationale / Notes
                </label>
                <input
                  type="text"
                  className="ui-input w-full text-sm"
                  value={disposalForm.reason}
                  onChange={(e) =>
                    setDisposalForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Asset Impairment Modal */}
      {showImpairmentModal && (
        <Modal
          open={showImpairmentModal}
          onClose={() => setShowImpairmentModal(false)}
          title={`Record Asset Impairment (IAS 36 / ASC 360) — ${asset.assetCode}`}
          size="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowImpairmentModal(false)}
                disabled={impairmentSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleImpairmentSubmit}
                disabled={impairmentSubmitting}
              >
                {impairmentSubmitting ? "Recording…" : "Post Impairment"}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {impairmentError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-600">
                {impairmentError}
              </div>
            )}
            <p className="text-xs ui-text-muted">
              Reduce the asset carrying amount to its recoverable amount (higher of Fair Value less Costs of Disposal and Value in Use). The impairment loss is immediately recognized in profit and loss.
            </p>

            <div className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-border)] rounded text-xs">
              <span className="ui-text-muted">Current Carrying Amount:</span>
              <span className={`block font-semibold text-sm ${styles.tabularNum}`}>
                ${Number(asset.currentValue).toFixed(2)}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium ui-text-primary mb-1">
                  Impairment Assessment Date *
                </label>
                <input
                  type="date"
                  className="ui-input w-full text-sm"
                  value={impairmentForm.impairmentDate}
                  onChange={(e) =>
                    setImpairmentForm((prev) => ({
                      ...prev,
                      impairmentDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium ui-text-primary mb-1">
                  Recoverable Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1500.00"
                  className="ui-input w-full text-sm"
                  value={impairmentForm.recoverableAmount}
                  onChange={(e) =>
                    setImpairmentForm((prev) => ({
                      ...prev,
                      recoverableAmount: e.target.value,
                    }))
                  }
                />
                {impairmentForm.recoverableAmount && (
                  <p className="text-xs mt-1 ui-text-muted">
                    Impairment Loss:{" "}
                    <span className={`font-semibold text-red-600 ${styles.tabularNum}`}>
                      ${Math.max(
                        0,
                        Number(asset.currentValue) -
                          Number(impairmentForm.recoverableAmount),
                      ).toFixed(2)}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium ui-text-primary mb-1">
                  Impairment Indicator / Valuation Rationale
                </label>
                <input
                  type="text"
                  className="ui-input w-full text-sm"
                  value={impairmentForm.reason}
                  onChange={(e) =>
                    setImpairmentForm((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
