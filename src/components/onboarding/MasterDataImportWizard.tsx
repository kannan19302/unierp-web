"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle, AlertTriangle, Play, FileSpreadsheet } from "lucide-react";
import styles from "./MasterDataImportWizard.module.css";

interface MasterDataImportWizardProps {
  onImportComplete?: (summary: any) => void;
}

const ENTITY_FIELDS: Record<string, string[]> = {
  CUSTOMER: ["name", "email", "phone", "taxId"],
  VENDOR: ["name", "email", "phone", "taxId"],
  ITEM: ["name", "sku", "price", "costPrice"],
  GL_ACCOUNT: ["code", "name", "type"],
  OPENING_BALANCE: ["accountCode", "debit", "credit"],
};

export const MasterDataImportWizard: React.FC<MasterDataImportWizardProps> = ({
  onImportComplete,
}) => {
  const [entityType, setEntityType] = useState("CUSTOMER");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const rawHeaders = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        setHeaders(rawHeaders);

        const rows: Record<string, any>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: Record<string, any> = {};
          rawHeaders.forEach((h, idx) => {
            row[h] = values[idx] || "";
          });
          rows.push(row);
        }
        setParsedRows(rows);

        // Auto-match headers to entity fields
        const autoMappings: Record<string, string> = {};
        const expectedFields = ENTITY_FIELDS[entityType] || [];
        rawHeaders.forEach((h) => {
          const matched = expectedFields.find(
            (f) => f.toLowerCase() === h.toLowerCase().replace(/[^a-z0-9]/g, "")
          );
          if (matched) autoMappings[h] = matched;
        });
        setFieldMappings(autoMappings);
      }
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await fetch("/api/v1/saas/onboarding/wizard/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          rows: parsedRows,
          fieldMappings,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
      }
    } catch (err) {
      console.error("Validation error:", err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/v1/saas/onboarding/wizard/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          fileName,
          fieldMappings,
          rows: parsedRows,
          dryRun: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onImportComplete?.(data);
      }
    } catch (err) {
      console.error("Import error:", err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={styles.importerContainer}>
      <div style={{ display: "flex", gap: "var(--token-space-3)", alignItems: "center" }}>
        <label style={{ fontSize: "var(--token-text-xs)", fontWeight: 600 }}>Entity Type:</label>
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setFieldMappings({});
            setValidationResult(null);
          }}
          style={{
            padding: "var(--token-space-2)",
            borderRadius: "var(--token-radius-md)",
            border: "1px solid var(--token-color-border-subtle)",
            background: "var(--token-color-surface-primary)",
            color: "var(--token-color-text-primary)",
          }}
        >
          <option value="CUSTOMER">Customers</option>
          <option value="VENDOR">Suppliers / Vendors</option>
          <option value="ITEM">Products & Inventory Items</option>
          <option value="GL_ACCOUNT">Chart of Accounts</option>
          <option value="OPENING_BALANCE">Opening Balances</option>
        </select>
      </div>

      {!fileName ? (
        <label className={styles.dropzone}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
          <UploadCloud size={36} color="var(--token-color-primary)" style={{ margin: "0 auto var(--token-space-2)" }} />
          <div className={styles.dropzoneTitle}>Click to upload or drag & drop CSV</div>
          <div className={styles.dropzoneHint}>Supports standard RFC 4180 CSV exports from Excel, QuickBooks, SAP, NetSuite</div>
        </label>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-2)", marginBottom: "var(--token-space-3)" }}>
            <FileSpreadsheet size={18} color="var(--token-color-primary)" />
            <span style={{ fontSize: "var(--token-text-sm)", fontWeight: 600 }}>{fileName}</span>
            <span style={{ fontSize: "var(--token-text-xs)", color: "var(--token-color-text-secondary)" }}>({parsedRows.length} rows parsed)</span>
          </div>

          <table className={styles.mappingTable}>
            <thead>
              <tr>
                <th>CSV Header</th>
                <th>Maps to UniERP Field</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((h) => (
                <tr key={h}>
                  <td><strong>{h}</strong></td>
                  <td>
                    <select
                      value={fieldMappings[h] || ""}
                      onChange={(e) =>
                        setFieldMappings({ ...fieldMappings, [h]: e.target.value })
                      }
                      style={{
                        padding: "var(--token-space-1) var(--token-space-2)",
                        borderRadius: "var(--token-radius-sm)",
                        border: "1px solid var(--token-color-border-subtle)",
                        background: "var(--token-color-surface-primary)",
                        color: "var(--token-color-text-primary)",
                      }}
                    >
                      <option value="">-- Ignore / Skip --</option>
                      {(ENTITY_FIELDS[entityType] || []).map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", gap: "var(--token-space-3)", marginTop: "var(--token-space-4)" }}>
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating}
              style={{
                padding: "var(--token-space-2) var(--token-space-4)",
                borderRadius: "var(--token-radius-md)",
                border: "1px solid var(--token-color-border-subtle)",
                background: "var(--token-color-surface-secondary)",
                color: "var(--token-color-text-primary)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isValidating ? "Validating..." : "Dry-Run Validate"}
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || !validationResult || validationResult.validRows === 0}
              style={{
                padding: "var(--token-space-2) var(--token-space-4)",
                borderRadius: "var(--token-radius-md)",
                border: "none",
                background: "var(--token-color-primary)",
                color: "var(--token-color-text-inverse, #ffffff)",
                fontWeight: 600,
                cursor: "pointer",
                opacity: (!validationResult || validationResult.validRows === 0) ? 0.5 : 1,
              }}
            >
              {isImporting ? "Importing..." : "Execute Bulk Import"}
            </button>
          </div>

          {validationResult && (
            <div
              className={`${styles.validationCard} ${
                validationResult.errorRows === 0
                  ? styles.validationSuccess
                  : styles.validationError
              }`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--token-space-2)" }}>
                {validationResult.errorRows === 0 ? (
                  <CheckCircle size={16} color="var(--token-color-success)" />
                ) : (
                  <AlertTriangle size={16} color="var(--token-color-error)" />
                )}
                <span style={{ fontWeight: 600, fontSize: "var(--token-text-xs)" }}>
                  {validationResult.validRows} / {validationResult.totalRows} Rows Ready for Ingestion
                </span>
              </div>

              {validationResult.errors.length > 0 && (
                <ul className={styles.errorList}>
                  {validationResult.errors.map((err: any, idx: number) => (
                    <li key={idx}>
                      Row {err.row}: {err.field} - {err.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
