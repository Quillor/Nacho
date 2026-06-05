// Icon sync: every lucide-react icon used anywhere in the codebase (scanned at
// build time into generated/assets.json) becomes a Figma component on the
// "Pico / Icons" page. Strokes bind to the Pico foreground color variable so the
// icon set restyles with the theme, exactly like the website's `text-foreground`
// icons.
//
// Idempotent: the page is plugin-owned, so a re-run clears it and rebuilds.

import {
  getOrCreatePage,
  ICONS_PAGE,
  findColorVariable,
  boundPaint,
} from "./figma-helpers";
import { fonts } from "./node-kit";
import assets from "../generated/assets.json";

const ICON_SIZE = 24;
const COLS = 12;
const CELL = ICON_SIZE + 32; // icon box + gutter

/** Recolor every stroked/filled leaf so icons follow the Pico foreground. */
async function bindIconColor(root: SceneNode): Promise<void> {
  const fg = await findColorVariable("foreground");
  if (!fg) return;
  const paint = boundPaint(fg);
  const nodes: SceneNode[] = [root];
  if ("findAll" in root) {
    for (const n of (root as ChildrenMixin & SceneNode).findAll(() => true)) {
      nodes.push(n);
    }
  }
  for (const n of nodes) {
    const g = n as unknown as {
      strokes?: ReadonlyArray<Paint>;
      fills?: ReadonlyArray<Paint> | typeof figma.mixed;
    };
    if (Array.isArray(g.strokes) && g.strokes.length > 0) {
      (n as unknown as { strokes: Paint[] }).strokes = g.strokes.map(() => paint);
    }
    if (Array.isArray(g.fills) && g.fills.length > 0) {
      (n as unknown as { fills: Paint[] }).fills = g.fills.map(() => paint);
    }
  }
}

export async function generateIcons(
  log: (msg: string) => void,
): Promise<number> {
  await fonts();
  const page = await getOrCreatePage(ICONS_PAGE);
  for (const child of [...page.children]) child.remove();

  const entries = Object.entries(assets.icons as Record<string, string>).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  let col = 0;
  let row = 0;
  let count = 0;
  const originX = 80;
  const originY = 80;

  for (const [name, svg] of entries) {
    let svgFrame: FrameNode;
    try {
      svgFrame = figma.createNodeFromSvg(svg);
    } catch {
      log(`Skipped ${name} (invalid SVG)`);
      continue;
    }
    svgFrame.name = "vector";
    const comp = figma.createComponent();
    comp.name = name;
    comp.resize(ICON_SIZE, ICON_SIZE);
    comp.fills = [];
    comp.clipsContent = false;
    comp.appendChild(svgFrame);
    svgFrame.x = 0;
    svgFrame.y = 0;
    await bindIconColor(comp);

    page.appendChild(comp);
    comp.x = originX + col * CELL;
    comp.y = originY + row * CELL;
    col++;
    if (col >= COLS) {
      col = 0;
      row++;
    }
    count++;
  }

  log(`Built ${count} icon components`);
  return count;
}
