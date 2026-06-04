# Nacho Desktop — Presenter Overlay Architecture

A build guide for wrapping this web app in an Electron shell so a presenter can
see **speaker notes, a camera bubble, and pause/stop controls** on screen while
those windows are **excluded from the screen recording** (native macOS content
protection — something a browser tab cannot do).

> Scope: this document is for the **local Electron build** (done on a Mac with
> Claude Code). The Replit project ships only the web app. Nothing here needs to
> run inside Replit. The web pages in this repo are already structured to be
> lifted into the shell unchanged — see "What the web app already gives you".

---

## 1. The core idea

The browser composites screen + camera onto a `<canvas>` and records that canvas
(`lib/recorder.ts`). Everything drawn on the canvas ends up in the file. A
browser cannot show the presenter extra UI (notes, controls) that is *not* on the
page being captured.

Electron can. On macOS, `BrowserWindow.setContentProtection(true)` flags a window
so the OS screen-capture pipeline **renders it black / skips it**. So the plan is:

- **Main window** — loads this web app (login → studio → editor). It owns the
  recorder and does the actual capture, exactly as it does on the web today.
- **Overlay windows** — separate, always-on-top, **content-protected** windows
  for speaker notes, the camera bubble, and transport controls. The presenter
  sees them; the recording does not.

```
┌──────────────────────────────────────────────────────────┐
│  macOS screen (what the audience / recording sees)         │
│                                                            │
│   ┌────────────────────────────────────────────┐          │
│   │  Main window  (Nacho web app, recorded)      │          │
│   │  - lib/recorder.ts runs here                 │          │
│   └────────────────────────────────────────────┘          │
│                                                            │
│   ▒▒▒ notes overlay ▒▒▒   ▒▒▒ camera ▒▒▒   ▒▒▒ controls ▒▒ │  ← content-protected,
│   (presenter-only, excluded from capture)                  │     invisible to capture
└──────────────────────────────────────────────────────────┘
```

Important consequence: the camera bubble that should appear **in the recording**
is still composited on the canvas by `lib/recorder.ts` (unchanged). The overlay
"camera window" is an *extra* presenter-facing preview only — do not confuse the
two. If you want the camera to appear *only* to the presenter and not in the file,
set the recorder `source` to `screen` (no composited cam) and rely on the overlay
camera window instead.

---

## 2. What the web app already gives you

You should reuse these as-is. They have no dependency on the marketing landing
page (`pages/home.tsx`) or the public viewer (`pages/public-view.tsx`).

| Concern | Module | Notes |
| --- | --- | --- |
| Capture + canvas compositing + MediaRecorder | `src/lib/recorder.ts` | Pure module. `prepareRecording(opts)` → `PreparedRecorder`; `prepared.start()` → `RecorderController`. |
| Live transcription | `src/lib/transcribe.ts` | Web Speech API; pause/resume in lockstep with the recorder. Feeds the notes/teleprompter overlay nicely. |
| Local persistence | `src/lib/db.ts` | IndexedDB. Works in the renderer unchanged. |
| GIF preview / publish | `src/lib/gif.ts`, `src/lib/publish.ts`, `src/lib/api.ts` | Network calls hit the same backend. |
| App chrome / pages | `src/components/app-shell.tsx`, `pages/studio.tsx`, `pages/library.tsx`, `pages/editor.tsx`, `pages/settings.tsx` | Pico-styled, self-contained. |

### The recorder is already cleanly drivable

`RecorderController` (in `src/lib/recorder.ts`) is the only surface the overlays
need to drive recording:

```ts
interface RecorderController {
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  getElapsed(): number;       // seconds
  stop(): Promise<Blob>;
  cancel(): void;
  onEnded(cb: () => void): void;
}
```

In `pages/studio.tsx` the active controller is held in `controllerRef`. Recording
state (phase, paused, elapsed) lives in React. To let an overlay window drive and
observe recording, expose a thin bridge from the main window renderer — **do not
change `recorder.ts`'s behavior**, just forward calls and broadcast state:

```ts
// renderer (main window), e.g. a useEffect in Studio once recording starts
const c = controllerRef.current!;
window.nacho.onCommand((cmd) => {
  if (cmd === "pause")  { c.pause();  /* mirror into React state */ }
  if (cmd === "resume") { c.resume(); }
  if (cmd === "stop")   { void finishRecording(); }
});
// push status so overlays can render elapsed / paused
const id = setInterval(
  () => window.nacho.emitStatus({ elapsed: c.getElapsed(), paused: c.isPaused(), phase }),
  250,
);
```

`window.nacho` is provided by the preload script (section 4).

---

## 3. Window setup (main process)

```ts
import { app, BrowserWindow } from "electron";
import path from "node:path";

function makeWindow(opts: Electron.BrowserWindowConstructorOptions) {
  return new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    ...opts,
  });
}

let mainWindow: BrowserWindow;
const overlays: Record<string, BrowserWindow> = {};

function createMain() {
  mainWindow = makeWindow({ width: 1280, height: 800 });
  // Boot straight into the app — no marketing landing page.
  loadRoute(mainWindow, "/studio"); // Protected route redirects to /sign-in if signed out
}

function createOverlay(name: string, route: string, bounds: Electron.Rectangle) {
  const win = makeWindow({
    ...bounds,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
  });
  win.setAlwaysOnTop(true, "screen-saver");      // float above full-screen apps
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // 🔒 The line that makes this overlay invisible to screen capture (macOS):
  win.setContentProtection(true);

  loadRoute(win, route);
  overlays[name] = win;
}
```

### Content protection notes
- `setContentProtection(true)` is the whole trick. On macOS it sets
  `NSWindowSharingNone`, so QuickTime, the system recorder, Zoom share, **and the
  Nacho canvas capture** all see the window as empty/black.
- Apply it to **every** presenter-only overlay (notes, camera preview, controls).
- Do **not** apply it to the main window — that one must be captured.
- Re-assert it if you toggle window visibility; recreate-safe is simplest.
- Windows/Linux: `setContentProtection` is a no-op or behaves differently; this
  feature is macOS-first by design (matches the user's goal).

---

## 4. IPC wiring (preload + channels)

`contextIsolation: true` + a preload bridge keeps the renderer sandboxed.

```ts
// preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("nacho", {
  // overlay → main window: transport commands
  sendCommand: (cmd: "pause" | "resume" | "stop") =>
    ipcRenderer.send("recorder:command", cmd),
  onCommand: (cb: (cmd: string) => void) =>
    ipcRenderer.on("recorder:command", (_e, cmd) => cb(cmd)),

  // main window → overlays: status + notes
  emitStatus: (s: unknown) => ipcRenderer.send("recorder:status", s),
  onStatus: (cb: (s: any) => void) =>
    ipcRenderer.on("recorder:status", (_e, s) => cb(s)),

  setNotes: (html: string) => ipcRenderer.send("notes:set", html),
  onNotes: (cb: (html: string) => void) =>
    ipcRenderer.on("notes:set", (_e, html) => cb(html)),
});
```

```ts
// main process: fan messages out to every window
import { ipcMain, BrowserWindow } from "electron";
const broadcast = (channel: string, payload: unknown) =>
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, payload));

ipcMain.on("recorder:command", (_e, cmd) => broadcast("recorder:command", cmd));
ipcMain.on("recorder:status",  (_e, s)   => broadcast("recorder:status", s));
ipcMain.on("notes:set",        (_e, html)=> broadcast("notes:set", html));
```

Flow: overlay control button → `window.nacho.sendCommand("pause")` → main process
broadcasts → main window renderer's `onCommand` calls `controller.pause()` →
main window broadcasts new status → overlays update their timer/paused badge.

---

## 5. The three overlays

Build these as **routes in the same React app** (so they share the Pico theme,
fonts, and components) and open them in their own content-protected windows.
Suggested routes: `/overlay/notes`, `/overlay/camera`, `/overlay/controls`. Gate
them so they render only their widget (no `AppShell` nav).

### a. Speaker notes / teleprompter (`/overlay/notes`)
- Large, scrollable, high-contrast text. Reuse Pico tokens (`bg-background`,
  `text-foreground`, `font-display`).
- Source the text from the recording's description (`lib/db.ts`) or a dedicated
  notes field; push live edits via `notes:set`.
- Optional: drive an auto-scroll teleprompter from `recorder:status.elapsed`, or
  show the live transcript from `lib/transcribe.ts` for confidence monitoring.

### b. Camera bubble (`/overlay/camera`)
- A small circular `getUserMedia` preview for the presenter.
- **Decide where the camera should appear:**
  - In the recording → keep `source: "screen-camera"`; the canvas composites it
    (today's behavior). The overlay camera is then redundant.
  - Presenter-only (not recorded) → use `source: "screen"` and show the camera
    **only** in this content-protected overlay.
- Style the ring with the `--color-card` token to match the in-recording bubble.

### c. Transport controls (`/overlay/controls`)
- Pause / Resume / Stop buttons + elapsed timer + a "REC" dot.
- Reuse the exact controls from `pages/studio.tsx` (the recording-phase block) so
  the look matches: chunky `border-4 border-foreground`, `bg-primary`, offset
  shadow. Buttons call `window.nacho.sendCommand(...)`; the timer/paused state
  comes from `onStatus`.

---

## 6. Routing & assets in a packaged app

The web app uses **path-based routing** (`wouter` with `base={BASE_URL}`) because
the Replit proxy serves it from a path. A packaged Electron app is loaded from
`file://` (or a custom protocol) with no router-aware server, so:

- **Use hash routing in Electron.** `wouter` supports it via `useHashLocation`:
  ```ts
  import { Router as WouterRouter } from "wouter";
  import { useHashLocation } from "wouter/use-hash-location";
  // when running under Electron:
  <WouterRouter hook={useHashLocation}> … </WouterRouter>
  ```
  Detect Electron with `window.location.protocol === "file:"` (or inject a flag
  from preload) and select the hook. Load overlays as `index.html#/overlay/notes`.
- **Build with a relative base** so assets resolve from `file://`:
  `vite build --base=./` (the repo's `vite.config.ts` reads `BASE_PATH`; set
  `BASE_PATH=./` for the desktop build). `import.meta.env.BASE_URL` then stays
  relative and `components/logo.tsx` (which uses `${BASE_URL}logo.svg`) keeps
  working. Public assets (`public/logo.svg`, `favicon.svg`) ship as-is.
- **Clerk redirect URLs**: in `App.tsx` the sign-in/up `forceRedirectUrl` and
  `path` are composed from `basePath`. With hash routing, set them to the hash
  equivalents (e.g. `/#/studio`) or boot the main window directly at the signed-in
  route. The Clerk **proxy** vars (`VITE_CLERK_PROXY_URL`) are prod-web only;
  desktop talks to Clerk FAPI directly like dev does.
- **No marketing dependency**: boot the main window at `/studio` (signed-in) or
  `/sign-in`. `pages/home.tsx` and `pages/public-view.tsx` are never loaded by the
  shell; the `Protected` gate already handles the signed-out redirect.

---

## 7. Permissions & capture on macOS

- Add usage strings and entitlements: `NSCameraUsageDescription`,
  `NSMicrophoneUsageDescription`, and Screen Recording permission (the OS prompts
  on first `getDisplayMedia`). Electron forwards these to the renderer.
- For programmatic source selection you may use `desktopCapturer` +
  `session.setDisplayMediaRequestHandler`, but the existing
  `navigator.mediaDevices.getDisplayMedia` path in `lib/recorder.ts` works inside
  Electron and needs no changes.
- Code-sign + notarize for distribution; screen recording permission is tied to
  the signed binary.

---

## 8. Suggested build order (hand to Claude Code)

1. Scaffold Electron (main + preload) alongside the existing Vite app; load the
   built `dist/public` (or dev server URL) into the main window.
2. Switch the renderer to **hash routing under Electron** and build with a
   relative base; verify login → studio → editor works from `file://`.
3. Add the IPC bridge (`window.nacho`) in preload + main-process broadcast.
4. In `pages/studio.tsx`, wire the active `RecorderController` to `onCommand` and
   start emitting `recorder:status` (no change to `recorder.ts`).
5. Add overlay routes (`/overlay/controls`, `/overlay/notes`, `/overlay/camera`)
   that render only their widget.
6. Create the overlay `BrowserWindow`s with `setContentProtection(true)`,
   `alwaysOnTop`, transparent/frameless; load the overlay routes.
7. Record a test clip and confirm the overlays are **absent from the output file**
   while visible to the presenter. Tune which camera path you want (recorded vs
   presenter-only).
8. Add macOS entitlements, sign, notarize.

---

## 9. Guardrails

- Don't change `src/lib/recorder.ts` recording behavior — only *read* its
  controller and forward commands. The capture path is verified on the web.
- Keep overlays in the same React app so the Pico theme stays consistent; don't
  fork styles.
- `setContentProtection` is the single point of failure for "excluded from
  recording" — assert it on every presenter window and re-check after any window
  recreation.
