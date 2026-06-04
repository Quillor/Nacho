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
} from "../shared/messages";
import { buildHexToTokenMap, validatePicoTokens } from "../shared/tokens";

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

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
  "svg",
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
  // Inline styles are most reliable in delivered HTML; class hints supplement.
  const display = style.display;
  const flexDir = style.flexDirection;
  const direction: "row" | "column" | undefined =
    flexDir === "row" || cls.includes("flex-row")
      ? "row"
      : flexDir === "column" || cls.includes("flex-col")
        ? "column"
        : display === "flex" || cls.includes("flex")
          ? "row"
          : undefined;

  const bgToken = tokenFor(style.backgroundColor);
  const fgToken = tokenFor(style.color);
  const radiusToken = cls.match(/rounded-(sm|md|lg|xl)\b/)?.[1];
  const shadowToken = cls.match(/shadow-(2xs|xs|sm|md|lg|xl|2xl)\b/)?.[1];
  const fontSize = style.fontSize ? parseFloat(style.fontSize) : undefined;
  const fontWeight = style.fontWeight ? parseInt(style.fontWeight, 10) : undefined;

  const layout: ParsedNode["layout"] = {};
  if (direction) layout.direction = direction;
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
  if (text && (isHeadingOrText || component)) node.text = text;
  const layout = readLayout(el);
  if (layout) node.layout = layout;
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
): Promise<FetchedPage> {
  if (renderBase) {
    const base = renderBase.replace(/\/+$/, "");
    const endpoint = `${base}/api/render?url=${encodeURIComponent(url)}`;
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

async function readPage(url: string, renderBase: string): Promise<ParsedPage> {
  const { html, finalUrl, status } = await fetchPage(url, renderBase);
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
      note: "Behind an auth/login wall — a placeholder will be generated.",
    };
  }

  const body = doc.body;
  const root = body ? walk(body, 0) : null;
  const componentCount = doc.querySelectorAll("[data-pico-component]").length;
  return {
    url,
    title,
    root: root || { children: [] },
    authWalled: false,
    note:
      componentCount > 0
        ? `Read ${componentCount} Pico component instance(s).`
        : "No Pico instrumentation found; rebuilt as token-bound frames.",
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

$("btn-placeholder").addEventListener("click", () => {
  setStatus("info", "Generating sample placeholder page…");
  post({ type: "generate-placeholder" });
});

$("btn-page").addEventListener("click", async () => {
  const url = ($("url") as HTMLInputElement).value.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    setStatus("error", "Enter a valid http(s) URL.");
    return;
  }
  const device = resolveDevice();
  const renderBase = ($("render-base") as HTMLInputElement).value.trim();
  setStatus("info", "Reading page…");
  try {
    const page = await readPage(url, renderBase);
    if (page.authWalled) {
      setStatus(
        "info",
        "Auth-walled — generating a placeholder under /placeholder…",
      );
      post({
        type: "reconstruct-placeholder-for-url",
        url,
        device,
        reason: page.note || "Auth wall",
      });
      return;
    }
    setStatus("info", `${page.note} Rebuilding in Figma…`);
    post({ type: "reconstruct-page", page, device });
  } catch (e) {
    setStatus("error", (e as Error).message);
  }
});

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as CodeToUi | undefined;
  if (!msg) return;
  if (msg.type === "status") setStatus(msg.level, msg.message);
};
