---
name: Figma plugin download package
description: How the no-terminal Pico Figma plugin download is built and served
---

The Pico docs site offers a ready-to-import plugin zip so designers never run a
build. Key points:

- `lib/pico-figma-plugin/pack.mjs` rebuilds from source (imports `buildPlugin`
  from build.mjs), rewrites the manifest to FLAT paths (`code.js`/`ui.html` — the
  repo manifest's `dist/*` paths don't exist inside the zip), and zips a
  top-level `pico-figma-plugin/` folder with fflate.
- `artifacts/pico` `dev` and `build` scripts call
  `node ../../lib/pico-figma-plugin/pack.mjs --out public/pico-figma-plugin.zip`
  before vite, so the download is regenerated on every dev start and prod ship.
  **Why:** the package must never drift from plugin source (no hand-committed
  copy). The zip is gitignored in artifacts/pico/.gitignore.
- Served at `${import.meta.env.BASE_URL}pico-figma-plugin.zip` (i.e.
  `/design-system/pico-figma-plugin.zip`) via Vite's public/ copy.
- Defaults baked at pack time: `build.mjs` esbuild-defines
  `__PICO_DEFAULT_ORIGIN__` from `PICO_PLUGIN_ORIGIN` or `REPLIT_DOMAINS[0]`;
  ui.ts prefills the optional Render service field with it. Tokens URL stays
  EMPTY on purpose = bundled tokens (public tokens.json serving is a separate
  task), which is the sensible zero-config default.

**How to apply:** if you change plugin source, the zip auto-rebuilds on next
dev/build — don't commit a zip. If you add a new plugin file, update pack.mjs's
zip entries and the manifest rewrite.
