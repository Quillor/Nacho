// Resolve a launchable Chromium binary for the headless render strategy.
//
// The binary is resolved best-first: REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE
// (provided in the Replit workspace) → a system Chromium on PATH (`chromium`
// is a declared system dependency, so a NixOS-compatible binary ships in the
// deployed image) → a browser downloaded by playwright-core itself. A
// downloaded vanilla Chromium will NOT run on NixOS (it can't find its ELF
// interpreter / shared libs), which is why a Nix-patched Chromium is installed
// as a system dependency for production.

import fs from "node:fs";
import path from "node:path";

// Candidate binary names for a system/Nix-provided Chromium, searched on PATH
// when REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE is absent (the deployment case).
const CHROMIUM_BINARIES = [
  "chromium",
  "chromium-browser",
  "google-chrome-stable",
  "google-chrome",
  "chrome",
];

let cachedExecutable: string | null | undefined;

function findOnPath(binaries: string[]): string | null {
  const dirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const bin of binaries) {
    for (const dir of dirs) {
      const candidate = path.join(dir, bin);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        /* not on this PATH entry */
      }
    }
  }
  return null;
}

// Cached after the first successful (or failed) resolution since the answer
// can't change at runtime.
export async function resolveChromiumExecutable(
  chromium: typeof import("playwright-core").chromium,
): Promise<string | null> {
  if (cachedExecutable !== undefined) return cachedExecutable;

  // 1. Replit workspace provides a Nix-patched binary via this env var.
  const fromEnv = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fromEnv && fs.existsSync(fromEnv)) {
    cachedExecutable = fromEnv;
    return cachedExecutable;
  }

  // 2. A system/Nix Chromium on PATH. In the deployed image `chromium` is a
  //    declared system dependency, so a NixOS-compatible binary is present.
  const onPath = findOnPath(CHROMIUM_BINARIES);
  if (onPath) {
    cachedExecutable = onPath;
    return cachedExecutable;
  }

  // 3. A browser downloaded by playwright-core itself, if one exists and is
  //    actually runnable in this environment.
  try {
    const p = chromium.executablePath();
    if (p && fs.existsSync(p)) {
      cachedExecutable = p;
      return cachedExecutable;
    }
  } catch {
    /* no bundled browser */
  }

  cachedExecutable = null;
  return cachedExecutable;
}
