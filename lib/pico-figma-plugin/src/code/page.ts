// Page reconstruction — turns the parsed page tree (built in the UI from the
// Figma-readable instrumentation) into a Figma frame at the chosen device size.
//
// The page is rebuilt with real Figma AUTO-LAYOUT that mirrors the HTML: each
// container becomes an auto-layout frame whose direction (row/column/grid-wrap),
// item spacing, padding, and primary/counter alignment come from the captured
// CSS, while hug/fill/fixed sizing is inferred from each element's rendered box.
// Nodes that carry a `data-pico-component` identity are placed as INSTANCES of
// the matching Figma component + variant. Navbar/header/footer sections are
// wrapped as Figma components so they sync. Idempotent: re-running replaces the
// page's prior frame.

import type { ParsedPage, ParsedNode, DeviceSize } from "../shared/messages";
import {
  getOrCreatePage,
  removeChildByName,
  PAGES_PAGE,
  applyFill,
  findSpaceVariable,
} from "./figma-helpers";
import { applyContainerStyle, makeText, fonts } from "./node-kit";

/** Section landmarks that should be wrapped as reusable Figma components. */
const SECTION_COMPONENTS = new Set(["navbar", "nav", "header", "footer"]);

/** A child is treated as "filling" its parent when it spans ~this much of the
 * parent's inner content size along an axis. */
const FILL_RATIO = 0.9;

/**
 * Resolve Pico components by canonical name across the local file and any
 * library components already present in the document. Built once per run.
 */
class ComponentResolver {
  private sets = new Map<string, ComponentSetNode>();
  private singles = new Map<string, ComponentNode>();

  async build() {
    await figma.loadAllPagesAsync();
    // 1) Local components defined in this file.
    const local = figma.root.findAllWithCriteria({
      types: ["COMPONENT_SET", "COMPONENT"],
    });
    for (const node of local) {
      if (node.type === "COMPONENT_SET") {
        if (!this.sets.has(node.name)) this.sets.set(node.name, node);
      } else if (node.type === "COMPONENT") {
        // Top-level components only (a component inside a set is covered above).
        if (node.parent && node.parent.type === "COMPONENT_SET") continue;
        if (!this.singles.has(node.name)) this.singles.set(node.name, node);
      }
    }
    // 2) Components from an externally published Pico library linked into this
    // file. Library main components aren't part of the document tree, but any
    // instance of one is — so resolve each instance's main component (which may
    // be remote) and register it by name. New instances can then be spun up
    // from the library main, satisfying the strict one-to-one mapping even when
    // the Pico components live in a separate published library.
    const instances = figma.root.findAllWithCriteria({ types: ["INSTANCE"] });
    for (const inst of instances) {
      let main: ComponentNode | null = null;
      try {
        main = await inst.getMainComponentAsync();
      } catch {
        main = null;
      }
      if (!main) continue;
      const parent = main.parent;
      if (parent && parent.type === "COMPONENT_SET") {
        if (!this.sets.has(parent.name)) this.sets.set(parent.name, parent);
      } else if (!this.singles.has(main.name)) {
        this.singles.set(main.name, main);
      }
    }
  }

  has(name: string): boolean {
    return this.sets.has(name) || this.singles.has(name);
  }

  /** Create an instance of `name` matching the requested variant axes. */
  createInstance(
    name: string,
    variants?: Record<string, string>,
  ): InstanceNode | null {
    const set = this.sets.get(name);
    if (set) {
      const target = this.matchVariant(set, variants);
      return target.createInstance();
    }
    const single = this.singles.get(name);
    if (single) return single.createInstance();
    return null;
  }

  private matchVariant(
    set: ComponentSetNode,
    variants?: Record<string, string>,
  ): ComponentNode {
    const components = set.children.filter(
      (c): c is ComponentNode => c.type === "COMPONENT",
    );
    if (!variants) return (set.defaultVariant as ComponentNode) ?? components[0];
    let best = components[0];
    let bestScore = -1;
    for (const comp of components) {
      const props = parseVariantName(comp.name);
      let score = 0;
      for (const [k, v] of Object.entries(variants)) {
        if (props[k] !== undefined && props[k] === v) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        best = comp;
      }
    }
    return best;
  }
}

function parseVariantName(name: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of name.split(",")) {
    const [k, v] = pair.split("=").map((s) => s.trim());
    if (k && v !== undefined) out[k] = v;
  }
  return out;
}

interface BuildCtx {
  resolver: ComponentResolver;
  missing: Set<string>;
  instances: number;
  frames: number;
  assets: Record<string, { bytes: string; mime: string }>;
  /** Section frames to wrap as components once the tree is in the document. */
  sectionFrames: FrameNode[];
}

/** Is this an auto-layout child we can safely stretch / grow to fill? */
function isFillable(node: SceneNode): node is FrameNode | TextNode {
  return node.type === "FRAME" || node.type === "TEXT";
}

/** Map CSS justify-content → Figma primary-axis alignment. */
function mapJustify(
  jc?: string,
): "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN" | undefined {
  if (!jc) return undefined;
  if (jc === "center") return "CENTER";
  if (jc === "flex-end" || jc === "end" || jc === "right") return "MAX";
  if (
    jc === "space-between" ||
    jc === "space-around" ||
    jc === "space-evenly"
  )
    return "SPACE_BETWEEN";
  if (jc === "flex-start" || jc === "start" || jc === "left" || jc === "normal")
    return "MIN";
  return undefined;
}

/** Map CSS align-items → Figma counter-axis alignment. */
function mapAlign(ai?: string): "MIN" | "CENTER" | "MAX" | undefined {
  if (!ai) return undefined;
  if (ai === "center") return "CENTER";
  if (ai === "flex-end" || ai === "end") return "MAX";
  if (
    ai === "flex-start" ||
    ai === "start" ||
    ai === "baseline" ||
    ai === "normal"
  )
    return "MIN";
  return undefined;
}

/**
 * Decide how a freshly built child fills its auto-layout parent based on how its
 * rendered box compares to the parent's inner content box.
 */
function applyChildFill(
  parent: FrameNode,
  child: SceneNode,
  childBox: ParsedNode["box"] | undefined,
  innerW: number,
  innerH: number,
  stretchAll: boolean,
  parentCounterCenter: boolean,
): void {
  if (!isFillable(child)) return;
  const horizontal = parent.layoutMode === "HORIZONTAL";
  // Counter axis (the one auto-layout stretches): width for a column, height
  // for a row.
  const counterInner = horizontal ? innerH : innerW;
  const counterBox = horizontal ? childBox?.h : childBox?.w;
  const fillsCounter =
    stretchAll ||
    (counterInner > 0 && !!counterBox && counterBox >= counterInner * FILL_RATIO);
  if (fillsCounter) {
    child.layoutAlign = "STRETCH";
    if (child.type === "TEXT") {
      child.textAutoResize = "HEIGHT";
      if (parentCounterCenter) child.textAlignHorizontal = "CENTER";
    }
  }
  // Primary axis fill: a single dominant child grows to consume the main axis.
  const primaryInner = horizontal ? innerW : innerH;
  const primaryBox = horizontal ? childBox?.w : childBox?.h;
  if (primaryInner > 0 && !!primaryBox && primaryBox >= primaryInner * FILL_RATIO) {
    child.layoutGrow = 1;
  }
}

/** Recursively build a Figma node for a parsed ParsedNode. */
async function buildNode(
  node: ParsedNode,
  ctx: BuildCtx,
): Promise<SceneNode | null> {
  // 1) Recognized Pico component → real instance + variant.
  if (node.component) {
    if (ctx.resolver.has(node.component)) {
      const instance = ctx.resolver.createInstance(node.component, node.variants);
      if (instance) {
        ctx.instances++;
        applyTextOverride(instance, node.text);
        return instance;
      }
    } else {
      ctx.missing.add(node.component);
    }
  }

  // 1b) Artwork leaf → drawable image / inline SVG node, sized to its box.
  if (node.svg || node.image) {
    const art = buildArtwork(node, ctx);
    if (art) {
      if (node.box && node.box.w > 0 && node.box.h > 0 && "resize" in art) {
        try {
          art.resize(node.box.w, node.box.h);
        } catch {
          // Some node types resist resize; keep intrinsic size.
        }
      }
      ctx.frames++;
      return art;
    }
  }

  // 2) Build children first so leaf-vs-container can be decided.
  const childPairs: { node: ParsedNode; built: SceneNode }[] = [];
  for (const child of node.children) {
    const built = await buildNode(child, ctx);
    if (built) childPairs.push({ node: child, built });
  }

  // Leaf text node → a wrapping text layer sized to its rendered box.
  if (node.text && childPairs.length === 0) {
    const t = await makeText({
      text: node.text,
      role: pickTextRole(node),
      size: textSize(node),
      colorToken: node.layout?.fgToken ?? "foreground",
      colorHex: node.layout?.fgHex,
      lineHeight: node.layout?.lineHeight,
      align: mapTextAlign(node.layout?.textAlign),
    });
    if (node.box && node.box.w > 0) {
      t.textAutoResize = "HEIGHT";
      t.resize(node.box.w, t.height);
    }
    return t;
  }

  if (childPairs.length === 0 && !node.text) return null;

  // 3) Generic container → token-bound auto-layout frame mirroring the HTML.
  const frame = figma.createFrame();
  frame.name = node.section ? `Section: ${node.section}` : "Frame";
  // Visual-only styling (no `direction` → layoutMode is configured below).
  await applyContainerStyle(frame, {
    bgToken: node.layout?.bgToken,
    bgHex: node.layout?.bgHex,
    radiusToken: node.layout?.radiusToken,
    strokeToken: node.layout?.strokeToken,
    strokeHex: node.layout?.strokeHex,
    strokeWeight: node.layout?.strokeWeight,
    shadowToken: node.layout?.shadowToken,
  });
  await configureAutoLayout(frame, node);
  ctx.frames++;

  // Inner content box (rendered box minus padding) drives child fill decisions.
  const innerW = node.box
    ? node.box.w - frame.paddingLeft - frame.paddingRight
    : 0;
  const innerH = node.box
    ? node.box.h - frame.paddingTop - frame.paddingBottom
    : 0;
  const stretchAll = (node.layout?.align ?? "").indexOf("stretch") === 0;
  const counterCenter = mapAlign(node.layout?.align) === "CENTER";

  if (node.text) {
    const t = await makeText({
      text: node.text,
      role: pickTextRole(node),
      size: textSize(node),
      colorToken: node.layout?.fgToken ?? "foreground",
      colorHex: node.layout?.fgHex,
      lineHeight: node.layout?.lineHeight,
      align: mapTextAlign(node.layout?.textAlign),
    });
    frame.appendChild(t);
  }
  for (const { node: childNode, built } of childPairs) {
    frame.appendChild(built);
    applyChildFill(
      frame,
      built,
      childNode.box,
      innerW,
      innerH,
      stretchAll,
      counterCenter,
    );
  }

  // Wrap navbar/header/footer sections as components (deferred conversion once
  // the whole tree is attached to the document).
  if (node.section && SECTION_COMPONENTS.has(node.section)) {
    ctx.sectionFrames.push(frame);
  }
  return frame;
}

/**
 * Configure a frame's auto-layout (direction, spacing, padding, alignment, and
 * hug/fill sizing) from a parsed node's captured CSS + rendered geometry.
 */
async function configureAutoLayout(
  frame: FrameNode,
  node: ParsedNode,
): Promise<void> {
  const layout = node.layout;
  const isGrid = !!(layout?.gridCols && layout.gridCols > 1);
  const isRow = layout?.flow === "row" || layout?.direction === "row" || isGrid;

  frame.layoutMode = isRow ? "HORIZONTAL" : "VERTICAL";

  // Padding — per side, falling back to the X/Y shorthand.
  frame.paddingLeft = layout?.paddingX ?? 0;
  frame.paddingRight = layout?.paddingRight ?? layout?.paddingX ?? 0;
  frame.paddingTop = layout?.paddingY ?? 0;
  frame.paddingBottom = layout?.paddingBottom ?? layout?.paddingY ?? 0;

  // Item spacing — main-axis gap; wrapped grids also get a cross-axis gap.
  const gap = layout?.gap ?? 0;
  if (isRow) {
    frame.itemSpacing = layout?.colGap ?? gap;
  } else {
    frame.itemSpacing = layout?.rowGap ?? gap;
  }

  // Bind auto-layout gap + padding to Pico space variables when a captured pixel
  // value matches a spacing token exactly (keeps spacing on the synced scale).
  await bindSpace(frame, "itemSpacing", frame.itemSpacing);
  await bindSpace(frame, "paddingLeft", frame.paddingLeft);
  await bindSpace(frame, "paddingRight", frame.paddingRight);
  await bindSpace(frame, "paddingTop", frame.paddingTop);
  await bindSpace(frame, "paddingBottom", frame.paddingBottom);

  // Alignment.
  const primary = mapJustify(layout?.justify);
  if (primary) frame.primaryAxisAlignItems = primary;
  const counter = mapAlign(layout?.align);
  if (counter) frame.counterAxisAlignItems = counter;

  // Sizing: hug on the primary axis, fixed on the cross axis from geometry. A
  // wrapping grid is the exception — it needs a fixed primary width so its items
  // wrap into rows.
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  const box = node.box;
  if (isGrid) {
    frame.layoutWrap = "WRAP";
    if (box && box.w > 0) {
      frame.primaryAxisSizingMode = "FIXED";
      frame.resize(box.w, frame.height);
    }
    if (layout?.rowGap) frame.counterAxisSpacing = layout.rowGap;
  } else if (box) {
    if (isRow && box.h > 0) {
      frame.counterAxisSizingMode = "FIXED";
      frame.resize(frame.width, box.h);
    } else if (!isRow && box.w > 0) {
      frame.counterAxisSizingMode = "FIXED";
      frame.resize(box.w, frame.height);
    }
  }
}

/** Bind an auto-layout numeric field to a Pico space variable matching its px. */
async function bindSpace(
  frame: FrameNode,
  field: "itemSpacing" | "paddingLeft" | "paddingRight" | "paddingTop" | "paddingBottom",
  px: number,
): Promise<void> {
  if (!px || px <= 0) return;
  const variable = await findSpaceVariable(px);
  if (variable) frame.setBoundVariable(field, variable);
}

/** Map a CSS text-align value to a Figma horizontal text alignment. */
function mapTextAlign(
  ta?: string,
): "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED" | undefined {
  switch (ta) {
    case "center":
      return "CENTER";
    case "right":
    case "end":
      return "RIGHT";
    case "justify":
      return "JUSTIFIED";
    case "left":
    case "start":
      return "LEFT";
    default:
      return undefined;
  }
}

/**
 * Build a drawable artwork node: inline SVG via createNodeFromSvg, or a raster
 * image (PNG/JPG/etc.) painted as an IMAGE fill on a sized rectangle. Returns
 * null when the bytes are unavailable or the format can't be drawn.
 */
function buildArtwork(node: ParsedNode, ctx: BuildCtx): SceneNode | null {
  // Inline SVG — recreate the vector directly from its markup.
  if (node.svg) {
    try {
      const svgNode = figma.createNodeFromSvg(node.svg.markup);
      svgNode.name = "Artwork (SVG)";
      const w = node.svg.width || svgNode.width;
      const h = node.svg.height || svgNode.height;
      if (w > 0 && h > 0) svgNode.resize(w, h);
      return svgNode;
    } catch {
      return null;
    }
  }

  // Raster image — needs bytes the UI fetched into the assets map.
  if (node.image) {
    const asset = ctx.assets[node.image.src];
    if (!asset) return null;
    // An SVG delivered via <img> can't go through createImage; draw its markup.
    if (/svg/i.test(asset.mime)) {
      try {
        const markup = decodeUtf8(figma.base64Decode(asset.bytes));
        const svgNode = figma.createNodeFromSvg(markup);
        svgNode.name = "Artwork (SVG)";
        const w = node.image.width || svgNode.width;
        const h = node.image.height || svgNode.height;
        if (w > 0 && h > 0) svgNode.resize(w, h);
        return svgNode;
      } catch {
        return null;
      }
    }
    try {
      const image = figma.createImage(figma.base64Decode(asset.bytes));
      const rect = figma.createRectangle();
      rect.name = "Artwork (Image)";
      const w = node.image.width || 200;
      const h = node.image.height || 200;
      rect.resize(w, h);
      rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
      return rect;
    } catch {
      return null;
    }
  }
  return null;
}

/** Decode UTF-8 bytes without TextDecoder (unavailable on the code side). */
function decodeUtf8(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i++];
    if (b < 0x80) {
      out += String.fromCharCode(b);
    } else if (b >= 0xc0 && b < 0xe0) {
      out += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i++] & 0x3f));
    } else if (b >= 0xe0 && b < 0xf0) {
      out += String.fromCharCode(
        ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f),
      );
    } else {
      const cp =
        ((b & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
      const off = cp - 0x10000;
      out += String.fromCharCode(0xd800 + (off >> 10), 0xdc00 + (off & 0x3ff));
    }
  }
  return out;
}

function pickTextRole(
  node: ParsedNode,
): "display" | "heading" | "body" | "bold" | "mono" {
  // Delivered HTML rarely carries computed sizes (DOMParser doesn't apply
  // stylesheets), so lead with the HTML tag for reliable hierarchy.
  const tag = node.tag;
  const family = node.layout?.fontFamily?.toLowerCase() ?? "";
  if (/platypi/.test(family)) return "display";
  if (/(mono|menlo|consolas|courier)/.test(family)) return "mono";
  if (tag === "h1" || tag === "h2") return "display";
  if (tag === "h3" || tag === "h4") return "heading";
  if (tag === "code" || tag === "pre" || tag === "kbd" || tag === "samp")
    return "mono";
  if (tag === "strong" || tag === "b" || tag === "th" || tag === "label")
    return "bold";
  const size = node.layout?.fontSize ?? 0;
  const weight = node.layout?.fontWeight ?? 0;
  if (size >= 30) return "display";
  if (size >= 20) return "heading";
  if (weight >= 700) return "bold";
  return "body";
}

/** Pixel size for a text node — declared size wins, else a per-tag default. */
function textSize(node: ParsedNode): number | undefined {
  if (node.layout?.fontSize) return node.layout.fontSize;
  switch (node.tag) {
    case "h1":
      return 40;
    case "h2":
      return 32;
    case "h3":
      return 24;
    case "h4":
      return 20;
    case "h5":
    case "h6":
      return 16;
    case "small":
      return 13;
    case "code":
    case "pre":
      return 14;
    default:
      return undefined;
  }
}

/** Push the parsed text into an instance's first text layer, if any. */
function applyTextOverride(instance: InstanceNode, text?: string) {
  if (!text) return;
  const textNode = instance.findOne((n) => n.type === "TEXT") as TextNode | null;
  if (textNode) {
    try {
      textNode.characters = text;
    } catch {
      // Font not loaded for this override; leave the default label.
    }
  }
}

export async function reconstructPage(
  page: ParsedPage,
  device: DeviceSize,
  log: (msg: string) => void,
): Promise<{ instances: number; frames: number; missing: string[] }> {
  await fonts();
  const figmaPage = await getOrCreatePage(PAGES_PAGE);

  const resolver = new ComponentResolver();
  await resolver.build();

  const frameName = `${shortName(page.url)} — ${device.label}`;
  removeChildByName(figmaPage, frameName);

  const width = page.contentWidth || device.width;

  const ctx: BuildCtx = {
    resolver,
    missing: new Set(),
    instances: 0,
    frames: 0,
    assets: page.assets ?? {},
    sectionFrames: [],
  };

  const built = await buildNode(page.root, ctx);

  // Resolve the top-level page frame: use the built body when it's a frame,
  // otherwise an empty frame so the action always produces something.
  let root: FrameNode;
  if (built && built.type === "FRAME") {
    root = built;
  } else {
    root = figma.createFrame();
    root.layoutMode = "VERTICAL";
    if (built) root.appendChild(built);
  }
  root.name = frameName;
  if (root.layoutMode === "NONE") root.layoutMode = "VERTICAL";
  // Full device width, hugging height; opaque page background behind it.
  root.counterAxisSizingMode = "FIXED";
  root.resize(width, root.height);
  if ((root.fills as readonly Paint[]).length === 0) {
    await applyFill(
      root as unknown as GeometryMixin & { fills: Paint[] },
      "background",
    );
  }

  figmaPage.appendChild(root);
  placeBelowExisting(figmaPage, root);

  // Now that the tree is in the document, wrap section frames as components.
  let components = 0;
  for (const fr of ctx.sectionFrames) {
    if (fr.removed) continue;
    const align = fr.layoutAlign;
    const grow = fr.layoutGrow;
    const label = fr.name.replace(/^Section:\s*/, "");
    try {
      const comp = figma.createComponentFromNode(fr);
      comp.name = `Component: ${label}`;
      // createComponentFromNode can reset fill behavior — restore it.
      if ("layoutAlign" in comp) comp.layoutAlign = align;
      if ("layoutGrow" in comp) comp.layoutGrow = grow;
      components++;
    } catch (e) {
      log(`Couldn't wrap "${label}" as a component (${(e as Error).message}).`);
    }
  }

  const missing = Array.from(ctx.missing);
  log(
    `Rebuilt "${frameName}" with auto-layout: ${ctx.instances} instances, ` +
      `${ctx.frames} frames, ${components} section component(s)` +
      (missing.length
        ? `. Missing components (run Generate components): ${missing.join(", ")}`
        : "."),
  );
  return { instances: ctx.instances, frames: ctx.frames, missing };
}

function shortName(url: string): string {
  const m = url.match(/^[a-z]+:\/\/([^/?#]+)([^?#]*)/i);
  if (!m) return url.slice(0, 40);
  const host = m[1];
  const rawPath = m[2] ?? "";
  const path = rawPath === "" || rawPath === "/" ? "home" : rawPath.replace(/\//g, " ").trim();
  return `${host}${path ? " " + path : ""}`;
}

/** Stack newly created frames to the right of existing ones, never overlapping. */
function placeBelowExisting(page: PageNode, node: SceneNode) {
  let maxX = 0;
  for (const child of page.children) {
    if (child === node) continue;
    maxX = Math.max(maxX, child.x + child.width);
  }
  node.x = maxX > 0 ? maxX + 80 : 80;
  node.y = 80;
}
