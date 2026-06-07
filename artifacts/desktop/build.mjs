// Bundles the Electron main + preload TypeScript into CommonJS for the app
// shell. CJS (not ESM) because the native `uiohook-napi` addon is required at
// runtime and Electron's main process loads it most reliably as CJS. `electron`
// and the native module stay external — they resolve from node_modules at run
// time, not bundled.
import esbuild from "esbuild";

const dev = process.env.NODE_ENV === "development";

await esbuild.build({
  entryPoints: ["src/main.ts", "src/preload.ts"],
  outdir: "dist",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  external: ["electron", "uiohook-napi"],
  sourcemap: dev ? "inline" : false,
  logLevel: "info",
});
