"use client";

import React, { useState, useEffect } from "react";
import { Card, StatusBadge, Button, Modal, FormField, Input, Select, useToast, DataTable } from "@kannan19302/ui";
import { Plus, AlertTriangle } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./AssetsTab.module.css";

interface Asset {
  id: string;
  employeeId: string;
  assetType: string;
  assetName: string;
  serialNumber: string | null;
  assignedDate: string;
  status: string;
}

export default function AssetsTab() {
  const client = useApiClient();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<
    Array<{ id: string; firstName: string; lastName: string }>
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    assetType: "LAPTOP",
    assetName: "",
    serialNumber: "",
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, [client]);

  const fetchData = async () => {
    try {
      const [assetsData, employeesData] = await Promise.all([
        client.get<Asset[] | { data?: Asset[] }>("/advanced-hr/assets"),
        client.get<
          | Array<{ id: string; firstName: string; lastName: string }>
          | {
              data?: Array<{ id: string; firstName: string; lastName: string }>;
            }
        >("/hr/employees"),
      ]);
      setAssets(Array.isArray(assetsData) ? assetsData : assetsData.data || []);
      setEmployees(
        Array.isArray(employeesData) ? employeesData : employeesData.data || [],
      );
      setLoadError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load assets";
      setLoadError(message);
      toast.error("Failed to load assets", message);
    }
  };

  const assignAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post("/advanced-hr/assets", form);
      toast.success("Asset assigned");
      setForm({
        employeeId: "",
        assetType: "LAPTOP",
        assetName: "",
        serialNumber: "",
      });
      setShowForm(false);
      fetchData();
    } catch {
      toast.error("Error assigning asset");
    }
  };

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Assign Asset
        </Button>
      </div>
      {loadError && (
        <div className="ui-alert ui-alert-danger">
          <AlertTriangle size={16} />
          {loadError}
        </div>
      )}
      <Card padding="none" className="builder-table-wrapper">
        <>{(() => {
                        const columns = [
                { key: "col_0", header: "Asset", render: (a: any) => (<>{a.assetName}</>) },
                { key: "col_1", header: "Type", render: (a: any) => (<>{a.assetType}</>) },
                { key: "col_2", header: "Serial", render: (a: any) => (<>{a.serialNumber || "--"}</>) },
                { key: "col_3", header: "Assigned", render: (a: any) => (<>{new Date(a.assignedDate).toLocaleDateString()}</>) },
                { key: "col_4", header: "Status", render: (a: any) => (<><StatusBadge status={a.status} /></>) },
              ];
                        return <DataTable columns={columns} data={assets} rowKey={(a: any) => a.id} />;
                      })()}</>
      </Card>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Assign Asset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={assignAsset as any}>
              Assign
            </Button>
          </>
        }
      >
        <form onSubmit={assignAsset} className="ui-stack-3">
          <FormField label="Employee" required>
            <Select
              value={form.employeeId}
              onChange={(e: any) => setForm({ ...form, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((e: any) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Asset Type">
            <Select
              value={form.assetType}
              onChange={(e: any) => setForm({ ...form, assetType: e.target.value })}
            >
              <option value="LAPTOP">Laptop</option>
              <option value="PHONE">Phone</option>
              <option value="BADGE">Badge</option>
              <option value="FURNITURE">Furniture</option>
              <option value="VEHICLE">Vehicle</option>
            </Select>
          </FormField>
          <FormField label="Asset Name" required>
            <Input
              placeholder="Asset Name"
              value={form.assetName}
              onChange={(e: any) => setForm({ ...form, assetName: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Serial Number">
            <Input
              placeholder="Serial Number (optional)"
              value={form.serialNumber}
              onChange={(e: any) =>
                setForm({ ...form, serialNumber: e.target.value })
              }
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
