// Authored Figma component/component-set builders for the Pico component set.
// Visuals mirror lib/pico-ui/src/components and the docs pages. Fills, strokes,
// radii and shadows bind to the synced Pico variables / effect styles.
//
// Idempotent: the Pico / Components page is owned entirely by the plugin, so a
// re-run clears every node on it first and rebuilds from scratch. That avoids
// stale duplicates that name-based deletion missed (e.g. heading labels that
// shared a component's name).

import { getOrCreatePage, COMPONENTS_PAGE } from "./figma-helpers";
import { applyContainerStyle, makeText, fonts, makeFrame } from "./node-kit";
import assets from "../generated/assets.json";

/** Apply a single-side border (Pico nav/footer use one chunky rule). */
async function applyEdgeBorder(
  node: FrameNode | ComponentNode,
  edge: "top" | "bottom",
  weight: number,
): Promise<void> {
  const { applyStroke } = await import("./figma-helpers");
  await applyStroke(node, "foreground", weight);
  node.strokeTopWeight = edge === "top" ? weight : 0;
  node.strokeBottomWeight = edge === "bottom" ? weight : 0;
  node.strokeLeftWeight = 0;
  node.strokeRightWeight = 0;
}

/** Build a Logo variant by importing the brand SVG and scaling to `targetH`. */
async function buildLogoVariant(
  variant: "wordmark" | "mark",
  targetH: number,
): Promise<ComponentNode> {
  const comp = figma.createComponent();
  comp.name = `variant=${variant}`;
  comp.fills = [];
  comp.clipsContent = false;
  const frame = figma.createNodeFromSvg(assets.logos[variant]);
  frame.name = "vector";
  const scale = targetH / frame.height;
  frame.rescale(scale);
  comp.resize(frame.width, frame.height);
  comp.appendChild(frame);
  frame.x = 0;
  frame.y = 0;
  return comp;
}

async function buildLogo(page: PageNode, x: number, y: number) {
  const nodes: ComponentNode[] = [
    await buildLogoVariant("wordmark", 48),
    await buildLogoVariant("mark", 48),
  ];
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Logo";
  configureSet(set, x, y);
  return set;
}

const FOOTER_LINKS = ["Twitter", "LinkedIn", "Privacy", "Terms", "Design System"];

async function buildFooter(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Footer";
  await applyContainerStyle(comp, {
    direction: "row",
    paddingX: 48,
    paddingY: 48,
    align: "SPACE_BETWEEN",
    cross: "CENTER",
    bgToken: "background",
  });
  comp.resize(1200, comp.height);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";
  await applyEdgeBorder(comp, "top", 4);

  const logo =
    (await instanceFromSet(page, "Logo", "variant=wordmark")) ??
    (await makeFrame({ name: "Logo", width: 150, height: 48 }));
  comp.appendChild(logo);

  const links = await makeFrame({
    name: "Links",
    direction: "row",
    gap: 24,
    cross: "CENTER",
  });
  for (const label of FOOTER_LINKS) {
    links.appendChild(
      await makeText({ text: label, role: "bold", size: 16, colorToken: "foreground" }),
    );
  }
  comp.appendChild(links);

  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

/** A nav pill (icon dot + label) used by the signed-in navbar variant. */
async function navItem(label: string, active: boolean): Promise<FrameNode> {
  const pill = await makeFrame({
    name: "NavItem",
    direction: "row",
    gap: 8,
    paddingX: 16,
    paddingY: 8,
    align: "CENTER",
    cross: "CENTER",
    bgToken: active ? "primary" : undefined,
    strokeToken: active ? "foreground" : undefined,
    strokeWeight: active ? 2 : undefined,
    shadowToken: active ? "sm" : undefined,
  });
  const dot = await makeFrame({
    name: "Icon",
    bgToken: active ? "primary-foreground" : "foreground",
    radiusPx: 999,
  });
  dot.resize(16, 16);
  pill.appendChild(dot);
  pill.appendChild(
    await makeText({
      text: label,
      role: "bold",
      size: 14,
      colorToken: active ? "primary-foreground" : "foreground",
      uppercase: true,
    }),
  );
  return pill;
}

async function buildNavbarVariant(
  page: PageNode,
  state: "signed-in" | "signed-out",
): Promise<ComponentNode> {
  const comp = figma.createComponent();
  comp.name = `state=${state}`;
  page.appendChild(comp);
  await applyContainerStyle(comp, {
    direction: "row",
    paddingX: 48,
    paddingY: 16,
    align: "SPACE_BETWEEN",
    cross: "CENTER",
    bgToken: "background",
  });
  comp.resize(1200, comp.height);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "AUTO";
  await applyEdgeBorder(comp, "bottom", 4);

  const logo =
    (await instanceFromSet(page, "Logo", "variant=wordmark")) ??
    (await makeFrame({ name: "Logo", width: 130, height: 36 }));
  comp.appendChild(logo);

  const right = await makeFrame({
    name: "Actions",
    direction: "row",
    gap: 8,
    cross: "CENTER",
  });

  if (state === "signed-out") {
    const signIn =
      (await instanceFromSet(
        comp.parent as PageNode,
        "Button",
        "variant=ghost, size=default",
        "Sign In",
      )) ?? (await fallbackButton("Sign In", false));
    const getStarted =
      (await instanceFromSet(
        comp.parent as PageNode,
        "Button",
        "variant=brand, size=default",
        "Get Started",
      )) ?? (await fallbackButton("Get Started", true));
    right.appendChild(signIn);
    right.appendChild(getStarted);
  } else {
    right.appendChild(await navItem("Record", true));
    right.appendChild(await navItem("Library", false));
    right.appendChild(await navItem("Settings", false));
    const divider = await makeFrame({ name: "Divider", bgToken: "foreground" });
    divider.resize(2, 32);
    divider.opacity = 0.2;
    right.appendChild(divider);
    const account = await makeFrame({
      name: "Account",
      direction: "row",
      gap: 8,
      paddingX: 12,
      paddingY: 6,
      cross: "CENTER",
      bgToken: "card",
      strokeToken: "foreground",
      strokeWeight: 2,
    });
    const avatar = await makeFrame({
      name: "Avatar",
      direction: "row",
      align: "CENTER",
      cross: "CENTER",
      bgToken: "primary",
      strokeToken: "foreground",
      strokeWeight: 2,
      radiusPx: 999,
    });
    avatar.resize(28, 28);
    avatar.appendChild(
      await makeText({ text: "P", role: "bold", size: 14, colorToken: "primary-foreground" }),
    );
    account.appendChild(avatar);
    account.appendChild(
      await makeText({ text: "Account", role: "bold", size: 14, colorToken: "foreground" }),
    );
    right.appendChild(account);
  }

  comp.appendChild(right);
  return comp;
}

async function buildNavbar(page: PageNode, x: number, y: number) {
  const nodes: ComponentNode[] = [];
  for (const state of ["signed-out", "signed-in"] as const) {
    const comp = await buildNavbarVariant(page, state);
    nodes.push(comp);
  }
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Navbar";
  set.layoutMode = "VERTICAL";
  set.itemSpacing = 24;
  set.counterAxisSizingMode = "AUTO";
  set.primaryAxisSizingMode = "AUTO";
  set.paddingLeft = set.paddingRight = 24;
  set.paddingTop = set.paddingBottom = 24;
  set.fills = [];
  set.x = x;
  set.y = y;
  return set;
}

/**
 * Create an instance of a component set's variant that was already built earlier
 * in this run (the set lives on `page`), optionally overriding its label. Lets
 * composite components (e.g. DialogContent) reference real Button instances
 * instead of detached frames named "Button".
 */
async function instanceFromSet(
  page: PageNode,
  setName: string,
  variantName: string,
  label?: string,
): Promise<InstanceNode | null> {
  const set = page.children.find(
    (c) => c.type === "COMPONENT_SET" && c.name === setName,
  ) as ComponentSetNode | undefined;
  if (!set) return null;
  const variant =
    (set.children.find(
      (c) => c.type === "COMPONENT" && c.name === variantName,
    ) as ComponentNode | undefined) ??
    (set.defaultVariant as ComponentNode | null) ??
    (set.children.find((c) => c.type === "COMPONENT") as
      | ComponentNode
      | undefined);
  if (!variant) return null;
  const inst = variant.createInstance();
  if (label) {
    const txt = inst.findOne((n) => n.type === "TEXT") as TextNode | null;
    if (txt) {
      try {
        await figma.loadFontAsync(txt.fontName as FontName);
        txt.characters = label;
      } catch {
        /* font not loaded for override — keep default label */
      }
    }
  }
  return inst;
}

/** Fallback button frame, used only if the Button set isn't available yet. */
async function fallbackButton(
  label: string,
  primary: boolean,
): Promise<FrameNode> {
  const btn = await makeFrame({
    name: "Button",
    direction: "row",
    paddingX: 16,
    paddingY: 0,
    align: "CENTER",
    cross: "CENTER",
    bgToken: primary ? "primary" : "background",
    radiusToken: "md",
    strokeToken: "foreground",
    strokeWeight: 1,
    shadowToken: primary ? undefined : "xs",
    height: 36,
  });
  btn.appendChild(
    await makeText({
      text: label,
      role: "bold",
      size: 14,
      colorToken: primary ? "primary-foreground" : "foreground",
    }),
  );
  return btn;
}

interface ButtonStyle {
  bgToken?: string;
  fgToken: string;
  strokeToken?: string;
  strokeWeight?: number;
  shadowToken?: string;
  underline?: boolean;
}

const BUTTON_VARIANTS: Record<string, ButtonStyle> = {
  default: { bgToken: "primary", fgToken: "primary-foreground", strokeToken: "foreground", strokeWeight: 1 },
  destructive: { bgToken: "destructive", fgToken: "destructive-foreground", strokeToken: "foreground", strokeWeight: 1, shadowToken: "sm" },
  outline: { fgToken: "foreground", strokeToken: "foreground", strokeWeight: 1, shadowToken: "xs" },
  secondary: { bgToken: "secondary", fgToken: "secondary-foreground", strokeToken: "foreground", strokeWeight: 1 },
  ghost: { fgToken: "foreground" },
  link: { fgToken: "primary", underline: true },
  brand: { bgToken: "primary", fgToken: "primary-foreground", strokeToken: "foreground", strokeWeight: 2, shadowToken: "sm" },
};

const BUTTON_SIZES: Record<
  string,
  { padX: number; minH: number; fontSize: number; icon?: boolean }
> = {
  default: { padX: 16, minH: 36, fontSize: 14 },
  sm: { padX: 12, minH: 32, fontSize: 12 },
  lg: { padX: 32, minH: 40, fontSize: 14 },
  icon: { padX: 0, minH: 36, fontSize: 14, icon: true },
};

async function buildButtonVariant(
  variant: string,
  size: string,
): Promise<ComponentNode> {
  const style = BUTTON_VARIANTS[variant];
  const sz = BUTTON_SIZES[size];
  const comp = figma.createComponent();
  comp.name = `variant=${variant}, size=${size}`;
  await applyContainerStyle(comp, {
    direction: "row",
    gap: 8,
    paddingX: sz.icon ? 0 : sz.padX,
    paddingY: 0,
    align: "CENTER",
    cross: "CENTER",
    bgToken: style.bgToken,
    radiusToken: "md",
    strokeToken: style.strokeToken,
    strokeWeight: style.strokeWeight,
    shadowToken: style.shadowToken,
  });
  comp.primaryAxisSizingMode = "AUTO";
  comp.counterAxisSizingMode = "FIXED";
  comp.resize(sz.icon ? sz.minH : comp.width, sz.minH);
  if (sz.icon) comp.layoutAlign = "INHERIT";

  const label = await makeText({
    text: sz.icon ? "★" : "Button",
    role: "bold",
    size: sz.fontSize,
    colorToken: style.fgToken,
  });
  if (style.underline) label.textDecoration = "UNDERLINE";
  comp.appendChild(label);
  if (sz.icon) comp.resize(sz.minH, sz.minH);
  return comp;
}

async function buildButton(page: PageNode, x: number, y: number) {
  const variants = Object.keys(BUTTON_VARIANTS);
  const sizes = Object.keys(BUTTON_SIZES);
  const nodes: ComponentNode[] = [];
  for (const v of variants) {
    for (const s of sizes) {
      nodes.push(await buildButtonVariant(v, s));
    }
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Button";
  configureSet(set, x, y);
  return set;
}

async function buildBadge(page: PageNode, x: number, y: number) {
  const variants: Record<string, ButtonStyle> = {
    default: { bgToken: "primary", fgToken: "primary-foreground", shadowToken: "xs" },
    secondary: { bgToken: "secondary", fgToken: "secondary-foreground" },
    destructive: { bgToken: "destructive", fgToken: "destructive-foreground", shadowToken: "xs" },
    outline: { fgToken: "foreground", strokeToken: "foreground", strokeWeight: 1 },
  };
  const nodes: ComponentNode[] = [];
  for (const [variant, style] of Object.entries(variants)) {
    const comp = figma.createComponent();
    comp.name = `variant=${variant}`;
    await applyContainerStyle(comp, {
      direction: "row",
      gap: 4,
      paddingX: 10,
      paddingY: 2,
      align: "CENTER",
      cross: "CENTER",
      bgToken: style.bgToken,
      radiusToken: "md",
      strokeToken: style.strokeToken,
      strokeWeight: style.strokeWeight,
      shadowToken: style.shadowToken,
    });
    const label = await makeText({
      text: "Badge",
      role: "bold",
      size: 12,
      colorToken: style.fgToken,
    });
    comp.appendChild(label);
    nodes.push(comp);
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Badge";
  configureSet(set, x, y);
  return set;
}

async function buildCard(page: PageNode, x: number, y: number) {
  const card = figma.createComponent();
  card.name = "Card";
  await applyContainerStyle(card, {
    direction: "column",
    gap: 0,
    bgToken: "card",
    radiusToken: "xl",
    strokeToken: "card-border",
    strokeWeight: 2,
    shadowToken: "DEFAULT",
  });
  card.resize(320, card.height);
  card.counterAxisSizingMode = "FIXED";

  const header = await makeFrame({
    name: "CardHeader",
    direction: "column",
    gap: 6,
    paddingX: 24,
    paddingY: 24,
  });
  header.layoutAlign = "STRETCH";
  const title = await makeText({ text: "Card Title", role: "display", size: 24, colorToken: "card-foreground", uppercase: true });
  const desc = await makeText({ text: "A short description of the card.", role: "body", size: 14, colorToken: "muted-foreground" });
  header.appendChild(title);
  header.appendChild(desc);

  const content = await makeFrame({
    name: "CardContent",
    direction: "column",
    gap: 8,
    paddingX: 24,
    paddingY: 0,
  });
  content.layoutAlign = "STRETCH";
  content.paddingBottom = 24;
  const body = await makeText({ text: "Card content goes here.", role: "body", size: 14, colorToken: "card-foreground" });
  content.appendChild(body);

  card.appendChild(header);
  card.appendChild(content);
  page.appendChild(card);
  card.x = x;
  card.y = y;
  return card;
}

async function buildInput(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Input";
  await applyContainerStyle(comp, {
    direction: "row",
    gap: 0,
    paddingX: 12,
    paddingY: 8,
    cross: "CENTER",
    radiusToken: "md",
    strokeToken: "input",
    strokeWeight: 1,
    shadowToken: "sm",
    bgToken: "background",
  });
  comp.resize(280, 36);
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisSizingMode = "FIXED";
  const placeholder = await makeText({ text: "Placeholder", role: "body", size: 14, colorToken: "muted-foreground" });
  comp.appendChild(placeholder);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildAlert(page: PageNode, x: number, y: number) {
  const variants: Record<string, { fgToken: string; strokeToken: string }> = {
    default: { fgToken: "foreground", strokeToken: "border" },
    destructive: { fgToken: "destructive", strokeToken: "destructive" },
  };
  const nodes: ComponentNode[] = [];
  for (const [variant, style] of Object.entries(variants)) {
    const comp = figma.createComponent();
    comp.name = `variant=${variant}`;
    await applyContainerStyle(comp, {
      direction: "column",
      gap: 4,
      paddingX: 16,
      paddingY: 12,
      bgToken: "background",
      radiusToken: "lg",
      strokeToken: style.strokeToken,
      strokeWeight: 1,
    });
    comp.resize(360, comp.height);
    comp.counterAxisSizingMode = "FIXED";
    const title = await makeText({ text: "Heads up!", role: "bold", size: 15, colorToken: style.fgToken });
    const desc = await makeText({ text: "This is an alert description.", role: "body", size: 14, colorToken: style.fgToken });
    title.layoutAlign = "STRETCH";
    desc.layoutAlign = "STRETCH";
    comp.appendChild(title);
    comp.appendChild(desc);
    nodes.push(comp);
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Alert";
  configureSet(set, x, y);
  return set;
}

async function buildLabel(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Label";
  await applyContainerStyle(comp, { direction: "row", gap: 0 });
  const t = await makeText({ text: "Label", role: "bold", size: 14, colorToken: "foreground" });
  comp.appendChild(t);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildSwitch(page: PageNode, x: number, y: number) {
  const states: Array<{ name: string; on: boolean }> = [
    { name: "state=off", on: false },
    { name: "state=on", on: true },
  ];
  const nodes: ComponentNode[] = [];
  for (const st of states) {
    const comp = figma.createComponent();
    comp.name = st.name;
    await applyContainerStyle(comp, {
      direction: "row",
      paddingX: 2,
      paddingY: 2,
      align: st.on ? "MAX" : "MIN",
      cross: "CENTER",
      bgToken: st.on ? "primary" : "input",
      radiusPx: 999,
    });
    comp.resize(36, 20);
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";
    const thumb = await makeFrame({ name: "Thumb", bgToken: "background", radiusPx: 999 });
    thumb.resize(16, 16);
    comp.appendChild(thumb);
    nodes.push(comp);
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Switch";
  configureSet(set, x, y);
  return set;
}

async function buildCheckbox(page: PageNode, x: number, y: number) {
  const states: Array<{ name: string; checked: boolean }> = [
    { name: "state=unchecked", checked: false },
    { name: "state=checked", checked: true },
  ];
  const nodes: ComponentNode[] = [];
  for (const st of states) {
    const comp = figma.createComponent();
    comp.name = st.name;
    await applyContainerStyle(comp, {
      direction: "row",
      align: "CENTER",
      cross: "CENTER",
      bgToken: st.checked ? "primary" : undefined,
      radiusToken: "sm",
      strokeToken: "primary",
      strokeWeight: 1,
      shadowToken: "DEFAULT",
    });
    comp.resize(16, 16);
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";
    if (st.checked) {
      const tick = await makeText({ text: "✓", role: "bold", size: 12, colorToken: "primary-foreground" });
      comp.appendChild(tick);
    }
    nodes.push(comp);
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Checkbox";
  configureSet(set, x, y);
  return set;
}

async function buildSeparator(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Separator";
  await applyContainerStyle(comp, { direction: "row", bgToken: "border" });
  comp.resize(280, 2);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildAvatar(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Avatar";
  await applyContainerStyle(comp, {
    direction: "row",
    align: "CENTER",
    cross: "CENTER",
    bgToken: "muted",
    radiusPx: 999,
  });
  comp.resize(40, 40);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  const initials = await makeText({ text: "PC", role: "bold", size: 14, colorToken: "muted-foreground" });
  comp.appendChild(initials);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildTextarea(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Textarea";
  await applyContainerStyle(comp, {
    direction: "column",
    gap: 0,
    paddingX: 12,
    paddingY: 8,
    radiusToken: "md",
    strokeToken: "input",
    strokeWeight: 1,
    shadowToken: "sm",
    bgToken: "background",
  });
  comp.resize(280, 80);
  comp.counterAxisSizingMode = "FIXED";
  comp.primaryAxisSizingMode = "FIXED";
  const placeholder = await makeText({
    text: "Type your message…",
    role: "body",
    size: 14,
    colorToken: "muted-foreground",
  });
  comp.appendChild(placeholder);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildTooltip(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Tooltip";
  await applyContainerStyle(comp, {
    direction: "row",
    paddingX: 10,
    paddingY: 6,
    align: "CENTER",
    cross: "CENTER",
    bgToken: "foreground",
    radiusToken: "md",
    shadowToken: "sm",
  });
  const t = await makeText({
    text: "Tooltip",
    role: "bold",
    size: 12,
    colorToken: "background",
  });
  comp.appendChild(t);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildProgress(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Progress";
  await applyContainerStyle(comp, {
    direction: "row",
    gap: 0,
    align: "MIN",
    cross: "CENTER",
    bgToken: "muted",
    radiusPx: 999,
    strokeToken: "foreground",
    strokeWeight: 1,
  });
  comp.resize(280, 12);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  const bar = await makeFrame({ name: "Indicator", bgToken: "primary", radiusPx: 999 });
  bar.resize(168, 12);
  comp.appendChild(bar);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildSkeleton(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Skeleton";
  await applyContainerStyle(comp, {
    direction: "row",
    bgToken: "muted",
    radiusToken: "md",
  });
  comp.resize(280, 20);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildSpinner(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Spinner";
  await applyContainerStyle(comp, {
    direction: "row",
    align: "CENTER",
    cross: "CENTER",
    radiusPx: 999,
    strokeToken: "primary",
    strokeWeight: 3,
  });
  comp.resize(28, 28);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  // A partial arc cue: brown notch over the yellow ring.
  const notch = await makeFrame({ name: "Arc", bgToken: "foreground", radiusPx: 999 });
  notch.resize(6, 6);
  comp.appendChild(notch);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildTabsList(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "TabsList";
  await applyContainerStyle(comp, {
    direction: "row",
    gap: 4,
    paddingX: 4,
    paddingY: 4,
    align: "MIN",
    cross: "CENTER",
    bgToken: "muted",
    radiusToken: "lg",
  });
  const labels = ["Account", "Password", "Settings"];
  for (let i = 0; i < labels.length; i++) {
    const active = i === 0;
    const trigger = await makeFrame({
      name: "TabsTrigger",
      direction: "row",
      paddingX: 12,
      paddingY: 4,
      align: "CENTER",
      cross: "CENTER",
      bgToken: active ? "background" : undefined,
      radiusToken: "md",
      shadowToken: active ? "sm" : undefined,
    });
    const label = await makeText({
      text: labels[i],
      role: "bold",
      size: 14,
      colorToken: active ? "foreground" : "muted-foreground",
    });
    trigger.appendChild(label);
    comp.appendChild(trigger);
  }
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildTabsTrigger(page: PageNode, x: number, y: number) {
  const states: Array<{ name: string; active: boolean }> = [
    { name: "state=active", active: true },
    { name: "state=inactive", active: false },
  ];
  const nodes: ComponentNode[] = [];
  for (const st of states) {
    const comp = figma.createComponent();
    comp.name = st.name;
    await applyContainerStyle(comp, {
      direction: "row",
      paddingX: 12,
      paddingY: 4,
      align: "CENTER",
      cross: "CENTER",
      bgToken: st.active ? "background" : undefined,
      radiusToken: "md",
      shadowToken: st.active ? "sm" : undefined,
    });
    const label = await makeText({
      text: "Tab",
      role: "bold",
      size: 14,
      colorToken: st.active ? "foreground" : "muted-foreground",
    });
    comp.appendChild(label);
    nodes.push(comp);
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "TabsTrigger";
  configureSet(set, x, y);
  return set;
}

async function buildSelectTrigger(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "SelectTrigger";
  await applyContainerStyle(comp, {
    direction: "row",
    gap: 8,
    paddingX: 12,
    paddingY: 8,
    align: "SPACE_BETWEEN",
    cross: "CENTER",
    bgToken: "background",
    radiusToken: "md",
    strokeToken: "input",
    strokeWeight: 1,
    shadowToken: "sm",
  });
  comp.resize(220, 36);
  comp.primaryAxisSizingMode = "FIXED";
  comp.counterAxisSizingMode = "FIXED";
  const value = await makeText({
    text: "Select an option",
    role: "body",
    size: 14,
    colorToken: "muted-foreground",
  });
  const chevron = await makeText({
    text: "▾",
    role: "body",
    size: 12,
    colorToken: "foreground",
  });
  comp.appendChild(value);
  comp.appendChild(chevron);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildDialogContent(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "DialogContent";
  await applyContainerStyle(comp, {
    direction: "column",
    gap: 16,
    paddingX: 24,
    paddingY: 24,
    bgToken: "background",
    radiusToken: "lg",
    strokeToken: "border",
    strokeWeight: 1,
    shadowToken: "lg",
  });
  comp.resize(420, comp.height);
  comp.counterAxisSizingMode = "FIXED";

  const header = await makeFrame({
    name: "DialogHeader",
    direction: "column",
    gap: 6,
  });
  header.layoutAlign = "STRETCH";
  const title = await makeText({
    text: "Are you absolutely sure?",
    role: "display",
    size: 18,
    colorToken: "foreground",
  });
  const desc = await makeText({
    text: "This action cannot be undone. This will permanently delete your data.",
    role: "body",
    size: 14,
    colorToken: "muted-foreground",
  });
  title.layoutAlign = "STRETCH";
  desc.layoutAlign = "STRETCH";
  header.appendChild(title);
  header.appendChild(desc);

  const footer = await makeFrame({
    name: "DialogFooter",
    direction: "row",
    gap: 8,
    align: "MAX",
    cross: "CENTER",
  });
  footer.layoutAlign = "STRETCH";
  // Reference real Button instances (Button is built first this run) so the
  // dialog actually attaches the component instead of detached "Button" frames.
  const cancel =
    (await instanceFromSet(
      page,
      "Button",
      "variant=outline, size=default",
      "Cancel",
    )) ?? (await fallbackButton("Cancel", false));
  const confirm =
    (await instanceFromSet(
      page,
      "Button",
      "variant=default, size=default",
      "Continue",
    )) ?? (await fallbackButton("Continue", true));
  footer.appendChild(cancel);
  footer.appendChild(confirm);

  comp.appendChild(header);
  comp.appendChild(footer);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildAccordionItem(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "AccordionItem";
  await applyContainerStyle(comp, { direction: "column", gap: 0 });
  comp.resize(360, comp.height);
  comp.counterAxisSizingMode = "FIXED";

  const trigger = await makeFrame({
    name: "AccordionTrigger",
    direction: "row",
    paddingY: 16,
    align: "SPACE_BETWEEN",
    cross: "CENTER",
  });
  trigger.layoutAlign = "STRETCH";
  trigger.appendChild(
    await makeText({ text: "Is it accessible?", role: "bold", size: 14, colorToken: "foreground" }),
  );
  trigger.appendChild(
    await makeText({ text: "▾", role: "body", size: 14, colorToken: "muted-foreground" }),
  );

  const content = await makeFrame({
    name: "AccordionContent",
    direction: "column",
    gap: 0,
  });
  content.layoutAlign = "STRETCH";
  content.paddingBottom = 16;
  const body = await makeText({
    text: "Yes. It adheres to the WAI-ARIA design pattern.",
    role: "body",
    size: 14,
    colorToken: "muted-foreground",
  });
  body.layoutAlign = "STRETCH";
  content.appendChild(body);

  const rule = await makeFrame({ name: "Border", bgToken: "border" });
  rule.resize(360, 2);
  rule.layoutAlign = "STRETCH";

  comp.appendChild(trigger);
  comp.appendChild(content);
  comp.appendChild(rule);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildSlider(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "Slider";
  // Absolute layout: the thumb overlaps the track, which auto-layout can't do.
  await applyContainerStyle(comp, { direction: "none" });
  comp.resize(280, 16);

  const track = await makeFrame({ name: "Track", bgToken: "muted", radiusPx: 999 });
  track.resize(280, 6);
  track.x = 0;
  track.y = 5;
  const range = await makeFrame({ name: "Range", bgToken: "primary", radiusPx: 999 });
  range.resize(140, 6);
  range.x = 0;
  range.y = 5;
  const thumb = await makeFrame({
    name: "Thumb",
    bgToken: "background",
    radiusPx: 999,
    strokeToken: "primary",
    strokeWeight: 1,
    shadowToken: "sm",
  });
  thumb.resize(16, 16);
  thumb.x = 132;
  thumb.y = 0;

  comp.appendChild(track);
  comp.appendChild(range);
  comp.appendChild(thumb);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

async function buildRadioGroupItem(page: PageNode, x: number, y: number) {
  const states: Array<{ name: string; checked: boolean }> = [
    { name: "state=unchecked", checked: false },
    { name: "state=checked", checked: true },
  ];
  const nodes: ComponentNode[] = [];
  for (const st of states) {
    const comp = figma.createComponent();
    comp.name = st.name;
    await applyContainerStyle(comp, {
      direction: "row",
      align: "CENTER",
      cross: "CENTER",
      radiusPx: 999,
      strokeToken: "primary",
      strokeWeight: 1,
      shadowToken: "DEFAULT",
    });
    comp.resize(16, 16);
    comp.primaryAxisSizingMode = "FIXED";
    comp.counterAxisSizingMode = "FIXED";
    if (st.checked) {
      const dot = await makeFrame({ name: "Indicator", bgToken: "primary", radiusPx: 999 });
      dot.resize(8, 8);
      comp.appendChild(dot);
    }
    nodes.push(comp);
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "RadioGroupItem";
  configureSet(set, x, y);
  return set;
}

async function buildToggle(page: PageNode, x: number, y: number) {
  const variants: Record<string, { strokeToken?: string; shadowToken?: string }> = {
    default: {},
    outline: { strokeToken: "input", shadowToken: "sm" },
  };
  const sizes: Record<string, { padX: number; h: number; minW: number }> = {
    default: { padX: 8, h: 36, minW: 36 },
    sm: { padX: 6, h: 32, minW: 32 },
    lg: { padX: 10, h: 40, minW: 40 },
  };
  const nodes: ComponentNode[] = [];
  for (const [variant, vStyle] of Object.entries(variants)) {
    for (const [size, sz] of Object.entries(sizes)) {
      const comp = figma.createComponent();
      comp.name = `variant=${variant}, size=${size}`;
      await applyContainerStyle(comp, {
        direction: "row",
        paddingX: sz.padX,
        align: "CENTER",
        cross: "CENTER",
        radiusToken: "md",
        strokeToken: vStyle.strokeToken,
        strokeWeight: vStyle.strokeToken ? 1 : undefined,
        shadowToken: vStyle.shadowToken,
      });
      comp.resize(sz.minW, sz.h);
      comp.counterAxisSizingMode = "FIXED";
      comp.primaryAxisSizingMode = "FIXED";
      const label = await makeText({
        text: "B",
        role: "bold",
        size: 14,
        colorToken: "foreground",
      });
      comp.appendChild(label);
      nodes.push(comp);
    }
  }
  nodes.forEach((n) => page.appendChild(n));
  const set = figma.combineAsVariants(nodes, page);
  set.name = "Toggle";
  configureSet(set, x, y);
  return set;
}

async function buildPopoverContent(page: PageNode, x: number, y: number) {
  const comp = figma.createComponent();
  comp.name = "PopoverContent";
  await applyContainerStyle(comp, {
    direction: "column",
    gap: 8,
    paddingX: 16,
    paddingY: 16,
    bgToken: "popover",
    radiusToken: "md",
    strokeToken: "popover-border",
    strokeWeight: 1,
    shadowToken: "md",
  });
  comp.resize(288, comp.height);
  comp.counterAxisSizingMode = "FIXED";
  const title = await makeText({
    text: "Dimensions",
    role: "bold",
    size: 14,
    colorToken: "popover-foreground",
  });
  const desc = await makeText({
    text: "Set the dimensions for the layer.",
    role: "body",
    size: 13,
    colorToken: "muted-foreground",
  });
  title.layoutAlign = "STRETCH";
  desc.layoutAlign = "STRETCH";
  comp.appendChild(title);
  comp.appendChild(desc);
  page.appendChild(comp);
  comp.x = x;
  comp.y = y;
  return comp;
}

/** Lay out a component set's variants in a tidy wrapped grid and place it. */
function configureSet(set: ComponentSetNode, x: number, y: number) {
  set.layoutMode = "HORIZONTAL";
  set.layoutWrap = "WRAP";
  set.itemSpacing = 16;
  set.counterAxisSpacing = 16;
  set.paddingLeft = set.paddingRight = 24;
  set.paddingTop = set.paddingBottom = 24;
  set.primaryAxisSizingMode = "FIXED";
  set.counterAxisSizingMode = "AUTO";
  set.resize(720, set.height);
  set.fills = [];
  set.x = x;
  set.y = y;
}

type Builder = (page: PageNode, x: number, y: number) => Promise<SceneNode>;

const BUILDERS: Array<{ name: string; build: Builder }> = [
  { name: "Button", build: buildButton },
  { name: "Logo", build: buildLogo },
  { name: "Navbar", build: buildNavbar },
  { name: "Footer", build: buildFooter },
  { name: "Badge", build: buildBadge },
  { name: "Card", build: buildCard },
  { name: "Input", build: buildInput },
  { name: "Alert", build: buildAlert },
  { name: "Label", build: buildLabel },
  { name: "Switch", build: buildSwitch },
  { name: "Checkbox", build: buildCheckbox },
  { name: "Separator", build: buildSeparator },
  { name: "Avatar", build: buildAvatar },
  { name: "Textarea", build: buildTextarea },
  { name: "Tooltip", build: buildTooltip },
  { name: "Progress", build: buildProgress },
  { name: "Skeleton", build: buildSkeleton },
  { name: "Spinner", build: buildSpinner },
  { name: "TabsList", build: buildTabsList },
  { name: "TabsTrigger", build: buildTabsTrigger },
  { name: "SelectTrigger", build: buildSelectTrigger },
  { name: "DialogContent", build: buildDialogContent },
  { name: "AccordionItem", build: buildAccordionItem },
  { name: "Slider", build: buildSlider },
  { name: "RadioGroupItem", build: buildRadioGroupItem },
  { name: "Toggle", build: buildToggle },
  { name: "PopoverContent", build: buildPopoverContent },
];

export async function generateComponents(
  log: (msg: string) => void,
): Promise<number> {
  await fonts();
  const page = await getOrCreatePage(COMPONENTS_PAGE);
  // Idempotent rebuild: wipe the plugin-owned page so re-runs never accumulate
  // stale headings or duplicate component sets.
  for (const child of [...page.children]) child.remove();
  let y = 80;
  const x = 80;
  let count = 0;
  for (const b of BUILDERS) {
    const node = await b.build(page, x, y);
    // Title above each component block. Named distinctly from the component so
    // it can never collide with the component/component-set node names.
    const heading = await makeText({
      text: b.name,
      role: "display",
      size: 18,
      colorToken: "foreground",
      uppercase: true,
    });
    heading.name = `${b.name} — label`;
    page.appendChild(heading);
    heading.x = x;
    heading.y = y - 32;
    y += node.height + 96;
    count++;
    log(`Built ${b.name}`);
  }
  return count;
}
