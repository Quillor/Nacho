// Build script for the Pico Figma plugin.
//
// A Figma plugin ships two bundles:
//   - the plugin "code" (runs in Figma's sandboxed JS realm, no DOM): dist/code.js
//   - the plugin "UI" (runs in an <iframe>, has DOM + fetch): dist/ui.html
//
// Figma requires the UI to be a single self-contained HTML file, so we bundle
// the UI TypeScript and inline it (plus the panel markup/styles) into ui.html.
//
// This module also exports `buildPlugin()` so the distributable packer
// (pack.mjs) can rebuild from source before zipping, keeping the downloadable
// package in sync with the plugin code.

import * as esbuild from "esbuild";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const outdir = resolve(root, "dist");

/**
 * Regenerate src/generated/assets.json (logos + scanned lucide icons) so the
 * bundled code bundle never drifts from the website's icon usage / brand SVGs.
 */
function generateAssets() {
  execFileSync("node", [resolve(root, "gen-assets.mjs")], {
    stdio: "inherit",
  });
}

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

/**
 * Default origin baked into the downloadable plugin so the optional render
 * service points at the deployed Pico/API server without the designer typing
 * anything. Empty string means "no default" (the field stays blank). Provided
 * at pack time via PICO_PLUGIN_ORIGIN.
 */
function defaultOrigin() {
  const explicit = process.env.PICO_PLUGIN_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const domains = process.env.REPLIT_DOMAINS?.split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (domains && domains.length > 0) return `https://${domains[0]}`;
  return "";
}

/** Build the plugin "code" bundle (sandboxed realm, no DOM). */
export async function buildCode() {
  mkdirSync(outdir, { recursive: true });
  generateAssets();
  await esbuild.build(codeOptions);
}

/**
 * Version metadata for a build, so a designer can tell at a glance whether
 * they're running the latest plugin: the package version plus the UTC build
 * time (to the minute, so same-day rebuilds are distinguishable). The same
 * object is baked into the UI label and written to the download sidecar
 * (pack.mjs), so the on-site stamp and the in-plugin stamp always agree.
 */
export function versionInfo() {
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  const builtAt =
    new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";
  return {
    version: pkg.version,
    builtAt,
    label: `v${pkg.version} · ${builtAt}`,
  };
}

/** Build the UI bundle (as text) and inline it into the HTML shell. */
export async function buildUi(info = versionInfo()) {
  mkdirSync(outdir, { recursive: true });
  const result = await esbuild.build({
    entryPoints: [resolve(root, "src/ui/ui.ts")],
    bundle: true,
    write: false,
    format: "iife",
    target: "es2018",
    platform: "browser",
    define: {
      __PICO_DEFAULT_ORIGIN__: JSON.stringify(defaultOrigin()),
      __PICO_PLUGIN_VERSION__: JSON.stringify(info.label),
    },
    logLevel: "info",
  });
  const js = result.outputFiles[0].text;
  const shell = readFileSync(resolve(root, "src/ui/ui.html"), "utf8");
  const html = shell.replace("/* __PICO_PLUGIN_UI_BUNDLE__ */", () => js);
  writeFileSync(resolve(outdir, "ui.html"), html, "utf8");
  console.log("ui.html written");
}

/** Full one-shot build of both bundles. */
export async function buildPlugin(info = versionInfo()) {
  await buildCode();
  await buildUi(info);
}

async function main() {
  const watch = process.argv.includes("--watch");
  if (watch) {
    const ctx = await esbuild.context(codeOptions);
    await ctx.watch();
    await buildUi();
    // Re-inline the UI on a simple interval; sufficient for local dev.
    setInterval(buildUi, 1500);
    console.log("watching…");
  } else {
    await buildPlugin();
    console.log("build complete");
  }
}

// Only run the CLI when invoked directly (not when imported by pack.mjs).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
