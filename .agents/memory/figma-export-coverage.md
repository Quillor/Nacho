---
name: Figma export coverage (components, icons, spacing, typography)
description: How the Pico Figma plugin stays one-to-one with the website across components, icons, spacing, and type.
---

The Figma plugin export is kept in lockstep with the website along four axes.
The agent cannot see Figma — a human verifies via screenshots — so everything
else (typecheck, build, tokens.json, render attrs, doc/landing render) must be
self-verified before handing off.

## Single source of truth flows
- **Spacing**: `theme.css --space-*` (4px grid) → `generate-tokens.mjs` emits a
  `spacing` map ({px,rem}) into `tokens.json` → plugin `tokens.ts` makes FLOAT
  `space/<key>` variables → doc site spacing page reads `tokens.json` → page
  reconstruction binds auto-layout itemSpacing/padding to a `space/` var when a
  captured px matches a token.
- **Typography**: `theme.css --text-*`/`--leading-*` → `typography.scale` in
  `tokens.json` ({size,lineHeight,weight,font,transform,tracking}) → plugin
  builds named text styles with explicit PERCENT line-height → page
  reconstruction reads `data-pico-lh`/`data-pico-ta` and applies lineHeight +
  textAlignHorizontal per text leaf.

**Why:** any drift between these layers shows up as a Figma export that doesn't
match the live site. Edit the token at the theme source, never downstream.

## Icons are scanned, not hand-listed
`gen-assets.mjs` scans `artifacts/{nacho,admin,pico}/src` + `lib/pico-ui/src`
for `lucide-react` named imports, kebab-cases them (stripping a trailing
"Icon"), and reads the matching SVG from `lucide-static/icons/*.svg`. Output is
`src/generated/assets.json` ({logos, icons}). `lucide-static` version must match
the `lucide-react` catalog pin or icons go missing/wrong. `build.mjs` regenerates
assets.json on every code build (committed like tokens.json so typecheck works
without a prior build). The "Sync icons" button builds one Figma component per
icon on the plugin-owned "Pico / Icons" page (cleared + rebuilt each run); icon
strokes/fills bind to the `color/foreground` variable.

## Logo/Navbar/Footer builders
Logo imports the two brand SVGs via `createNodeFromSvg` + `rescale` (variants
`wordmark`/`mark`); its hardcoded brand hex is intentional (literal brand
colors). Navbar (`state=signed-in|signed-out`) and Footer instance the Logo +
Button sets, so Logo and Button must come before them in the `BUILDERS` array.
Single-side nav/footer rules use per-side `strokeTopWeight`/`strokeBottomWeight`
(set the others to 0) since Figma strokes are otherwise uniform.
