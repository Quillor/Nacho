// SSRF hardening + capped readers shared by both render strategies.
//
// Only http(s) is allowed, every fetch hop (including redirects) is re-resolved
// and rejected if it points at a private / loopback / link-local / cloud-
// metadata address, and fetched bodies are size-capped. Public Replit app
// domains (*.replit.app / *.replit.dev / *.repl.co) are allowed even though
// they resolve to internal addresses inside the cluster — they represent the
// user's own publicly-reachable apps, the common case for this tool.

import dns from "node:dns/promises";
import net from "node:net";
import { MAX_BYTES, MAX_ASSET_BYTES } from "./render.types";

/** True for any IP that must never be fetched (private/loopback/metadata/etc). */
export function isBlockedIp(ip: string): boolean {
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

/** Reject a hostname that resolves to any private/internal address. */
export async function assertPublicHost(hostname: string): Promise<void> {
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

/** Read an HTML response body as text, capped at MAX_BYTES. */
export async function readCapped(response: Response): Promise<string> {
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

/** Read a binary response body, throwing if it exceeds MAX_ASSET_BYTES. */
export async function readCappedBytes(response: Response): Promise<Buffer> {
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
