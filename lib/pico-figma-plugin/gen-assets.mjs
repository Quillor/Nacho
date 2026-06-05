// Build-time asset generator for the Pico Figma plugin.
//
// Produces src/generated/assets.json, bundled into the plugin code by esbuild's
// JSON loader. It contains:
//   - logos: the Nacho wordmark + mark SVGs (source of truth: artifacts/nacho)
//   - icons: every lucide-react icon actually imported anywhere in the codebase,
//     mapped name → SVG markup (source of truth: the lucide-static package, kept
//     in lockstep with the lucide-react catalog version).
//
// Re-run on every build so the Figma export never drifts from the code.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const repoRoot = resolve(__dirname, "../..");

/** PascalCase lucide-react export → lucide-static kebab filename. */
function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])([0-9])/g, "$1-$2")
    .toLowerCase();
}

/** Recursively collect .ts/.tsx files under a directory. */
function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const SCAN_ROOTS = [
  "artifacts/nacho/src",
  "artifacts/admin/src",
  "artifacts/pico/src",
  "lib/pico-ui/src",
];

const IMPORT_RE =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']lucide-react["']/g;

/** Collect the set of lucide-react icon export names used across the code. */
function collectIconNames() {
  const names = new Set();
  for (const root of SCAN_ROOTS) {
    for (const file of walk(resolve(repoRoot, root))) {
      const src = readFileSync(file, "utf8");
      let m;
      while ((m = IMPORT_RE.exec(src))) {
        for (const raw of m[1].split(",")) {
          let member = raw.trim();
          if (!member) continue;
          // Drop type-only members and the LucideIcon type helper.
          if (member.startsWith("type ")) continue;
          // "Foo as Bar" → the lucide export is "Foo".
          member = member.split(/\s+as\s+/)[0].trim();
          if (member === "LucideIcon" || !/^[A-Za-z][A-Za-z0-9]*$/.test(member))
            continue;
          names.add(member);
        }
      }
    }
  }
  return names;
}

/** Strip the license comment so createNodeFromSvg gets clean markup. */
function cleanSvg(svg) {
  return svg.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function build() {
  // Logos (brand source of truth lives with the Nacho app).
  const logos = {
    wordmark: cleanSvg(
      readFileSync(resolve(repoRoot, "artifacts/nacho/public/logo.svg"), "utf8"),
    ),
    mark: cleanSvg(
      readFileSync(
        resolve(repoRoot, "artifacts/nacho/public/logo-mark.svg"),
        "utf8",
      ),
    ),
  };

  // Icons: resolve lucide-static, map every used icon → kebab SVG file.
  const iconsDir = resolve(
    dirname(require.resolve("lucide-static/package.json")),
    "icons",
  );
  const icons = {};
  const missing = [];
  for (const name of [...collectIconNames()].sort()) {
    const base = name.replace(/Icon$/, "");
    const kebab = toKebab(base);
    const file = join(iconsDir, `${kebab}.svg`);
    if (!existsSync(file)) {
      missing.push(`${name} → ${kebab}.svg`);
      continue;
    }
    // Key by kebab so aliases (Foo / FooIcon) collapse to one component.
    if (!icons[kebab]) icons[kebab] = cleanSvg(readFileSync(file, "utf8"));
  }

  const outDir = resolve(__dirname, "src/generated");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "assets.json"),
    JSON.stringify({ logos, icons }, null, 2) + "\n",
    "utf8",
  );

  const iconCount = Object.keys(icons).length;
  console.log(`gen-assets: ${iconCount} icons, 2 logos written`);
  if (missing.length) {
    console.warn(
      `gen-assets: ${missing.length} unmapped icon(s): ${missing.join(", ")}`,
    );
  }
}

build();
