// Companion fetch/render step for the Pico Figma plugin's page-from-URL flow.
//
// A Figma plugin's UI iframe can `fetch`, but cross-origin requests to other
// sites are routinely blocked by CORS, so the plugin can't reliably read most
// public pages itself. This endpoint performs the work server-side (no CORS
// restriction) and returns HTML for the plugin to parse.
//
// Two strategies, best-first:
//   1. Headless render — when a Chromium binary can be resolved, we drive it
//      with playwright-core: navigate, let the SPA hydrate, inline the computed
//      styles the plugin's importer reads (colors, font size/weight, flex
//      direction, padding, gap), then serialize the live DOM. This is what
//      lets client-rendered apps (e.g. Nacho) come back with their real
//      `data-pico-*` instrumentation instead of an empty shell. The binary is
//      resolved in this order: REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE (provided
//      in the Replit workspace) → a system Chromium on PATH (`chromium` is a
//      declared system dependency, so a NixOS-compatible binary ships in the
//      deployed image) → a browser downloaded by playwright-core itself. A
//      downloaded vanilla Chromium will NOT run on NixOS (it can't find its
//      ELF interpreter / shared libs), which is why a Nix-patched Chromium is
//      installed as a system dependency for production.
//   2. Plain fetch — fallback when no browser is available. Returns the
//      *delivered* markup only; client-rendered SPAs will return their shell.
//      The response records which strategy ran (`rendered`) so the plugin can
//      tell a real reconstruction from an unrenderable shell.
//
// SSRF hardening: only http(s) is allowed, every fetch hop (including
// redirects) is re-resolved and rejected if it points at a private / loopback
// / link-local / cloud-metadata address, and the fetched body is size-capped.
// Public Replit app domains (*.replit.app / *.replit.dev / *.repl.co) are
// allowed even though they resolve to internal addresses inside the cluster —
// they represent the user's own publicly-reachable apps, which is the common
// case for this tool.

import { Router, type IRouter } from "express";
import dns from "node:dns/promises";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";

const router: IRouter = Router();

const MAX_BYTES = 2_000_000;
const MAX_ASSET_BYTES = 5_000_000;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 15_000;
const BROWSER_TIMEOUT_MS = 30_000;

interface RenderResult {
  finalUrl: string;
  status: number;
  html: string;
  /** Which strategy produced the HTML — lets the plugin distinguish a real
   *  reconstruction from an unrenderable SPA shell. */
  rendered: "browser" | "fetch";
}

// Candidate binary names for a system/Nix-provided Chromium, searched on PATH
// when REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE is absent (the deployment case).
const CHROMIUM_BINARIES = [
  "chromium",
  "chromium-browser",
  "google-chrome-stable",
  "google-chrome",
  "chrome",
];

let cachedExecutable: string | null | undefined;

function findOnPath(binaries: string[]): string | null {
  const dirs = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  for (const bin of binaries) {
    for (const dir of dirs) {
      const candidate = path.join(dir, bin);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        /* not on this PATH entry */
      }
    }
  }
  return null;
}

// Resolve a launchable Chromium binary, best-first. Cached after the first
// successful (or failed) resolution since the answer can't change at runtime.
async function resolveChromiumExecutable(
  chromium: typeof import("playwright-core").chromium,
): Promise<string | null> {
  if (cachedExecutable !== undefined) return cachedExecutable;

  // 1. Replit workspace provides a Nix-patched binary via this env var.
  const fromEnv = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (fromEnv && fs.existsSync(fromEnv)) {
    cachedExecutable = fromEnv;
    return cachedExecutable;
  }

  // 2. A system/Nix Chromium on PATH. In the deployed image `chromium` is a
  //    declared system dependency, so a NixOS-compatible binary is present.
  const onPath = findOnPath(CHROMIUM_BINARIES);
  if (onPath) {
    cachedExecutable = onPath;
    return cachedExecutable;
  }

  // 3. A browser downloaded by playwright-core itself, if one exists and is
  //    actually runnable in this environment.
  try {
    const p = chromium.executablePath();
    if (p && fs.existsSync(p)) {
      cachedExecutable = p;
      return cachedExecutable;
    }
  } catch {
    /* no bundled browser */
  }

  cachedExecutable = null;
  return cachedExecutable;
}

function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 127 || a === 10) return true; // this-host, loopback, private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true; // loopback / unspecified
    if (v.startsWith("fe80")) return true; // link-local
    if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique-local
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedIp(mapped[1]);
    return false;
  }
  return true;
}

// Public Replit app domains resolve to internal cluster addresses from inside
// the workspace, but they are the user's own publicly-reachable apps — the
// primary thing this tool recreates. Trust them by hostname.
function isReplitPublicHost(hostname: string): boolean {
  return /(^|\.)(replit\.app|replit\.dev|repl\.co)$/i.test(hostname);
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (isReplitPublicHost(hostname)) return;
  let addrs: string[];
  if (net.isIP(hostname)) {
    addrs = [hostname];
  } else {
    const looked = await dns.lookup(hostname, { all: true });
    addrs = looked.map((l) => l.address);
  }
  if (addrs.length === 0) throw new Error("Host did not resolve");
  for (const ip of addrs) {
    if (isBlockedIp(ip)) {
      throw new Error("Refusing to fetch a private/internal address");
    }
  }
}

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return response.text();
  const decoder = new TextDecoder();
  let html = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    html += decoder.decode(value, { stream: true });
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  html += decoder.decode();
  return html;
}

// Runs in the page context (Chromium). Inlines the computed styles the plugin's
// importer reads so a CSS-less DOMParser on the plugin side still sees real
// colors, type, and spacing, then returns the serialized live DOM.
const INLINE_AND_SERIALIZE = `(() => {
  var TRANSPARENT = "rgba(0, 0, 0, 0)";
  var els = document.querySelectorAll("*");
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var cs = getComputedStyle(el);
    var s = el.style;
    var bg = cs.backgroundColor;
    if (bg && bg !== TRANSPARENT && bg !== "transparent") s.backgroundColor = bg;
    var hasText = false;
    for (var j = 0; j < el.childNodes.length; j++) {
      var n = el.childNodes[j];
      if (n.nodeType === 3 && n.textContent && n.textContent.trim()) { hasText = true; break; }
    }
    if (hasText) {
      if (cs.color) s.color = cs.color;
      if (cs.fontSize) s.fontSize = cs.fontSize;
      if (cs.fontWeight) s.fontWeight = cs.fontWeight;
      if (cs.fontFamily) s.fontFamily = cs.fontFamily;
      // Line-height as a unitless ratio (lineHeight px / fontSize px) so the
      // plugin can rebuild type with the page's real leading. "normal" → skip.
      var lhPx = parseFloat(cs.lineHeight);
      var fsPx = parseFloat(cs.fontSize);
      if (lhPx && fsPx) el.setAttribute("data-pico-lh", (lhPx / fsPx).toFixed(3));
    }
    if (cs.display === "flex" || cs.display === "inline-flex") {
      s.display = "flex";
      if (cs.flexDirection) s.flexDirection = cs.flexDirection;
    }
    // Auto-layout hints: primary-axis flow, grid track count, alignment.
    var disp = cs.display;
    var flow = "";
    if (disp === "flex" || disp === "inline-flex") {
      flow = (cs.flexDirection && cs.flexDirection.indexOf("column") === 0) ? "col" : "row";
    } else if (disp === "grid" || disp === "inline-grid") {
      flow = "row";
      var gtc = (cs.gridTemplateColumns || "").trim();
      var cols = (gtc && gtc !== "none") ? gtc.split(/\\s+/).filter(Boolean).length : 0;
      if (cols > 1) el.setAttribute("data-pico-cols", String(cols));
    }
    if (flow) {
      el.setAttribute("data-pico-flow", flow);
      if (cs.justifyContent) el.setAttribute("data-pico-jc", cs.justifyContent);
      if (cs.alignItems) el.setAttribute("data-pico-ai", cs.alignItems);
    }
    // Padding (all four sides) + row/column gaps, for auto-layout spacing.
    var pl = parseFloat(cs.paddingLeft) || 0;
    var pr = parseFloat(cs.paddingRight) || 0;
    var pt = parseFloat(cs.paddingTop) || 0;
    var pb = parseFloat(cs.paddingBottom) || 0;
    if (pl) { s.paddingLeft = cs.paddingLeft; el.setAttribute("data-pico-pl", String(Math.round(pl))); }
    if (pr) el.setAttribute("data-pico-pr", String(Math.round(pr)));
    if (pt) { s.paddingTop = cs.paddingTop; el.setAttribute("data-pico-pt", String(Math.round(pt))); }
    if (pb) el.setAttribute("data-pico-pb", String(Math.round(pb)));
    var rg = parseFloat(cs.rowGap) || 0;
    var cg = parseFloat(cs.columnGap) || 0;
    if (rg) el.setAttribute("data-pico-rg", String(Math.round(rg)));
    if (cg) el.setAttribute("data-pico-cg", String(Math.round(cg)));
    if (parseFloat(cs.rowGap || cs.gap)) s.gap = (cs.rowGap || cs.gap);
    // Border — record the thickest side as a uniform stroke hint.
    var bw = [
      parseFloat(cs.borderTopWidth) || 0,
      parseFloat(cs.borderRightWidth) || 0,
      parseFloat(cs.borderBottomWidth) || 0,
      parseFloat(cs.borderLeftWidth) || 0
    ];
    var maxBw = Math.max(bw[0], bw[1], bw[2], bw[3]);
    if (maxBw > 0) {
      el.setAttribute("data-pico-bw", String(maxBw));
      var bcs = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor];
      var bColor = bcs[bw.indexOf(maxBw)];
      if (bColor) el.setAttribute("data-pico-bc", bColor);
    }
    // Border radius (top-left is representative for the uniform case we draw).
    var br = parseFloat(cs.borderTopLeftRadius) || 0;
    if (br > 0) el.setAttribute("data-pico-r", String(Math.round(br)));
    // Keep <img> src absolute so the asset proxy can fetch it later.
    if (el.tagName === "IMG") {
      try { var iSrc = el.currentSrc || el.src; if (iSrc) el.setAttribute("src", iSrc); } catch (e) {}
    }
    // Rendered geometry (page-relative) for absolute reconstruction.
    var r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      el.setAttribute("data-pico-x", String(Math.round(r.left + window.scrollX)));
      el.setAttribute("data-pico-y", String(Math.round(r.top + window.scrollY)));
      el.setAttribute("data-pico-w", String(Math.round(r.width)));
      el.setAttribute("data-pico-h", String(Math.round(r.height)));
      el.setAttribute("data-pico-ta", cs.textAlign || "");
    }
  }
  var docEl = document.documentElement;
  docEl.setAttribute("data-pico-doc-w", String(Math.round(docEl.scrollWidth)));
  docEl.setAttribute("data-pico-doc-h", String(Math.round(docEl.scrollHeight)));
  return "<!doctype html>" + docEl.outerHTML;
})()`;

// Render with a headless Chromium when one is available. Returns null (so the
// caller falls back to a plain fetch) when no browser binary is present or the
// dependency can't be loaded — e.g. an environment without the Replit-provided
// Playwright binary.
async function renderWithBrowser(
  start: URL,
  log: { warn: (obj: unknown, msg?: string) => void },
  viewportWidth: number,
): Promise<RenderResult | null> {
  let chromium: typeof import("playwright-core").chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    return null;
  }

  const executablePath = await resolveChromiumExecutable(chromium);
  if (!executablePath) return null;

  await assertPublicHost(start.hostname);

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage({
      viewport: { width: viewportWidth, height: 1024 },
      userAgent: "PicoFigmaPlugin/1.0 (+page-reader)",
    });
    const response = await page.goto(start.toString(), {
      waitUntil: "networkidle",
      timeout: BROWSER_TIMEOUT_MS,
    });
    // Small settle for late hydration.
    await page.waitForTimeout(400);
    // Grow the viewport to the full document height so every scroll-triggered
    // animation (e.g. Framer Motion `whileInView`) is in view at once and
    // settles to its final opacity/transform before we capture. With the
    // default short viewport, below-the-fold sections serialize mid-animation
    // (opacity:0, translateY(...)), so their captured geometry and styles don't
    // match the page's real resting layout — the reconstruction then misplaces
    // or overlaps them.
    try {
      const fullHeight = (await page.evaluate(
        "document.documentElement.scrollHeight",
      )) as number;
      const capped = Math.min(Math.max(fullHeight || 0, 1024), 8000);
      await page.setViewportSize({ width: viewportWidth, height: capped });
      await page.waitForTimeout(1000);
    } catch {
      // Non-fatal: keep whatever the default viewport captured.
    }
    const html = (await page.evaluate(INLINE_AND_SERIALIZE)) as string;
    return {
      finalUrl: page.url(),
      status: response?.status() ?? 200,
      html,
      rendered: "browser",
    };
  } catch (e) {
    log.warn({ err: (e as Error).message }, "headless render failed");
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// Plain server-side fetch with a manually-validated redirect loop. Returns the
// delivered markup only (no JS execution).
async function renderWithFetch(start: URL): Promise<RenderResult> {
  let current = start;
  let redirects = 0;
  for (;;) {
    await assertPublicHost(current.hostname);
    const response = await fetch(current.toString(), {
      redirect: "manual",
      headers: {
        "user-agent": "PicoFigmaPlugin/1.0 (+page-reader)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      if (++redirects > MAX_REDIRECTS) throw new Error("Too many redirects");
      const next = new URL(location, current);
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        throw new Error("Redirect to a non-http(s) URL");
      }
      current = next;
      continue;
    }
    const html = await readCapped(response);
    return {
      finalUrl: current.toString(),
      status: response.status,
      html,
      rendered: "fetch",
    };
  }
}

async function readCappedBytes(response: Response): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) return Buffer.from(await response.arrayBuffer());
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_ASSET_BYTES) {
      await reader.cancel();
      throw new Error("Asset too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

// Fetch a single image asset server-side (same SSRF hardening as /render).
// Restricted to image content so it can't be abused as a general-purpose proxy.
async function fetchAsset(start: URL): Promise<{ mime: string; body: Buffer }> {
  let current = start;
  let redirects = 0;
  for (;;) {
    await assertPublicHost(current.hostname);
    const response = await fetch(current.toString(), {
      redirect: "manual",
      headers: { "user-agent": "PicoFigmaPlugin/1.0 (+asset)" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      if (++redirects > MAX_REDIRECTS) throw new Error("Too many redirects");
      const next = new URL(location, current);
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        throw new Error("Redirect to a non-http(s) URL");
      }
      current = next;
      continue;
    }
    if (!response.ok) throw new Error(`Upstream returned ${response.status}`);
    const mime = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (!/^image\//.test(mime) && mime !== "application/octet-stream") {
      throw new Error(`Refusing non-image asset (${mime || "unknown type"})`);
    }
    const body = await readCappedBytes(response);
    return { mime: mime || "application/octet-stream", body };
  }
}

router.get("/asset", async (req, res) => {
  const target = typeof req.query.url === "string" ? req.query.url : "";
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    res.status(400).json({ error: "Only http(s) URLs are allowed" });
    return;
  }
  try {
    const { mime, body } = await fetchAsset(url);
    res.setHeader("content-type", mime);
    res.setHeader("cache-control", "public, max-age=3600");
    res.send(body);
  } catch (e) {
    req.log.warn({ err: (e as Error).message }, "asset fetch failed");
    res.status(502).json({ error: (e as Error).message });
  }
});

router.get("/render", async (req, res) => {
  const target = typeof req.query.url === "string" ? req.query.url : "";
  let current: URL;
  try {
    current = new URL(target);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  if (current.protocol !== "http:" && current.protocol !== "https:") {
    res.status(400).json({ error: "Only http(s) URLs are allowed" });
    return;
  }

  const widthParam =
    typeof req.query.w === "string" ? parseInt(req.query.w, 10) : NaN;
  const viewportWidth =
    Number.isFinite(widthParam) && widthParam >= 320 && widthParam <= 3840
      ? widthParam
      : 1440;

  try {
    // Prefer a real headless render so client-rendered SPAs come back with
    // their hydrated, instrumented DOM. Fall back to a plain fetch otherwise.
    const rendered = await renderWithBrowser(current, req.log, viewportWidth);
    const result = rendered ?? (await renderWithFetch(current));
    res.json(result);
  } catch (e) {
    req.log.warn({ err: (e as Error).message }, "page render failed");
    res.status(502).json({ error: (e as Error).message });
  }
});

export default router;
