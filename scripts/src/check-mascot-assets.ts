import { readFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

/**
 * Mascot-asset integrity guardrail.
 *
 * The Pico "Imagery" docs (Character Prompt Spec page) reference every Nacho
 * mascot PNG by file name through `ASSET_FILES` in the imagery feature data
 * files. If an asset is renamed, moved, or removed — or a new asset is added to
 * the served folder but never referenced — the page silently renders broken
 * images or ships orphaned files. This check enforces a 1:1 mapping between:
 *   - the PNGs served from `artifacts/pico/public/nacho/`, and
 *   - the file names referenced by the imagery feature data files.
 *
 * It fails (exit 1) on either direction of drift:
 *   - MISSING: referenced in data but not present on disk (would render broken).
 *   - ORPHANED: present on disk but never referenced (dead asset).
 *
 * Status: BLOCKING — wired into `pnpm run build` and runnable directly via
 * `pnpm run check-mascot-assets`.
 *
 * Usage: tsx ./src/check-mascot-assets.ts   (exit 0 = ok, 1 = violations)
 */

// Repo root, resolved from this file's location so the scan works no matter
// which directory pnpm runs the script from (pnpm runs it from `scripts/`).
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Folder the high-res Nacho PNGs are served from (Pico's public dir).
const ASSETS_DIR = "artifacts/pico/public/nacho";

// Imagery feature data files that reference the assets by file name.
const DATA_FILES = [
  "artifacts/pico/src/features/foundations/imagery/data.ts",
  "artifacts/pico/src/features/foundations/imagery/prompts-data.ts",
];

// Matches PNG file names inside string literals, e.g. "nacho-presenting.png".
const PNG_REF = /["'`]([\w./-]+\.png)["'`]/g;

function basename(p: string): string {
  return p.split("/").pop() ?? p;
}

function main(): void {
  // 1. Asset file names present on disk.
  const onDisk = new Set(
    globSync("*.png", { cwd: resolve(REPO_ROOT, ASSETS_DIR) }).map(basename),
  );

  // 2. Asset file names referenced by the imagery data files.
  const referenced = new Set<string>();
  for (const file of DATA_FILES) {
    const abs = resolve(REPO_ROOT, file);
    if (!existsSync(abs)) {
      console.error(`[Mascot assets] Data file not found: ${file}`);
      process.exit(1);
    }
    const text = readFileSync(abs, "utf-8");
    for (const m of text.matchAll(PNG_REF)) {
      referenced.add(basename(m[1]));
    }
  }

  const missing = [...referenced].filter((f) => !onDisk.has(f)).sort();
  const orphaned = [...onDisk].filter((f) => !referenced.has(f)).sort();

  if (missing.length > 0 || orphaned.length > 0) {
    console.error("\n[Mascot assets] Asset references are out of sync:\n");
    if (missing.length > 0) {
      console.error(
        `  Referenced but MISSING from ${ASSETS_DIR}/ (would render broken):`,
      );
      for (const f of missing) console.error(`    - ${f}`);
    }
    if (orphaned.length > 0) {
      console.error(
        `  Present in ${ASSETS_DIR}/ but never referenced (orphaned):`,
      );
      for (const f of orphaned) console.error(`    - ${f}`);
    }
    console.error(
      "\nFix: keep the PNGs in the served folder and the file names in the\n" +
        "imagery data files (ASSET_FILES) in 1:1 sync — add, rename, or remove\n" +
        "in both places together.\n",
    );
    process.exit(1);
  }

  console.log(
    `[Mascot assets] All clear — ${onDisk.size} asset(s) on disk, all referenced ` +
      `and all references resolve.`,
  );
  process.exit(0);
}

main();
