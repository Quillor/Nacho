#!/usr/bin/env node
/*
 * Pico token manifest generator.
 *
 * Parses theme.css (the single source of truth for Pico design tokens) and emits
 * a machine-readable tokens.json that a Figma plugin can consume to map raw
 * colors/spacing/shadows back to named Pico tokens.
 *
 * No dependencies — plain Node. Deterministic output (no timestamps) so repeated
 * runs produce byte-identical manifests.
 *
 *   node scripts/generate-tokens.mjs
 */

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const themePath = join(__dirname, "..", "theme.css")
const outPath = join(__dirname, "..", "tokens.json")

const css = readFileSync(themePath, "utf8")

/** Extract the body of a top-level `selector { ... }` block. */
function extractBlock(source, selector) {
  const start = source.indexOf(selector)
  if (start === -1) return ""
  const open = source.indexOf("{", start)
  if (open === -1) return ""
  let depth = 0
  for (let i = open; i < source.length; i++) {
    const ch = source[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return ""
}

/** Parse `--name: value;` declarations from a block body into a Map. */
function parseDeclarations(block) {
  const decls = new Map()
  const re = /--([\w-]+)\s*:\s*([^;]+);/g
  let m
  while ((m = re.exec(block)) !== null) {
    decls.set(m[1].trim(), m[2].trim())
  }
  return decls
}

/** "47 91% 53%" -> { h, s, l } numbers, or null if not an HSL triple. */
function parseHslTriple(value) {
  const m = value
    .trim()
    .match(/^(-?\d*\.?\d+)\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%$/)
  if (!m) return null
  return { h: parseFloat(m[1]), s: parseFloat(m[2]), l: parseFloat(m[3]) }
}

/** HSL (h deg, s%, l%) -> "#rrggbb". */
function hslToHex({ h, s, l }) {
  const sN = s / 100
  const lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = lN - c / 2
  const toHex = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

/** Build the color token map for one theme (light/dark). */
function buildColors(decls) {
  const colors = {}
  for (const [name, value] of decls) {
    const hsl = parseHslTriple(value)
    if (!hsl) continue
    colors[name] = {
      hsl: value,
      css: `hsl(${value})`,
      hex: hslToHex(hsl),
    }
  }
  return colors
}

/** Build the chunky offset shadow scale (resolves the foreground color). */
function buildShadows(decls, foregroundHex) {
  const shadows = {}
  for (const [name, value] of decls) {
    if (name !== "shadow" && !name.startsWith("shadow-")) continue
    const key = name === "shadow" ? "DEFAULT" : name.replace("shadow-", "")
    shadows[key] = {
      raw: value,
      resolved: value.replace(/hsl\(var\(--foreground\)\)/g, foregroundHex),
    }
  }
  return shadows
}

const rootBlock = extractBlock(css, ":root {")
const darkBlock = extractBlock(css, ".dark {")
const themeInlineBlock = extractBlock(css, "@theme inline {")

const root = parseDeclarations(rootBlock)
const dark = parseDeclarations(darkBlock)
const themeInline = parseDeclarations(themeInlineBlock)

const lightColors = buildColors(root)
const darkColors = buildColors(dark)

/* Primitive ramp hues. Keys like `yellow-500` are mode-independent primitives,
 * not semantic theme tokens, so we lift them out of the semantic color maps
 * into a grouped `primitives` collection (hue → ordered shades). This keeps
 * `colors.light/dark` purely semantic while exposing the full ramp to the
 * Colors page and the Figma plugin as a separate primitive collection. */
const RAMP_HUES = ["yellow", "brown", "red"]
const RAMP_RE = new RegExp(`^(${RAMP_HUES.join("|")})-(\\d+)$`)

function extractPrimitives(colorMap) {
  const primitives = {}
  for (const name of Object.keys(colorMap)) {
    const m = name.match(RAMP_RE)
    if (!m) continue
    const [, hue, step] = m
    ;(primitives[hue] ??= []).push({ step: parseInt(step, 10), ...colorMap[name] })
    delete colorMap[name]
  }
  for (const hue of Object.keys(primitives)) {
    primitives[hue].sort((a, b) => a.step - b.step)
  }
  // Preserve declaration order of hues as listed in RAMP_HUES.
  const ordered = {}
  for (const hue of RAMP_HUES) {
    if (primitives[hue]) ordered[hue] = primitives[hue]
  }
  return ordered
}

// Primitives live only in :root (light); extract from both maps so any that
// also appear in .dark are removed from the semantic dark map too.
const primitives = extractPrimitives(lightColors)
extractPrimitives(darkColors)

// `card`/`card-foreground`/`card-border` are deprecated aliases of the base
// surface (they resolve to the same values as background/foreground/border).
// They are kept in theme.css only so the legacy `bg-card`/`text-card-foreground`
// Tailwind utilities keep working, but they are intentionally excluded from the
// token manifest (and therefore from the Figma variable set and the Colors
// docs) so the documented design tokens stay deduplicated. The Figma resolver
// maps them onto the `surface/*` group via `colorAliases` below.
const DEPRECATED_COLOR_TOKENS = ["card", "card-foreground", "card-border"]
for (const key of DEPRECATED_COLOR_TOKENS) {
  delete lightColors[key]
  delete darkColors[key]
}

/* Semantic token families. Tokens that are used together (a surface fill, the
 * text laid on it, and any matching border) are grouped so Figma can emit them
 * under paired, self-describing variable names — e.g. `danger/danger-background`,
 * `danger/danger-foreground`, `danger/danger-border`. The `token` is the CSS
 * custom property / Tailwind suffix (the contract consumed across the apps);
 * `role` is the slot within the family (background | foreground | border | ring).
 * The Figma variable name is always `<group>/<group>-<role>`. */
const SEMANTIC_GROUPS = [
  {
    group: "primary",
    label: "Primary",
    blurb: "Page canvas, body ink, and hairline borders.",
    roles: [
      { role: "background", token: "background" },
      { role: "element", token: "foreground" },
      { role: "border", token: "border" },
      {
        role: "accent-foreground",
        token: "accent-on-primary",
        figma: "primary/accent-foreground",
      },
    ],
  },
  {
    group: "accent",
    label: "Accent",
    blurb: "Golden-yellow accent fill and the brown element on it. High-contrast highlights.",
    roles: [
      { role: "background", token: "accent" },
      { role: "element", token: "accent-foreground" },
    ],
  },
  {
    group: "inverse",
    label: "Inverse",
    blurb: "Deep-brown inverse fill and the warm element on it. Strong contrast.",
    roles: [
      { role: "background", token: "primary" },
      { role: "element", token: "primary-foreground" },
    ],
  },
  {
    group: "secondary",
    label: "Secondary",
    blurb: "Quiet supporting surface for secondary information.",
    roles: [
      { role: "background", token: "secondary" },
      { role: "element", token: "secondary-foreground" },
    ],
  },
  {
    group: "muted",
    label: "Muted",
    blurb: "Low-emphasis surface and the muted element on it.",
    roles: [
      { role: "background", token: "muted" },
      { role: "element", token: "muted-foreground" },
    ],
  },
  {
    group: "danger",
    label: "Danger",
    blurb: "Destructive / irreversible actions: red fill, element, and maroon border.",
    roles: [
      { role: "background", token: "destructive" },
      { role: "element", token: "destructive-foreground" },
      { role: "border", token: "destructive-border" },
    ],
  },
]

/** Build the grouped semantic token manifest (paired Figma names + values). */
function buildSemanticGroups() {
  return SEMANTIC_GROUPS.map((g) => ({
    group: g.group,
    label: g.label,
    blurb: g.blurb,
    tokens: g.roles
      .filter((r) => lightColors[r.token])
      .map((r) => ({
        role: r.role,
        token: r.token,
        tailwind: r.token,
        figmaName: r.figma ?? `${g.group}/${g.group}-${r.role}`,
        light: lightColors[r.token],
        dark: darkColors[r.token] ?? lightColors[r.token],
      })),
  }))
}

const semanticGroups = buildSemanticGroups()

/** Map deprecated/legacy color token names onto their grouped Figma variable so
 * the Figma component builders keep resolving them after the rename. */
const colorAliases = {
  card: "primary/primary-background",
  "card-foreground": "primary/primary-element",
  "card-border": "primary/primary-border",
}

const lightForegroundHex = lightColors.foreground?.hex ?? "#000000"
const darkForegroundHex = darkColors.foreground?.hex ?? "#FFFFFF"

const radiusBase = root.get("radius") ?? "0.25rem"
const radiusScale = {}
for (const [name, value] of themeInline) {
  if (name.startsWith("radius-")) {
    radiusScale[name.replace("radius-", "")] = value
  }
}

/** Spacing scale: `--space-<key>` (rem) → { rem, px }. Ordered by px value. */
function buildSpacing(decls) {
  const out = {}
  for (const [name, value] of decls) {
    if (!name.startsWith("space-")) continue
    const key = name.replace("space-", "")
    const rem = value.trim()
    out[key] = { rem, px: Math.round(parseFloat(rem) * 16) }
  }
  return out
}

// Design-system metadata for each type role. Sizes and line-heights come from
// theme.css (`--text-*` / `--leading-*`); family, weight, transform and tracking
// are encoded here since they are constants of the Pico type system.
const TYPE_META = {
  display: { font: "display", weight: 800, transform: "none", letterSpacing: "-0.02em" },
  h1: { font: "display", weight: 800, transform: "none", letterSpacing: "-0.02em" },
  h2: { font: "display", weight: 800, transform: "none", letterSpacing: "-0.01em" },
  h3: { font: "display", weight: 800, transform: "none", letterSpacing: "-0.01em" },
  h4: { font: "display", weight: 800, transform: "none", letterSpacing: "0em" },
  "body-lg": { font: "body", weight: 500, transform: "none", letterSpacing: "0em" },
  body: { font: "body", weight: 400, transform: "none", letterSpacing: "0em" },
  caption: { font: "body", weight: 700, transform: "uppercase", letterSpacing: "0.04em" },
}

/** Type scale: merge `--text-<role>` / `--leading-<role>` with TYPE_META. */
function buildTypeScale(decls) {
  const out = {}
  for (const role of Object.keys(TYPE_META)) {
    const sizeRem = decls.get(`text-${role}`)
    if (!sizeRem) continue
    const leading = decls.get(`leading-${role}`)
    const meta = TYPE_META[role]
    out[role] = {
      size: sizeRem.trim(),
      sizePx: Math.round(parseFloat(sizeRem) * 16),
      lineHeight: leading ? parseFloat(leading) : 1.5,
      fontKey: meta.font,
      fontFamily:
        meta.font === "display"
          ? "var(--app-font-display)"
          : "var(--app-font-sans)",
      fontWeight: meta.weight,
      textTransform: meta.transform,
      letterSpacing: meta.letterSpacing,
    }
  }
  return out
}

const spacing = buildSpacing(root)
const typeScale = buildTypeScale(root)

const tokens = {
  $schema: "https://pico.design/tokens.schema.json",
  name: "Pico Design System",
  source: "@workspace/pico-theme/theme.css",
  colors: {
    light: lightColors,
    dark: darkColors,
  },
  semanticGroups,
  colorAliases,
  primitives,
  fonts: {
    sans: root.get("app-font-sans") ?? null,
    serif: root.get("app-font-serif") ?? null,
    mono: root.get("app-font-mono") ?? null,
    display: root.get("app-font-display") ?? null,
  },
  typography: {
    headingFontFamily: "var(--app-font-display)",
    headingFontWeight: 800,
    bodyFontFamily: "var(--app-font-sans)",
    scale: typeScale,
  },
  spacing,
  radius: {
    base: radiusBase,
    scale: radiusScale,
  },
  shadows: {
    light: buildShadows(root, lightForegroundHex),
    dark: buildShadows(dark, darkForegroundHex),
  },
}

writeFileSync(outPath, JSON.stringify(tokens, null, 2) + "\n", "utf8")
console.log(`Wrote ${outPath}`)
