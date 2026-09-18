import { describe, expect, it } from "vitest";
import {
  ACTIVE_OCC_APP_MANIFESTS,
  OCC_APP_MANIFESTS,
  occManifestById,
} from "./control-center-manifests";

describe("OCC canonical app manifests", () => {
  it("declares every OCC app exactly once", () => {
    expect(OCC_APP_MANIFESTS).toHaveLength(22);
    expect(new Set(OCC_APP_MANIFESTS.map((manifest) => manifest.appId)).size).toBe(22);
    expect(OCC_APP_MANIFESTS.every((manifest) => manifest.center === "OCC")).toBe(true);
  });

  it("activates all 22 OCC applications including entitlements, extensions, and ai governance", () => {
    expect(ACTIVE_OCC_APP_MANIFESTS).toHaveLength(22);
    expect(occManifestById("OCC-09")?.availability).toBe("ACTIVE");
    expect(occManifestById("OCC-09")?.entryPath).toBe("/organization-entitlements");
    expect(occManifestById("OCC-10")?.availability).toBe("ACTIVE");
    expect(occManifestById("OCC-10")?.entryPath).toBe("/apps-extensions");
    expect(occManifestById("OCC-21")?.availability).toBe("ACTIVE");
    expect(occManifestById("OCC-21")?.entryPath).toBe("/ai-governance");
  });

  it("contains no provider application or provider route", () => {
    expect(OCC_APP_MANIFESTS.some((manifest) => manifest.appId.startsWith("PCC-"))).toBe(false);
    expect(OCC_APP_MANIFESTS.some((manifest) => manifest.entryPath.includes("super-admin"))).toBe(false);
  });
});
