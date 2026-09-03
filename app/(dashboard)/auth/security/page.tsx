"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, Button, DataTable, Card, useToast } from "@kannan19302/ui";
import { RouteGuard } from "@kannan19302/framework";
import { Plus, Trash2, Save } from "lucide-react";
import type { Column } from "@kannan19302/ui";

interface IpAllowlistEntry {
  id: string;
  ipRange: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  expiryDays: number;
  historyCount: number;
}

export default function SecurityPage() {
  const { toast } = useToast();
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [entries, setEntries] = useState<IpAllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState("");

  const fetchAll = useCallback(async () => {
    const [pRes, eRes] = await Promise.all([
      fetch("/api/v1/auth/password-policy"),
      fetch("/api/v1/auth/ip-allowlist"),
    ]);
    if (pRes.ok) setPolicy(await pRes.json());
    if (eRes.ok) setEntries(await eRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updatePolicy = async (key: string, value: any) => {
    const res = await fetch("/api/v1/auth/password-policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (res.ok) {
      setPolicy(await res.json());
      toast({ title: "Policy updated", variant: "success" });
    } else toast({ title: "Failed to update policy", variant: "error" });
  };

  const addIpEntry = async () => {
    if (!newIp) return;
    const res = await fetch("/api/v1/auth/ip-allowlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ipRange: newIp }),
    });
    if (res.ok) {
      setNewIp("");
      await fetchAll();
      toast({ title: "IP range added", variant: "success" });
    } else {
      const d = await res.json();
      toast({ title: d.message ?? "Failed to add IP range", variant: "error" });
    }
  };

  const deleteIpEntry = async (id: string) => {
    const res = await fetch(`/api/v1/auth/ip-allowlist/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchAll();
      toast({ title: "Entry removed", variant: "success" });
    }
  };

  const columns: Column<IpAllowlistEntry>[] = [
    {
      key: "ipRange",
      header: "IP Range",
      render: (r: any) => <code>{r.ipRange}</code>,
    },
    {
      key: "description",
      header: "Description",
      render: (r: any) => r.description ?? "-",
    },
    {
      key: "isActive",
      header: "Active",
      render: (r: any) =>
        r.isActive ? (
          <span className="ui-badge ui-badge-success">Yes</span>
        ) : (
          <span className="ui-badge ui-badge-muted">No</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (r: any) => (
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Trash2 size={14} />}
          onClick={(e: any) => {
            e.stopPropagation();
            deleteIpEntry(r.id);
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <RouteGuard permission="auth.password-policy.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Security Settings"
          description="Password policies and IP allowlisting."
        />

        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-4">Password Policy</h3>
            {policy && (
              <div className="ui-grid-3">
                <div className="ui-form-group">
                  <label className="ui-label">Min Length</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={policy.minLength}
                    onChange={(e: any) =>
                      setPolicy({
                        ...policy,
                        minLength: parseInt(e.target.value),
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Save size={14} />}
                    onClick={() => updatePolicy("minLength", policy.minLength)}
                  >
                    Save
                  </Button>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Expiry Days (0 = never)</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={policy.expiryDays}
                    onChange={(e: any) =>
                      setPolicy({
                        ...policy,
                        expiryDays: parseInt(e.target.value),
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Save size={14} />}
                    onClick={() =>
                      updatePolicy("expiryDays", policy.expiryDays)
                    }
                  >
                    Save
                  </Button>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Password History Count</label>
                  <input
                    className="ui-input"
                    type="number"
                    value={policy.historyCount}
                    onChange={(e: any) =>
                      setPolicy({
                        ...policy,
                        historyCount: parseInt(e.target.value),
                      })
                    }
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Save size={14} />}
                    onClick={() =>
                      updatePolicy("historyCount", policy.historyCount)
                    }
                  >
                    Save
                  </Button>
                </div>
                {[
                  "requireUppercase",
                  "requireLowercase",
                  "requireNumber",
                  "requireSpecial",
                ].map((k: any) => (
                  <label
                    key={k}
                    className="ui-flex-row ui-gap-2 u-items-center"
                  >
                    <input
                      type="checkbox"
                      checked={(policy as any)[k]}
                      onChange={(e: any) => updatePolicy(k, e.target.checked)}
                    />
                    {k.replace("require", "Require ")}
                  </label>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-4">IP Allowlist</h3>
            <div className="ui-flex-row ui-gap-4 u-mb-4">
              <input
                className="ui-input u-flex-1"
                placeholder="e.g. 192.168.1.0/24"
                value={newIp}
                onChange={(e: any) => setNewIp(e.target.value)}
              />
              <Button
                leftIcon={<Plus size={16} />}
                onClick={addIpEntry}
                disabled={!newIp}
              >
                Add
              </Button>
            </div>
            <DataTable columns={columns} data={entries} loading={loading} />
          </div>
        </Card>
      </div>
    </RouteGuard>
  );
}
