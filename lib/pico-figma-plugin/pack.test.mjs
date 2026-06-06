// Guards the downloadable Figma plugin package so a broken zip never reaches a
// designer hitting "Import plugin from manifest" in Figma.
//
// It runs the real packer (pack.mjs) into a temp directory and asserts the
// produced zip is import-ready:
//   - contains pico-figma-plugin/{manifest.json,code.js,ui.html}
//   - manifest main = "code.js", ui = "ui.html" (flat paths, not dist/*)
//   - ui.html has the UI bundle inlined (no leftover replacement marker)
//   - code.js / ui.html are non-trivially sized (bundles actually built)
//
// Run: node --test pack.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync, strFromU8 } from "fflate";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FOLDER = "pico-figma-plugin";

test("pack.mjs produces an import-ready Figma plugin zip", () => {
  const tmp = mkdtempSync(resolve(tmpdir(), "pico-plugin-pack-"));
  const out = resolve(tmp, "plugin.zip");

  try {
    // Run the real packer (rebuilds from source, then zips) into a temp file.
    execFileSync("node", [resolve(__dirname, "pack.mjs"), "--out", out], {
      stdio: "inherit",
    });

    const entries = unzipSync(readFileSync(out));
    const names = Object.keys(entries);

    // 1. The three flat files live under the single top-level folder.
    for (const file of ["manifest.json", "code.js", "ui.html"]) {
      const key = `${FOLDER}/${file}`;
      assert.ok(
        Object.prototype.hasOwnProperty.call(entries, key),
        `zip is missing ${key} (entries: ${names.join(", ")})`,
      );
    }

    // 2. Manifest points at the flat files, not the repo's dist/* paths.
    const manifest = JSON.parse(strFromU8(entries[`${FOLDER}/manifest.json`]));
    assert.equal(manifest.main, "code.js", "manifest.main must be code.js");
    assert.equal(manifest.ui, "ui.html", "manifest.ui must be ui.html");

    // 3. UI bundle is inlined — the build marker must be fully replaced.
    const uiHtml = strFromU8(entries[`${FOLDER}/ui.html`]);
    assert.ok(
      !uiHtml.includes("__PICO_PLUGIN_UI_BUNDLE__"),
      "ui.html still contains the unreplaced __PICO_PLUGIN_UI_BUNDLE__ marker",
    );

    // 4. Bundles actually built (not empty/near-empty placeholders).
    assert.ok(
      entries[`${FOLDER}/code.js`].length > 1000,
      "code.js looks too small to be a real build",
    );
    assert.ok(
      uiHtml.length > 1000,
      "ui.html looks too small to be a real build",
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
