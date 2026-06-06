// Headless-browser render strategy. When a Chromium binary can be resolved, we
// drive it with playwright-core: navigate, let the SPA hydrate, inline the
// computed styles the plugin's importer reads (colors, font size/weight, flex
// direction, padding, gap), then serialize the live DOM. This is what lets
// client-rendered apps (e.g. Nacho) come back with their real `data-pico-*`
// instrumentation instead of an empty shell.

import { assertPublicHost } from "./net-guard";
import { resolveChromiumExecutable } from "./chromium";
import { BROWSER_TIMEOUT_MS, type RenderResult } from "./render.types";

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
export async function renderWithBrowser(
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
