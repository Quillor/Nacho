// Token sync — maps the Pico token manifest into native Figma variables
// (Light/Dark modes), text styles, and effect styles. Idempotent.

import {
  tokens,
  COLOR_TOKEN_NAMES,
  RADIUS_KEYS,
  SHADOW_KEYS,
  hslToRgb01,
  hexToRgb01,
  parseShadow,
} from "../shared/tokens";
import {
  getOrCreateCollection,
  getOrCreateVariable,
  getModeId,
  getOrCreateEffectStyle,
  getOrCreateTextStyle,
  ensureFonts,
  effectStyleName,
  MODE_LIGHT,
  MODE_DARK,
} from "./figma-helpers";

/** Convert a CSS rem/px string to a number of px (16px base). */
function toPx(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith("rem")) return parseFloat(trimmed) * 16;
  if (trimmed.endsWith("px")) return parseFloat(trimmed);
  return parseFloat(trimmed) || 0;
}

/**
 * Resolve a radius scale entry like "calc(var(--radius) - 2px)" against the
 * base radius into a concrete px number.
 */
function resolveRadiusPx(expr: string, basePx: number): number {
  if (expr.includes("var(--radius)")) {
    const m = expr.match(/([+-])\s*(\d+)px/);
    if (m) {
      const delta = parseInt(m[2], 10) * (m[1] === "-" ? -1 : 1);
      return basePx + delta;
    }
    return basePx;
  }
  return toPx(expr);
}

export async function syncTokens(
  log: (msg: string) => void,
): Promise<{ colors: number; radius: number; shadows: number; text: number }> {
  await ensureFonts();
  const collection = await getOrCreateCollection();
  const lightId = getModeId(collection, MODE_LIGHT);
  const darkId = getModeId(collection, MODE_DARK);

  // --- Colors (Light + Dark modes) ---
  let colorCount = 0;
  for (const name of COLOR_TOKEN_NAMES) {
    const variable = await getOrCreateVariable(
      `color/${name}`,
      collection,
      "COLOR",
    );
    const light = tokens.colors.light[name];
    const dark = tokens.colors.dark[name] ?? light;
    variable.setValueForMode(lightId, hslToRgb01(light.hsl));
    variable.setValueForMode(darkId, hslToRgb01(dark.hsl));
    variable.scopes = ["ALL_SCOPES"];
    colorCount++;
  }
  log(`Colors: ${colorCount} variables (Light + Dark)`);

  // --- Radius scale (number variables) ---
  const basePx = toPx(tokens.radius.base);
  let radiusCount = 0;
  for (const key of RADIUS_KEYS) {
    const expr = tokens.radius.scale[key];
    if (!expr) continue;
    const variable = await getOrCreateVariable(
      `radius/${key}`,
      collection,
      "FLOAT",
    );
    const px = resolveRadiusPx(expr, basePx);
    variable.setValueForMode(lightId, px);
    variable.setValueForMode(darkId, px);
    variable.scopes = ["CORNER_RADIUS"];
    radiusCount++;
  }
  log(`Radius: ${radiusCount} variables`);

  // --- Effect styles (chunky offset shadows), Light + Dark via styles ---
  // Figma effect styles are single-mode, so we encode the light (brown) shadow
  // which is the canonical brand look; the resolved color comes from the token.
  let shadowCount = 0;
  for (const key of SHADOW_KEYS) {
    const light = tokens.shadows.light[key];
    if (!light) continue;
    const parsed = parseShadow(light.resolved);
    if (!parsed) continue;
    const style = await getOrCreateEffectStyle(effectStyleName(key));
    const rgb = hexToRgb01(parsed.hex);
    const effect: DropShadowEffect = {
      type: "DROP_SHADOW",
      color: { r: rgb.r, g: rgb.g, b: rgb.b, a: 1 },
      offset: { x: parsed.offsetX, y: parsed.offsetY },
      radius: parsed.blur,
      spread: parsed.spread,
      visible: true,
      blendMode: "NORMAL",
    };
    style.effects = [effect];
    shadowCount++;
  }
  log(`Shadows: ${shadowCount} effect styles`);

  // --- Text styles (font roles) ---
  const fonts = await ensureFonts();
  let textCount = 0;
  const textRoles: Array<{ name: string; font: FontName; size: number }> = [
    { name: "Pico/Display", font: fonts.display, size: 48 },
    { name: "Pico/Heading", font: fonts.display, size: 28 },
    { name: "Pico/Body", font: fonts.body, size: 16 },
    { name: "Pico/Body Bold", font: fonts.bold, size: 16 },
    { name: "Pico/Mono", font: fonts.mono, size: 14 },
  ];
  for (const role of textRoles) {
    const style = await getOrCreateTextStyle(role.name);
    style.fontName = role.font;
    style.fontSize = role.size;
    textCount++;
  }
  log(`Typography: ${textCount} text styles`);

  return {
    colors: colorCount,
    radius: radiusCount,
    shadows: shadowCount,
    text: textCount,
  };
}
