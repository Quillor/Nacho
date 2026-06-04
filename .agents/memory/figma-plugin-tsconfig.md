---
name: Figma plugin tsconfig split
description: Why the Pico Figma plugin uses two separate tsconfigs (code vs UI) and avoids DOM globals on the code side.
---

# Figma plugin: split code vs UI typechecking

The plugin (`lib/pico-figma-plugin`) typechecks with **two** tsconfigs, not one:
`tsconfig.json` (code side) and `tsconfig.ui.json` (UI side), both extending
`tsconfig.base.json`. The package `typecheck` script runs both.

**Why:** `@figma/plugin-typings` declares a global `const fetch` (with its own
`FetchOptions`/`FetchResponse`) that conflicts with the DOM lib's `fetch`. If you
put both `lib: ["DOM"]` and the figma types in one config you get duplicate-global
errors. So:
- Code side (`tsconfig.json`): `lib: ["ES2018"]`, `typeRoots: ["./node_modules/@figma"]`,
  `types: ["plugin-typings"]`, includes `src/code` + `src/shared`. No DOM.
- UI side (`tsconfig.ui.json`): `lib: ["ES2018","DOM","DOM.Iterable"]`, `types: []`,
  includes `src/ui` + `src/shared`. No figma types.

**How to apply:**
- The code side has **no `URL` global** (not in ES2018 lib, not in figma typings).
  Parse hostnames/paths with a regex (`/^[a-z]+:\/\/([^/?#]+)([^?#]*)/i`), not `new URL()`.
- Do not name any shared interface `PageNode` — it collides with Figma's global
  `PageNode`. The parsed-DOM tree type is `ParsedNode` (in `src/shared/messages.ts`).
- `figma`-API node `.fills` is typed `ReadonlyArray<Paint> | typeof figma.mixed` but
  its setter accepts `Paint[]`; assign directly (`node.fills = [...]`), no cast needed.
- Build is esbuild via `build.mjs` (bundles `dist/code.js`, inlines UI JS into
  `dist/ui.html` at a placeholder comment). esbuild is installed per-package, not at
  repo root — run `pnpm install` after creating the package before building.
