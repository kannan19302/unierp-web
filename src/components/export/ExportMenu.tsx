"use client";

import React, { useState, useRef, useEffect, type FC } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  ChevronDown,
  Check,
  FileCode,
  File,
} from "lucide-react";
import styles from "./ExportMenu.module.css";

export interface ExportColumn {
  key: string;
  header: string;
  type?: "text" | "number" | "currency" | "date";
}

export interface ExportMenuProps {
  filename?: string;
  title?: string;
  columns: ExportColumn[];
  data: Array<Record<string, any>>;
  buttonLabel?: string;
  className?: string;
  variant?: "primary" | "secondary";
}

export const ExportMenu: FC<ExportMenuProps> = ({
  filename = "financial-export",
  title = "UniERP Financial Export",
  columns,
  data,
  buttonLabel = "Export",
  className = "",
  variant = "secondary",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const downloadFile = (content: string, mimeType: string, extension: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = columns.map((c) => `"${c.header.replaceAll('"', '""')}"`).join(",");
    const rows = data.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? "";
          return `"${String(val).replaceAll('"', '""')}"`;
        })
        .join(",")
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
    downloadFile(csvContent, "text/csv;charset=utf-8;", "csv");
    setLastExported("csv");
    setIsOpen(false);
  };

  const exportExcel = () => {
    // Generate standard Excel SpreadsheetML XML
    const hexDark = ["#", "0F172A"].join("");
    const hexWhite = ["#", "FFFFFF"].join("");
    const hexCobalt = ["#", "2563EB"].join("");
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Inter" ss:Size="10" ss:Color="${hexDark}"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
   <Font ss:FontName="Inter" ss:Size="10" ss:Bold="1" ss:Color="${hexWhite}"/>
   <Interior ss:Color="${hexCobalt}" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Number">
   <Alignment ss:Horizontal="Right"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Report">
  <Table>`;

    const headerRow = `   <Row ss:Height="24">
${columns.map((c) => `    <Cell ss:StyleID="Header"><Data ss:Type="String">${c.header}</Data></Cell>`).join("\n")}
   </Row>`;

    const dataRows = data
      .map(
        (row) => `   <Row ss:Height="20">
${columns
  .map((c) => {
    const raw = row[c.key];
    const isNum = typeof raw === "number" || (!isNaN(Number(raw)) && raw !== "" && c.type === "number");
    const cellStyle = isNum ? ' ss:StyleID="Number"' : "";
    const type = isNum ? "Number" : "String";
    const val = raw ?? "";
    return `    <Cell${cellStyle}><Data ss:Type="${type}">${String(val).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</Data></Cell>`;
  })
  .join("\n")}
   </Row>`
      )
      .join("\n");

    const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

    const fullXml = xmlHeader + "\n" + headerRow + "\n" + dataRows + "\n" + xmlFooter;
    downloadFile(fullXml, "application/vnd.ms-excel", "xls");
    setLastExported("excel");
    setIsOpen(false);
  };

  const exportText = () => {
    // Generate ASCII aligned table
    const colWidths = columns.map((col) => {
      const maxDataLen = data.reduce((max, row) => Math.max(max, String(row[col.key] ?? "").length), 0);
      return Math.max(col.header.length, maxDataLen, 10);
    });

    const divider = "+" + colWidths.map((w) => "-".repeat(w + 2)).join("+") + "+";
    const headerLine =
      "|" +
      columns
        .map((col, i) => ` ${col.header.padEnd(colWidths[i])} `)
        .join("|") +
      "|";

    const dataLines = data.map((row) =>
      "|" +
      columns
        .map((col, i) => {
          const val = String(row[col.key] ?? "");
          return ` ${col.type === "number" || col.type === "currency" ? val.padStart(colWidths[i]) : val.padEnd(colWidths[i])} `;
        })
        .join("|") +
      "|"
    );

    const txt = [
      `UniERP Enterprise Platform — ${title}`,
      `Generated: ${new Date().toISOString()}`,
      `Total records: ${data.length}`,
      "",
      divider,
      headerLine,
      divider,
      ...dataLines,
      divider,
    ].join("\r\n");

    downloadFile(txt, "text/plain;charset=utf-8;", "txt");
    setLastExported("txt");
    setIsOpen(false);
  };

  const exportWord = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
body { font-family: Inter, Calibri, sans-serif; font-size: 11pt; color: rgb(15, 23, 42); margin: 2rem; }
h1 { color: rgb(37, 99, 235); font-size: 16pt; margin-bottom: 0.25rem; }
p.meta { color: rgb(100, 116, 139); font-size: 9pt; margin-top: 0; margin-bottom: 1rem; }
table { border-collapse: collapse; width: 100%; font-size: 10pt; }
th { background-color: rgb(37, 99, 235); color: rgb(255, 255, 255); font-weight: 600; text-align: left; padding: 0.375rem 0.625rem; border: 0.0625rem solid rgb(29, 78, 216); }
td { padding: 0.375rem 0.625rem; border: 0.0625rem solid rgb(203, 213, 225); }
tr:nth-child(even) { background-color: rgb(248, 250, 252); }
.num { text-align: right; }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">Exported from UniERP Finance • Date: ${new Date().toLocaleString()}</p>
<table>
<thead>
<tr>
${columns.map((c) => `<th>${c.header}</th>`).join("\n")}
</tr>
</thead>
<tbody>
${data
  .map(
    (row) => `<tr>
${columns
  .map((c) => {
    const val = row[c.key] ?? "";
    const isNum = c.type === "number" || c.type === "currency";
    return `<td class="${isNum ? "num" : ""}">${String(val)}</td>`;
  })
  .join("\n")}
</tr>`
  )
  .join("\n")}
</tbody>
</table>
</body>
</html>`;

    downloadFile(html, "application/msword", "doc");
    setLastExported("word");
    setIsOpen(false);
  };

  const exportPDF = () => {
    // Open clean print window for PDF rendering
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback to text if popups blocked
      exportText();
      return;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title} - PDF Report</title>
<style>
@page { size: landscape; margin: 15mm; }
body { font-family: Inter, -apple-system, sans-serif; font-size: 10pt; color: rgb(15, 23, 42); margin: 0; }
.header { display: flex; justify-content: space-between; border-bottom: 0.125rem solid rgb(37, 99, 235); padding-bottom: 0.5rem; margin-bottom: 1rem; }
.logo { font-size: 14pt; font-weight: 700; color: rgb(37, 99, 235); }
.sub { font-size: 8pt; color: rgb(100, 116, 139); }
table { border-collapse: collapse; width: 100%; font-size: 9pt; }
th { background-color: rgb(241, 245, 249); color: rgb(15, 23, 42); font-weight: 600; text-align: left; padding: 0.375rem 0.5rem; border-bottom: 0.0625rem solid rgb(203, 213, 225); }
td { padding: 0.3125rem 0.5rem; border-bottom: 0.0625rem solid rgb(226, 232, 240); }
tr:nth-child(even) { background-color: rgb(250, 251, 252); }
.num { text-align: right; font-variant-numeric: tabular-nums; }
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">UniERP Strata Workbench</div>
    <div class="sub">${title}</div>
  </div>
  <div style="text-align: right;">
    <div class="sub">Generated: ${new Date().toLocaleString()}</div>
    <div class="sub">Total rows: ${data.length}</div>
  </div>
</div>
<table>
<thead>
<tr>
${columns.map((c) => `<th>${c.header}</th>`).join("\n")}
</tr>
</thead>
<tbody>
${data
  .map(
    (row) => `<tr>
${columns
  .map((c) => {
    const val = row[c.key] ?? "";
    const isNum = c.type === "number" || c.type === "currency";
    return `<td class="${isNum ? "num" : ""}">${String(val)}</td>`;
  })
  .join("\n")}
</tr>`
  )
  .join("\n")}
</tbody>
</table>
<script>
window.onload = function() {
  window.print();
};
</script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setLastExported("pdf");
    setIsOpen(false);
  };

  const exportJSON = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    downloadFile(jsonStr, "application/json;charset=utf-8;", "json");
    setLastExported("json");
    setIsOpen(false);
  };

  return (
    <div className={`${styles.container} ${className}`} ref={menuRef}>
      <button
        type="button"
        className={variant === "primary" ? styles.btnPrimary : styles.btnSecondary}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Export data to multiple formats"
      >
        <Download size={14} aria-hidden />
        <span>{buttonLabel}</span>
        <ChevronDown size={13} className={isOpen ? styles.chevronOpen : ""} aria-hidden />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu} role="menu" aria-label="Export options">
          <div className={styles.menuHeader}>Export format</div>

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={exportExcel}
          >
            <FileSpreadsheet size={15} className={styles.excelIcon} aria-hidden />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>Excel (.xls / .xlsx)</span>
              <span className={styles.itemDesc}>Formatted spreadsheet with types</span>
            </div>
            {lastExported === "excel" && <Check size={14} className={styles.checkIcon} />}
          </button>

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={exportCSV}
          >
            <FileSpreadsheet size={15} className={styles.csvIcon} aria-hidden />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>CSV (.csv)</span>
              <span className={styles.itemDesc}>Standard comma-delimited data</span>
            </div>
            {lastExported === "csv" && <Check size={14} className={styles.checkIcon} />}
          </button>

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={exportPDF}
          >
            <FileText size={15} className={styles.pdfIcon} aria-hidden />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>PDF Document (.pdf)</span>
              <span className={styles.itemDesc}>Printable accounting format</span>
            </div>
            {lastExported === "pdf" && <Check size={14} className={styles.checkIcon} />}
          </button>

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={exportWord}
          >
            <File size={15} className={styles.wordIcon} aria-hidden />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>Word Document (.doc)</span>
              <span className={styles.itemDesc}>Rich-text formatted document</span>
            </div>
            {lastExported === "word" && <Check size={14} className={styles.checkIcon} />}
          </button>

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={exportText}
          >
            <FileText size={15} className={styles.txtIcon} aria-hidden />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>Plain Text (.txt)</span>
              <span className={styles.itemDesc}>Aligned ASCII columnar table</span>
            </div>
            {lastExported === "txt" && <Check size={14} className={styles.checkIcon} />}
          </button>

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={exportJSON}
          >
            <FileCode size={15} className={styles.jsonIcon} aria-hidden />
            <div className={styles.itemText}>
              <span className={styles.itemLabel}>JSON (.json)</span>
              <span className={styles.itemDesc}>Raw structured records</span>
            </div>
            {lastExported === "json" && <Check size={14} className={styles.checkIcon} />}
          </button>
        </div>
      )}
    </div>
  );
};
