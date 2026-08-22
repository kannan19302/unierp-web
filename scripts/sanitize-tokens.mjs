import fs from "fs";
import path from "path";

const COLOR_MAP = {
  // Danger / Red
  "#ef4444": "var(--color-danger)",
  "#dc2626": "var(--color-danger)",
  "#b91c1c": "var(--color-danger)",
  "#f87171": "var(--color-danger)",
  
  // Warning / Orange / Amber / Yellow
  "#f59e0b": "var(--color-warning)",
  "#d97706": "var(--color-warning)",
  "#ca8a04": "var(--color-warning)",
  "#ea580c": "var(--color-warning)",
  "#f97316": "var(--color-warning)",
  "#fbbf24": "var(--color-warning)",
  
  // Success / Green
  "#10b981": "var(--color-success)",
  "#059669": "var(--color-success)",
  "#16a34a": "var(--color-success)",
  "#22c55e": "var(--color-success)",
  "#34d399": "var(--color-success)",
  
  // Primary / Blue / Indigo
  "#3b82f6": "var(--color-primary)",
  "#2563eb": "var(--color-primary)",
  "#1d4ed8": "var(--color-primary)",
  "#6366f1": "var(--color-primary)",
  "#4f46e5": "var(--color-primary)",
  "#4338ca": "var(--color-primary)",
  "#312e81": "var(--color-primary)",
  "#1e1b4b": "var(--color-bg)",
  "#7c3aed": "var(--color-primary)",
  "#818cf8": "var(--color-primary)",
  "#a78bfa": "var(--color-primary)",
  
  // Info / Cyan / Teal
  "#14b8a6": "var(--color-info)",
  "#06b6d4": "var(--color-info)",
  "#0284c7": "var(--color-info)",
  "#0ea5e9": "var(--color-info)",
  "#38bdf8": "var(--color-info)",
  
  // Pink / Purple / Magenta
  "#ec4899": "var(--chart-3)",
  "#f43f5e": "var(--chart-3)",
  "#db2777": "var(--chart-3)",
  "#fdf2f8": "var(--color-surface)",
  
  // Border / Slate / Gray
  "#cbd5e1": "var(--color-border)",
  "#e2e8f0": "var(--color-border)",
  "#f1f5f9": "var(--color-border)",
  "#E5E7EB": "var(--color-border)",
  "#e5e7eb": "var(--color-border)",
  "#d1d5db": "var(--color-border)",
  "#94a3b8": "var(--color-text-secondary)",
  "#64748b": "var(--color-text-secondary)",
  "#475569": "var(--color-text-secondary)",
  "#f8fafc": "var(--color-surface)",
  "#f3f4f6": "var(--color-surface)",
};

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", ".git", "coverage"].includes(entry.name)) {
        processDir(fullPath);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts") || entry.name.endsWith(".css"))) {
      if (entry.name.endsWith(".d.ts")) continue;
      let content = fs.readFileSync(fullPath, "utf8");
      let modified = false;
      
      for (const [hex, token] of Object.entries(COLOR_MAP)) {
        const regex1 = new RegExp(`(["'\`])` + hex.replace("#", "\\#") + `(["'\`])`, "gi");
        if (regex1.test(content)) {
          content = content.replace(regex1, `$1${token}$2`);
          modified = true;
        }
        
        // CSS properties: e.g. color: #14b8a6; -> color: var(--color-info);
        const regex2 = new RegExp(`:\\s*` + hex.replace("#", "\\#") + `([;\\s])`, "gi");
        if (regex2.test(content)) {
          content = content.replace(regex2, `: ${token}$1`);
          modified = true;
        }

        // Tailwind inline classes: text-[#ec4899] -> text-[var(--chart-3)]
        const regex3 = new RegExp(`(text|bg|border)-\\[` + hex.replace("#", "\\#") + `\\]`, "gi");
        if (regex3.test(content)) {
          content = content.replace(regex3, `$1-[${token}]`);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`Updated: ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

processDir(path.resolve("app"));
console.log("Token sanitization complete!");
