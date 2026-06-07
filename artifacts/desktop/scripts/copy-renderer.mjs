// Copies the built Nacho web renderer (artifacts/nacho/dist/public) into this
// app's dist/renderer so the packaged Electron app can load it from file://.
// Kept as a copy (not a symlink) so electron-builder bundles it.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..", "..", "nacho", "dist", "public");
const dest = path.resolve(here, "..", "dist", "renderer");

if (!existsSync(src)) {
  console.error(
    `[copy-renderer] Renderer build not found at ${src}\n` +
      `Run the renderer build first (pnpm run build:renderer).`,
  );
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-renderer] Copied renderer → ${dest}`);
