// Typed access to the Pico token manifest (the single source of truth produced
// from lib/pico-theme/theme.css). Bundled at build time via esbuild's JSON
// loader, so the plugin never parses raw CSS at runtime.

import rawTokens from "@workspace/pico-theme/tokens.json";

export interface ColorToken {
  hsl: string;
  css: string;
  hex: string;
}
export interface ShadowToken {
  raw: string;
  resolved: string;
}

export interface PicoTokens {
  name: string;
  source: string;
  colors: {
    light: Record<string, ColorToken>;
    dark: Record<string, ColorToken>;
  };
  fonts: { sans: string; serif: string; mono: string; display: string };
  typography: {
    headingFontFamily: string;
    headingFontWeight: number;
    bodyFontFamily: string;
  };
  radius: { base: string; scale: Record<string, string> };
  shadows: {
    light: Record<string, ShadowToken>;
    dark: Record<string, ShadowToken>;
  };
}

export const tokens = rawTokens as unknown as PicoTokens;

/** Ordered list of color token names (light mode is authoritative for keys). */
export const COLOR_TOKEN_NAMES = Object.keys(tokens.colors.light);

/** Color token names for an arbitrary token set (light mode is authoritative). */
export function colorTokenNames(set: PicoTokens): string[] {
  return Object.keys(set.colors.light);
}

/**
 * Validate that an arbitrary parsed JSON value has the shape of a Pico token
 * manifest. Throws with a human-readable message on the first missing piece so
 * a bad fetched URL fails loudly (and the caller can fall back to bundled).
 */
export function validatePicoTokens(data: unknown): PicoTokens {
  const fail = (why: string): never => {
    throw new Error(`Not a valid Pico tokens manifest: ${why}.`);
  };
  if (typeof data !== "object" || data === null) fail("expected a JSON object");
  const d = data as Record<string, unknown>;
  const colors = d.colors as { light?: unknown; dark?: unknown } | undefined;
  if (!colors || typeof colors !== "object") fail("missing `colors`");
  const light = colors!.light as Record<string, unknown> | undefined;
  const dark = colors!.dark as Record<string, unknown> | undefined;
  if (!light || typeof light !== "object" || Object.keys(light).length === 0) {
    fail("missing `colors.light`");
  }
  if (!dark || typeof dark !== "object") fail("missing `colors.dark`");
  const radius = d.radius as { base?: unknown; scale?: unknown } | undefined;
  if (!radius || typeof radius.base !== "string" || typeof radius.scale !== "object") {
    fail("missing `radius.base` / `radius.scale`");
  }
  const shadows = d.shadows as { light?: unknown; dark?: unknown } | undefined;
  if (!shadows || typeof shadows.light !== "object") fail("missing `shadows.light`");
  if (!d.fonts || typeof d.fonts !== "object") fail("missing `fonts`");
  return data as PicoTokens;
}

/** Radius token keys in scale order. */
export const RADIUS_KEYS = ["sm", "md", "lg", "xl"] as const;

/** Shadow token keys in scale order (DEFAULT is the unsuffixed `--shadow`). */
export const SHADOW_KEYS = [
  "2xs",
  "xs",
  "sm",
  "DEFAULT",
  "md",
  "lg",
  "xl",
  "2xl",
] as const;

/** Convert "47 43% 94%" (HSL components) → {r,g,b} in 0..1 for Figma. */
export function hslToRgb01(hslComponents: string): {
  r: number;
  g: number;
  b: number;
} {
  const m = hslComponents
    .trim()
    .split(/\s+/)
    .map((p) => parseFloat(p));
  const h = m[0] ?? 0;
  const s = (m[1] ?? 0) / 100;
  const l = (m[2] ?? 0) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const mAdd = l - c / 2;
  return { r: r + mAdd, g: g + mAdd, b: b + mAdd };
}

/** "#F4C51A" → {r,g,b} in 0..1. */
export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const n = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16,
  );
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
}

/** Parse the chunky offset shadow string into Figma DROP_SHADOW geometry. */
export function parseShadow(resolved: string): {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  hex: string;
} | null {
  // e.g. "6px 6px 0px 0px #2E1C0F"
  const m = resolved.match(
    /(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(#[0-9a-fA-F]{3,8})/,
  );
  if (!m) return null;
  return {
    offsetX: parseInt(m[1], 10),
    offsetY: parseInt(m[2], 10),
    blur: parseInt(m[3], 10),
    spread: parseInt(m[4], 10),
    hex: m[5],
  };
}

/** Build a hex(lowercased) → token name map for resolving raw colors to tokens. */
export function buildHexToTokenMap(
  mode: "light" | "dark" = "light",
): Record<string, string> {
  const out: Record<string, string> = {};
  const set = tokens.colors[mode];
  // Prefer the most "semantic" names by inserting in declaration order; later
  // duplicates do not overwrite earlier (more primary) names.
  for (const name of Object.keys(set)) {
    const hex = set[name].hex.toLowerCase();
    if (!(hex in out)) out[hex] = name;
  }
  return out;
}
