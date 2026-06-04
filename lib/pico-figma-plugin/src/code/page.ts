// Page reconstruction — turns the parsed page tree (built in the UI from the
// Figma-readable instrumentation) into a Figma frame at the chosen device size.
//
// Strict one-to-one mapping: every node that carries a `data-pico-component`
// identity is placed as an INSTANCE of the matching Figma component + variant,
// resolved from the local file (or an external published Pico library linked
// into the file). Only genuinely non-component content becomes a token-bound
// auto-layout frame. Idempotent: re-running replaces the page's prior frame.

import type { ParsedPage, ParsedNode, DeviceSize } from "../shared/messages";
import {
  getOrCreatePage,
  removeChildByName,
  PAGES_PAGE,
} from "./figma-helpers";
import { applyContainerStyle, makeText, fonts } from "./node-kit";

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

  // 2) Leaf text node → text.
  const childNodes: SceneNode[] = [];
  for (const child of node.children) {
    const built = await buildNode(child, ctx);
    if (built) childNodes.push(built);
  }

  if (node.text && childNodes.length === 0) {
    const t = await makeText({
      text: node.text,
      role: pickTextRole(node),
      size: node.layout?.fontSize,
      colorToken: node.layout?.fgToken ?? "foreground",
      colorHex: node.layout?.fgHex,
    });
    return t;
  }

  if (childNodes.length === 0 && !node.text) return null;

  // 3) Generic container → token-bound auto-layout frame.
  const frame = figma.createFrame();
  frame.name = node.section ? `Section: ${node.section}` : "Frame";
  await applyContainerStyle(frame, {
    direction: node.layout?.direction === "row" ? "row" : "column",
    gap: node.layout?.gap ?? 12,
    paddingX: node.layout?.paddingX ?? 0,
    paddingY: node.layout?.paddingY ?? 0,
    bgToken: node.layout?.bgToken,
    bgHex: node.layout?.bgHex,
    radiusToken: node.layout?.radiusToken,
    shadowToken: normalizeShadowKey(node.layout?.shadowToken),
  });
  ctx.frames++;

  if (node.text) {
    const t = await makeText({
      text: node.text,
      role: pickTextRole(node),
      size: node.layout?.fontSize,
      colorToken: node.layout?.fgToken ?? "foreground",
      colorHex: node.layout?.fgHex,
    });
    frame.appendChild(t);
  }
  for (const c of childNodes) {
    frame.appendChild(c);
    if ("layoutAlign" in c) (c as AutoLayoutChildrenMixin & SceneNode).layoutAlign = "STRETCH";
  }
  return frame;
}

function normalizeShadowKey(key?: string): string | undefined {
  return key;
}

function pickTextRole(
  node: ParsedNode,
): "display" | "heading" | "body" | "bold" | "mono" {
  const size = node.layout?.fontSize ?? 0;
  const weight = node.layout?.fontWeight ?? 0;
  if (size >= 30) return "display";
  if (size >= 20) return "heading";
  if (weight >= 700) return "bold";
  return "body";
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

  const root = figma.createFrame();
  root.name = frameName;
  root.resize(device.width, device.height);
  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "FIXED";
  root.counterAxisSizingMode = "FIXED";
  root.itemSpacing = 0;
  root.clipsContent = true;
  await applyContainerStyle(root, {
    direction: "column",
    bgToken: "background",
  });
  root.resize(device.width, device.height);
  root.primaryAxisSizingMode = "FIXED";
  root.counterAxisSizingMode = "FIXED";

  const ctx: BuildCtx = {
    resolver,
    missing: new Set(),
    instances: 0,
    frames: 0,
  };

  const built = await buildNode(page.root, ctx);
  if (built) {
    root.appendChild(built);
    if ("layoutAlign" in built) {
      (built as AutoLayoutChildrenMixin & SceneNode).layoutAlign = "STRETCH";
    }
  }

  figmaPage.appendChild(root);
  placeBelowExisting(figmaPage, root);

  const missing = Array.from(ctx.missing);
  log(
    `Rebuilt "${frameName}": ${ctx.instances} instances, ${ctx.frames} frames` +
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
