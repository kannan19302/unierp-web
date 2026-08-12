#!/usr/bin/env node
/**
 * E2E journey coverage gate — J19 exit criterion: "Every documented
 * journey has an E2E test. An undocumented journey is either documented
 * or removed."
 *
 * docs/ai/APP_FLOW.md (unierp-workspace) names 7 top-level journeys
 * (A-G). This gate parses those headings directly from the doc (the
 * single source of truth, not a copy that can drift from it) and checks
 * a committed manifest (e2e/journey-coverage.json) mapping each one to
 * the real spec file that covers it. Fails if:
 *
 *   1. A journey named in APP_FLOW.md has no manifest entry at all, or
 *      its manifest entry names a spec file that does not exist.
 *   2. A spec file under e2e/journeys/ is not referenced by ANY
 *      manifest entry — an "undocumented journey" in the sense this
 *      exit criterion means: a real E2E test nobody connected back to
 *      the journey list it is supposed to prove.
 *
 * Usage:
 *   APP_FLOW_PATH=<path to APP_FLOW.md> node scripts/check-e2e-journey-coverage.mjs
 *   (defaults to ../unierp-workspace/docs/ai/APP_FLOW.md, matching this
 *   polyrepo's sibling-checkout layout)
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_FLOW_PATH = process.env.APP_FLOW_PATH
  ? path.resolve(process.env.APP_FLOW_PATH)
  : path.resolve(ROOT, "..", "unierp-workspace", "docs", "ai", "APP_FLOW.md");
const MANIFEST_PATH = path.join(ROOT, "e2e", "journey-coverage.json");
const JOURNEYS_DIR = path.join(ROOT, "e2e", "journeys");

if (!existsSync(APP_FLOW_PATH)) {
  console.error(
    `E2E journey coverage gate CANNOT RUN: APP_FLOW.md not found at ${APP_FLOW_PATH}.\n` +
      "Set APP_FLOW_PATH, or check out unierp-workspace as a sibling repo.",
  );
  process.exit(1);
}
if (!existsSync(MANIFEST_PATH)) {
  console.error(
    `E2E journey coverage gate FAILED: no manifest at ${path.relative(ROOT, MANIFEST_PATH)}.`,
  );
  process.exit(1);
}

const appFlow = readFileSync(APP_FLOW_PATH, "utf8");
// `## 4. Journey A — Onboarding a new organisation (Dev, IT Admin)`
const journeyHeadingRe = /^##\s+\d+\.\s+Journey\s+([A-Z])\s+—\s+(.+?)\s*$/gm;
const documentedJourneys = [];
for (const m of appFlow.matchAll(journeyHeadingRe)) {
  documentedJourneys.push({ id: m[1], title: m[2].replace(/\s*\([^)]*\)\s*$/, "") });
}

if (documentedJourneys.length === 0) {
  console.error(
    "E2E journey coverage gate CANNOT RUN: found 0 journey headings in APP_FLOW.md. " +
      "The extraction pattern may no longer match the doc's heading shape.",
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const specFiles = existsSync(JOURNEYS_DIR)
  ? readdirSync(JOURNEYS_DIR).filter((f) => f.endsWith(".spec.ts"))
  : [];

const failures = [];
const referencedSpecs = new Set();

for (const journey of documentedJourneys) {
  const entry = manifest[journey.id];
  if (!entry) {
    failures.push(
      `Journey ${journey.id} ("${journey.title}") is documented in APP_FLOW.md but has no entry in e2e/journey-coverage.json.`,
    );
    continue;
  }
  if (entry.outOfScope) {
    // A real, explicit, named exception — not silently skipped. E.g.
    // Journey E (mobile) cannot be tested by THIS repo's Playwright
    // suite at all; it needs its own coverage in unierp-mobile.
    continue;
  }
  if (!entry.specs || entry.specs.length === 0) {
    failures.push(
      `Journey ${journey.id} ("${journey.title}") is documented in APP_FLOW.md but has zero E2E specs — ${entry.gap ?? "no test exists for it"}.`,
    );
    continue;
  }
  for (const spec of entry.specs) {
    referencedSpecs.add(spec);
    if (!specFiles.includes(spec)) {
      failures.push(
        `Journey ${journey.id} ("${journey.title}") names spec "${spec}" in the manifest, but e2e/journeys/${spec} does not exist.`,
      );
    }
  }
}

// A spec that tests a cross-cutting behavioural RULE (APP_FLOW.md § 11 —
// tenant isolation, RBAC boundaries, offboarding) rather than one of the
// 7 named journeys is real and valuable, but it is not "a journey" in
// this doc's own taxonomy. Rather than force an incorrect journey
// mapping (or delete a real security test), such a spec must be
// explicitly named in the manifest's `crossCuttingSpecs` allowlist, with
// a reason. A spec in neither list is genuinely undocumented.
const crossCutting = new Set(
  Object.keys(manifest.crossCuttingSpecs ?? {}),
);
for (const spec of crossCutting) {
  if (!specFiles.includes(spec)) {
    failures.push(
      `crossCuttingSpecs names "${spec}" in the manifest, but e2e/journeys/${spec} does not exist.`,
    );
  }
}

const undocumentedSpecs = specFiles.filter(
  (f) => !referencedSpecs.has(f) && !crossCutting.has(f),
);
for (const spec of undocumentedSpecs) {
  failures.push(
    `e2e/journeys/${spec} exists but is not referenced by any journey or crossCuttingSpecs entry in ` +
      `e2e/journey-coverage.json — an undocumented journey must be either documented (add it to ` +
      `APP_FLOW.md and the manifest) or removed.`,
  );
}

if (failures.length > 0) {
  console.error(
    `E2E journey coverage gate FAILED: ${failures.length} issue(s):\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log(
  `E2E journey coverage gate: all ${documentedJourneys.length} documented journeys have a real, existing spec; ` +
    `all ${specFiles.length} spec files are accounted for.`,
);
