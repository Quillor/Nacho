// Window factory for the desktop shell.
//
// - The MAIN window loads the Nacho web app and runs the recorder/canvas
//   capture exactly as on the web. It is the window that gets recorded, so it
//   must NOT be content-protected.
// - OVERLAY windows are presenter-only HUDs (notes, camera preview, transport
//   controls). Each is content-protected so the macOS capture pipeline renders
//   it black — visible to the presenter, absent from the recording.
import { BrowserWindow, screen } from "electron";
import path from "node:path";
import { ROUTE, type OverlayName } from "./constants";
import { getRendererOrigin } from "./runtime";

const PRELOAD = path.join(__dirname, "preload.cjs");

/** Build a full URL for a path route, e.g. http://localhost:17653/overlay/notes */
function routeUrl(route: string): string {
  return `${getRendererOrigin()}${route}`;
}

function baseWebPreferences(): Electron.WebPreferences {
  return {
    preload: PRELOAD,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false, // preload uses ipcRenderer; keep sandbox off for the bridge
  };
}

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#f7f3e9",
    title: "Nacho",
    webPreferences: baseWebPreferences(),
  });
  void win.loadURL(routeUrl(ROUTE.studio));
  return win;
}

/** Default on-screen placement for each overlay, anchored to the work area. */
function overlayBounds(name: OverlayName): Electron.Rectangle {
  const { workArea } = screen.getPrimaryDisplay();
  const margin = 24;
  if (name === "controls") {
    const width = 360;
    const height = 72;
    return {
      x: workArea.x + Math.round((workArea.width - width) / 2),
      y: workArea.y + workArea.height - height - margin,
      width,
      height,
    };
  }
  if (name === "camera") {
    const size = 220;
    return {
      x: workArea.x + workArea.width - size - margin,
      y: workArea.y + workArea.height - size - margin,
      width: size,
      height: size,
    };
  }
  // notes
  const width = 420;
  const height = 520;
  return {
    x: workArea.x + margin,
    y: workArea.y + margin,
    width,
    height,
  };
}

const OVERLAY_ROUTE: Record<OverlayName, string> = {
  notes: ROUTE.notes,
  camera: ROUTE.camera,
  controls: ROUTE.controls,
};

export function createOverlay(name: OverlayName): BrowserWindow {
  const win = new BrowserWindow({
    ...overlayBounds(name),
    frame: false,
    transparent: true,
    resizable: true,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    backgroundColor: "#00000000",
    webPreferences: baseWebPreferences(),
  });

  // Float above full-screen apps and follow the user across Spaces.
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // 🔒 The single line that excludes this window from screen capture on macOS.
  // Must be re-asserted on every overlay; never applied to the main window.
  win.setContentProtection(true);

  void win.loadURL(routeUrl(OVERLAY_ROUTE[name]));
  return win;
}
