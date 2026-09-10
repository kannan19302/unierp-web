"use client";

import React, { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, FileText, RefreshCw } from "lucide-react";
import { Button, Card, ListPageTemplate, type ListColumn } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";

type Row = Record<string, any> & { id: string };
const base = "/advanced-finance/assets";
const today = new Date().toISOString().slice(0, 10);

export default function AssetOperationsPage() {
  const client = useApiClient();
  const [tab, setTab] = useState("insurance");
  const [insurance, setInsurance] = useState<Row[]>([]);
  const [expiring, setExpiring] = useState<Row[]>([]);
  const [impairments, setImpairments] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Row[]>([]);
  const [disposals, setDisposals] = useState<Row[]>([]);
  const [detail, setDetail] = useState<unknown>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [i, x, m, p, d] = await Promise.all([
        client.get<Row[]>(`${base}/insurances`), client.get<Row[]>(`${base}/insurances/expiring?daysAhead=30`),
        client.get<Row[]>(`${base}/impairments`), client.get<Row[]>(`${base}/capital-projects`), client.get<Row[]>(`${base}/disposals/list`),
      ]);
      setInsurance(i); setExpiring(x); setImpairments(m); setProjects(p); setDisposals(d);
    } catch { setError("Failed to load asset lifecycle operations."); }
    finally { setLoading(false); }
  }, [client]);
  useEffect(() => { load(); }, [load]);

  const perform = async (action: () => Promise<unknown>, message: string) => {
    setError(""); setSuccess("");
    try { const result = await action(); if (result !== undefined) setDetail(result); setSuccess(message); await load(); }
    catch { setError(`Failed: ${message}`); }
  };
  const f = (name: string, label: string, type = "text") => <label className="text-sm">{label}<input aria-label={label} className="ui-input block mt-1" type={type} value={form[name] || ""} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /></label>;
  const buttons = (children: React.ReactNode) => <div className="flex flex-wrap gap-2">{children}</div>;

  const createInsurance = () => perform(() => client.post(`${base}/insurances`, { assetId: form.assetId, policyNumber: form.policyNumber, insurer: form.insurer, coverageType: form.coverageType || "PROPERTY", coverageAmount: Number(form.coverageAmount), premium: Number(form.premium), startDate: form.startDate || today, renewalDate: form.renewalDate || today }), "Insurance policy created.");
  const updateInsurance = (row: Row) => perform(() => client.patch(`${base}/insurances/${row.id}`, { renewalDate: form.renewalDate || row.renewalDate, premium: Number(form.premium || row.premium), notes: form.notes || row.notes }), "Insurance policy updated.");
  const createImpairment = () => perform(() => client.post(`${base}/impairments`, { assetId: form.assetId, testDate: form.testDate || today, carryingAmount: Number(form.carryingAmount), recoverableAmount: Number(form.recoverableAmount), reason: form.reason || undefined }), "Impairment test created.");
  const finalizeImpairment = (row: Row) => perform(() => client.post(`${base}/impairments/${row.id}/finalize`, {}), "Impairment test finalized.");
  const postImpairment = (row: Row) => perform(() => client.post(`${base}/impairments/${row.id}/post`, {}), "Impairment journal posted.");

  const createProject = () => perform(() => client.post(`${base}/capital-projects`, { code: form.code, name: form.name, description: form.description || undefined, budgetAmount: Number(form.budgetAmount), startDate: form.startDate || today, expectedCompletion: form.expectedCompletion || undefined, costGlAccountId: form.costGlAccountId || undefined }), "Capital project created.");
  const viewProject = (row: Row) => perform(() => client.get(`${base}/capital-projects/${row.id}`), "Capital project loaded.");
  const updateProject = (row: Row) => perform(() => client.patch(`${base}/capital-projects/${row.id}`, { status: form.status || row.status, completedDate: form.completedDate || undefined, notes: form.notes || row.notes }), "Capital project updated.");
  const addProjectCost = (row: Row) => perform(() => client.post(`${base}/capital-projects/${row.id}/costs`, { costDate: form.costDate || today, costType: form.costType || "DIRECT", description: form.description || undefined, amount: Number(form.amount), vendorId: form.vendorId || undefined, invoiceId: form.invoiceId || undefined, glAccountId: form.glAccountId || undefined }), "Project cost added.");
  const convertProject = (row: Row) => perform(() => client.post(`${base}/capital-projects/${row.id}/convert-to-asset`, { assetName: form.assetName || row.name, categoryId: form.categoryId, assetDate: form.assetDate || today }), "Capital project converted to an asset.");

  const createRevaluation = () => perform(() => client.post(`${base}/revaluations`, { assetId: form.assetId, revaluationDate: form.revaluationDate || today, revaluedValue: Number(form.revaluedValue), notes: form.notes || undefined }), "Asset revaluation created.");
  const listRevaluations = () => perform(() => client.get(`${base}/${form.assetId}/revaluations`), "Revaluation history loaded.");
  const postRevaluation = () => perform(() => client.post(`${base}/revaluations/${form.recordId}/post`, {}), "Revaluation journal posted.");
  const createDisposal = () => perform(() => client.post(`${base}/disposals`, { assetId: form.assetId, disposalDate: form.disposalDate || today, disposalType: form.disposalType || "SALE", salePrice: form.salePrice ? Number(form.salePrice) : undefined, notes: form.notes || undefined }), "Asset disposal created.");
  const postDisposal = (row: Row) => perform(() => client.post(`${base}/disposals/${row.id}/post`, {}), "Disposal journal posted.");
  const bulkDispose = () => perform(() => client.post(`${base}/disposals/bulk`, { assetIds: (form.assetIds || "").split(",").map((id) => id.trim()).filter(Boolean), disposalDate: form.disposalDate || today, disposalType: form.disposalType || "RETIREMENT" }), "Bulk disposal created.");
  const bulkUpload = () => perform(() => client.post(`${base}/bulk-upload`, { rows: JSON.parse(form.rows || "[]") }), "Asset rows uploaded.");

  const depreciation = () => perform(() => client.get(`${base}/${form.assetId}/depreciation-schedule`), "Depreciation schedule loaded.");
  const depreciationAfterRevaluation = () => perform(() => client.get(`${base}/${form.assetId}/depreciation-post-reval`), "Post-revaluation depreciation loaded.");
  const auditReport = () => perform(() => client.get(`${base}/${form.assetId}/audit-report`), "Asset audit report loaded.");
  const rollForward = () => perform(() => client.get(`${base}/nbv-roll-forward?period=${encodeURIComponent(form.period || "")}`), "Net book value roll-forward loaded.");

  const common: ListColumn[] = [{ key: "name", header: "Record" }, { key: "status", header: "Status" }, { key: "createdAt", header: "Created" }];
  const insuranceColumns: ListColumn[] = [...common, { key: "id", header: "Actions", render: (_: any, row: Row) => buttons(<Button size="sm" variant="outline" onClick={() => updateInsurance(row)}>Update</Button>) }];
  const impairmentColumns: ListColumn[] = [...common, { key: "id", header: "Actions", render: (_: any, row: Row) => buttons(<><Button size="sm" variant="outline" onClick={() => finalizeImpairment(row)}>Finalize</Button><Button size="sm" variant="outline" onClick={() => postImpairment(row)}>Post GL</Button></>) }];
  const projectColumns: ListColumn[] = [...common, { key: "id", header: "Actions", render: (_: any, row: Row) => buttons(<><Button size="sm" variant="outline" onClick={() => viewProject(row)}>View</Button><Button size="sm" variant="outline" onClick={() => updateProject(row)}>Update</Button><Button size="sm" variant="outline" onClick={() => addProjectCost(row)}>Add cost</Button><Button size="sm" variant="outline" onClick={() => convertProject(row)}>Convert</Button></>) }];
  const disposalColumns: ListColumn[] = [...common, { key: "id", header: "Actions", render: (_: any, row: Row) => <Button size="sm" variant="outline" onClick={() => postDisposal(row)}>Post GL</Button> }];

  return <RouteGuard permission="finance.assets.read"><div className="ui-page-container space-y-4">
    <header className="ui-page-head"><div><h1 className="ui-page-title">Asset Accounting Operations</h1><p className="ui-page-subtitle">Insurance, impairment, capital projects, revaluation, disposal, depreciation, and audit evidence.</p></div><Button variant="outline" onClick={load}><RefreshCw size={16} /> Refresh</Button></header>
    {error && <div role="alert" className="ui-alert ui-alert-error">{error}</div>}{success && <div role="status" className="ui-alert ui-alert-success">{success}</div>}
    {detail != null && (
      <Card className="p-4 border border-blue-100 bg-blue-50/10">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="font-semibold text-sm text-gray-900">Operation Result & Details</h2>
            {typeof detail === "object" && detail !== null && !Array.isArray(detail) && "id" in (detail as Record<string, unknown>) && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                {String((detail as Record<string, unknown>).id)}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setDetail(null)}>Close</Button>
        </div>
        {Array.isArray(detail) ? (
          detail.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-md border border-gray-100">
              <table className="w-full text-xs text-left text-gray-700">
                <thead className="bg-gray-50 uppercase text-2xs font-semibold text-gray-500 border-b border-gray-100">
                  <tr>
                    {Object.keys(detail[0] as Record<string, unknown>).slice(0, 7).map((h) => (
                      <th key={h} className="px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detail.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      {Object.keys(detail[0] as Record<string, unknown>).slice(0, 7).map((h) => (
                        <td key={h} className="px-3 py-2 font-medium" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                          {row[h] === null || row[h] === undefined
                            ? "—"
                            : typeof row[h] === "object"
                              ? JSON.stringify(row[h])
                              : String(row[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500 bg-white p-3 rounded border border-gray-100">No records returned.</p>
          )
        ) : typeof detail === "object" && detail !== null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3 rounded-md border border-gray-100">
            {Object.entries(detail as Record<string, unknown>).map(([key, val]) => (
              <div key={key} className="p-2 rounded bg-gray-50/80 border border-gray-100/80">
                <span className="text-2xs uppercase tracking-wider text-gray-500 font-semibold block">{key}</span>
                <span className="text-xs text-gray-800 font-medium break-all mt-0.5 block" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
                  {val === null || val === undefined
                    ? "—"
                    : typeof val === "object"
                      ? JSON.stringify(val)
                      : typeof val === "boolean"
                        ? val ? "Yes" : "No"
                        : String(val)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-100">{String(detail)}</p>
        )}
      </Card>
    )}
    <nav aria-label="Asset operation sections" className="flex flex-wrap gap-2">{["insurance", "impairments", "projects", "revaluation", "disposals", "reports", "upload"].map((name) => <Button key={name} variant={tab === name ? "primary" : "outline"} onClick={() => { setTab(name); setForm({}); }}>{name}</Button>)}</nav>
    <Card className="p-4"><div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {tab === "insurance" && <>{f("assetId", "Asset ID")}{f("policyNumber", "Policy number")}{f("insurer", "Insurer")}{f("coverageType", "Coverage type")}{f("coverageAmount", "Coverage amount", "number")}{f("premium", "Premium", "number")}{f("startDate", "Start date", "date")}{f("renewalDate", "Renewal date", "date")}{f("notes", "Notes")}<Button onClick={createInsurance}>Create policy</Button></>}
      {tab === "impairments" && <>{f("assetId", "Asset ID")}{f("testDate", "Test date", "date")}{f("carryingAmount", "Carrying amount", "number")}{f("recoverableAmount", "Recoverable amount", "number")}{f("reason", "Reason")}<Button onClick={createImpairment}>Create impairment test</Button></>}
      {tab === "projects" && <>{f("code", "Project code")}{f("name", "Project name")}{f("budgetAmount", "Budget amount", "number")}{f("startDate", "Start date", "date")}{f("expectedCompletion", "Expected completion", "date")}{f("amount", "Cost amount", "number")}{f("costType", "Cost type")}{f("assetName", "Asset name")}{f("categoryId", "Asset category ID")}{f("assetDate", "Asset date", "date")}{f("status", "Project status")}{f("description", "Description")}<Button onClick={createProject}>Create project</Button></>}
      {tab === "revaluation" && <>{f("assetId", "Asset ID")}{f("revaluationDate", "Revaluation date", "date")}{f("revaluedValue", "Revalued value", "number")}{f("recordId", "Revaluation ID")}{f("notes", "Notes")}<Button onClick={createRevaluation}>Create revaluation</Button><Button variant="outline" onClick={listRevaluations}>View history</Button><Button variant="outline" onClick={postRevaluation}>Post GL</Button></>}
      {tab === "disposals" && <>{f("assetId", "Asset ID")}{f("assetIds", "Asset IDs, comma separated")}{f("disposalDate", "Disposal date", "date")}{f("disposalType", "Disposal type")}{f("salePrice", "Sale price", "number")}{f("notes", "Notes")}<Button onClick={createDisposal}>Create disposal</Button><Button variant="outline" onClick={bulkDispose}>Bulk dispose</Button></>}
      {tab === "reports" && <>{f("assetId", "Asset ID")}{f("period", "Reporting period")}<Button onClick={depreciation}>Depreciation schedule</Button><Button variant="outline" onClick={depreciationAfterRevaluation}>Post-revaluation depreciation</Button><Button variant="outline" onClick={auditReport}>Audit report</Button><Button variant="outline" onClick={rollForward}>NBV roll-forward</Button></>}
      {tab === "upload" && <>{f("rows", "Asset rows JSON")}<Button onClick={bulkUpload}><FileSpreadsheet size={16} /> Upload rows</Button></>}
    </div></Card>
    {tab === "insurance" && <><Card className="p-3"><h2 className="font-semibold">Expiring in 30 days: {expiring.length}</h2></Card><ListPageTemplate columns={insuranceColumns} data={insurance} loading={loading} emptyTitle="No insurance policies" emptyDescription="Create an asset insurance policy." /></>}
    {tab === "impairments" && <ListPageTemplate columns={impairmentColumns} data={impairments} loading={loading} emptyTitle="No impairment tests" emptyDescription="Create an impairment test." />}
    {tab === "projects" && <ListPageTemplate columns={projectColumns} data={projects} loading={loading} emptyTitle="No capital projects" emptyDescription="Create a capital project." />}
    {tab === "disposals" && <ListPageTemplate columns={disposalColumns} data={disposals} loading={loading} emptyTitle="No asset disposals" emptyDescription="Create an asset disposal." />}
  </div></RouteGuard>;
}
