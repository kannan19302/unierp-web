import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALL_FINANCE_MODULES } from "@/navigation/finance-workspaces";

describe("Finance workspace navigation", () => {
  it("links every catalog entry to an existing Next.js page without duplicate destinations", () => {
    expect(ALL_FINANCE_MODULES.length).toBeGreaterThan(0);
    const hrefs = ALL_FINANCE_MODULES.map((entry) => entry.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const entry of ALL_FINANCE_MODULES) {
      expect(existsSync(resolve(`app/(dashboard)${entry.href}/page.tsx`)), entry.href).toBe(true);
      expect(entry.label.trim().length).toBeGreaterThan(0);
    }
  });

  it("exposes every Finance workspace through the sidebar or its shared catalog", () => {
    const sidebar = readFileSync(resolve("src/components/shell/FinanceSidebarV2.tsx"), "utf8");
    const directLinks = [...sidebar.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    const destinations = new Set([...directLinks, ...ALL_FINANCE_MODULES.map((entry) => entry.href)]);
    const root = resolve("app/(dashboard)/finance");
    function visit(directory: string): void {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith("[") && entry.name !== "new") {
          visit(join(directory, entry.name));
        } else if (entry.name === "page.tsx") {
          const route = "/finance" + directory.slice(root.length).replaceAll("\\", "/");
          expect(destinations.has(route), `Unreachable workspace: ${route}`).toBe(true);
        }
      }
    }
    visit(root);
  });
});
