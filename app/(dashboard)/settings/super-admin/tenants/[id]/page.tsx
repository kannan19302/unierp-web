"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PageHeader,
  Button,
  Card,
  Badge,
  Spinner,
} from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { CheckCircle, AlertTriangle, Play, Pause, Trash2, Shield, Activity, Users, Box, History } from "lucide-react";

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const api = useApiClient();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      loadTenant(params.id);
    }
  }, [params?.id]);

  const [internalAuditLogs, setInternalAuditLogs] = useState<any[]>([]);

  async function loadTenant(id: string) {
    try {
      const data = await api.get(`/super-admin/tenants/${id}`);
      setTenant(data);

      const logs = (await api.get(`/super-admin/tenants/${id}/audit-trail?limit=10`)) as any;
      if (logs && logs.data) {
        setInternalAuditLogs(logs.data);
      }
    } catch (err) {
      console.error("Failed to load tenant", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend() {
    if (!confirm("Suspend this tenant?")) return;
    await api.post(`/tenants/${params?.id}/suspend`, {});
    loadTenant(params!.id);
  }

  async function handleResume() {
    if (!confirm("Resume this tenant?")) return;
    await api.post(`/tenants/${params?.id}/unsuspend`, {});
    loadTenant(params!.id);
  }

  async function handlePurge() {
    if (
      !confirm("WARNING: PERMANENTLY PURGE TENANT? This action is irreversible.")
    )
      return;
    const reason = prompt(
      "Enter a break-glass reason (min 10 chars) to bypass two-person control, or cancel:",
    );
    if (!reason || reason.length < 10) {
      alert("Invalid or missing reason. Purge cancelled.");
      return;
    }
    try {
      const token = localStorage.getItem("unierp_token");
      const res = await fetch(`/api/v1/super-admin/tenants/${params?.id}/purge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-confirm-purge": "true",
          "x-break-glass-reason": reason
        }
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      router.push("/settings/super-admin/tenants");
    } catch (err: any) {
      alert(`Purge failed: ${err.message}`);
    }
  }

  async function handleOffboard() {
    if (!confirm("Start offboarding process for this tenant? (30 days retention)")) return;
    try {
      await api.post(`/tenants/${params?.id}/offboard`, { retentionDays: 30 });
      loadTenant(params!.id);
    } catch (err: any) {
      alert(`Offboard failed: ${err.message}`);
    }
  }

  async function handleExport() {
    try {
      const token = localStorage.getItem("unierp_token");
      const res = await fetch(`/api/v1/super-admin/tenants/${params?.id}/audit-trail/export`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenant-${params?.id}-audit-trail.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  }

  async function handleImpersonate() {
    try {
      const res = (await api.post(`/super-admin/tenants/${params?.id}/impersonate`, {})) as any;
      if (res?.token) {
        // Save the current token to restore later
        const currentToken = localStorage.getItem("unierp_token");
        if (currentToken) localStorage.setItem("unierp_token_original", currentToken);
        
        // Apply impersonation token
        localStorage.setItem("unierp_token", res.token);
        
        // Redirect to dashboard (now impersonating)
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      alert(`Impersonation failed: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tenant) {
    return <div>Tenant not found.</div>;
  }

  const isDegraded = tenant.metrics?.healthStatus === "DEGRADED";
  const isActive = tenant.status === "ACTIVE";

  return (
    <RouteGuard permission="system.tenant.read">
      <div className="space-y-6">
        <PageHeader
          title={tenant.name}
          description={`Tenant ID: ${tenant.id} | Slug: ${tenant.slug}`}
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Settings", href: "/settings" },
            { label: "Super Admin" },
            { label: "Tenants", href: "/settings/super-admin/tenants" },
            { label: tenant.name },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleImpersonate}>
                <Users className="w-4 h-4 mr-2" />
                Impersonate
              </Button>
              <Button variant="outline" onClick={handleExport}>
                Export
              </Button>
              {tenant.status === "ACTIVE" && (
                <Button variant="outline" onClick={handleSuspend}>
                  <Pause className="w-4 h-4 mr-2" />
                  Suspend
                </Button>
              )}
              {tenant.status === "SUSPENDED" && (
                <Button variant="outline" onClick={handleResume}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              {tenant.status !== "OFFBOARDING" && tenant.status !== "PURGED" && (
                <Button variant="outline" onClick={handleOffboard}>
                  Archive
                </Button>
              )}
              <Button variant="danger" onClick={handlePurge}>
                <Trash2 className="w-4 h-4 mr-2" />
                Purge
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overview */}
          <Card>
            <div className="px-6 py-4 border-b dark:border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <Shield className="w-5 h-5 mr-2 text-gray-500" />
                Overview
              </h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant={isActive ? "success" : "warning"}>
                  {tenant.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="font-medium">{tenant.subscription?.plan?.name || tenant.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Demo Data</span>
                <span>{tenant.demoDataLoaded ? "Yes" : "No"}</span>
              </div>
            </div>
          </Card>

          {/* Health & Usage */}
          <Card>
            <div className="px-6 py-4 border-b dark:border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <Activity className="w-5 h-5 mr-2 text-gray-500" />
                Health & Usage
              </h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">System Health</span>
                {isDegraded ? (
                  <Badge variant="danger" className="flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    DEGRADED
                  </Badge>
                ) : (
                  <Badge variant="success" className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    HEALTHY
                  </Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Errors (24h)</span>
                <span className="font-medium">{tenant.metrics?.errorsLast24h || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center"><Users className="w-4 h-4 mr-1"/> Users</span>
                <span className="font-medium">{tenant.metrics?.userCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 flex items-center"><Box className="w-4 h-4 mr-1"/> Enabled Modules</span>
                <span className="font-medium">{tenant.apps?.length || 0}</span>
              </div>
            </div>
          </Card>

          {/* Audit History Snippet */}
          <Card>
            <div className="px-6 py-4 border-b dark:border-gray-800">
              <h3 className="text-lg font-semibold flex items-center">
                <History className="w-5 h-5 mr-2 text-gray-500" />
                Recent Support History
              </h3>
            </div>
            <div className="p-6">
              {tenant.auditLogs?.length > 0 ? (
                <ul className="space-y-3 text-sm">
                  {tenant.auditLogs.slice(0, 4).map((log: any) => (
                    <li key={log.id} className="pb-3 border-b last:border-0 last:pb-0 border-gray-100 dark:border-gray-800">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        By {log.actorId} • {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 italic">No recent control-plane actions on this tenant.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Internal Audit Trail Viewer */}
        <Card>
          <div className="px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center">
              <History className="w-5 h-5 mr-2 text-gray-500" />
              Tenant Internal Audit Trail
            </h3>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export CSV
            </Button>
          </div>
          <div className="p-6">
            {internalAuditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Entity Type</th>
                      <th className="px-4 py-3">Entity ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internalAuditLogs.map((log: any) => (
                      <tr key={log.id} className="border-b dark:border-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium">{log.action}</td>
                        <td className="px-4 py-3 text-gray-500">{log.userId}</td>
                        <td className="px-4 py-3">{log.entityType}</td>
                        <td className="px-4 py-3 font-mono text-xs">{log.entityId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No internal audit logs found for this tenant.</div>
            )}
          </div>
        </Card>

      </div>
    </RouteGuard>
  );
}
