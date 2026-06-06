---
name: Figma plugin "Page from URL" — headless render in prod + fail loud, never blank
description: How render works in deployment (Nix system Chromium), and why unreadable URLs now error instead of composing a blank/fallback page.
---

# "Page from URL" recreates the real page, or fails with a clear reason

## Rendering works in deployment, not just dev
`/api/render` drives a headless Chromium via `playwright-core` so client-rendered
SPAs come back hydrated with their `data-pico-*` instrumentation (real
colors/type/spacing), not an empty shell.

**Browser resolution order (`resolveChromiumExecutable` in
`artifacts/api-server/src/routes/render.ts`):** env var
`REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE` → PATH search for chromium/chrome
binaries → `chromium.executablePath()`. The env var only exists in dev; in
deployment the browser is the **Nix system package `pkgs.chromium`** declared in
`replit.nix` (added via `installSystemDependencies`). System deps persist into
the deployment image, so the same code path that worked only in dev now works in
prod.

**Why not download Chromium at build time:** vanilla/downloaded Chromium does
NOT run on this NixOS env (`libglib-2.0.so.0: cannot open shared object file`;
missing ELF interpreter). Only Nix-patched Chromium launches. Do not reintroduce
a `playwright install` / download-binary step in `build.mjs` — declare the Nix
package instead.

The SSRF guard allows public Replit hosts (`*.replit.app`/`*.replit.dev`/
`*.repl.co`) by hostname; the private-IP block still applies to other hosts.

## Fail loud — never produce a blank frame (this REPLACED the old "always compose fallback" rule)
The UI now THROWS (and `btn-page` shows `Couldn't read that URL — <reason>` and
returns WITHOUT posting `reconstruct-page`) when the page is unreadable:
- auth wall detected, or
- non-substantive shell — heuristic in `readPage`: substantive if
  componentCount>0 OR has `[data-pico-w]` geometry OR bodyText≥40 chars OR ≥10
  body elements. The error message distinguishes browser-rendered-empty
  ("rendered no visible content") from no-browser shell ("only an empty shell
  came back").

`RenderResult`/`FetchedPage` carry a `rendered: "browser" | "fetch"` flag so the
UI can word the error correctly.

**Why the change:** the prod bug was blank white frames — the old fallback
reconstructed the empty SPA shell into nothing. A clear, actionable error beats a
silent blank page. If you ever reintroduce a compose-fallback, gate it so it can
never run on an empty/auth-walled shell.
