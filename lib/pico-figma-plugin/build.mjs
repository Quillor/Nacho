// Build script for the Pico Figma plugin.
//
// A Figma plugin ships two bundles:
//   - the plugin "code" (runs in Figma's sandboxed JS realm, no DOM): dist/code.js
//   - the plugin "UI" (runs in an <iframe>, has DOM + fetch): dist/ui.html
//
// Figma requires the UI to be a single self-contained HTML file, so we bundle
// the UI TypeScript and inline it (plus the panel markup/styles) into ui.html.

import * as esbuild from "esbuild";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const outdir = resolve(root, "dist");
mkdirSync(outdir, { recursive: true });

const watch = process.argv.includes("--watch");

const codeOptions = {
  entryPoints: [resolve(root, "src/code/main.ts")],
  outfile: resolve(outdir, "code.js"),
  bundle: true,
  format: "iife",
  target: "es2018",
  platform: "neutral",
  loader: { ".json": "json" },
  logLevel: "info",
};

/** Build the UI bundle (as text) and inline it into the HTML shell. */
async function buildUi() {
  const result = await esbuild.build({
    entryPoints: [resolve(root, "src/ui/ui.ts")],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2018",
    platform: "browser",
    logLevel: "info",
  });
  const js = result.outputFiles[0].text;
  const shell = readFileSync(resolve(root, "src/ui/ui.html"), "utf8");
  const html = shell.replace(
    "/* __PICO_PLUGIN_UI_BUNDLE__ */",
    () => js,
  );
  writeFileSync(resolve(outdir, "ui.html"), html, "utf8");
  console.log("ui.html written");
}

if (watch) {
  const ctx = await esbuild.context(codeOptions);
  await ctx.watch();
  await buildUi();
  // Re-inline the UI on a simple interval; sufficient for local dev.
  setInterval(buildUi, 1500);
  console.log("watching…");
} else {
  await esbuild.build(codeOptions);
  await buildUi();
  console.log("build complete");
}
