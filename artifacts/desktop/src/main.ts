// Nacho desktop shell — main process.
//
// Responsibilities:
//   - Boot the main window into the Nacho app at /studio.
//   - Pick the screen source for capture and remember which display it is, so
//     the renderer can map global cursor coordinates onto the recorded canvas.
//   - Broadcast IPC between the main window (recorder) and the presenter-only,
//     content-protected overlay windows (notes / camera / controls).
//   - Drive the global input tracker (cursor position + clicks) for the cursor
//     controls feature.
import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  screen,
  session,
  shell,
} from "electron";
import path from "node:path";
import { CH, type OverlayName } from "./constants";
import { createMainWindow, createOverlay } from "./windows";
import { createInputTracker, ensureAccessibility } from "./input-tracker";
import { startRendererServer } from "./renderer-server";
import { setRendererOrigin } from "./runtime";

// The packaged renderer is served from a loopback HTTP server (see
// renderer-server.ts) rather than file:// or a custom scheme, because Clerk auth
// requires an http(s) origin and a stable origin keeps the session + IndexedDB.
const RENDERER_DIR = path.join(__dirname, "renderer");

let mainWindow: BrowserWindow | null = null;
const overlays = new Map<OverlayName, BrowserWindow>();

// Deep-link (nacho://auth?...) handling for the browser sign-in handoff.
let pendingAuthUrl: string | null = null;

function deliverAuthUrl(url: string) {
  if (!url || !url.startsWith("nacho://")) return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("auth:callback", url);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    pendingAuthUrl = url; // window not ready yet; deliver on creation
  }
}

/** Bounds (DIP) + scale of the display currently being captured. */
let capturedDisplay: {
  id: number;
  bounds: Electron.Rectangle;
  scaleFactor: number;
} | null = null;

const inputTracker = createInputTracker(
  (p) => mainWindow?.webContents.send(CH.cursorMove, p),
  () => mainWindow?.webContents.send(CH.cursorClick),
);

// Register nacho:// so the browser can hand the auth code back to this app.
app.setAsDefaultProtocolClient("nacho");

// Single-instance: a second launch (e.g. via the nacho:// link on Win/Linux)
// forwards its URL to the running instance instead of starting a new one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_e, argv) => {
    const url = argv.find((a) => a.startsWith("nacho://"));
    if (url) deliverAuthUrl(url);
  });
}

// macOS delivers the deep link via open-url.
app.on("open-url", (event, url) => {
  event.preventDefault();
  deliverAuthUrl(url);
});

/** Send a payload to every open window (main + overlays). */
function broadcast(channel: string, payload?: unknown) {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send(channel, payload);
  }
}

/**
 * The source the renderer's in-app picker chose (a desktopCapturer source id
 * like "screen:0:0" or "window:123:0"). The next getDisplayMedia call captures
 * this source directly — no OS picker. Null falls back to the primary screen.
 */
let selectedSourceId: string | null = null;

/**
 * Resolve getDisplayMedia against the in-app (Zoom-style) picker's selection
 * instead of the OS picker. The renderer calls `capture:select` with a source
 * id first; screens also record their display bounds so the cursor overlay can
 * map global coordinates (window captures can't, so the mapping is cleared).
 */
function installDisplayMediaHandler() {
  session.defaultSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      void desktopCapturer
        .getSources({ types: ["screen", "window"] })
        .then((sources) => {
          const primary = screen.getPrimaryDisplay();
          const match =
            (selectedSourceId
              ? sources.find((s) => s.id === selectedSourceId)
              : undefined) ??
            sources.find((s) => s.display_id === String(primary.id)) ??
            sources[0];

          if (match?.id.startsWith("screen:")) {
            const display =
              screen
                .getAllDisplays()
                .find((d) => String(d.id) === match.display_id) ?? primary;
            capturedDisplay = {
              id: display.id,
              bounds: display.bounds,
              scaleFactor: display.scaleFactor,
            };
          } else {
            // Window capture: global cursor coordinates can't be mapped onto
            // the recorded frame, so the cursor overlay is disabled for it.
            capturedDisplay = null;
          }
          // `loopback` captures system audio on macOS 13+ (ScreenCaptureKit);
          // degrades gracefully where unsupported.
          callback({ video: match, audio: "loopback" });
        })
        .catch((err) => {
          console.error("[main] desktopCapturer failed:", err);
          callback({});
        });
    },
  );
}

function showOverlays(which: OverlayName[]) {
  for (const name of which) {
    let win = overlays.get(name);
    if (!win || win.isDestroyed()) {
      win = createOverlay(name);
      overlays.set(name, win);
      win.on("closed", () => overlays.delete(name));
    } else {
      // Re-assert content protection in case the window was recreated/toggled.
      win.setContentProtection(true);
      win.showInactive();
    }
  }
}

function hideOverlays() {
  for (const win of overlays.values()) {
    if (!win.isDestroyed()) win.close();
  }
  overlays.clear();
}

function registerIpc() {
  // Transport + status + notes are simple fan-out broadcasts.
  ipcMain.on(CH.command, (_e, cmd) => broadcast(CH.command, cmd));
  ipcMain.on(CH.status, (_e, s) => broadcast(CH.status, s));
  ipcMain.on(CH.notes, (_e, html) => broadcast(CH.notes, html));

  ipcMain.on(CH.overlaysShow, (_e, which: OverlayName[]) =>
    showOverlays(which),
  );
  ipcMain.on(CH.overlaysHide, () => hideOverlays());

  // Cursor controls.
  ipcMain.on(CH.cursorStart, (_e, opts: { withClicks?: boolean }) =>
    inputTracker.start({ withClicks: Boolean(opts?.withClicks) }),
  );
  ipcMain.on(CH.cursorStop, () => inputTracker.stop());

  ipcMain.handle(CH.displayBounds, () => capturedDisplay);
  ipcMain.handle(CH.accessibility, () => ensureAccessibility(true));

  // In-app source picker: enumerate capturable screens/windows with live
  // thumbnails. Nacho's own windows (main + presenter overlays) are excluded —
  // recording the recorder is never what the user means.
  ipcMain.handle(CH.captureList, async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 420, height: 262 },
      fetchWindowIcons: true,
    });
    const ownTitles = new Set(
      BrowserWindow.getAllWindows().map((w) => w.getTitle()),
    );
    return sources
      .filter((s) => !(s.id.startsWith("window:") && ownTitles.has(s.name)))
      .map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.id.startsWith("screen:") ? "screen" : "window",
        thumbnailDataUrl: s.thumbnail.isEmpty()
          ? null
          : s.thumbnail.toDataURL(),
        appIconDataUrl:
          s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : null,
      }));
  });

  ipcMain.handle(CH.captureSelect, (_e, id: unknown) => {
    selectedSourceId = typeof id === "string" && id.length > 0 ? id : null;
  });

  // Browser sign-in handoff: open the system browser to the login page.
  ipcMain.handle("auth:openExternal", (_e, url: string) => {
    if (typeof url === "string" && /^https?:\/\//.test(url)) {
      return shell.openExternal(url);
    }
    return undefined;
  });

  // The packaged app version, used by the renderer's update check.
  ipcMain.handle("app:getVersion", () => app.getVersion());
}

app.whenReady().then(async () => {
  // Resolve the renderer origin: the Vite dev server in development, or the
  // packaged loopback HTTP server otherwise.
  const devUrl = process.env.NACHO_DEV_URL;
  const origin = devUrl
    ? devUrl.replace(/\/$/, "")
    : await startRendererServer(RENDERER_DIR);
  setRendererOrigin(origin);

  // Default the cursor-overlay mapping to the primary display. When the native
  // system picker is used the request handler doesn't run, so seed it here.
  const primary = screen.getPrimaryDisplay();
  capturedDisplay = {
    id: primary.id,
    bounds: primary.bounds,
    scaleFactor: primary.scaleFactor,
  };

  installDisplayMediaHandler();
  registerIpc();
  mainWindow = createMainWindow();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  // Deliver a deep link that arrived before the window existed.
  if (pendingAuthUrl) {
    const url = pendingAuthUrl;
    pendingAuthUrl = null;
    mainWindow.webContents.once("did-finish-load", () => deliverAuthUrl(url));
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  inputTracker.stop();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => inputTracker.stop());
