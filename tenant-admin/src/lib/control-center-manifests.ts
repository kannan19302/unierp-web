import manifests from "../manifests/occ-apps.json";

function assertOccManifestRuntimeShape(): void {
  if (manifests.length !== 22) throw new Error(`OCC shell requires 22 app manifests; found ${manifests.length}`);
  const ids = new Set(manifests.map((manifest) => manifest.appId));
  if (ids.size !== manifests.length) throw new Error("OCC shell contains duplicate app manifests");
  if (manifests.some((manifest) => manifest.center !== "OCC")) throw new Error("OCC shell contains a non-OCC manifest");
}

assertOccManifestRuntimeShape();

export const OCC_APP_MANIFESTS = manifests;
export const ACTIVE_OCC_APP_MANIFESTS = manifests.filter(
  (manifest) => manifest.availability === "ACTIVE" || manifest.availability === "PREVIEW",
);

export function occManifestById(appId: string) {
  return OCC_APP_MANIFESTS.find((manifest) => manifest.appId === appId);
}
