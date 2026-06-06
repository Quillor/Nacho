// Shared types and tuning constants for the page-render feature (the Figma
// plugin's fetch/render companion). See render.service.ts for the why behind
// the two-strategy design and the SSRF hardening.

export interface RenderResult {
  finalUrl: string;
  status: number;
  html: string;
  /** Which strategy produced the HTML — lets the plugin distinguish a real
   *  reconstruction from an unrenderable SPA shell. */
  rendered: "browser" | "fetch";
}

/** Cap on the bytes read from an HTML document fetch. */
export const MAX_BYTES = 2_000_000;
/** Cap on the bytes read from a single proxied image asset. */
export const MAX_ASSET_BYTES = 5_000_000;
/** Max manual redirect hops followed per fetch (SSRF re-validated each hop). */
export const MAX_REDIRECTS = 5;
/** Timeout for a plain server-side fetch. */
export const FETCH_TIMEOUT_MS = 15_000;
/** Timeout for a headless-browser navigation. */
export const BROWSER_TIMEOUT_MS = 30_000;
