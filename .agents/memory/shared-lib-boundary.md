---
name: "@workspace/shared browser-vs-node import boundary"
description: Why @workspace/shared splits exports by environment, and the rule for adding to it.
---

# @workspace/shared import boundary

`@workspace/shared` (the cross-app shared lib) deliberately splits its `exports`
into a browser barrel and browser-free subpaths:

- `.` (root barrel) — pulls in browser-only code (dev-auth uses `import.meta.env`,
  `document`, `localStorage`). **Only browser/Vite consumers** (the Nacho app,
  the Admin app) may import this.
- `./types` — pure domain types, zero runtime, browser-free.
- `./dev-auth-constants` — plain constants (cookie name, dev user id), browser-free.

**Rule:** Node/non-browser consumers (`@workspace/api-server`, `lib/db`) must
import ONLY the browser-free subpaths, never the root barrel.

**Why:** the root barrel transitively loads the browser dev-auth module, which has
a top-level side effect touching `document`/`import.meta`. Importing it from the
server would crash at import time (esbuild bundles it for node) and fail the
node-typed tsconfig (no `vite/client`). The lib self-typechecks via a local
`src/vite-env.d.ts` ambient `import.meta.env` declaration so it doesn't depend on
`vite/client`.

**How to apply:** when adding anything to `@workspace/shared`, classify it as
browser-only or environment-agnostic. Environment-agnostic things get their own
browser-free subpath export; browser-only things go through the root barrel only.
Keep the dev-auth production boundary intact: client gate is `import.meta.env.DEV`
(folds to `false` / dead-code-eliminated in prod), server gate is
`NODE_ENV === "production"`.
