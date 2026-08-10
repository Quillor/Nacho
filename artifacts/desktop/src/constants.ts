// IPC channel names and overlay route definitions shared across the main
// process modules. The renderer declares the matching channel strings in its
// own desktop bridge type (it cannot import this app per the monorepo boundary
// rule), so keep the two in sync by convention.

export const CH = {
  /** overlay → main → main-window: transport command (pause/resume/stop/cancel) */
  command: "recorder:command",
  /** main-window → main → overlays: recording status (elapsed/paused/phase) */
  status: "recorder:status",
  /** notes editor → main → notes overlay: sanitized notes HTML */
  notes: "notes:set",
  /** renderer → main: show/hide the presenter overlay windows */
  overlaysShow: "overlays:show",
  overlaysHide: "overlays:hide",
  /** main → renderer: global cursor position (screen DIP coordinates), ~60Hz */
  cursorMove: "cursor:move",
  /** main → renderer: a global mouse-down occurred */
  cursorClick: "cursor:click",
  /** renderer → main: start/stop the global input tracker */
  cursorStart: "cursor:start",
  cursorStop: "cursor:stop",
  /** renderer → main (invoke): bounds of the display being captured */
  displayBounds: "display:bounds",
  /** renderer → main (invoke): ensure/return macOS Accessibility trust */
  accessibility: "perm:accessibility",
  /** renderer → main (invoke): enumerate screens/windows for the picker */
  captureList: "capture:list",
  /** renderer → main (invoke): set the source the next getDisplayMedia uses */
  captureSelect: "capture:select",
} as const;

/** Hash routes (the renderer runs under hash routing inside Electron). */
export const ROUTE = {
  studio: "/studio",
  notes: "/overlay/notes",
  camera: "/overlay/camera",
  controls: "/overlay/controls",
} as const;

export type OverlayName = "notes" | "camera" | "controls";
