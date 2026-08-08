"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, PageHeader, Button, Spinner, Badge, Table, DataTable } from "@unerp/ui";
import { AlertCircle, Truck, CheckCircle, Plus, Package } from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

import { Package as InventoryModuleIcon } from "lucide-react";
const STATUS_COLORS: Record<
  string,
  "default" | "info" | "warning" | "success" | "danger"
> = {
  PENDING: "default",
  IN_TRANSIT: "info",
  ARRIVED: "warning",
  RECEIVING: "warning",
  RECEIVED: "success",
  PARTIALLY_RECEIVED: "info",
  CANCELLED: "danger",
  OVERAGE: "warning",
  SHORTAGE: "danger",
  WRONG_ITEM: "danger",
  DAMAGED: "danger",
};

interface Asn {
  id: string;
  asnNumber: string;
  status: string;
  vendorId: string;
  warehouseId: string;
  carrierName?: string;
  trackingNumber?: string;
  expectedArrival?: string;
  lineItems?: LineItem[];
  _count?: { lineItems: number };
}
interface LineItem {
  id: string;
  productId: string;
  expectedQty: string;
  receivedQty: string;
  uom: string;
}
interface Discrepancy {
  id: string;
  asnId: string;
  discrepancyType: string;
  productId: string;
  expectedQty: string;
  actualQty: string;
  resolvedAt?: string;
  notes?: string;
}
interface Dashboard {
  byStatus: { status: string; _count: { id: number } }[];
  discrepancyStats: { discrepancyType: string; _count: { id: number } }[];
  recentAsns: Asn[];
}

export default function AsnPage() {
  const client = useApiClient();
  const apiFetch = useCallback(
    <T,>(path: string, opts?: RequestInit) =>
      client.request<T>(path, {
        method: opts?.method,
        body: opts?.body ? String(opts.body) : undefined,
      }),
    [client],
  );
  const [tab, setTab] = useState<
    "dashboard" | "asns" | "discrepancies" | "new-asn" | "detail"
  >("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [asns, setAsns] = useState<Asn[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [selectedAsn, setSelectedAsn] = useState<Asn | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asnForm, setAsnForm] = useState({
    vendorId: "",
    warehouseId: "",
    carrierName: "",
    trackingNumber: "",
    expectedArrival: "",
  });
  const [receiveItemId, setReceiveItemId] = useState("");
  const [receiveQty, setReceiveQty] = useState("");

  const load = async (t: typeof tab, asnIdToLoad?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (t === "dashboard")
        setDashboard(await apiFetch("/inventory/asn/dashboard"));
      if (t === "asns") setAsns(await apiFetch("/inventory/asn"));
      if (t === "discrepancies")
        setDiscrepancies(await apiFetch("/inventory/asn/discrepancies"));
      if (t === "detail" && asnIdToLoad)
        setSelectedAsn(await apiFetch(`/inventory/asn/${asnIdToLoad}`));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const createAsn = async () => {
    try {
      await apiFetch("/inventory/asn", {
        method: "POST",
        body: JSON.stringify(asnForm),
      });
      setTab("asns");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const asnAction = async (
    action: string,
    asnId: string,
    body?: Record<string, unknown>,
  ) => {
    try {
      await apiFetch(`/inventory/asn/${asnId}/${action}`, {
        method: "PATCH",
        body: JSON.stringify(body ?? {}),
      });
      if (selectedAsn?.id === asnId) load("detail", asnId);
      else load(tab);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const receiveItem = async () => {
    if (!selectedAsn) return;
    try {
      await apiFetch(
        `/inventory/asn/${selectedAsn.id}/items/${receiveItemId}/receive`,
        {
          method: "PATCH",
          body: JSON.stringify({ receivedQty: Number(receiveQty) }),
        },
      );
      setReceiveItemId("");
      setReceiveQty("");
      load("detail", selectedAsn.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const resolveDiscrepancy = async (id: string) => {
    try {
      await apiFetch(`/inventory/asn/discrepancies/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolutionNote: "Resolved" }),
      });
      load("discrepancies");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "asns", label: "ASNs" },
    { key: "discrepancies", label: "Discrepancies" },
    { key: "new-asn", label: "+ New ASN" },
  ] as const;

  return (
    <RouteGuard permission="inventory.asn.read">
      <div className="p-6 space-y-4">
        <PageHeader title="Advance Shipping Notices" />
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "primary" : "secondary"}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
          {selectedAsn && (
            <Button
              variant={tab === "detail" ? "primary" : "secondary"}
              onClick={() => setTab("detail")}
            >
              ASN {selectedAsn.asnNumber}
            </Button>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {loading && <Spinner />}

        {tab === "dashboard" && dashboard && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dashboard.byStatus.map((s) => (
                <Card key={s.status} className="p-4">
                  <div className="text-sm text-gray-500">
                    {s.status.replace(/_/g, " ")}
                  </div>
                  <div className="text-2xl font-bold">{s._count.id}</div>
                  <Badge variant={STATUS_COLORS[s.status] ?? "default"}>
                    ASNs
                  </Badge>
                </Card>
              ))}
            </div>
            {dashboard.discrepancyStats.length > 0 && (
              <Card className="p-4">
                <div className="font-semibold mb-2 text-red-600">
                  Open Discrepancies
                </div>
                <div className="flex gap-4">
                  {dashboard.discrepancyStats.map((d) => (
                    <div key={d.discrepancyType} className="text-sm">
                      <Badge
                        variant={STATUS_COLORS[d.discrepancyType] ?? "default"}
                      >
                        {d.discrepancyType}
                      </Badge>
                      <span className="ml-1">{d._count.id}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <Card className="p-4">
              <div className="font-semibold mb-2">
                Incoming ASNs (Expected Soon)
              </div>
              <>{(() => {
                                  const columns = [
                            { key: "col_0", header: "ASN #" , render: (a: any) => (<>{a.asnNumber}</>) },
                            { key: "col_1", header: "Vendor" , render: (a: any) => (<>{a.vendorId}</>) },
                            { key: "col_2", header: "Status" , render: (a: any) => (<><Badge variant={STATUS_COLORS[a.status] ?? "default"}>
                                                    {a.status}
                                                  </Badge></>) },
                            { key: "col_3", header: "Expected Arrival" , render: (a: any) => (<>{a.expectedArrival
                                                    ? new Date(a.expectedArrival).toLocaleDateString()
                                                    : "—"}</>) },
                            { key: "col_4", header: "Items" , render: (a: any) => (<>{a._count?.lineItems ?? 0}</>) },
                          ];
                                  return <DataTable columns={columns} data={dashboard.recentAsns} rowKey={(a: any) => a.id} />;
                              })()}</>
            </Card>
          </div>
        )}

        {tab === "asns" && (
          <Card className="p-4">
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "ASN #" , render: (a: any) => (<>{a.asnNumber}</>) },
                        { key: "col_1", header: "Vendor" , render: (a: any) => (<>{a.vendorId}</>) },
                        { key: "col_2", header: "Status" , render: (a: any) => (<><Badge variant={STATUS_COLORS[a.status] ?? "default"}>
                                              {a.status}
                                            </Badge></>) },
                        { key: "col_3", header: "Carrier" , render: (a: any) => (<>{a.carrierName ?? "—"}</>) },
                        { key: "col_4", header: "Tracking" , render: (a: any) => (<>{a.trackingNumber ?? "—"}</>) },
                        { key: "col_5", header: "Expected" , render: (a: any) => (<>{a.expectedArrival
                                              ? new Date(a.expectedArrival).toLocaleDateString()
                                              : "—"}</>) },
                        { key: "col_6", header: "Actions" , render: (a: any) => (<><Button
                                              variant="secondary"
                                              onClick={() => {
                                                setSelectedAsn(a);
                                                load("detail", a.id);
                                                setTab("detail");
                                              }}
                                            >
                                              View
                                            </Button>{a.status === "PENDING" && (
                                              <Button
                                                variant="secondary"
                                                onClick={() => asnAction("in-transit", a.id)}
                                              >
                                                <Truck size={12} />
                                              </Button>
                                            )}{["PENDING", "IN_TRANSIT"].includes(a.status) && (
                                              <Button
                                                variant="secondary"
                                                onClick={() => asnAction("arrived", a.id)}
                                              >
                                                <Package size={12} />
                                              </Button>
                                            )}{["ARRIVING", "RECEIVING"].includes(a.status) && (
                                              <Button
                                                variant="secondary"
                                                onClick={() => asnAction("finalize", a.id)}
                                              >
                                                <CheckCircle size={12} />
                                              </Button>
                                            )}</>) },
                      ];
                              return <DataTable columns={columns} data={asns} rowKey={(a: any) => a.id} />;
                          })()}</>
          </Card>
        )}

        {tab === "discrepancies" && (
          <Card className="p-4">
            <>{(() => {
                              const columns = [
                        { key: "col_0", header: "ASN" , render: (d: any) => (<>{d.asnId}</>) },
                        { key: "col_1", header: "Type" , render: (d: any) => (<><Badge
                                              variant={STATUS_COLORS[d.discrepancyType] ?? "default"}
                                            >
                                              {d.discrepancyType}
                                            </Badge></>) },
                        { key: "col_2", header: "Product" , render: (d: any) => (<>{d.productId}</>) },
                        { key: "col_3", header: "Expected" , render: (d: any) => (<>{d.expectedQty}</>) },
                        { key: "col_4", header: "Actual" , render: (d: any) => (<>{d.actualQty}</>) },
                        { key: "col_5", header: "Status" , render: (d: any) => (<>{d.resolvedAt ? (
                                              <Badge variant="success">Resolved</Badge>
                                            ) : (
                                              <Badge variant="warning">Open</Badge>
                                            )}</>) },
                        { key: "col_6", header: "Action" , render: (d: any) => (<>{!d.resolvedAt && (
                                              <Button
                                                variant="secondary"
                                                onClick={() => resolveDiscrepancy(d.id)}
                                              >
                                                Resolve
                                              </Button>
                                            )}</>) },
                      ];
                              return <DataTable columns={columns} data={discrepancies} rowKey={(d: any) => d.id} />;
                          })()}</>
          </Card>
        )}

        {tab === "detail" && selectedAsn && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">ASN {selectedAsn.asnNumber}</div>
                <Badge variant={STATUS_COLORS[selectedAsn.status] ?? "default"}>
                  {selectedAsn.status}
                </Badge>
              </div>
              <div className="flex gap-2 mb-4">
                {selectedAsn.status === "PENDING" && (
                  <Button
                    variant="secondary"
                    onClick={() => asnAction("in-transit", selectedAsn.id)}
                  >
                    <Truck size={14} className="mr-1" />
                    Mark In Transit
                  </Button>
                )}
                {["PENDING", "IN_TRANSIT"].includes(selectedAsn.status) && (
                  <Button
                    variant="secondary"
                    onClick={() => asnAction("arrived", selectedAsn.id)}
                  >
                    <Package size={14} className="mr-1" />
                    Mark Arrived
                  </Button>
                )}
                {["ARRIVED", "RECEIVING"].includes(selectedAsn.status) && (
                  <Button
                    variant="primary"
                    onClick={() => asnAction("finalize", selectedAsn.id)}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Finalize Receiving
                  </Button>
                )}
                {!["RECEIVED", "CANCELLED"].includes(selectedAsn.status) && (
                  <Button
                    variant="danger"
                    onClick={() => asnAction("cancel", selectedAsn.id)}
                  >
                    Cancel ASN
                  </Button>
                )}
              </div>
              <>{(() => {
                                  const columns = [
                            { key: "col_0", header: "Product" , render: (item: any) => (<>{item.productId}</>) },
                            { key: "col_1", header: "Expected" , render: (item: any) => (<>{item.expectedQty}</>) },
                            { key: "col_2", header: "Received" , render: (item: any) => (<>{item.receivedQty}</>) },
                            { key: "col_3", header: "UOM" , render: (item: any) => (<>{item.uom}</>) },
                          ];
                                  return <DataTable columns={columns} data={selectedAsn.lineItems} rowKey={(item: any) => item.id} />;
                              })()}</>
            </Card>
            {["ARRIVED", "RECEIVING"].includes(selectedAsn.status) && (
              <Card className="p-4 space-y-3 max-w-md">
                <div className="font-semibold">Receive Items</div>
                <input
                  className="border rounded px-2 py-1 text-sm w-full"
                  placeholder="Line Item ID"
                  value={receiveItemId}
                  onChange={(e) => setReceiveItemId(e.target.value)}
                />
                <input
                  className="border rounded px-2 py-1 text-sm w-32"
                  placeholder="Qty"
                  type="number"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                />
                <Button variant="primary" onClick={receiveItem}>
                  <CheckCircle size={14} className="mr-1" />
                  Confirm Receipt
                </Button>
              </Card>
            )}
          </div>
        )}

        {tab === "new-asn" && (
          <Card className="p-4 space-y-3 max-w-lg">
            <div className="font-semibold flex items-center gap-2">
              <Plus size={16} />
              New Advance Shipping Notice
            </div>
            {(
              [
                ["Vendor ID *", "vendorId", "text"],
                ["Warehouse ID *", "warehouseId", "text"],
                ["Carrier Name", "carrierName", "text"],
                ["Tracking Number", "trackingNumber", "text"],
                ["Expected Arrival", "expectedArrival", "date"],
              ] as const
            ).map(([label, key, type]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">
                  {label}
                </label>
                <input
                  type={type}
                  className="border rounded px-2 py-1 w-full text-sm"
                  value={asnForm[key as keyof typeof asnForm]}
                  onChange={(e) =>
                    setAsnForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <Button variant="primary" onClick={createAsn}>
              <CheckCircle size={14} className="mr-1" />
              Create ASN
            </Button>
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}
