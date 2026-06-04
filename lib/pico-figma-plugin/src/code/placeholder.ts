// Placeholder pages — ready-made sample layouts built from real component
// instances + token-bound frames. Used two ways:
//   1. "Generate sample page" — a standalone starter layout.
//   2. Auth-walled URLs — routed here and filed under the Pico / Placeholder
//      page so they never block the page-from-URL flow.

import type { DeviceSize } from "../shared/messages";
import {
  getOrCreatePage,
  removeChildByName,
  PLACEHOLDER_PAGE,
} from "./figma-helpers";
import { applyContainerStyle, makeFrame, makeText, fonts } from "./node-kit";

class Resolver {
  private sets = new Map<string, ComponentSetNode>();
  private singles = new Map<string, ComponentNode>();
  async build() {
    await figma.loadAllPagesAsync();
    const all = figma.root.findAllWithCriteria({
      types: ["COMPONENT_SET", "COMPONENT"],
    });
    for (const node of all) {
      if (node.type === "COMPONENT_SET") this.sets.set(node.name, node);
      else if (!node.parent || node.parent.type !== "COMPONENT_SET")
        this.singles.set(node.name, node);
    }
  }
  instance(name: string, variants?: Record<string, string>): InstanceNode | null {
    const set = this.sets.get(name);
    if (set) {
      const comps = set.children.filter(
        (c): c is ComponentNode => c.type === "COMPONENT",
      );
      let best = (set.defaultVariant as ComponentNode) ?? comps[0];
      if (variants) {
        let score = -1;
        for (const c of comps) {
          const props: Record<string, string> = {};
          c.name.split(",").forEach((p) => {
            const [k, v] = p.split("=").map((s) => s.trim());
            if (k && v) props[k] = v;
          });
          let s = 0;
          for (const [k, v] of Object.entries(variants))
            if (props[k] === v) s++;
          if (s > score) {
            score = s;
            best = c;
          }
        }
      }
      return best ? best.createInstance() : null;
    }
    const single = this.singles.get(name);
    return single ? single.createInstance() : null;
  }
}

async function setInstanceText(instance: InstanceNode, text: string) {
  const t = instance.findOne((n) => n.type === "TEXT") as TextNode | null;
  if (t) {
    try {
      t.characters = text;
    } catch {
      /* font not loaded for override */
    }
  }
}

/** Build a realistic sample layout. Returns the root frame. */
async function buildSampleLayout(
  resolver: Resolver,
  title: string,
  subtitle: string,
  device: DeviceSize,
): Promise<FrameNode> {
  const root = figma.createFrame();
  root.name = `${title} — ${device.label}`;
  await applyContainerStyle(root, {
    direction: "column",
    gap: 0,
    bgToken: "background",
  });
  root.resize(device.width, device.height);
  root.primaryAxisSizingMode = "FIXED";
  root.counterAxisSizingMode = "FIXED";
  root.clipsContent = true;

  // Top bar
  const bar = await makeFrame({
    name: "Section: navbar",
    direction: "row",
    gap: 16,
    paddingX: 32,
    paddingY: 20,
    align: "SPACE_BETWEEN",
    cross: "CENTER",
    bgToken: "primary",
  });
  bar.layoutAlign = "STRETCH";
  bar.primaryAxisSizingMode = "FIXED";
  const brand = await makeText({ text: "Pico.", role: "display", size: 24, colorToken: "primary-foreground", uppercase: true });
  bar.appendChild(brand);
  const cta = resolver.instance("Button", { variant: "brand", size: "default" });
  if (cta) {
    await setInstanceText(cta, "Get started");
    bar.appendChild(cta);
  }
  root.appendChild(bar);

  // Hero
  const hero = await makeFrame({
    name: "Section: hero",
    direction: "column",
    gap: 16,
    paddingX: 48,
    paddingY: 56,
    cross: "MIN",
    bgToken: "background",
  });
  hero.layoutAlign = "STRETCH";
  hero.primaryAxisSizingMode = "AUTO";
  const badge = resolver.instance("Badge", { variant: "default" });
  if (badge) {
    await setInstanceText(badge, "New");
    hero.appendChild(badge);
  }
  const h1 = await makeText({ text: title, role: "display", size: 44, colorToken: "foreground", uppercase: true });
  const sub = await makeText({ text: subtitle, role: "body", size: 18, colorToken: "muted-foreground" });
  h1.layoutAlign = "STRETCH";
  sub.layoutAlign = "STRETCH";
  hero.appendChild(h1);
  hero.appendChild(sub);
  const heroBtn = resolver.instance("Button", { variant: "brand", size: "lg" });
  if (heroBtn) {
    await setInstanceText(heroBtn, "Try the demo");
    hero.appendChild(heroBtn);
  }
  root.appendChild(hero);

  // Cards row
  const grid = await makeFrame({
    name: "Section: features",
    direction: "row",
    gap: 24,
    paddingX: 48,
    paddingY: 24,
    bgToken: "background",
  });
  grid.layoutAlign = "STRETCH";
  grid.primaryAxisSizingMode = "FIXED";
  for (const [t, d] of [
    ["Fast", "Built for speed."],
    ["Bold", "High-contrast brand."],
    ["Token-true", "Synced from code."],
  ]) {
    const card = resolver.instance("Card");
    if (card) {
      card.layoutAlign = "STRETCH";
      const texts = card.findAll((n) => n.type === "TEXT") as TextNode[];
      try {
        if (texts[0]) texts[0].characters = t.toUpperCase();
        if (texts[1]) texts[1].characters = d;
      } catch {
        /* font override skipped */
      }
      grid.appendChild(card);
    } else {
      const fallback = await makeFrame({
        name: "Card",
        direction: "column",
        gap: 6,
        paddingX: 24,
        paddingY: 24,
        bgToken: "card",
        radiusToken: "xl",
        strokeToken: "card-border",
        strokeWeight: 2,
        shadowToken: "DEFAULT",
      });
      fallback.layoutAlign = "STRETCH";
      const ct = await makeText({ text: t, role: "display", size: 20, colorToken: "card-foreground", uppercase: true });
      const cd = await makeText({ text: d, role: "body", size: 14, colorToken: "muted-foreground" });
      fallback.appendChild(ct);
      fallback.appendChild(cd);
      grid.appendChild(fallback);
    }
  }
  root.appendChild(grid);

  return root;
}

function placeRight(page: PageNode, node: SceneNode) {
  let maxX = 0;
  for (const child of page.children) {
    if (child === node) continue;
    maxX = Math.max(maxX, child.x + child.width);
  }
  node.x = maxX > 0 ? maxX + 80 : 80;
  node.y = 80;
}

export async function generatePlaceholder(
  device: DeviceSize,
  log: (msg: string) => void,
  name = "Sample Page",
): Promise<void> {
  await fonts();
  const page = await getOrCreatePage(PLACEHOLDER_PAGE);
  const resolver = new Resolver();
  await resolver.build();
  const root = await buildSampleLayout(
    resolver,
    name,
    "A ready-made starting layout built from real Pico components and tokens.",
    device,
  );
  removeChildByName(page, root.name);
  page.appendChild(root);
  placeRight(page, root);
  log(`Placeholder "${root.name}" created.`);
}

export async function generatePlaceholderForUrl(
  url: string,
  device: DeviceSize,
  reason: string,
  log: (msg: string) => void,
): Promise<void> {
  await fonts();
  const page = await getOrCreatePage(PLACEHOLDER_PAGE);
  const resolver = new Resolver();
  await resolver.build();
  let host = url;
  const m = url.match(/^[a-z]+:\/\/([^/?#]+)/i);
  if (m) host = m[1];
  const root = await buildSampleLayout(
    resolver,
    `Placeholder · ${host}`,
    `Auth-walled URL — ${reason}`,
    device,
  );
  removeChildByName(page, root.name);
  page.appendChild(root);
  placeRight(page, root);
  log(`Auth-walled "${url}" → placeholder filed under ${PLACEHOLDER_PAGE}.`);
}
