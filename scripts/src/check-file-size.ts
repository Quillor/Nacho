import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

/**
 * File-size budget guardrail.
 *
 * Keeps source files small enough to stay readable and reviewable. Any
 * `.ts`/`.tsx` file under `artifacts/*` or `lib/*` that exceeds `MAX_LINES`
 * must either be split into focused modules, or be listed in one of:
 *   - `PERMANENT_EXEMPTIONS` — inherently large by nature (generated data,
 *     vendored components, code-generation builders).
 *   - `LEGACY_ALLOWLIST` — temporary; a reorganization task will split it and
 *     then delete the entry. The list only ever shrinks.
 *
 * Status: BLOCKING — wired into `pnpm run build` and runnable directly via
 * `pnpm run check-file-size`. `LEGACY_ALLOWLIST` is now empty; new offenders
 * must be split (or, if inherently large, added to `PERMANENT_EXEMPTIONS`).
 * See ARCHITECTURE.md ("File-size budget").
 *
 * Usage: tsx ./src/check-file-size.ts   (exit 0 = ok, 1 = violations)
 */

const MAX_LINES = 400;

// Repo root, resolved from this file's location so the scan works no matter
// which directory pnpm runs the script from (pnpm runs it from `scripts/`).
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Globs scanned, relative to the repo root.
const INCLUDE = [
  "artifacts/**/*.ts",
  "artifacts/**/*.tsx",
  "lib/**/*.ts",
  "lib/**/*.tsx",
];

// Never counted: generated output, dependencies, and the generated tooling
// artifact (mockup-sandbox is a scaffolded preview harness, not product code).
const IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/generated/**",
  "**/*.gen.ts",
  "**/*.d.ts",
  "artifacts/mockup-sandbox/**",
];

// Permanently allowed to exceed the budget — inherently large by nature.
const PERMANENT_EXEMPTIONS: Record<string, string> = {
  "artifacts/nacho/src/lib/job-titles.ts":
    "Generated static data list (~1000 job titles); no logic to split.",
  "lib/pico-figma-plugin/src/code/components.ts":
    "Figma component-set builder (code generation); cohesive single unit.",
  "lib/pico-figma-plugin/src/code/page.ts":
    "Figma page-reconstruction builder (code generation); cohesive single unit.",
  "lib/pico-figma-plugin/src/ui/ui.ts":
    "Figma plugin UI controller; single plugin-iframe entry point.",
  "lib/pico-ui/src/components/sidebar.tsx":
    "Vendored shadcn/ui sidebar primitive; kept aligned with upstream.",
};

// Temporarily allowed — a reorganization task splits these, then removes the
// entry. Now empty: the budget is fully enforced. Keep it that way; prefer
// splitting a file over adding it back here.
const LEGACY_ALLOWLIST: Record<string, string> = {};

function normalize(p: string): string {
  return p.replace(/^\.\//, "").split("\\").join("/");
}

function main(): void {
  const found = INCLUDE.flatMap((g) =>
    globSync(g, { cwd: REPO_ROOT, ignore: IGNORE }),
  ).map(normalize);
  const unique = Array.from(new Set(found)).sort();

  const violations: { file: string; lines: number }[] = [];
  const staleAllowlist: string[] = [];

  for (const file of unique) {
    const lines = readFileSync(resolve(REPO_ROOT, file), "utf-8").split("\n").length;
    const isExempt = file in PERMANENT_EXEMPTIONS;
    const isLegacy = file in LEGACY_ALLOWLIST;

    if (lines <= MAX_LINES) {
      // An allowlisted file that has since been trimmed should be removed.
      if (isLegacy) staleAllowlist.push(file);
      continue;
    }
    if (isExempt || isLegacy) continue;
    violations.push({ file, lines });
  }

  if (violations.length > 0) {
    console.error(`\n[File-size budget] ${violations.length} file(s) exceed ${MAX_LINES} lines:\n`);
    for (const v of violations) console.error(`  ${v.file} — ${v.lines} lines`);
    console.error(
      "\nFix: split the file into focused modules (see ARCHITECTURE.md).\n" +
        "If it is inherently large (generated data, vendored component, code-gen\n" +
        "builder), add it to PERMANENT_EXEMPTIONS in this script with a reason.\n",
    );
    process.exit(1);
  }

  console.log(
    `[File-size budget] All clear — ${unique.length} files checked, none over ${MAX_LINES} lines ` +
      `(${Object.keys(PERMANENT_EXEMPTIONS).length} permanent exemptions, ${Object.keys(LEGACY_ALLOWLIST).length} legacy allowlisted).`,
  );
  if (staleAllowlist.length > 0) {
    console.log(
      `\nNote: ${staleAllowlist.length} legacy-allowlisted file(s) are now within budget — ` +
        "remove them from LEGACY_ALLOWLIST:",
    );
    for (const f of staleAllowlist) console.log(`  - ${f}`);
  }
  process.exit(0);
}

main();
