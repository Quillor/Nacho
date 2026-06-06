// Companion fetch/render step for the Pico Figma plugin's page-from-URL flow.
//
// A Figma plugin's UI iframe can `fetch`, but cross-origin requests to other
// sites are routinely blocked by CORS, so the plugin can't reliably read most
// public pages itself. This service performs the work server-side (no CORS
// restriction) and returns HTML for the plugin to parse.
//
// Two strategies, best-first:
//   1. Headless render (browser-render.ts) — drives a Chromium so client-
//      rendered SPAs come back with their hydrated, instrumented DOM.
//   2. Plain fetch — fallback when no browser is available. Returns the
//      *delivered* markup only; client-rendered SPAs will return their shell.
//      The response records which strategy ran (`rendered`) so the plugin can
//      tell a real reconstruction from an unrenderable shell.
//
// SSRF hardening lives in net-guard.ts and is applied on every hop here.

import { renderWithBrowser } from "./browser-render";
import {
  assertPublicHost,
  readCapped,
  readCappedBytes,
} from "./net-guard";
import {
  FETCH_TIMEOUT_MS,
  MAX_REDIRECTS,
  type RenderResult,
} from "./render.types";

type RenderLogger = { warn: (obj: unknown, msg?: string) => void };

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

/**
 * Render a page best-first: prefer a real headless render so client-rendered
 * SPAs come back with their hydrated, instrumented DOM; fall back to a plain
 * fetch when no browser is available.
 */
export async function renderPage(
  url: URL,
  viewportWidth: number,
  log: RenderLogger,
): Promise<RenderResult> {
  const rendered = await renderWithBrowser(url, log, viewportWidth);
  return rendered ?? (await renderWithFetch(url));
}

// Fetch a single image asset server-side (same SSRF hardening as renderPage).
// Restricted to image content so it can't be abused as a general-purpose proxy.
export async function fetchImageAsset(
  start: URL,
): Promise<{ mime: string; body: Buffer }> {
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
