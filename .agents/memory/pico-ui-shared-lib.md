---
name: Pico UI shared component lib
description: How the canonical Pico UI components are packaged and consumed; the Tailwind content-scan gotcha.
---

# `@workspace/pico-ui` shared component library

The canonical Pico UI components (shadcn-style), their `cn` util, and the `use-toast`/`use-mobile` hooks live ONLY in `lib/pico-ui/src`. Both `artifacts/nacho` and `artifacts/pico` import them; there are no per-app `components/ui` or `hooks` copies.

- Consumed as **source** (like `@workspace/api-client-react`): package `exports` map subpaths straight to `.tsx`/`.ts` source. Import sites use `@workspace/pico-ui/<component>` (e.g. `@workspace/pico-ui/button`), `@workspace/pico-ui/utils` for `cn`, and `@workspace/pico-ui/hooks/use-toast`.
- App code that did `@/components/ui/X` / `@/hooks/X` was rewritten to the package paths. `nacho`'s `src/lib/utils.ts` is now just `export { cn } from "@workspace/pico-ui/utils"`.
- Inside the lib, components cross-import via relative paths (`./button`, `../lib/utils`, `../hooks/use-toast`).

**Why the `@source` line matters:** Tailwind v4 auto content-detection ignores `node_modules`. Since the lib is consumed via the `node_modules/@workspace/pico-ui` symlink, classes that appear ONLY in lib component source (e.g. `cva` variant strings) would be dropped from the build. Each app's `index.css` therefore has `@source "../../../lib/pico-ui/src";` — do not remove it, or component styling silently breaks.

**How to apply:** add new shared components to `lib/pico-ui/src/components`, add a matching `./<name>` entry only if you need a non-`.tsx` extension (the `./*` wildcard already covers `.tsx`). `useToast` must stay a single module instance shared between the `Toaster` and page callers — never re-add a per-app copy.
