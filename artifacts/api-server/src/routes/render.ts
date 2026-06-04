// Companion fetch step for the Pico Figma plugin's page-from-URL flow.
//
// A Figma plugin's UI iframe can `fetch`, but cross-origin requests to other
// sites are routinely blocked by CORS, so the plugin can't reliably read most
// public pages itself. This endpoint performs the fetch server-side (no CORS
// restriction) and returns the delivered HTML for the plugin to parse.
//
// Note: this returns the *delivered* markup, not a JS-executed render. A
// headless browser cannot run inside a Figma plugin, and one is not available
// in this environment, so single-page apps that render entirely client-side
// will return their shell. Server-rendered / static pages (which carry the
// Figma-readable `data-pico-*` instrumentation in their delivered HTML) read
// fully.
//
// SSRF hardening: only http(s) is allowed, every hop (including redirects) is
// re-resolved and rejected if it points at a private / loopback / link-local /
// cloud-metadata address, and the response body is size-capped.

import { Router, type IRouter } from "express";
import dns from "node:dns/promises";
import net from "node:net";

const router: IRouter = Router();

const MAX_BYTES = 2_000_000;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 15_000;

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

async function assertPublicHost(hostname: string): Promise<void> {
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

  try {
    let redirects = 0;
    let response: Response;
    // Manual redirect loop so every hop is re-validated against the SSRF guard
    // (an allowed origin could otherwise 30x into an internal address).
    for (;;) {
      await assertPublicHost(current.hostname);
      response = await fetch(current.toString(), {
        redirect: "manual",
        headers: {
          "user-agent": "PicoFigmaPlugin/1.0 (+page-reader)",
          accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        if (++redirects > MAX_REDIRECTS) {
          res.status(502).json({ error: "Too many redirects" });
          return;
        }
        const next = new URL(location, current);
        if (next.protocol !== "http:" && next.protocol !== "https:") {
          res.status(400).json({ error: "Redirect to a non-http(s) URL" });
          return;
        }
        current = next;
        continue;
      }
      break;
    }

    const html = await readCapped(response);
    res.json({ finalUrl: current.toString(), status: response.status, html });
  } catch (e) {
    req.log.warn({ err: (e as Error).message }, "page render fetch failed");
    res.status(502).json({ error: (e as Error).message });
  }
});

export default router;
