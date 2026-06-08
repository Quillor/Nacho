// Desktop (Electron) detection + typed access to the `window.nacho` preload
// bridge. This is the single source of truth the renderer uses to decide
// whether desktop-only features (presenter overlays, cursor controls,
// speaker-notes authoring) are available.
//
// In the plain web build `window.nacho` is undefined, so `isDesktop` is false
// and every desktop feature stays off — no behavior change on the web.

export type RecorderCommand = "pause" | "resume" | "stop" | "cancel";

export interface RecorderStatus {
  elapsed: number;
  paused: boolean;
  phase: string;
}

export interface CapturedDisplay {
  id: number;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
}

export type OverlayName = "notes" | "camera" | "controls";

export interface NachoCursorBridge {
  start(opts: { withClicks: boolean }): void;
  stop(): void;
  onMove(cb: (p: { x: number; y: number }) => void): () => void;
  onClick(cb: () => void): () => void;
  getCapturedDisplayBounds(): Promise<CapturedDisplay | null>;
  requestAccessibility(): Promise<boolean>;
}

export interface NachoBridge {
  isDesktop: true;
  platform: string;
  sendCommand(cmd: RecorderCommand): void;
  onCommand(cb: (cmd: RecorderCommand) => void): () => void;
  emitStatus(s: RecorderStatus): void;
  onStatus(cb: (s: RecorderStatus) => void): () => void;
  setNotes(html: string): void;
  onNotes(cb: (html: string) => void): () => void;
  showOverlays(which: OverlayName[]): void;
  hideOverlays(): void;
  cursor: NachoCursorBridge;
  /** Open a URL in the user's default browser (sign-in handoff). */
  openExternal(url: string): Promise<void>;
  /** Receive the nacho://auth deep-link callback URL. */
  onAuthCallback(cb: (url: string) => void): () => void;
}

declare global {
  interface Window {
    nacho?: NachoBridge;
  }
}

export const desktopBridge: NachoBridge | undefined =
  typeof window !== "undefined" ? window.nacho : undefined;

export const isDesktop: boolean =
  Boolean(desktopBridge?.isDesktop) ||
  (typeof window !== "undefined" && window.location.protocol === "file:");

/** True when the global cursor/click bridge is available (Electron only). */
export const hasCursorBridge: boolean = Boolean(desktopBridge?.cursor);

/**
 * Open a URL in the user's real browser. On desktop this hands off to the OS
 * (so public links don't try to load inside the app, which has no such route);
 * on the web it opens a new tab.
 */
export function openExternalUrl(url: string): void {
  if (desktopBridge) {
    void desktopBridge.openExternal(url);
  } else if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
