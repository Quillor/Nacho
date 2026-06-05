// Message contract between the plugin UI (<iframe>, has DOM/fetch) and the
// plugin code (Figma sandbox, has the Figma API). Keep these shapes stable;
// both sides import this module.

import type { PicoTokens } from "./tokens";

export type DeviceSizeId = "desktop" | "tablet" | "mobile" | "custom";

export interface DeviceSize {
  id: DeviceSizeId;
  /** Human label shown in Figma layer names. */
  label: string;
  width: number;
  height: number;
}

export const DEVICE_PRESETS: Record<
  Exclude<DeviceSizeId, "custom">,
  { label: string; width: number; height: number }
> = {
  desktop: { label: "Desktop", width: 1440, height: 1024 },
  tablet: { label: "Tablet", width: 834, height: 1112 },
  mobile: { label: "Mobile", width: 390, height: 844 },
};

/**
 * A single node in the parsed page tree. Either a recognized Pico component
 * (has `component`) or a generic layout/text node. Built in the UI from the
 * rendered DOM, consumed by the code side to rebuild Figma nodes.
 */
export interface ParsedNode {
  /** Canonical Pico component name (matches `data-pico-component`), if any. */
  component?: string;
  /** Resolved variant axes (from `data-pico-*`), e.g. { variant: "brand" }. */
  variants?: Record<string, string>;
  /** Section landmark name (from `data-pico-section`), if any. */
  section?: string;
  /** Visible text directly owned by this node (no child element text). */
  text?: string;
  /** Lowercase HTML tag of a text-bearing node (e.g. "h1", "p"), if any. */
  tag?: string;
  /** Layout hints read from computed/declared styles. */
  layout?: ParsedNodeLayout;
  /** Rendered page-relative geometry (headless render), drives hug/fill sizing. */
  box?: { x: number; y: number; w: number; h: number };
  /** Raster image (from <img>): absolute src + rendered box. Bytes live in ParsedPage.assets. */
  image?: { src: string; width: number; height: number };
  /** Inline SVG (from <svg>): serialized markup + rendered box. Drawn directly, no fetch. */
  svg?: { markup: string; width: number; height: number };
  children: ParsedNode[];
}

export interface ParsedNodeLayout {
  direction?: "row" | "column";
  /** Auto-layout primary axis from the render step ("row"=horizontal, "col"=vertical). */
  flow?: "row" | "col";
  /** Grid track count (from grid-template-columns) when the element is a CSS grid. */
  gridCols?: number;
  /** Raw CSS justify-content (main-axis distribution). */
  justify?: string;
  /** Raw CSS align-items (cross-axis alignment). */
  align?: string;
  /** Token name resolved for the background fill, e.g. "card" / "primary". */
  bgToken?: string;
  /** Token name resolved for the text color. */
  fgToken?: string;
  /** Raw hex fallback when no token could be resolved. */
  bgHex?: string;
  fgHex?: string;
  /** Radius token key (sm/md/lg/xl) when detectable. */
  radiusToken?: string;
  /** Shadow token key (2xs..2xl) when detectable. */
  shadowToken?: string;
  fontSize?: number;
  fontWeight?: number;
  /** Line-height as a unitless ratio (line-height px / font-size px). */
  lineHeight?: number;
  /** Raw CSS text-align (left/center/right/justify) for text-bearing nodes. */
  textAlign?: string;
  /** Resolved font-family string (inlined computed value or class-derived). */
  fontFamily?: string;
  /** Border color token when an element has a visible border. */
  strokeToken?: string;
  /** Raw hex border color fallback when no token matched. */
  strokeHex?: string;
  /** Border width in px (thickest side, applied as a uniform stroke). */
  strokeWeight?: number;
  paddingX?: number;
  paddingY?: number;
  /** Right padding (px). Falls back to paddingX when absent. */
  paddingRight?: number;
  /** Bottom padding (px). Falls back to paddingY when absent. */
  paddingBottom?: number;
  gap?: number;
  /** Row gap (px) when distinct from the shorthand gap. */
  rowGap?: number;
  /** Column gap (px) when distinct from the shorthand gap. */
  colGap?: number;
}

export interface ParsedPage {
  url: string;
  title: string;
  /** Top-level tree of the page body. */
  root: ParsedNode;
  /** True when the URL is behind an auth/login wall and cannot be read. */
  authWalled: boolean;
  /** Human-readable note about how the read went. */
  note?: string;
  /** Base64 bytes for each <img> src referenced in the tree, keyed by absolute URL. */
  assets?: Record<string, { bytes: string; mime: string }>;
  /** Rendered content width (device viewport width). */
  contentWidth?: number;
  /** Rendered content height (full document height). */
  contentHeight?: number;
}

/** Page-relative geometry (pixels) stamped by the render step. */
export interface OpBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---- UI -> code messages -------------------------------------------------

export type UiToCode =
  | {
      type: "sync-tokens";
      /**
       * Tokens fetched live from a "tokens URL" in the UI. When omitted the
       * code side uses the copy bundled at build time.
       */
      tokens?: PicoTokens;
      /** Where the tokens came from, for the status message (e.g. the URL or "bundled"). */
      sourceLabel?: string;
    }
  | { type: "generate-components" }
  | { type: "sync-icons" }
  | { type: "reconstruct-page"; page: ParsedPage; device: DeviceSize };

// ---- code -> UI messages -------------------------------------------------

export type CodeToUi =
  | { type: "status"; level: "info" | "success" | "error"; message: string }
  | { type: "done"; action: string };
