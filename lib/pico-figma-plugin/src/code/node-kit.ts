// Reusable node builders that bind fills/strokes/radius/effects to the synced
// Pico variables and styles. Used by component generation, page reconstruction,
// and placeholder pages so everything stays token-bound (not hardcoded).

import {
  applyFill,
  applyStroke,
  applyShadow,
  findColorVariable,
  ensureFonts,
} from "./figma-helpers";
import { tokens, hexToRgb01, RADIUS_KEYS } from "../shared/tokens";

let cachedFonts: Awaited<ReturnType<typeof ensureFonts>> | null = null;
export async function fonts() {
  if (!cachedFonts) cachedFonts = await ensureFonts();
  return cachedFonts;
}

export interface FrameOptions {
  name?: string;
  direction?: "row" | "column" | "none";
  gap?: number;
  paddingX?: number;
  paddingY?: number;
  bgToken?: string;
  bgHex?: string;
  radiusToken?: string;
  radiusPx?: number;
  strokeToken?: string;
  strokeWeight?: number;
  shadowToken?: string;
  align?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  cross?: "MIN" | "CENTER" | "MAX";
  width?: number;
  height?: number;
  fillWidth?: boolean;
}

/** Resolve a radius token key (sm/md/lg/xl) to its px value from the manifest. */
function radiusPxFor(key: string): number {
  const base = parseFloat(tokens.radius.base) * 16;
  const expr = tokens.radius.scale[key] || "";
  const m = expr.match(/([+-])\s*(\d+)px/);
  if (m) return base + parseInt(m[2], 10) * (m[1] === "-" ? -1 : 1);
  return base;
}

/** Container nodes that share the auto-layout + geometry surface we style. */
type Container = FrameNode | ComponentNode | InstanceNode;

/** Apply layout, fills, radius, stroke and shadow to any container node. */
export async function applyContainerStyle(
  node: Container,
  opts: FrameOptions,
): Promise<void> {
  node.fills = [];
  node.clipsContent = false;

  if (opts.direction && opts.direction !== "none") {
    node.layoutMode = opts.direction === "row" ? "HORIZONTAL" : "VERTICAL";
    node.itemSpacing = opts.gap ?? 0;
    node.paddingLeft = node.paddingRight = opts.paddingX ?? 0;
    node.paddingTop = node.paddingBottom = opts.paddingY ?? 0;
    node.primaryAxisSizingMode = "AUTO";
    node.counterAxisSizingMode = "AUTO";
    if (opts.align) node.primaryAxisAlignItems = opts.align;
    if (opts.cross) node.counterAxisAlignItems = opts.cross;
  }

  if (opts.bgToken || opts.bgHex) {
    await applyFill(
      node as unknown as GeometryMixin & { fills: Paint[] },
      opts.bgToken,
      opts.bgHex ? hexToRgb01(opts.bgHex) : undefined,
    );
  }

  if (opts.radiusToken && RADIUS_KEYS.includes(opts.radiusToken as never)) {
    const variable = await figmaRadiusVariable(opts.radiusToken);
    if (variable) {
      node.setBoundVariable("topLeftRadius", variable);
      node.setBoundVariable("topRightRadius", variable);
      node.setBoundVariable("bottomLeftRadius", variable);
      node.setBoundVariable("bottomRightRadius", variable);
    } else {
      node.cornerRadius = radiusPxFor(opts.radiusToken);
    }
  } else if (typeof opts.radiusPx === "number") {
    node.cornerRadius = opts.radiusPx;
  }

  if (opts.strokeToken) {
    await applyStroke(node, opts.strokeToken, opts.strokeWeight ?? 2);
  }
  if (opts.shadowToken) {
    await applyShadow(node, opts.shadowToken);
  }

  if (opts.width) node.resize(opts.width, node.height);
  if (opts.height) node.resize(node.width, opts.height);
}

export async function makeFrame(opts: FrameOptions): Promise<FrameNode> {
  const frame = figma.createFrame();
  if (opts.name) frame.name = opts.name;
  await applyContainerStyle(frame, opts);
  return frame;
}

async function figmaRadiusVariable(key: string): Promise<Variable | null> {
  const all = await figma.variables.getLocalVariablesAsync();
  return all.find((v) => v.name === `radius/${key}`) || null;
}

export interface TextOptions {
  text: string;
  role?: "display" | "heading" | "body" | "bold" | "mono";
  size?: number;
  colorToken?: string;
  colorHex?: string;
  uppercase?: boolean;
}

export async function makeText(opts: TextOptions): Promise<TextNode> {
  const f = await fonts();
  const node = figma.createText();
  const role = opts.role ?? "body";
  const font =
    role === "display" || role === "heading"
      ? f.display
      : role === "bold"
        ? f.bold
        : role === "mono"
          ? f.mono
          : f.body;
  node.fontName = font;
  node.characters = opts.uppercase ? opts.text.toUpperCase() : opts.text;
  node.fontSize =
    opts.size ??
    (role === "display" ? 40 : role === "heading" ? 24 : role === "mono" ? 13 : 15);
  await applyFill(
    node as unknown as GeometryMixin & { fills: Paint[] },
    opts.colorToken ?? "foreground",
    opts.colorHex ? hexToRgb01(opts.colorHex) : undefined,
  );
  return node;
}

/** Resolve an rgb for a token (used where a raw color is unavoidable). */
export async function tokenRgb(name: string) {
  const variable = await findColorVariable(name);
  if (variable) return undefined; // caller should bind instead
  return hexToRgb01(tokens.colors.light[name]?.hex ?? "#000000");
}
