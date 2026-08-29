"use client";
import React, { useEffect, useState, useCallback } from "react";
import { PageHeader, Card, DataTable, type Column, Button, Modal, TextField, Select, FormField, Badge, StatusBadge, Spinner, Pagination } from "@kannan19302/ui";
import { useApiClient } from "@kannan19302/framework";
import { Plus, Search, Zap } from "lucide-react";
import Link from "next/link";

interface WavePlan {
  id: string;
  planNumber: string;
  planType: string;
  status: string;
  warehouseId: string | null;
  optimizationStrategy: string;
  totalOrders: number;
  totalLines: number;
  totalItems: number;
  startTime: string | null;
  endTime: string | null;
  actualDurationMin: number | null;
  createdAt: string;
  _count?: { tasks: number };
}

export default function WavePlanningPage() {
  const client = useApiClient();
  const [data, setData] = useState<WavePlan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    planType: "PICK",
    optimizationStrategy: "BATCH",
    sortMethod: "ORDER",
    warehouseId: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const limit = 20;
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get<{ data: WavePlan[]; total: number }>(
        `/inventory/wave-plans?page=${page}&limit=${limit}`,
      );
      setData(res.data);
      setTotal(res.total);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [client, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await client.post("/inventory/wave-plans", { ...form, tasks: [] });
      setCreateOpen(false);
      fetchData();
    } catch {
      /* empty */
    } finally {
      setCreating(false);
    }
  };

  const filtered = data.filter(
    (w: any) => !search || w.planNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<WavePlan>[] = [
    {
      key: "planNumber",
      header: "Plan #",
      render: (r: any) => (
        <Link href={`/inventory/wave-planning/${r.id}`} className="ui-link">
          {r.planNumber}
        </Link>
      ),
    },
    {
      key: "planType",
      header: "Type",
      render: (r: any) => <Badge>{r.planType}</Badge>,
    },
    { key: "optimizationStrategy", header: "Strategy" },
    { key: "totalLines", header: "Lines" },
    { key: "totalItems", header: "Items" },
    { key: "tasks", header: "Tasks", render: (r: any) => r._count?.tasks ?? 0 },
    {
      key: "actualDurationMin",
      header: "Duration (min)",
      render: (r: any) => (r.actualDurationMin ? `${r.actualDurationMin}m` : "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (r: any) => <StatusBadge status={r.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (r: any) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="ui-page">
      <PageHeader
        title="Wave Planning"
        description="Create and manage warehouse picking waves"
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> New Wave Plan
          </Button>
        }
      />
      <Card>
        <TextField
          label="Search Wave Plans"
          placeholder="Search wave plans..."
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          rowKey={(r: any) => r.id}
          emptyTitle="No wave plans"
          emptyMessage="Create your first wave plan to start picking."
          emptyIcon={<Zap size={48} />}
        />
        <Pagination
          page={page}
          pageCount={Math.ceil(total / limit)}
          onChange={setPage}
        />
      </Card>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Wave Plan"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate as any}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="ui-stack-4">
          <FormField label="Plan Type">
            <Select
              value={form.planType}
              onChange={(e: any) => setForm({ ...form, planType: e.target.value })}
            >
              <option value="PICK">Pick</option>
              <option value="PUTAWAY">Putaway</option>
              <option value="REPLENISH">Replenish</option>
            </Select>
          </FormField>
          <FormField label="Optimization">
            <Select
              value={form.optimizationStrategy}
              onChange={(e: any) =>
                setForm({ ...form, optimizationStrategy: e.target.value })
              }
            >
              <option value="BATCH">Batch</option>
              <option value="ZONE">Zone</option>
              <option value="ORDER">Order</option>
              <option value="WAVE">Wave</option>
            </Select>
          </FormField>
          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
