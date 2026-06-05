// Produce the downloadable, ready-to-import Pico Figma plugin package.
//
// This rebuilds the plugin from source (so the package never drifts from the
// code) and zips a flat, self-contained bundle that a designer can unzip and
// import into Figma's desktop app without any terminal step:
//
//   pico-figma-plugin/
//     manifest.json   (paths rewritten to the flat files below)
//     code.js
//     ui.html
//
// Usage:
//   node pack.mjs --out <path-to-zip>
//
// Defaults the output to dist/pico-figma-plugin.zip when --out is omitted.

import { buildPlugin, versionInfo } from "./build.mjs";
import { zipSync, strToU8 } from "fflate";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const distdir = resolve(root, "dist");

const FOLDER = "pico-figma-plugin";

/**
 * Filesystem-safe build stamp derived from the human builtAt
 * ("2026-06-05 21:06 UTC" → "20260605-2106").
 */
function fileStampFrom(builtAt) {
  return builtAt
    .replace(" UTC", "")
    .replace(/[-:]/g, "")
    .replace(" ", "-");
}

/**
 * Versioned zip name carrying the version + UTC build time (to the minute) so a
 * designer can tell at a glance which build they downloaded — matching the
 * version label baked into the plugin UI and the download sidecar. e.g.
 *   pico-figma-plugin-v0.1.0-20260605-2103.zip
 */
function versionedName(info) {
  return `${FOLDER}-v${info.version}-${fileStampFrom(info.builtAt)}.zip`;
}

function parseOut(info) {
  const i = process.argv.indexOf("--out");
  if (i !== -1 && process.argv[i + 1]) {
    const out = process.argv[i + 1];
    return isAbsolute(out) ? out : resolve(process.cwd(), out);
  }
  return resolve(distdir, versionedName(info));
}

async function main() {
  // 1. Rebuild from source so the package matches the current plugin code.
  //    Compute the version stamp once and thread it through, so the UI label,
  //    the zip filename, and the sidecar all share the exact same timestamp.
  const info = versionInfo();
  await buildPlugin(info);

  // 2. Read the freshly built bundles.
  const code = readFileSync(resolve(distdir, "code.js"));
  const ui = readFileSync(resolve(distdir, "ui.html"));

  // 3. Rewrite the manifest so it references the flat files in the package
  //    (the repo manifest points at dist/* paths that don't exist in the zip).
  const manifest = JSON.parse(
    readFileSync(resolve(root, "manifest.json"), "utf8"),
  );
  manifest.main = "code.js";
  manifest.ui = "ui.html";
  const manifestText = JSON.stringify(manifest, null, 2) + "\n";

  // 4. Zip everything under a single top-level folder for a tidy unzip.
  const zipped = zipSync(
    {
      [`${FOLDER}/manifest.json`]: strToU8(manifestText),
      [`${FOLDER}/code.js`]: new Uint8Array(code),
      [`${FOLDER}/ui.html`]: new Uint8Array(ui),
    },
    { level: 9 },
  );

  const out = parseOut(info);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, zipped);

  // 5. Emit a version sidecar next to the zip so the download page can show
  //    the build stamp and offer a versioned filename + cache-busting query.
  const sidecar = resolve(dirname(out), `${FOLDER}.version.json`);
  writeFileSync(
    sidecar,
    JSON.stringify(
      {
        version: info.version,
        builtAt: info.builtAt,
        label: info.label,
        filename: versionedName(info),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`packed Figma plugin → ${out} (${zipped.length} bytes)`);
  console.log(`wrote version sidecar → ${sidecar}`);
}

await main();
