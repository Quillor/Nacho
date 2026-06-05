// Token sync — maps the Pico token manifest into native Figma variables
// (Light/Dark modes), text styles, and effect styles. Idempotent.

import {
  tokens as bundledTokens,
  colorTokenNames,
  RADIUS_KEYS,
  SHADOW_KEYS,
  SPACE_KEYS,
  TYPE_ROLE_KEYS,
  hslToRgb01,
  hexToRgb01,
  parseShadow,
  type PicoTokens,
} from "../shared/tokens";
import {
  getOrCreateCollection,
  getOrCreateVariable,
  getModeId,
  getOrCreateEffectStyle,
  getOrCreateRoleTextStyle,
  getOrCreateScaleTextStyle,
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
  tokens: PicoTokens = bundledTokens,
): Promise<{
  colors: number;
  radius: number;
  spacing: number;
  shadows: number;
  text: number;
}> {
  await ensureFonts();
  const collection = await getOrCreateCollection();
  const lightId = getModeId(collection, MODE_LIGHT);
  const darkId = getModeId(collection, MODE_DARK);

  // --- Colors (Light + Dark modes) ---
  let colorCount = 0;
  for (const name of colorTokenNames(tokens)) {
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

  // --- Spacing scale (number variables) for auto-layout gap / padding / size ---
  let spacingCount = 0;
  for (const key of SPACE_KEYS) {
    const sp = tokens.spacing[key];
    if (!sp) continue;
    const variable = await getOrCreateVariable(
      `space/${key}`,
      collection,
      "FLOAT",
    );
    variable.setValueForMode(lightId, sp.px);
    variable.setValueForMode(darkId, sp.px);
    variable.scopes = ["GAP", "WIDTH_HEIGHT"];
    spacingCount++;
  }
  log(`Spacing: ${spacingCount} variables`);

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
  // The documented type ramp. Component/page builders bind to these by role+size
  // (and create any extra role+size combos they need on demand).
  const textRoles: Array<{ role: string; font: FontName; size: number }> = [
    { role: "display", font: fonts.display, size: 40 },
    { role: "display", font: fonts.display, size: 24 },
    { role: "heading", font: fonts.display, size: 28 },
    { role: "body", font: fonts.body, size: 16 },
    { role: "body", font: fonts.body, size: 14 },
    { role: "bold", font: fonts.bold, size: 16 },
    { role: "bold", font: fonts.bold, size: 14 },
    { role: "mono", font: fonts.mono, size: 14 },
  ];
  for (const r of textRoles) {
    await getOrCreateRoleTextStyle(r.role, r.size, r.font);
    textCount++;
  }
  // Semantic named type styles from the Pico type scale (size + line-height +
  // tracking), e.g. "Pico/Type/Display", "Pico/Type/H1", "Pico/Type/Body".
  for (const roleKey of TYPE_ROLE_KEYS) {
    const role = tokens.typography.scale[roleKey];
    if (!role) continue;
    const font =
      role.fontKey === "display"
        ? fonts.display
        : role.fontWeight >= 700
          ? fonts.bold
          : fonts.body;
    await getOrCreateScaleTextStyle(roleKey, role, font);
    textCount++;
  }
  log(`Typography: ${textCount} text styles`);

  return {
    colors: colorCount,
    radius: radiusCount,
    spacing: spacingCount,
    shadows: shadowCount,
    text: textCount,
  };
}
