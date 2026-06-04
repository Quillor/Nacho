// Message contract between the plugin UI (<iframe>, has DOM/fetch) and the
// plugin code (Figma sandbox, has the Figma API). Keep these shapes stable;
// both sides import this module.

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
  /** Layout hints read from computed/declared styles. */
  layout?: ParsedNodeLayout;
  children: ParsedNode[];
}

export interface ParsedNodeLayout {
  direction?: "row" | "column";
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
  paddingX?: number;
  paddingY?: number;
  gap?: number;
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
}

// ---- UI -> code messages -------------------------------------------------

export type UiToCode =
  | { type: "sync-tokens" }
  | { type: "generate-components" }
  | { type: "generate-placeholder"; name?: string }
  | { type: "reconstruct-page"; page: ParsedPage; device: DeviceSize }
  | {
      type: "reconstruct-placeholder-for-url";
      url: string;
      device: DeviceSize;
      reason: string;
    };

// ---- code -> UI messages -------------------------------------------------

export type CodeToUi =
  | { type: "status"; level: "info" | "success" | "error"; message: string }
  | { type: "done"; action: string };
