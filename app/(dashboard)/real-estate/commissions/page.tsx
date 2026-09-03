"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { PageHeader, Card, Button, Spinner, Badge, DataTable, type Column, Modal, TextField, KPICard, useToast } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { DollarSign, Plus, Users, AlertTriangle } from "lucide-react";
interface Commission {
  id: string;
  agentId: string;
  amount: number;
  splitRatio: number;
  generalLedgerRef?: string;
  status?: string;
}
const fmtCurrency = (n: number) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CommissionsPage() {
  const client = useApiClient();
  const { error: notifyError } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    agentId: "",
    amount: 0,
    splitRatio: 100,
    generalLedgerRef: "",
  });
  useEffect(() => {
    (async () => {
      try {
        const d = await client.get<Commission[] | { data?: Commission[] }>(
          "/ext/real-estate/commissions",
        );
        setCommissions(Array.isArray(d) ? d : d.data || []);
        setLoadError(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load commissions";
        setLoadError(message);
        notifyError("Failed to load commissions", message);
      } finally {
        setLoading(false);
      }
    })();
  }, [client, notifyError]);
  const handleCreate = async () => {
    if (!form.agentId) return;
    setCreating(true);
    try {
      await client.post("/ext/real-estate/commissions", {
        ...form,
        amount: Number(form.amount),
        splitRatio: Number(form.splitRatio),
      });
      setCreateOpen(false);
      window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create commission";
      notifyError("Failed to create commission", message);
    } finally {
      setCreating(false);
    }
  };
  const totalPaid = commissions.reduce((a: any, c: any) => a + Number(c.amount || 0), 0);
  const columns: Column<Commission>[] = [
    {
      key: "agent",
      header: "Agent",
      render: (row: any) => (
        <span className="ui-heading-sm">{row.agentId.slice(0, 12)}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right" as const,
      render: (row: any) => (
        <span className="font-semibold">{fmtCurrency(row.amount)}</span>
      ),
    },
    {
      key: "split",
      header: "Split Ratio",
      render: (row: any) => <Badge variant="info">{row.splitRatio}%</Badge>,
    },
    {
      key: "gl",
      header: "GL Reference",
      render: (row: any) => (
        <code className={styles.s1}>{row.generalLedgerRef || "—"}</code>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => <Badge variant="success">Paid</Badge>,
    },
  ];
  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  return (
    <RouteGuard permission="real-estate.commissions.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Agent Commissions"
          description="Commission rules, calculations, and payouts"
          actions={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-2" /> Add Commission
            </Button>
          }
        />
        {loadError && (
          <div className="ui-alert ui-alert-danger">
            <AlertTriangle size={16} /> Failed to load commissions — list below
            may be stale. {loadError}
          </div>
        )}
        <div className="ui-grid-auto">
          <KPICard
            title="Total Commissions"
            value={commissions.length}
            icon={<Users size={18} />}
            color="var(--color-primary)"
          />
          <KPICard
            title="Total Paid"
            value={fmtCurrency(totalPaid)}
            icon={<DollarSign size={18} />}
            color="var(--color-success)"
          />
        </div>
        <Card padding="none">
          <DataTable
            columns={columns}
            data={commissions}
            rowKey={(r: any) => r.id}
            emptyTitle="No commissions"
            emptyMessage="Add commission records."
            emptyIcon={<DollarSign size={48} />}
          />
        </Card>
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Add Commission"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "Saving..." : "Add"}
              </Button>
            </>
          }
        >
          <div className="ui-stack-4">
            <TextField
              label="Agent ID"
              required
              value={form.agentId}
              onChange={(e: any) => setForm({ ...form, agentId: e.target.value })}
            />
            <TextField
              label="Amount ($)"
              type="number"
              value={String(form.amount)}
              onChange={(e: any) =>
                setForm({ ...form, amount: Number(e.target.value) })
              }
            />
            <TextField
              label="Split Ratio (%)"
              type="number"
              value={String(form.splitRatio)}
              onChange={(e: any) =>
                setForm({ ...form, splitRatio: Number(e.target.value) })
              }
            />
            <TextField
              label="GL Reference"
              value={form.generalLedgerRef}
              onChange={(e: any) =>
                setForm({ ...form, generalLedgerRef: e.target.value })
              }
            />
          </div>
        </Modal>
      </div>
    </RouteGuard>
  );
}
