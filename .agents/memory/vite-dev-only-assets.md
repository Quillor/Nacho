---
name: Vite dev-only large assets
description: How to load a big asset only in dev without leaking it into the prod bundle
---

# Keep large dev-only assets out of the prod bundle

A static `import x from "@assets/foo?url"` (or any asset import) inside a module
that is only reached via a dynamic `import()` behind a dead `import.meta.env.DEV`
branch is **still emitted into the production bundle**. Rollup creates the async
chunk and emits its referenced assets during bundling, before minifier dead-code
elimination removes the call site. Verified: a 19MB webm imported this way landed
in `dist/` even though the seed code is unreachable in prod.

**Why:** asset emission is driven by the module graph at bundle time, not by
runtime reachability. The orphaned chunk + its asset get written regardless.

**How to apply:** for a large asset needed only in dev, do NOT import it. Add a
Vite plugin with `apply: "serve"` whose `configureServer` registers a middleware
that streams the file from disk at a stable URL, and `fetch()` that URL at
runtime from the dev-only code. `apply: "serve"` means the plugin never runs in
`vite build`, so nothing about the asset enters prod. Confirm by grepping `dist/`
for the asset after a prod build.
