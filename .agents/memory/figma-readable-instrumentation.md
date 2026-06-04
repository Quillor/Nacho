---
name: Figma-readable instrumentation
description: How Pico surfaces expose machine-readable component/token/section metadata for a Figma plugin to reconstruct a live page.
---

# Figma-readable instrumentation

Three single-source-of-truth layers let a Figma plugin read a live URL and rebuild it:

- **Component identity + variants** live in `@workspace/pico-ui` via `picoMeta(component, variants)`
  (`lib/pico-ui/src/lib/pico-meta.ts`). Each instrumented component spreads it on its root,
  emitting `data-pico-component` (canonical = Figma component name) and `data-pico-<axis>`
  (variant property values). Only `null`/`undefined` axes are skipped — explicit `false`
  is preserved so boolean variants serialize. Spread BEFORE `{...props}` so a caller can
  still override.
- **Tokens** derive from the single theme source `@workspace/pico-theme/theme.css` via
  `scripts/generate-tokens.mjs` → `tokens.json` (exported as `./tokens.json`). Generator is
  plain node, no deps, deterministic (no timestamp). HSL is authoritative; hex is computed.
- **Sections / landmarks**: surfaces use semantic landmarks plus `data-pico-section="<name>"`
  on each region (hero, features, navbar, content, sidebar, etc.).

**Why:** the contract is *names*. `data-pico-component` / token keys / section names must stay
stable — the (separate, downstream) plugin maps against them.

**How to apply:** stamp EVERY exported sub-part with its OWN name, not just the Content root.
Three patterns: (1) component renders a DOM element → spread `picoMeta("Name")` before
`{...props}`; (2) alias re-export that renders DOM (e.g. `const Trigger = Primitive.Trigger`)
→ convert to a thin `forwardRef` wrapper that stamps; (3) pass-through wrapper whose root is
ANOTHER pico-ui component (e.g. `PaginationPrevious` → `<PaginationLink>`) → stamp the
wrapper's name on that child element; the child's own picoMeta runs first and the later spread
wins, so the wrapper identity is what reaches the DOM (this compiles fine). After editing
theme.css, rerun `generate-tokens` so `tokens.json` stays in sync.

**Generator granularity (page reconstruction):** the plugin's page resolver matches a parsed
node by its exact `data-pico-component` name and, on a hit, places an INSTANCE and RETURNS —
it does NOT recurse into that node's children. So Figma component generators must be authored
at the granularity the DOM actually emits and at the level that carries the visual identity.
For composites this means generating the emitted sub-part names (e.g. `TabsList` containing its
triggers, `SelectTrigger`, `DialogContent`, `AccordionItem`, `RadioGroupItem`, `PopoverContent`),
NOT an outer wrapper like `Tabs`/`Select` that never renders the box. A generator named for a
name the DOM never emits (the old `Tooltip` vs emitted `TooltipTrigger`/`TooltipContent`) will
never resolve. The generator's component/set `.name` IS the match key.

**Coverage gate:** `pnpm --filter @workspace/pico-ui run check-pico-meta` (also the `pico-meta`
validation command) is AST-based and PER-COMPONENT: it enumerates every exported PascalCase
component and FAILS unless each one calls `picoMeta(` or is in the script's ALLOWLIST. Only
genuine non-DOM components belong in the ALLOWLIST (Radix Root/Provider/Portal/Sub whose props
reject data-*, react-hook-form Form/FormField, Recharts Chart* config, pure composers like
Toaster/CommandDialog) — each with a reason. Run with `--list` to see OK/ALLOW/MISS per
component. Do NOT allowlist a DOM-rendering component just to silence it.
