"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Calculator, FileCheck, FileText, Landmark, Percent, RefreshCw, ShieldCheck } from "lucide-react";
import { Button, Card, ListPageTemplate, type ListColumn } from "@kannan19302/ui";
import { RouteGuard, useApiClient } from "@kannan19302/framework";
import { SubTabBar, type SubTab } from "@kannan19302/ui/layout";

type Row = Record<string, any> & { id: string };
const base = "/advanced-finance/tax";
const today = new Date().toISOString().slice(0, 10);

export default function AdvancedTaxOperationsPage() {
  const client = useApiClient();
  const [tab, setTab] = useState("jurisdictions");
  const [jurisdictions, setJurisdictions] = useState<Row[]>([]);
  const [exemptions, setExemptions] = useState<Row[]>([]);
  const [reconciliations, setReconciliations] = useState<Row[]>([]);
  const [withholding, setWithholding] = useState<Row[]>([]);
  const [amendments, setAmendments] = useState<Row[]>([]);
  const [dashboard, setDashboard] = useState<Row | null>(null);
  const [detail, setDetail] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [j, e, r, w, a, d] = await Promise.all([
        client.get<Row[]>(`${base}/jurisdictions`),
        client.get<Row[]>(`${base}/exemption-certificates`),
        client.get<Row[]>(`${base}/reconciliations`),
        client.get<Row[]>(`${base}/withholding-certificates`),
        client.get<Row[]>(`${base}/amended-filings`),
        client.get<Row>(`${base}/dashboard`),
      ]);
      setJurisdictions(j); setExemptions(e); setReconciliations(r); setWithholding(w); setAmendments(a); setDashboard(d);
    } catch { setError("Failed to load advanced tax operations."); }
    finally { setLoading(false); }
  }, [client]);
  useEffect(() => { load(); }, [load]);

  const perform = async (action: () => Promise<unknown>, message: string) => {
    setError(""); setSuccess("");
    try { const value = await action(); if (value !== undefined) setDetail(value); setSuccess(message); await load(); }
    catch { setError(`Failed: ${message}`); }
  };

  const createJurisdiction = () => perform(() => client.post(`${base}/jurisdictions`, {
    name: form.name, code: form.code, country: form.country || "US", state: form.state || undefined,
    taxType: form.taxType || "SALES_TAX", rate: Number(form.rate), effectiveFrom: form.effectiveFrom || today,
  }), "Jurisdiction created.");
  const editJurisdiction = (row: Row) => perform(() => client.patch(`${base}/jurisdictions/${row.id}`, { name: form.name || row.name, description: form.description || row.description }), "Jurisdiction updated.");
  const changeRate = (row: Row) => perform(() => client.post(`${base}/jurisdictions/${row.id}/change-rate`, { rate: Number(form.rate), effectiveFrom: form.effectiveFrom || today }), "A new jurisdiction rate version was created.");
  const retireJurisdiction = (row: Row) => perform(() => client.delete(`${base}/jurisdictions/${row.id}`), "Jurisdiction retired.");
  const viewJurisdiction = (row: Row) => perform(() => client.get(`${base}/jurisdictions/${row.id}`), "Jurisdiction loaded.");

  const createExemption = () => perform(() => client.post(`${base}/exemption-certificates`, {
    entityType: form.entityType || "CUSTOMER", entityId: form.entityId, jurisdictionId: form.jurisdictionId,
    certificateNumber: form.certificateNumber, exemptionType: form.exemptionType || "FULL", exemptionPct: form.exemptionPct ? Number(form.exemptionPct) : undefined, validFrom: form.validFrom || today,
  }), "Exemption certificate created.");
  const viewExemption = (row: Row) => perform(() => client.get(`${base}/exemption-certificates/${row.id}`), "Certificate loaded.");
  const editExemption = (row: Row) => perform(() => client.patch(`${base}/exemption-certificates/${row.id}`, { validTo: form.validTo || undefined, notes: form.notes || row.notes }), "Certificate updated.");
  const revokeExemption = (row: Row) => perform(() => client.post(`${base}/exemption-certificates/${row.id}/revoke`, {}), "Certificate revoked.");

  const previewVat = () => perform(() => client.get(`${base}/vat-return/preview?periodStart=${encodeURIComponent(form.periodStart || today)}&periodEnd=${encodeURIComponent(form.periodEnd || today)}`), "VAT return preview generated.");
  const computeReconciliation = () => perform(() => client.post(`${base}/reconciliations/compute`, { periodStart: form.periodStart || today, periodEnd: form.periodEnd || today, taxType: form.taxType || "VAT" }), "Tax reconciliation computed.");
  const updateReconciliation = (row: Row) => perform(() => client.patch(`${base}/reconciliations/${row.id}`, { paymentsMade: Number(form.paymentsMade || 0), notes: form.notes || undefined }), "Tax reconciliation updated.");

  const createWithholding = () => perform(() => client.post(`${base}/withholding-certificates`, { vendorId: form.vendorId, year: Number(form.year || new Date().getFullYear()), grossAmount: Number(form.grossAmount), taxWithheld: Number(form.taxWithheld) }), "Withholding certificate created.");
  const viewWithholding = (row: Row) => perform(() => client.get(`${base}/withholding-certificates/${row.id}`), "Withholding certificate loaded.");
  const issueWithholding = (row: Row) => perform(() => client.post(`${base}/withholding-certificates/${row.id}/issue`, {}), "Withholding certificate issued.");
  const fileWithholding = (row: Row) => perform(() => client.post(`${base}/withholding-certificates/${row.id}/file`, {}), "Withholding certificate filed.");
  const bulkWithholding = () => perform(() => client.post(`${base}/withholding-certificates/bulk-generate`, { year: Number(form.year || new Date().getFullYear()) }), "Withholding certificates generated.");

  const createAmendment = () => perform(() => client.post(`${base}/amended-filings`, { originalFilingId: form.originalFilingId, amendedReason: form.amendedReason, refundAmount: form.refundAmount ? Number(form.refundAmount) : undefined, additionalTax: form.additionalTax ? Number(form.additionalTax) : undefined }), "Amended filing created.");
  const submitAmendment = (row: Row) => perform(() => client.post(`${base}/amended-filings/${row.id}/submit`, {}), "Amended filing submitted.");
  const decideAmendment = (row: Row, status: "ACCEPTED" | "REJECTED") => perform(() => client.patch(`${base}/amended-filings/${row.id}/status`, { status }), `Amended filing ${status.toLowerCase()}.`);

  const actions = (buttons: React.ReactNode) => <div className="flex flex-wrap gap-2">{buttons}</div>;
  const columns = (kind: string): ListColumn[] => [
    { key: "name", header: kind }, { key: "status", header: "Status" }, { key: "code", header: "Code" },
    { key: "id", header: "Actions", render: (_: any, row: Row) => kind === "Jurisdiction" ? actions(<><Button size="sm" variant="outline" onClick={() => viewJurisdiction(row)}>View</Button><Button size="sm" variant="outline" onClick={() => editJurisdiction(row)}>Edit</Button><Button size="sm" variant="outline" onClick={() => changeRate(row)}>Change rate</Button><Button size="sm" variant="outline" onClick={() => retireJurisdiction(row)}>Retire</Button></>) : kind === "Exemption" ? actions(<><Button size="sm" variant="outline" onClick={() => viewExemption(row)}>View</Button><Button size="sm" variant="outline" onClick={() => editExemption(row)}>Edit</Button><Button size="sm" variant="outline" onClick={() => revokeExemption(row)}>Revoke</Button></>) : kind === "Reconciliation" ? actions(<Button size="sm" variant="outline" onClick={() => updateReconciliation(row)}>Record payment</Button>) : kind === "Withholding" ? actions(<><Button size="sm" variant="outline" onClick={() => viewWithholding(row)}>View</Button><Button size="sm" variant="outline" onClick={() => issueWithholding(row)}>Issue</Button><Button size="sm" variant="outline" onClick={() => fileWithholding(row)}>File</Button></>) : actions(<><Button size="sm" variant="outline" onClick={() => submitAmendment(row)}>Submit</Button><Button size="sm" variant="outline" onClick={() => decideAmendment(row, "ACCEPTED")}>Accept</Button><Button size="sm" variant="outline" onClick={() => decideAmendment(row, "REJECTED")}>Reject</Button></>) },
  ];

  const field = (name: string, label: string, type = "text") => <label className="text-sm">{label}<input aria-label={label} className="ui-input block mt-1" type={type} value={form[name] || ""} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /></label>;
  const tabs: SubTab[] = [
    { id: "jurisdictions", label: "Jurisdictions", href: "#jurisdictions", icon: Landmark }, { id: "exemptions", label: "Exemptions", href: "#exemptions", icon: ShieldCheck },
    { id: "reconciliations", label: "VAT & Reconciliation", href: "#reconciliations", icon: Percent }, { id: "withholding", label: "Withholding", href: "#withholding", icon: FileCheck }, { id: "amendments", label: "Amended Filings", href: "#amendments", icon: Calculator },
  ];

  return <RouteGuard permission="finance.tax.read"><div className="ui-page-container space-y-4">
    <header className="ui-page-head"><div><h1 className="ui-page-title">Advanced Tax Operations</h1><p className="ui-page-subtitle">Versioned jurisdictions, exemptions, VAT reconciliation, withholding certificates, and amended filings.</p></div><Button variant="outline" onClick={load}><RefreshCw size={16} /> Refresh</Button></header>
    {error && <div role="alert" className="ui-alert ui-alert-error">{error}</div>}{success && <div role="status" className="ui-alert ui-alert-success">{success}</div>}
    {dashboard && (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
            <Landmark size={14} className="text-blue-600" />
            <span>Jurisdictions</span>
          </div>
          <p className="text-xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
            {Number(dashboard.jurisdictions ?? 0)}
          </p>
          <span className="text-2xs text-gray-400">Active tax boundaries</span>
        </Card>
        <Card className="p-3 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
            <ShieldCheck size={14} className="text-green-600" />
            <span>Certificates</span>
          </div>
          <p className="text-xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
            {Number(dashboard.certificates ?? 0)}
          </p>
          <span className="text-2xs text-gray-400">Active exemptions</span>
        </Card>
        <Card className="p-3 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
            <Percent size={14} className="text-purple-600" />
            <span>Reconciliations</span>
          </div>
          <p className="text-xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
            {Number(dashboard.reconciliations ?? 0)}
          </p>
          <span className="text-2xs text-gray-400">VAT & sales tax runs</span>
        </Card>
        <Card className="p-3 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
            <FileCheck size={14} className="text-amber-600" />
            <span>Withholding</span>
          </div>
          <p className="text-xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
            {Number(dashboard.withholdingCerts ?? 0)}
          </p>
          <span className="text-2xs text-gray-400">Vendor 1099/W-8 certs</span>
        </Card>
        <Card className="p-3 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase">
            <Calculator size={14} className="text-indigo-600" />
            <span>Amended Filings</span>
          </div>
          <p className="text-xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: "tabular-nums lining-nums" }}>
            {Number(dashboard.amendedFilings ?? 0)}
          </p>
          <span className="text-2xs text-gray-400">Revisions & appeals</span>
        </Card>
      </div>
    )}
    {detail != null && (
      <Card className="p-4 border border-blue-100 bg-blue-50/10">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            <h2 className="font-semibold text-sm text-gray-900">Operation Result & Details</h2>
            {typeof detail === "object" && detail !== null && "id" in (detail as Record<string, unknown>) && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                {String((detail as Record<string, unknown>).id)}
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setDetail(null)}>Close</Button>
        </div>
        {typeof detail === "object" && detail !== null ? (
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
    <SubTabBar tabs={tabs.map((item) => ({ ...item, href: `/finance/advanced/tax-operations?subtab=${item.id}` }))} />
    <nav className="flex flex-wrap gap-2" aria-label="Tax operation sections">{tabs.map((item) => <Button key={item.id} variant={tab === item.id ? "primary" : "outline"} onClick={() => { setTab(item.id); setForm({}); }}>{item.label}</Button>)}</nav>
    <Card className="p-4"><div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {tab === "jurisdictions" && <>{field("name", "Name")}{field("code", "Code")}{field("country", "Country")}{field("state", "State")}{field("taxType", "Tax type")}{field("rate", "Rate", "number")}{field("effectiveFrom", "Effective from", "date")}{field("description", "Description")}<Button onClick={createJurisdiction}>Create jurisdiction</Button></>}
      {tab === "exemptions" && <>{field("entityType", "Entity type")}{field("entityId", "Entity ID")}{field("jurisdictionId", "Jurisdiction ID")}{field("certificateNumber", "Certificate number")}{field("exemptionType", "Exemption type")}{field("exemptionPct", "Exemption percent", "number")}{field("validFrom", "Valid from", "date")}{field("validTo", "Valid to", "date")}{field("notes", "Notes")}<Button onClick={createExemption}>Create certificate</Button></>}
      {tab === "reconciliations" && <>{field("periodStart", "Period start", "date")}{field("periodEnd", "Period end", "date")}{field("taxType", "Tax type")}{field("paymentsMade", "Payments made", "number")}{field("notes", "Notes")}<Button onClick={previewVat}>Preview VAT</Button><Button onClick={computeReconciliation}>Compute reconciliation</Button></>}
      {tab === "withholding" && <>{field("vendorId", "Vendor ID")}{field("year", "Tax year", "number")}{field("grossAmount", "Gross amount", "number")}{field("taxWithheld", "Tax withheld", "number")}<Button onClick={createWithholding}>Create certificate</Button><Button variant="outline" onClick={bulkWithholding}>Bulk generate</Button></>}
      {tab === "amendments" && <>{field("originalFilingId", "Original filing ID")}{field("amendedReason", "Amendment reason")}{field("refundAmount", "Refund amount", "number")}{field("additionalTax", "Additional tax", "number")}<Button onClick={createAmendment}>Create amendment</Button></>}
    </div></Card>
    {tab === "jurisdictions" && <ListPageTemplate columns={columns("Jurisdiction")} data={jurisdictions} loading={loading} emptyTitle="No jurisdictions" emptyDescription="Create the first jurisdiction version." />}
    {tab === "exemptions" && <ListPageTemplate columns={columns("Exemption")} data={exemptions} loading={loading} emptyTitle="No exemption certificates" emptyDescription="Create a certificate to begin." />}
    {tab === "reconciliations" && <ListPageTemplate columns={columns("Reconciliation")} data={reconciliations} loading={loading} emptyTitle="No reconciliations" emptyDescription="Compute a period reconciliation." />}
    {tab === "withholding" && <ListPageTemplate columns={columns("Withholding")} data={withholding} loading={loading} emptyTitle="No withholding certificates" emptyDescription="Create or bulk-generate certificates." />}
    {tab === "amendments" && <ListPageTemplate columns={columns("Amendment")} data={amendments} loading={loading} emptyTitle="No amended filings" emptyDescription="Create an amendment from an original filing." />}
  </div></RouteGuard>;
}
