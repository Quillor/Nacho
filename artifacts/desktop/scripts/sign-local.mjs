// Code-signs the packaged Nacho.app for LOCAL use so macOS shows a single,
// PERSISTENT permission entry.
//
// Two problems this solves:
//  1. Duplicate entries — each Electron helper, if left with the generic
//     "Electron" identity, shows as its own "Nacho" row. Signing helpers with
//     `com.apple.security.inherit` folds their TCC grants into the main app.
//  2. Grants resetting on every rebuild — ad-hoc signatures change each build,
//     so macOS treats each build as a new app and drops Screen Recording /
//     Camera / Mic / Accessibility permission. Signing with a STABLE
//     self-signed identity keeps the code Authority constant, so grants persist.
//
// The stable identity is created by ensure-signing-identity.sh. If it can't be
// created (e.g. no openssl), we fall back to ad-hoc signing so the build still
// succeeds — permissions just won't persist across rebuilds.
//
// For notarized distribution, use a real Developer ID via `pnpm run dist`.
import { execFileSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const app =
  process.argv[2] || path.join(root, "dist-app", "mac-arm64", "Nacho.app");
const inheritEnts = path.join(root, "build", "entitlements.mac.inherit.plist");
const mainEnts = path.join(root, "build", "entitlements.mac.plist");

if (!existsSync(app)) {
  console.error(`[sign-local] app not found: ${app}`);
  process.exit(1);
}

const IDENTITY = "Nacho Local Signing";
const KEYCHAIN = "nacho-build.keychain";

// Resolve a stable signing identity, creating it if needed; else ad-hoc.
let signArgs = ["--sign", "-"];
try {
  execFileSync("bash", [path.join(here, "ensure-signing-identity.sh")], {
    stdio: "inherit",
  });
  const found = execFileSync(
    "security",
    ["find-identity", "-p", "codesigning", KEYCHAIN],
    { encoding: "utf8" },
  );
  if (found.includes(IDENTITY)) {
    signArgs = ["--keychain", KEYCHAIN, "--sign", IDENTITY];
    console.log(`[sign-local] using stable identity: ${IDENTITY}`);
  } else {
    console.log("[sign-local] stable identity unavailable — ad-hoc signing");
  }
} catch {
  console.log("[sign-local] identity setup failed — ad-hoc signing");
}

const codesign = (extra) =>
  execFileSync("codesign", [...signArgs, "--force", ...extra], {
    stdio: "inherit",
  });

// 1. Sign everything inside-out so all nested code is valid.
console.log("[sign-local] deep sign");
codesign(["--deep", app]);

// 2. Re-sign each helper app with inherit entitlements (folds TCC into parent).
const frameworks = path.join(app, "Contents", "Frameworks");
for (const name of readdirSync(frameworks)) {
  if (!name.endsWith(".app")) continue;
  console.log(`[sign-local] helper (inherit): ${name}`);
  codesign(["--entitlements", inheritEnts, path.join(frameworks, name)]);
}

// 3. Re-sign the main app last with its entitlements + a stable identifier.
console.log("[sign-local] main app");
codesign([
  "--entitlements",
  mainEnts,
  "--identifier",
  "com.nacho.desktop",
  app,
]);

console.log("[sign-local] done");
