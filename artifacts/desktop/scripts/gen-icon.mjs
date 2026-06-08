// Regenerates the macOS app icon (build/icon.png) from the Pico brand mark.
// electron-builder converts this 1024×1024 PNG into a multi-resolution .icns at
// package time, so a single high-res PNG is all that needs to be committed.
//
// Requires ImageMagick (`magick`) on PATH. Run from this package:
//   node ./scripts/gen-icon.mjs
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(
  here,
  "..",
  "..",
  "pico",
  "public",
  "logo-mark.svg",
);
const dest = path.resolve(here, "..", "build", "icon.png");

if (!existsSync(src)) {
  console.error(`[gen-icon] Source mark not found at ${src}`);
  process.exit(1);
}

try {
  execFileSync(
    "magick",
    [
      "-background",
      "none",
      "-density",
      "600",
      src,
      "-resize",
      "1024x1024",
      "-depth",
      "8",
      "-strip",
      dest,
    ],
    { stdio: "inherit" },
  );
  console.log(`[gen-icon] Wrote ${dest}`);
} catch (err) {
  console.error(
    "[gen-icon] Failed to run ImageMagick. Is `magick` installed and on PATH?",
  );
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
