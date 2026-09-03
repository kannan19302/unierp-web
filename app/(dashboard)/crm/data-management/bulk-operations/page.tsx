"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Card, PageHeader, Spinner, Button, Badge, DataTable } from "@kannan19302/ui";
import { Plus, Play, XCircle, ListChecks } from "lucide-react";
import { apiGet, apiSend } from "../../_components/api";

interface BulkOp {
  id: string;
  operationType: string;
  entityType: string;
  targetIds: string[];
  status: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorItems: number;
  createdAt: string;
}

export default function BulkOperationsPage() {
  const [ops, setOps] = useState<BulkOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    operationType: "UPDATE_STATUS",
    entityType: "LEAD",
    targetIds: "",
    parameters: "{}",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ data: BulkOp[] }>(
        "/crm/data/bulk-operations",
      );
      setOps((data as any)?.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createOp = async () => {
    await apiSend("/crm/data/bulk-operations", "POST", {
      operationType: form.operationType,
      entityType: form.entityType,
      targetIds: form.targetIds
        .split(",")
        .map((s: any) => s.trim())
        .filter(Boolean),
      parameters: JSON.parse(form.parameters || "{}"),
    });
    setShowNew(false);
    setForm({
      operationType: "UPDATE_STATUS",
      entityType: "LEAD",
      targetIds: "",
      parameters: "{}",
    });
    load();
  };

  const executeOp = async (id: string) => {
    await apiSend(`/crm/data/bulk-operations/${id}/execute`, "POST");
    load();
  };

  const cancelOp = async (id: string) => {
    if (confirm("Cancel this operation?")) {
      await apiSend(`/crm/data/bulk-operations/${id}/cancel`, "POST");
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Bulk Operations"
        description="Update status, assign owners, or delete records in bulk"
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Operation
          </Button>
        }
      />

      {showNew && (
        <Card className="p-4">
          <div className="ui-form-group space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operation Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={form.operationType}
                onChange={(e: any) =>
                  setForm({ ...form, operationType: e.target.value })
                }
              >
                <option value="UPDATE_STATUS">Update Status</option>
                <option value="ASSIGN_OWNER">Assign Owner</option>
                <option value="DELETE">Delete</option>
                <option value="TAG_ADD">Add Tag</option>
                <option value="TAG_REMOVE">Remove Tag</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={form.entityType}
                onChange={(e: any) =>
                  setForm({ ...form, entityType: e.target.value })
                }
              >
                <option value="CUSTOMER">Customer</option>
                <option value="LEAD">Lead</option>
                <option value="CONTACT">Contact</option>
                <option value="OPPORTUNITY">Opportunity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target IDs (comma-separated)
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={form.targetIds}
                onChange={(e: any) =>
                  setForm({ ...form, targetIds: e.target.value })
                }
                placeholder="id-1, id-2, id-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parameters (JSON)
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={form.parameters}
                onChange={(e: any) =>
                  setForm({ ...form, parameters: e.target.value })
                }
                placeholder='{"newStatus":"CONTACTED"}'
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={createOp}>
                Create
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowNew(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {ops.length === 0 ? (
          <p className="text-sm text-gray-400">No bulk operations yet.</p>
        ) : (
          <>{(() => {
                                const columns = [
                        { key: "col_0", header: "Type", render: (op: any) => (<><ListChecks className="w-4 h-4 inline mr-1" />
                                          {op.operationType}</>) },
                        { key: "col_1", header: "Entity", render: (op: any) => (<>{op.entityType}</>) },
                        { key: "col_2", header: "Progress", render: (op: any) => (<>{op.processedItems}/{op.totalItems}</>) },
                        { key: "col_3", header: "Status", render: (op: any) => (<><Badge
                                            variant={
                                              op.status === "COMPLETED"
                                                ? "success"
                                                : op.status === "FAILED" || op.status === "CANCELLED"
                                                  ? "danger"
                                                  : "warning"
                                            }
                                          >
                                            {op.status}
                                          </Badge></>) },
                        { key: "col_4", header: "Actions", render: (op: any) => (<>{op.status === "PENDING" && (
                                            <div className="flex gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => executeOp(op.id)}
                                              >
                                                <Play className="w-4 h-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => cancelOp(op.id)}
                                              >
                                                <XCircle className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          )}</>) },
                      ];
                                return <DataTable columns={columns} data={ops} rowKey={(op: any) => op.id} />;
                              })()}</>
        )}
      </Card>
    </div>
  );
}
