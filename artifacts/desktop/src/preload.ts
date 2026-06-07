// Preload bridge — the only surface the sandboxed renderer sees of the main
// process. Exposed as `window.nacho`. The renderer feature-detects this object:
// when absent (the plain web build) all desktop-only features stay off.
import { contextBridge, ipcRenderer } from "electron";
import { CH } from "./constants";

type Command = "pause" | "resume" | "stop" | "cancel";
type Point = { x: number; y: number };
type Unsubscribe = () => void;

function on<T>(channel: string, cb: (payload: T) => void): Unsubscribe {
  const handler = (_e: Electron.IpcRendererEvent, payload: T) => cb(payload);
  ipcRenderer.on(channel, handler as never);
  return () => ipcRenderer.removeListener(channel, handler as never);
}

const api = {
  isDesktop: true as const,
  platform: process.platform,

  // Transport: overlay controls drive the main window's recorder.
  sendCommand: (cmd: Command) => ipcRenderer.send(CH.command, cmd),
  onCommand: (cb: (cmd: Command) => void) => on(CH.command, cb),

  // Recording status: main window → overlays (elapsed / paused / phase).
  emitStatus: (s: unknown) => ipcRenderer.send(CH.status, s),
  onStatus: (cb: (s: unknown) => void) => on(CH.status, cb),

  // Speaker notes: editor → notes overlay (sanitized HTML).
  setNotes: (html: string) => ipcRenderer.send(CH.notes, html),
  onNotes: (cb: (html: string) => void) => on(CH.notes, cb),

  // Presenter overlay windows.
  showOverlays: (which: Array<"notes" | "camera" | "controls">) =>
    ipcRenderer.send(CH.overlaysShow, which),
  hideOverlays: () => ipcRenderer.send(CH.overlaysHide),

  // Browser sign-in handoff.
  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke("auth:openExternal", url),
  onAuthCallback: (cb: (url: string) => void) =>
    on("auth:callback", cb),

  // Cursor controls.
  cursor: {
    start: (opts: { withClicks: boolean }) =>
      ipcRenderer.send(CH.cursorStart, opts),
    stop: () => ipcRenderer.send(CH.cursorStop),
    onMove: (cb: (p: Point) => void) => on(CH.cursorMove, cb),
    onClick: (cb: () => void) => on(CH.cursorClick, cb),
    getCapturedDisplayBounds: (): Promise<{
      id: number;
      bounds: { x: number; y: number; width: number; height: number };
      scaleFactor: number;
    } | null> => ipcRenderer.invoke(CH.displayBounds),
    requestAccessibility: (): Promise<boolean> =>
      ipcRenderer.invoke(CH.accessibility),
  },
};

export type NachoBridge = typeof api;

contextBridge.exposeInMainWorld("nacho", api);
