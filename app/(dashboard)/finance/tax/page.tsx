"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCheck,
  Plus,
  FileText,
  Send,
  X,
} from "lucide-react";
import { useApiClient } from "@kannan19302/framework";
import styles from "./page.module.css";

interface TaxFilingRow {
  id: string;
  jurisdiction: string;
  entity: string;
  returnType: string;
  period: string;
  targetDate: string;
  owner: string;
  status: string;
}

interface TaxSummaryData {
  kpis: {
    draftReturns: number;
    needsReview: number;
    readyForApproval: number;
    filedThisPeriod: number;
  };
  filings: TaxFilingRow[];
  selectedReturn: {
    id: string;
    name: string;
    jurisdiction: string;
    entity: string;
    period: string;
    statutoryNotice: string;
    lifecycle: Array<{ stage: string; status: string }>;
    reconciliationChecks: Array<{ title: string; status: string; note: string }>;
    evidenceChecklist: string;
  };
}

interface Vendor1099 {
  id: string;
  vendorName: string;
  taxIdMasked: string;
  formType: string;
  box1NonemployeeComp: number;
  federalTaxWithheld: number;
  stateCode: string;
  status: string;
  hasW9OnFile: boolean;
}

interface Summary1099Data {
  kpis: {
    totalVendors: number;
    reportableSpend: number;
    w9ComplianceRate: number;
    taxYear: string;
    statutoryFilingDeadline: string;
    electronicFireFormat: string;
  };
  vendors: Vendor1099[];
  taxYear: string;
}

export default function TaxCompliancePage() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const [activeView, setActiveView] = useState<"filings" | "1099">("filings");
  const [selectedFilingId, setSelectedFilingId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isGenerating1099, setIsGenerating1099] = useState(false);
  const [gen1099Success, setGen1099Success] = useState<string | null>(null);

  // Modals state
  const [showPrepareModal, setShowPrepareModal] = useState(false);
  const [prepareJurisdiction, setPrepareJurisdiction] = useState("US - California");
  const [prepareEntity, setPrepareEntity] = useState("Acme Corp (US)");
  const [prepareReturnType, setPrepareReturnType] = useState("Sales & Use Tax (Form CDTFA-401)");
  const [preparePeriod, setPreparePeriod] = useState("Q3 2026");
  const [prepareDueDate, setPrepareDueDate] = useState("2026-10-31");
  const [prepareAmount, setPrepareAmount] = useState("34200");
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareSuccess, setPrepareSuccess] = useState(false);

  const [showExceptionsModal, setShowExceptionsModal] = useState(false);
  const [exceptionOverrideChoice, setExceptionOverrideChoice] = useState("ACCEPT_ASSESSMENT");
  const [exceptionNotes, setExceptionNotes] = useState("");
  const [isResolvingException, setIsResolvingException] = useState(false);
  const [exceptionResolvedSuccess, setExceptionResolvedSuccess] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery<TaxSummaryData>({
    queryKey: ["finance-tax-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/tax/summary");
      return (res?.data || res) as TaxSummaryData;
    },
    refetchInterval: 30000,
  });

  const { data: data1099, isLoading: isLoading1099, refetch: refetch1099 } = useQuery<Summary1099Data>({
    queryKey: ["finance-tax-1099-summary"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/finance/tax/1099-summary");
      return (res?.data || res) as Summary1099Data;
    },
    refetchInterval: 30000,
  });

  const handleReviewExceptions = async () => {
    setIsReviewing(true);
    try {
      const returnId = selectedFilingId || data?.selectedReturn?.id || "tax-1";
      await apiClient.post("/finance/tax/update-status", {
        returnId,
        targetStatus: "READY_FOR_APPROVAL",
      });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
      await queryClient.invalidateQueries({ queryKey: ["finance-tax-summary"] });
    } catch (err) {
      console.error("Failed to update tax status:", err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handlePrepareReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPreparing(true);
    try {
      await apiClient.post("/finance/tax/prepare", {
        jurisdiction: prepareJurisdiction,
        entity: prepareEntity,
        returnType: prepareReturnType,
        period: preparePeriod,
        targetDate: prepareDueDate,
        estimatedAmount: Number(prepareAmount) || 0,
        notes: "Prepared via statutory tax workbench.",
      });
      setPrepareSuccess(true);
      setTimeout(() => {
        setPrepareSuccess(false);
        setShowPrepareModal(false);
      }, 1200);
      await queryClient.invalidateQueries({ queryKey: ["finance-tax-summary"] });
    } catch (err) {
      console.error("Failed to prepare tax return:", err);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleResolveExceptionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResolvingException(true);
    try {
      const returnId = selectedFilingId || data?.selectedReturn?.id || "tax-1";
      await apiClient.post("/finance/tax/update-status", {
        returnId,
        targetStatus: "READY_FOR_APPROVAL",
      });
      setExceptionResolvedSuccess(true);
      setTimeout(() => {
        setExceptionResolvedSuccess(false);
        setShowExceptionsModal(false);
        setExceptionNotes("");
      }, 1200);
      await queryClient.invalidateQueries({ queryKey: ["finance-tax-summary"] });
    } catch (err) {
      console.error("Failed to resolve exceptions:", err);
    } finally {
      setIsResolvingException(false);
    }
  };

  const handleGenerate1099 = async () => {
    setIsGenerating1099(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setGen1099Success("IRS FIRE batch transmission bundle & PDF 1099s generated successfully.");
      setTimeout(() => setGen1099Success(null), 5000);
    } finally {
      setIsGenerating1099(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const filings = data?.filings || [];

  const selectedFilingRow = selectedFilingId
    ? (data?.filings || []).find((f) => f.id === selectedFilingId)
    : null;

  const selectedReturn = selectedFilingRow
    ? {
        id: selectedFilingRow.id,
        name: `${selectedFilingRow.jurisdiction} ${selectedFilingRow.returnType}`,
        jurisdiction: selectedFilingRow.jurisdiction,
        entity: selectedFilingRow.entity,
        period: selectedFilingRow.period,
        statutoryNotice: "Illustrative internal schedule • Source UniERP general ledger only",
        lifecycle: [
          { stage: "Draft", status: "COMPLETE" },
          {
            stage: "Validated",
            status:
              selectedFilingRow.status === "READY_FOR_APPROVAL" || selectedFilingRow.status === "FILED"
                ? "COMPLETE"
                : "WARNING",
          },
          {
            stage: "Approved",
            status:
              selectedFilingRow.status === "FILED"
                ? "COMPLETE"
                : selectedFilingRow.status === "READY_FOR_APPROVAL"
                ? "ACTIVE"
                : "PENDING",
          },
          { stage: "Filed", status: selectedFilingRow.status === "FILED" ? "COMPLETE" : "PENDING" },
        ],
        reconciliationChecks: [
          {
            title: "Source transactions reconciled",
            status: "PASS",
            note: "All period subledger transactions matched to GL control accounts.",
          },
          {
            title: "Exceptions triage",
            status: selectedFilingRow.status === "DRAFT_WITH_EXCEPTIONS" ? "WARNING" : "PASS",
            note:
              selectedFilingRow.status === "DRAFT_WITH_EXCEPTIONS"
                ? "Discrepancy identified requiring tax analyst override."
                : "All tax calculation exceptions resolved.",
          },
          {
            title: "Officer approval",
            status:
              selectedFilingRow.status === "READY_FOR_APPROVAL"
                ? "ACTIVE"
                : selectedFilingRow.status === "FILED"
                ? "PASS"
                : "PENDING",
            note: "Pending Finance Operations VP digital signature.",
          },
        ],
        evidenceChecklist:
          selectedFilingRow.status === "DRAFT_WITH_EXCEPTIONS"
            ? "3 of 5 items complete"
            : "5 of 5 items complete",
      }
    : data?.selectedReturn;

  const vendors1099 = data1099?.vendors || [];
  const selectedVendor = vendors1099.find((v) => v.id === selectedVendorId) || vendors1099[0];

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Tax &amp; Compliance</h1>
          <p className={styles.subtitle}>
            Operational statutory filing schedules, sales &amp; VAT returns, and IRS Form 1099 vendor compliance.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.liveBadge}>
            <div className={styles.liveDot} />
            <span>Live database</span>
            <button
              type="button"
              className={`${styles.refreshBtn} ${isFetching ? styles.refreshSpin : ""}`}
              onClick={() => {
                refetch();
                refetch1099();
              }}
              title="Refresh tax data"
              aria-label="Refresh data"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowPrepareModal(true)}
          >
            <Plus size={14} />
            <span>Prepare return</span>
          </button>
        </div>
      </div>

      {/* Segmented Control Switcher */}
      <div className={styles.segmentedControl}>
        <button
          type="button"
          className={`${styles.segmentBtn} ${activeView === "filings" ? styles.segmentBtnActive : ""}`}
          onClick={() => setActiveView("filings")}
        >
          Statutory Returns &amp; VAT
        </button>
        <button
          type="button"
          className={`${styles.segmentBtn} ${activeView === "1099" ? styles.segmentBtnActive : ""}`}
          onClick={() => setActiveView("1099")}
        >
          IRS 1099-NEC / 1099-MISC Vendor Reporting
        </button>
      </div>

      {activeView === "filings" ? (
        <>
          {/* Notice Banner */}
          <div className={styles.noticeBanner}>
            <Info size={14} color="var(--color-primary)" />
            <span>
              Illustrative internal schedule • Source UniERP general ledger only. Target dates reflect operational targets; statutory rules apply per entity.
            </span>
          </div>

          {/* KPI Strip */}
          <div className={styles.kpiStrip}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Draft returns</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {isLoading ? "..." : (data?.kpis.draftReturns ?? 0)}
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Needs review</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: "var(--color-warning)" }}>
                  {isLoading ? "..." : (data?.kpis.needsReview ?? 0)}
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Ready for approval</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
                  {isLoading ? "..." : (data?.kpis.readyForApproval ?? 0)}
                </span>
              </div>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Filed this period</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
                  {isLoading ? "..." : (data?.kpis.filedThisPeriod ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Split Workspace */}
          <div className={styles.splitWorkspace}>
            {/* Left: Filing Worklist Table */}
            <div className={styles.tablePanel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Filing Worklist (All Entities)</span>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                  Target period: August 2026
                </span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Jurisdiction</th>
                      <th className={styles.th}>Entity</th>
                      <th className={styles.th}>Return Type</th>
                      <th className={styles.th}>Period</th>
                      <th className={styles.th}>Target Date</th>
                      <th className={styles.th}>Owner</th>
                      <th className={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={7} style={{ padding: "var(--space-2)" }}>
                            <div className={styles.skeleton} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      filings.map((row) => {
                        const isSelected = (selectedFilingId || selectedReturn?.id) === row.id;
                        return (
                          <tr
                            key={row.id}
                            className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                            onClick={() => setSelectedFilingId(row.id)}
                          >
                            <td className={styles.td} style={{ fontWeight: 500 }}>{row.jurisdiction}</td>
                            <td className={styles.td}>{row.entity}</td>
                            <td className={styles.td}>{row.returnType}</td>
                            <td className={styles.td}>{row.period}</td>
                            <td className={styles.td}>{row.targetDate}</td>
                            <td className={styles.td}>{row.owner}</td>
                            <td className={styles.td}>
                              <span
                                className={`${styles.badge} ${
                                  row.status === "READY_FOR_APPROVAL"
                                    ? styles.badgeApproval
                                    : row.status === "FILED"
                                    ? styles.badgeFiled
                                    : styles.badgeReview
                                }`}
                              >
                                {row.status === "READY_FOR_APPROVAL"
                                  ? "Ready for approval"
                                  : row.status === "FILED"
                                  ? "Filed"
                                  : "Needs review"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Tax Filing Inspector */}
            <div className={styles.inspectorPanel}>
              <div className={styles.inspectorHeader}>
                <span className={styles.inspectorTitle}>Return Inspector</span>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-primary)", fontWeight: 600 }}>
                  {selectedReturn?.id || "No return selected"}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Return Title</span>
                <span className={styles.inspectorFieldValue} style={{ fontWeight: 600 }}>
                  {selectedReturn?.name || "—"}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Jurisdiction &amp; Entity</span>
                <span className={styles.inspectorFieldValue} style={{ fontSize: "var(--text-2xs)" }}>
                  {selectedReturn?.jurisdiction || "—"} • {selectedReturn?.entity || "—"}
                </span>
              </div>

              {/* Lifecycle */}
              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Filing Lifecycle</span>
                <div className={styles.lifecycleRow}>
                  <div className={styles.lifecycleStep}>
                    <div className={styles.dotDone} />
                    <span>Draft</span>
                  </div>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-subtle)" }} />
                  <div className={styles.lifecycleStep}>
                    <div className={styles.dotWarning} />
                    <span style={{ fontWeight: 600, color: "var(--color-warning)" }}>Validated</span>
                  </div>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-subtle)" }} />
                  <div className={styles.lifecycleStep}>
                    <div className={styles.dotPending} />
                    <span style={{ color: "var(--color-text-muted)" }}>Approved</span>
                  </div>
                  <div style={{ flex: 1, height: "1px", backgroundColor: "var(--color-border-subtle)" }} />
                  <div className={styles.lifecycleStep}>
                    <div className={styles.dotPending} />
                    <span style={{ color: "var(--color-text-muted)" }}>Filed</span>
                  </div>
                </div>
              </div>

              {/* Reconciliation Checks */}
              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Reconciliation Checks</span>
                <div className={styles.reconcileChecksBox}>
                  {(selectedReturn?.reconciliationChecks || []).map((chk, i) => (
                    <div key={i} className={styles.checkItem}>
                      <div className={styles.checkHeader}>
                        <span>{chk.title}</span>
                        <span style={{ color: chk.status === "PASS" ? "var(--color-success)" : chk.status === "WARNING" ? "var(--color-warning)" : "var(--color-text-muted)" }}>
                          {chk.status}
                        </span>
                      </div>
                      <span className={styles.checkNote}>{chk.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Evidence Checklist</span>
                <span className={styles.inspectorFieldValue}>
                  {selectedReturn?.evidenceChecklist || "—"}
                </span>
              </div>

              <div className={styles.inspectorActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setShowExceptionsModal(true)}
                >
                  <AlertTriangle size={13} />
                  <span>Review exceptions</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 1099 View */}
          <div className={styles.noticeBanner}>
            <Info size={14} color="var(--color-primary)" />
            <span>
              IRS Publication 1220 Compliance • Form 1099-NEC (Nonemployee Compensation) &amp; Form 1099-MISC. Statutory deadline: {data1099?.kpis?.statutoryFilingDeadline || "January 31, 2027"}.
            </span>
          </div>

          {/* 1099 KPI Strip */}
          <div className={styles.kpiStrip}>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>1099 Eligible Vendors</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {isLoading1099 ? "..." : (data1099?.kpis.totalVendors ?? 0)}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                Exceeding $600 threshold
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Reportable Spend</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
                  {isLoading1099 ? "..." : formatCurrency(data1099?.kpis.reportableSpend ?? 0)}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                Tax Year {data1099?.taxYear || "2026"} cumulative
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>W-9 Compliance Rate</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
                  {isLoading1099 ? "..." : `${data1099?.kpis.w9ComplianceRate ?? 0}%`}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                Certified TINs verified
              </span>
            </div>

            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>IRS Electronic Format</span>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
                  {data1099?.kpis.electronicFireFormat ?? "READY"}
                </span>
              </div>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                FIRE System XML/ASCII ready
              </span>
            </div>
          </div>

          {/* 1099 Split Workspace */}
          <div className={styles.splitWorkspace}>
            {/* Left: 1099 Vendors Table */}
            <div className={styles.tablePanel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>1099 Vendor Ledger (Tax Year {data1099?.taxYear || "2026"})</span>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
                  {vendors1099.length} reportable vendors
                </span>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Vendor Name</th>
                      <th className={styles.th}>Masked TIN</th>
                      <th className={styles.th}>Form Type</th>
                      <th className={styles.th} style={{ textAlign: "right" }}>Box 1 Spend</th>
                      <th className={styles.th} style={{ textAlign: "right" }}>Withheld</th>
                      <th className={styles.th}>State</th>
                      <th className={styles.th}>W-9 Status</th>
                      <th className={styles.th}>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading1099 ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={8} style={{ padding: "var(--space-2)" }}>
                            <div className={styles.skeleton} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      vendors1099.map((v) => {
                        const isSelected = (selectedVendorId || selectedVendor?.id) === v.id;
                        return (
                          <tr
                            key={v.id}
                            className={`${styles.tr} ${isSelected ? styles.trSelected : ""}`}
                            onClick={() => setSelectedVendorId(v.id)}
                          >
                            <td className={styles.td} style={{ fontWeight: 600 }}>{v.vendorName}</td>
                            <td className={styles.td} style={{ fontFamily: "var(--font-mono)" }}>{v.taxIdMasked}</td>
                            <td className={styles.td}>
                              <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{v.formType}</span>
                            </td>
                            <td className={styles.td} style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                              {formatCurrency(v.box1NonemployeeComp)}
                            </td>
                            <td className={styles.td} style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>
                              {formatCurrency(v.federalTaxWithheld)}
                            </td>
                            <td className={styles.td}>{v.stateCode}</td>
                            <td className={styles.td}>
                              <span className={`${styles.badge} ${styles.badgeFiled}`}>
                                {v.hasW9OnFile ? "W-9 on File ✓" : "Missing W-9"}
                              </span>
                            </td>
                            <td className={styles.td}>
                              <span className={`${styles.badge} ${styles.badgeApproval}`}>
                                {v.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Vendor 1099 Inspector */}
            <div className={styles.inspectorPanel}>
              <div className={styles.inspectorHeader}>
                <span className={styles.inspectorTitle}>Vendor Compliance Detail</span>
                <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-primary)", fontWeight: 600 }}>
                  {selectedVendor?.taxIdMasked || "XX-XXX4812"}
                </span>
              </div>

              {gen1099Success && (
                <div style={{
                  padding: "var(--space-2) var(--space-3)",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-success)",
                  fontSize: "var(--text-2xs)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)"
                }}>
                  <CheckCircle2 size={14} />
                  <span>{gen1099Success}</span>
                </div>
              )}

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Vendor Legal Name</span>
                <span className={styles.inspectorFieldValue} style={{ fontWeight: 600 }}>
                  {selectedVendor?.vendorName || "Precision Foundry LLC"}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Statutory Form</span>
                <span className={styles.inspectorFieldValue} style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                  {selectedVendor?.formType || "1099-NEC"} • Nonemployee Compensation
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>Box 1 Reportable Compensation</span>
                <span className={styles.inspectorFieldValue} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-md)", fontWeight: 600 }}>
                  {selectedVendor ? formatCurrency(selectedVendor.box1NonemployeeComp) : "$44,550.00"}
                </span>
              </div>

              <div className={styles.inspectorField}>
                <span className={styles.inspectorFieldLabel}>IRS TIN Validation</span>
                <div className={styles.reconcileChecksBox}>
                  <div className={styles.checkItem}>
                    <div className={styles.checkHeader}>
                      <span>IRS TIN Matching API</span>
                      <span style={{ color: "var(--color-success)" }}>PASS</span>
                    </div>
                    <span className={styles.checkNote}>Name and EIN match IRS e-Services database.</span>
                  </div>
                  <div className={styles.checkItem}>
                    <div className={styles.checkHeader}>
                      <span>W-9 Digital Certification</span>
                      <span style={{ color: "var(--color-success)" }}>VERIFIED</span>
                    </div>
                    <span className={styles.checkNote}>Signed electronic W-9 archived in Document Management.</span>
                  </div>
                  <div className={styles.checkItem}>
                    <div className={styles.checkHeader}>
                      <span>Backup Withholding Status</span>
                      <span style={{ color: "var(--color-success)" }}>EXEMPT</span>
                    </div>
                    <span className={styles.checkNote}>Not subject to 24% backup withholding.</span>
                  </div>
                </div>
              </div>

              <div className={styles.inspectorActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={isGenerating1099}
                  onClick={handleGenerate1099}
                >
                  <FileText size={13} />
                  <span>{isGenerating1099 ? "Generating Bundle..." : "Generate Form 1099 PDF / FIRE"}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Prepare Return Modal */}
      {showPrepareModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPrepareModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Prepare Statutory Tax Filing</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowPrepareModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handlePrepareReturn}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tax Jurisdiction</label>
                  <select
                    className={styles.formSelect}
                    value={prepareJurisdiction}
                    onChange={(e) => setPrepareJurisdiction(e.target.value)}
                  >
                    <option value="US - California">US - California (CDTFA)</option>
                    <option value="US - Federal">US - Federal (IRS)</option>
                    <option value="US - New York">US - New York (NYS DTF)</option>
                    <option value="EU - Germany VAT">EU - Germany (Bundeszentralamt für Steuern)</option>
                    <option value="UK - HMRC VAT">UK - HMRC (Making Tax Digital VAT)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Legal Entity</label>
                  <select
                    className={styles.formSelect}
                    value={prepareEntity}
                    onChange={(e) => setPrepareEntity(e.target.value)}
                  >
                    <option value="Acme Corp (US)">Acme Corp (US Primary)</option>
                    <option value="Acme Global Operations">Acme Global Operations Inc</option>
                    <option value="Acme EU Holding B.V.">Acme EU Holding B.V.</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Return / Form Type</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={prepareReturnType}
                    onChange={(e) => setPrepareReturnType(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tax Period</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={preparePeriod}
                    onChange={(e) => setPreparePeriod(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Statutory Due Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={prepareDueDate}
                    onChange={(e) => setPrepareDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estimated Tax Assessment (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.formInput}
                    value={prepareAmount}
                    onChange={(e) => setPrepareAmount(e.target.value)}
                    required
                  />
                </div>

                {prepareSuccess && (
                  <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <CheckCircle2 size={14} />
                    <span>Statutory return staged and scheduled in tax compliance calendar!</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowPrepareModal(false)}
                  disabled={isPreparing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isPreparing}
                >
                  {isPreparing ? "Staging Return..." : "Stage Tax Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Exceptions Modal */}
      {showExceptionsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowExceptionsModal(false)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Tax Reconciliation Exceptions: {selectedReturn?.name}</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowExceptionsModal(false)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleResolveExceptionsSubmit}>
              <div className={styles.modalBody}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)", padding: "var(--space-3)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-xs)", color: "var(--color-warning)" }}>
                    Tax Rate Discrepancy Identified
                  </div>
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-secondary)" }}>
                    Subledger transaction TX-9844 applies 8.25% district surcharge while statutory schedule indicates standard rate 7.75%. Variance of USD 248.50 requires compliance resolution before officer sign-off.
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Compliance Resolution Decision</label>
                  <select
                    className={styles.formSelect}
                    value={exceptionOverrideChoice}
                    onChange={(e) => setExceptionOverrideChoice(e.target.value)}
                  >
                    <option value="ACCEPT_ASSESSMENT">Accept District Surcharge Assessment &amp; True-up Expense</option>
                    <option value="REQUEST_VENDOR_CREDIT">Request Vendor Credit Memo for Overbilled Surcharge</option>
                    <option value="RECLASSIFY_EXEMPT">Reclassify as Intercompany Exemption</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Auditor / Sign-off Notes</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter compliance justification and sign-off remarks..."
                    value={exceptionNotes}
                    onChange={(e) => setExceptionNotes(e.target.value)}
                    required
                  />
                </div>

                {exceptionResolvedSuccess && (
                  <div style={{ color: "var(--color-success)", fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <CheckCircle2 size={14} />
                    <span>Exceptions approved! Return status updated to Ready For Approval.</span>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowExceptionsModal(false)}
                  disabled={isResolvingException}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isResolvingException}
                >
                  {isResolvingException ? "Authorizing..." : "Authorize & Approve Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
