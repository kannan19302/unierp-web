import { describe, it, expect } from "vitest";
import { APPS_CATALOG } from "../../../app/(dashboard)/apps/page";

describe("Application Wizard Catalog Governance", () => {
  it("contains exactly 20 enterprise applications matching the design specification", () => {
    expect(APPS_CATALOG).toHaveLength(20);
  });

  it("contains unique ids and href destinations for all apps", () => {
    const ids = APPS_CATALOG.map((app) => app.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(20);

    const hrefs = APPS_CATALOG.map((app) => app.href);
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(20);
  });

  it("distributes applications across the 4 core categories according to module index (9, 4, 4, 3)", () => {
    const coreApps = APPS_CATALOG.filter((app) => app.category === "core");
    const opsApps = APPS_CATALOG.filter((app) => app.category === "operations");
    const prodApps = APPS_CATALOG.filter((app) => app.category === "productivity");
    const industryApps = APPS_CATALOG.filter((app) => app.category === "verticals");

    expect(coreApps).toHaveLength(9);
    expect(opsApps).toHaveLength(4);
    expect(prodApps).toHaveLength(4);
    expect(industryApps).toHaveLength(3);
  });

  it("verifies all apps have valid displayName and icon components", () => {
    APPS_CATALOG.forEach((app) => {
      expect(app.displayName).toBeTruthy();
      expect(app.name).toBeTruthy();
      expect(typeof app.icon).toBe("object"); // Lucide icon forwardRef
    });
  });
});
