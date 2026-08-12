#!/usr/bin/env node
/**
 * Command palette singleton gate — E40 exit criterion: "Any record is
 * reachable in under three keystrokes plus a query, from any screen."
 *
 * D115: this repo used to mount TWO independent global Cmd/Ctrl+K
 * listeners at once — a stale placeholder in src/components/
 * CommandPalette.tsx (mounted in the root layout, filtered a hardcoded
 * 5-item array, never called any search API) racing the real,
 * search-wired src/components/shell/CommandPalette.tsx (mounted in the
 * dashboard layout, queries /search/global for live records). A single
 * keystroke could open either one nondeterministically, and the
 * placeholder could never reach a real record no matter how it was
 * queried — silently breaking the exit criterion on every keystroke
 * that happened to hit it.
 *
 * This gate counts global keydown listeners matching the Cmd/Ctrl+K
 * shape across the app. Exactly one must exist. More than one means the
 * duplicate-listener defect is back; zero means the palette has been
 * removed entirely and the exit criterion can no longer be met at all.
 *
 * Usage: node scripts/check-command-palette-singleton.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_ROOTS = [path.join(ROOT, "app"), path.join(ROOT, "src")].filter(
  (d) => existsSync(d),
);

function sourceFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === ".next")
        continue;
      sourceFiles(p, out);
    } else if (/\.tsx?$/.test(entry) && !/\.(spec|test)\.tsx?$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

// A global shortcut registration: a keydown listener whose body checks for
// metaKey/ctrlKey together with the "k" key, in either order.
const HAS_KEYDOWN_LISTENER = /addEventListener\(\s*["']keydown["']/;
const HAS_META_OR_CTRL = /\bmetaKey\b[\s\S]{0,40}\bctrlKey\b|\bctrlKey\b[\s\S]{0,40}\bmetaKey\b/;
const HAS_K_KEY = /["']k["']/;

const hits = [];
for (const root of SCAN_ROOTS) {
  for (const file of sourceFiles(root)) {
    const src = readFileSync(file, "utf8");
    if (!HAS_KEYDOWN_LISTENER.test(src)) continue;
    if (!HAS_META_OR_CTRL.test(src)) continue;
    if (!HAS_K_KEY.test(src)) continue;
    hits.push(path.relative(ROOT, file).replace(/\\/g, "/"));
  }
}

if (process.argv.includes("--list")) {
  for (const h of hits) console.log(h);
  process.exit(0);
}

if (hits.length === 0) {
  console.error(
    "Command palette singleton gate FAILED: found 0 global Cmd/Ctrl+K listeners.\n" +
      "E40's exit criterion (\"any record reachable in under three keystrokes plus a\n" +
      "query, from any screen\") has no entry point left. Mount " +
      "src/components/shell/CommandPalette.tsx's keyboard shortcut somewhere reachable\n" +
      "from every screen.",
  );
  process.exit(1);
}

if (hits.length > 1) {
  console.error(
    `Command palette singleton gate FAILED: found ${hits.length} global Cmd/Ctrl+K listeners:\n` +
      hits.map((h) => `  - ${h}`).join("\n") +
      "\n\nMore than one means two palettes race the same keystroke — exactly the D115\n" +
      "defect this gate exists to catch. A keystroke opening a stale, hardcoded, record-\n" +
      "blind palette instead of the real search-wired one silently breaks E40's exit\n" +
      "criterion. Keep exactly one.",
  );
  process.exit(1);
}

console.log(
  `Command palette singleton gate: exactly 1 global Cmd/Ctrl+K listener (${hits[0]}).`,
);
