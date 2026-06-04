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

const lightForegroundHex = lightColors.foreground?.hex ?? "#000000"
const darkForegroundHex = darkColors.foreground?.hex ?? "#FFFFFF"

const radiusBase = root.get("radius") ?? "0.25rem"
const radiusScale = {}
for (const [name, value] of themeInline) {
  if (name.startsWith("radius-")) {
    radiusScale[name.replace("radius-", "")] = value
  }
}

const tokens = {
  $schema: "https://pico.design/tokens.schema.json",
  name: "Pico Design System",
  source: "@workspace/pico-theme/theme.css",
  colors: {
    light: lightColors,
    dark: darkColors,
  },
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
  },
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
