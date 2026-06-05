// Pico Figma plugin — UI side. Runs inside the plugin <iframe>, which (unlike
// the plugin "code" sandbox) has access to the DOM and `fetch`. This is the
// "fetch/render step" the plugin drives: it retrieves the page's delivered HTML
// — directly, or via the companion `/api/render` endpoint when a render-service
// base URL is supplied (server-side fetch that sidesteps CORS) — and parses the
// Figma-readable instrumentation (`data-pico-component`, `data-pico-<axis>`,
// `data-pico-section`) into a structured tree, then hands it to the code side to
// rebuild in Figma.

import {
  DEVICE_PRESETS,
  type DeviceSize,
  type ParsedNode,
  type ParsedPage,
  type UiToCode,
  type CodeToUi,
  type OpBox,
} from "../shared/messages";
import { buildHexToTokenMap, validatePicoTokens } from "../shared/tokens";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

// Origin baked in at build time (pack.mjs / build.mjs) so the downloadable
// plugin already points the optional render service at the deployed Pico + API
// server. Empty string when no default is configured (field stays blank).
declare const __PICO_DEFAULT_ORIGIN__: string;

// Build-time version label (package version + UTC build date), baked by
// build.mjs so a designer can confirm they're running the latest plugin.
declare const __PICO_PLUGIN_VERSION__: string;

const versionEl = document.getElementById("version");
if (versionEl && typeof __PICO_PLUGIN_VERSION__ === "string") {
  versionEl.textContent = __PICO_PLUGIN_VERSION__;
}

const statusEl = $("status");

function setStatus(level: "info" | "success" | "error", message: string) {
  statusEl.className = level;
  statusEl.textContent = message;
}

function post(msg: UiToCode) {
  parent.postMessage({ pluginMessage: msg }, "*");
}

function resolveDevice(): DeviceSize {
  const id = ($("device") as HTMLSelectElement).value as DeviceSize["id"];
  if (id === "custom") {
    const width = Math.max(
      64,
      parseInt(($("custom-w") as HTMLInputElement).value, 10) || 1280,
    );
    const height = Math.max(
      64,
      parseInt(($("custom-h") as HTMLInputElement).value, 10) || 900,
    );
    return { id, label: `Custom ${width}×${height}`, width, height };
  }
  const preset = DEVICE_PRESETS[id];
  return { id, label: preset.label, width: preset.width, height: preset.height };
}

// ---- Page reading --------------------------------------------------------

const hexToToken = buildHexToTokenMap("light");

/** Normalize any CSS color into "#rrggbb" lowercase, or null if unknown. */
function normalizeColor(input: string | null): string | null {
  if (!input) return null;
  const v = input.trim().toLowerCase();
  if (v === "transparent" || v.startsWith("rgba(0, 0, 0, 0")) return null;
  const rgb = v.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(",").map((p) => parseFloat(p));
    const [r, g, b, a] = parts;
    if (a !== undefined && a === 0) return null;
    return (
      "#" +
      [r, g, b]
        .map((n) => Math.round(n).toString(16).padStart(2, "0"))
        .join("")
    );
  }
  if (v.startsWith("#")) {
    if (v.length === 4) {
      return (
        "#" +
        v
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
      );
    }
    return v.slice(0, 7);
  }
  return null;
}

function tokenFor(color: string | null): string | undefined {
  const hex = normalizeColor(color);
  if (!hex) return undefined;
  return hexToToken[hex];
}

/** Detect that a fetched document is actually a login / auth wall. */
function looksAuthWalled(doc: Document, finalUrl: string, html: string): boolean {
  const lowerUrl = finalUrl.toLowerCase();
  if (/\/sign-in|\/sign_in|\/login|\/signin|accounts\./.test(lowerUrl)) {
    return true;
  }
  if (doc.querySelector("[data-clerk-publishable-key], .cl-rootBox, #clerk")) {
    return true;
  }
  const text = (doc.body?.textContent || "").toLowerCase();
  const hasComponents = !!doc.querySelector("[data-pico-component], [data-pico-section]");
  if (
    !hasComponents &&
    /(sign in|log in|create account|password)/.test(text) &&
    doc.querySelector('input[type="password"]')
  ) {
    return true;
  }
  return false;
}

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "LINK",
  "META",
  "HEAD",
  "BR",
]);

/** Direct (non-descendant) text owned by an element. */
function ownText(el: Element): string {
  let t = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) t += n.textContent || "";
  });
  return t.replace(/\s+/g, " ").trim();
}

function readLayout(el: Element): ParsedNode["layout"] {
  const style = (el as HTMLElement).style;
  const cls = el.className && typeof el.className === "string" ? el.className : "";
  const numAttr = (name: string): number | undefined => {
    const v = parseFloat(el.getAttribute(name) || "");
    return Number.isFinite(v) ? v : undefined;
  };
  // Flow direction — prefer the render step's data-pico-flow, else inline/class.
  const flowAttr = el.getAttribute("data-pico-flow");
  const flow: "row" | "col" | undefined =
    flowAttr === "row" ? "row" : flowAttr === "col" ? "col" : undefined;
  const display = style.display;
  const flexDir = style.flexDirection;
  const direction: "row" | "column" | undefined =
    flow === "row"
      ? "row"
      : flow === "col"
        ? "column"
        : flexDir === "row" || cls.includes("flex-row")
          ? "row"
          : flexDir === "column" || cls.includes("flex-col")
            ? "column"
            : display === "flex" || cls.includes("flex")
              ? "row"
              : undefined;
  const gridCols = numAttr("data-pico-cols");
  const justify = el.getAttribute("data-pico-jc") || undefined;
  const align = el.getAttribute("data-pico-ai") || undefined;

  const bgToken = tokenFor(style.backgroundColor);
  const fgToken = tokenFor(style.color);
  const radiusToken = cls.match(/rounded-(sm|md|lg|xl)\b/)?.[1];
  const shadowToken = cls.match(/shadow-(2xs|xs|sm|md|lg|xl|2xl)\b/)?.[1];
  const fontSize = style.fontSize ? parseFloat(style.fontSize) : undefined;
  const fontWeight = style.fontWeight ? parseInt(style.fontWeight, 10) : undefined;
  // Line-height ratio + text-align stamped by the render step (data-pico-lh/ta).
  const lineHeight = numAttr("data-pico-lh");
  const textAlign = el.getAttribute("data-pico-ta") || undefined;
  // Spacing — data-pico-* (from the render step) wins over inline style.
  const paddingX =
    numAttr("data-pico-pl") ??
    (style.paddingLeft ? parseFloat(style.paddingLeft) : undefined);
  const paddingRight = numAttr("data-pico-pr");
  const paddingY =
    numAttr("data-pico-pt") ??
    (style.paddingTop ? parseFloat(style.paddingTop) : undefined);
  const paddingBottom = numAttr("data-pico-pb");
  const rowGap = numAttr("data-pico-rg");
  const colGap = numAttr("data-pico-cg");
  const flowGap = direction === "row" ? colGap ?? rowGap : rowGap ?? colGap;
  const gap = flowGap ?? (style.gap ? parseFloat(style.gap) : undefined);
  // Typography family — drives display/serif/mono role detection.
  let fontFamily = style.fontFamily || undefined;
  if (!fontFamily && /\bfont-display\b/.test(cls)) fontFamily = "Platypi";
  else if (!fontFamily && /\bfont-serif\b/.test(cls)) fontFamily = "Georgia";
  else if (!fontFamily && /\bfont-mono\b/.test(cls)) fontFamily = "monospace";
  // Border — inlined by the render step as data-pico-bw / data-pico-bc.
  const borderWidthAttr = el.getAttribute("data-pico-bw");
  const borderColorAttr = el.getAttribute("data-pico-bc");

  const layout: ParsedNode["layout"] = {};
  if (direction) layout.direction = direction;
  if (flow) layout.flow = flow;
  if (gridCols && gridCols > 1) layout.gridCols = gridCols;
  if (justify) layout.justify = justify;
  if (align) layout.align = align;
  if (bgToken) layout.bgToken = bgToken;
  else {
    const hex = normalizeColor(style.backgroundColor);
    if (hex) layout.bgHex = hex;
  }
  if (fgToken) layout.fgToken = fgToken;
  else {
    const hex = normalizeColor(style.color);
    if (hex) layout.fgHex = hex;
  }
  if (radiusToken) layout.radiusToken = radiusToken;
  if (shadowToken) layout.shadowToken = shadowToken;
  if (fontSize) layout.fontSize = fontSize;
  if (fontWeight) layout.fontWeight = fontWeight;
  if (lineHeight && lineHeight > 0) layout.lineHeight = lineHeight;
  if (textAlign) layout.textAlign = textAlign;
  if (paddingX) layout.paddingX = paddingX;
  if (paddingY) layout.paddingY = paddingY;
  if (paddingRight) layout.paddingRight = paddingRight;
  if (paddingBottom) layout.paddingBottom = paddingBottom;
  if (gap) layout.gap = gap;
  if (rowGap) layout.rowGap = rowGap;
  if (colGap) layout.colGap = colGap;
  if (fontFamily) layout.fontFamily = fontFamily;
  if (borderWidthAttr) {
    const w = parseFloat(borderWidthAttr);
    if (w > 0) {
      layout.strokeWeight = w;
      const tok = tokenFor(borderColorAttr);
      if (tok) layout.strokeToken = tok;
      else {
        const hex = normalizeColor(borderColorAttr);
        if (hex) layout.strokeHex = hex;
      }
    }
  }
  return Object.keys(layout).length ? layout : undefined;
}

function readVariants(el: Element): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-pico-") && attr.name !== "data-pico-component") {
      const axis = attr.name.replace("data-pico-", "");
      if (axis === "section") continue;
      out[axis] = attr.value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** Walk the DOM into a compact ParsedNode tree, keeping meaningful nodes only. */
function walk(el: Element, depth: number): ParsedNode | null {
  if (SKIP_TAGS.has(el.tagName)) return null;
  if (depth > 40) return null;

  // Inline SVG → a single drawable leaf (don't recurse into its paths).
  if (el.tagName === "svg") {
    const w = parseInt(el.getAttribute("data-pico-w") || "", 10);
    const h = parseInt(el.getAttribute("data-pico-h") || "", 10);
    const markup = el.outerHTML;
    if (markup && w > 0 && h > 0) {
      const n: ParsedNode = { children: [], svg: { markup, width: w, height: h } };
      const box = pageCoords(el);
      if (box) n.box = box;
      return n;
    }
    return null;
  }

  // Raster image → an image leaf; bytes are fetched after the walk.
  if (el.tagName === "IMG") {
    const src = el.getAttribute("src") || "";
    if (!/^https?:\/\//i.test(src)) return null;
    const w = parseInt(el.getAttribute("data-pico-w") || "", 10) || 0;
    const h = parseInt(el.getAttribute("data-pico-h") || "", 10) || 0;
    const n: ParsedNode = { children: [], image: { src, width: w, height: h } };
    const box = pageCoords(el);
    if (box) n.box = box;
    return n;
  }

  const component = el.getAttribute("data-pico-component") || undefined;
  const section = el.getAttribute("data-pico-section") || undefined;
  const variants = readVariants(el);
  const text = ownText(el);

  const children: ParsedNode[] = [];
  for (const child of Array.from(el.children)) {
    const node = walk(child, depth + 1);
    if (node) children.push(node);
  }

  const isHeadingOrText = /^(H[1-6]|P|SPAN|A|LABEL|LI|STRONG|EM|SMALL)$/.test(
    el.tagName,
  );
  const meaningful =
    component ||
    section ||
    (text && isHeadingOrText) ||
    children.length > 0 ||
    el.tagName === "IMG";

  if (!meaningful) return null;

  // Collapse pure pass-through wrappers (single child, no identity/text).
  if (
    !component &&
    !section &&
    !text &&
    children.length === 1 &&
    el.tagName === "DIV"
  ) {
    return children[0];
  }

  const node: ParsedNode = { children };
  if (component) node.component = component;
  if (variants) node.variants = variants;
  if (section) node.section = section;
  if (text && (isHeadingOrText || component)) {
    node.text = text;
    node.tag = el.tagName.toLowerCase();
  }
  const layout = readLayout(el);
  if (layout) node.layout = layout;
  const box = pageCoords(el);
  if (box) node.box = box;
  return node;
}

interface FetchedPage {
  html: string;
  finalUrl: string;
  status: number;
}

/**
 * Retrieve a page's delivered HTML. When a render-service base URL is provided
 * the fetch is done server-side (the companion `/api/render` endpoint), which
 * sidesteps the CORS limits a plugin iframe hits on most cross-origin sites.
 * Falls back to a direct fetch when no service is configured.
 */
async function fetchPage(
  url: string,
  renderBase: string,
  viewportWidth: number,
): Promise<FetchedPage> {
  if (renderBase) {
    const base = renderBase.replace(/\/+$/, "");
    const endpoint = `${base}/api/render?url=${encodeURIComponent(url)}&w=${viewportWidth}`;
    let res: Response;
    try {
      res = await fetch(endpoint, { credentials: "omit" });
    } catch (e) {
      throw new Error(
        `Could not reach the render service. ${(e as Error).message}`,
      );
    }
    if (!res.ok) {
      let detail = "";
      try {
        detail = ((await res.json()) as { error?: string }).error || "";
      } catch {
        /* non-JSON error body */
      }
      throw new Error(
        `Render service returned ${res.status}${detail ? `: ${detail}` : ""}`,
      );
    }
    const data = (await res.json()) as Partial<FetchedPage>;
    return {
      html: data.html || "",
      finalUrl: data.finalUrl || url,
      status: data.status ?? 200,
    };
  }

  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow", credentials: "omit" });
  } catch (e) {
    throw new Error(
      `Could not fetch the URL directly (network/CORS). Set a render service URL to fetch it server-side. ${(e as Error).message}`,
    );
  }
  return { html: await res.text(), finalUrl: res.url || url, status: res.status };
}

/** Collect every absolute <img> src referenced in the parsed tree. */
function collectImageSrcs(node: ParsedNode, out: Set<string>): void {
  if (node.image?.src) out.add(node.image.src);
  for (const child of node.children) collectImageSrcs(child, out);
}

/** Page-relative box stamped by the render step, or null if absent/empty. */
function pageCoords(el: Element): OpBox | null {
  const x = parseInt(el.getAttribute("data-pico-x") || "", 10);
  const y = parseInt(el.getAttribute("data-pico-y") || "", 10);
  const w = parseInt(el.getAttribute("data-pico-w") || "", 10);
  const h = parseInt(el.getAttribute("data-pico-h") || "", 10);
  if (![x, y, w, h].every((n) => Number.isFinite(n))) return null;
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(bin);
}

const MAX_ASSETS = 24;

/** Fetch image bytes for each src (via the render service proxy when set). */
async function fetchAssets(
  srcs: string[],
  renderBase: string,
): Promise<Record<string, { bytes: string; mime: string }>> {
  const assets: Record<string, { bytes: string; mime: string }> = {};
  const base = renderBase.replace(/\/+$/, "");
  const unique = Array.from(new Set(srcs)).slice(0, MAX_ASSETS);
  await Promise.all(
    unique.map(async (src) => {
      try {
        const endpoint = base
          ? `${base}/api/asset?url=${encodeURIComponent(src)}`
          : src;
        const res = await fetch(endpoint, { credentials: "omit" });
        if (!res.ok) return;
        const mime = (res.headers.get("content-type") || "application/octet-stream")
          .split(";")[0]
          .trim();
        const buf = await res.arrayBuffer();
        assets[src] = { bytes: arrayBufferToBase64(buf), mime };
      } catch {
        /* skip unreachable assets */
      }
    }),
  );
  return assets;
}

async function readPage(
  url: string,
  renderBase: string,
  device: DeviceSize,
): Promise<ParsedPage> {
  const { html, finalUrl, status } = await fetchPage(url, renderBase, device.width);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.title || url;

  const authWalled =
    status === 401 ||
    status === 403 ||
    looksAuthWalled(doc, finalUrl, html);

  if (authWalled) {
    return {
      url,
      title,
      root: { children: [] },
      authWalled: true,
      note: "Behind an auth/login wall — the page markup can't be read.",
    };
  }

  const body = doc.body;
  const root = body ? walk(body, 0) : null;
  const resolvedRoot = root || { children: [] };
  const componentCount = doc.querySelectorAll("[data-pico-component]").length;

  const docEl = doc.documentElement;
  const contentWidth =
    parseInt(docEl?.getAttribute("data-pico-doc-w") || "", 10) || device.width;
  const contentHeight =
    parseInt(docEl?.getAttribute("data-pico-doc-h") || "", 10) || 0;

  const srcSet = new Set<string>();
  collectImageSrcs(resolvedRoot, srcSet);
  const assets =
    srcSet.size > 0 ? await fetchAssets(Array.from(srcSet), renderBase) : {};

  const compNote =
    componentCount > 0
      ? `${componentCount} Pico component instance(s)`
      : "no Pico instrumentation";

  return {
    url,
    title,
    root: resolvedRoot,
    authWalled: false,
    note: `Rebuilt page with auto-layout (${compNote}).`,
    assets,
    contentWidth,
    contentHeight,
  };
}

// ---- Wire up the panel ---------------------------------------------------

$("device").addEventListener("change", () => {
  const custom = ($("device") as HTMLSelectElement).value === "custom";
  $("custom-size").classList.toggle("show", custom);
});

$("btn-sync-tokens").addEventListener("click", async () => {
  const tokensUrl = ($("tokens-url") as HTMLInputElement).value.trim();
  if (!tokensUrl) {
    setStatus("info", "Syncing bundled tokens…");
    post({ type: "sync-tokens" });
    return;
  }
  if (!/^https?:\/\//i.test(tokensUrl)) {
    setStatus("error", "Tokens URL must be an http(s) link.");
    return;
  }
  setStatus("info", "Fetching latest tokens…");
  try {
    const res = await fetch(tokensUrl, { credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = validatePicoTokens(await res.json());
    setStatus("info", "Syncing tokens from URL…");
    post({ type: "sync-tokens", tokens: data, sourceLabel: tokensUrl });
  } catch (e) {
    setStatus(
      "error",
      `Couldn't use ${tokensUrl} (${(e as Error).message}). Falling back to bundled tokens…`,
    );
    post({ type: "sync-tokens" });
  }
});

$("btn-generate-components").addEventListener("click", () => {
  setStatus("info", "Generating components…");
  post({ type: "generate-components" });
});

$("btn-sync-icons").addEventListener("click", () => {
  setStatus("info", "Syncing icons…");
  post({ type: "sync-icons" });
});

$("btn-page").addEventListener("click", async () => {
  const url = ($("url") as HTMLInputElement).value.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    setStatus("error", "Enter a valid http(s) URL.");
    return;
  }
  const device = resolveDevice();
  // The downloadable plugin is baked with the deployed Pico + API origin, so the
  // companion /api/render endpoint is always reached via that origin — there is
  // no user-facing render-service field anymore.
  const renderBase =
    typeof __PICO_DEFAULT_ORIGIN__ === "string" ? __PICO_DEFAULT_ORIGIN__ : "";
  setStatus("info", "Reading page…");
  let page: ParsedPage;
  try {
    page = await readPage(url, renderBase, device);
    setStatus("info", `${page.note ?? "Page read."} Building in Figma…`);
  } catch (e) {
    page = {
      url,
      title: url,
      root: { children: [] },
      authWalled: false,
      note: `Couldn't read the page (${(e as Error).message}).`,
    };
    setStatus("error", `Couldn't read that URL (${(e as Error).message}).`);
  }
  post({ type: "reconstruct-page", page, device });
});

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as CodeToUi | undefined;
  if (!msg) return;
  if (msg.type === "status") setStatus(msg.level, msg.message);
};
