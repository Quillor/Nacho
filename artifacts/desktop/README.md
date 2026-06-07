# Nacho Desktop (macOS)

Electron shell that wraps the Nacho web renderer to add **presenter overlays
excluded from the recording** (speaker notes, transport controls, camera
preview) plus **cursor controls** (enlarged synthetic cursor + click sound).

This is a **local-only** build. The Replit project ships only the web app; none
of this runs in Replit. See `../nacho/DESKTOP_OVERLAYS.md` for the architecture.

## How it fits together

- **Main window** → loads the Nacho renderer at `#/studio` and runs the existing
  canvas recorder unchanged. This is the window that gets recorded.
- **Overlay windows** → `#/overlay/notes`, `#/overlay/camera`, `#/overlay/controls`,
  each created with `setContentProtection(true)` so macOS renders them black to
  any screen capture (including Nacho's own canvas).
- **`window.nacho`** preload bridge → transport commands, status, notes, and the
  cursor/click stream. The renderer feature-detects it; the web build sees no
  `window.nacho` and all desktop features stay off.

## Prerequisites (one-time, local Mac)

The workspace `pnpm-workspace.yaml` force-excludes darwin native binaries for the
Replit linux deploy. To build on a Mac you must allow them — see the repo root
note. After that:

```bash
pnpm install
```

`uiohook-napi` is an N-API module, so its prebuilt binary is ABI-stable across
Electron/Node versions — no native rebuild step is required.

## Develop

```bash
# Terminal 1 — renderer dev server (hash routing works at root):
BASE_PATH=/ PORT=5173 pnpm --filter @workspace/nacho run dev

# Terminal 2 — Electron pointed at the dev server:
NACHO_DEV_URL=http://localhost:5173 pnpm --filter @workspace/desktop run dev
```

## Build & package

```bash
pnpm --filter @workspace/desktop run build       # renderer (BASE_PATH=./) + main bundle
pnpm --filter @workspace/desktop run pack:local  # local, ad-hoc-signed Nacho.app (no Apple cert)
pnpm --filter @workspace/desktop run dist        # electron-builder → signed/notarized .dmg (needs certs)
```

`pack:local` produces `dist-app/mac-arm64/Nacho.app` and ad-hoc signs it via
`scripts/sign-local.mjs`. Signing the Electron **helper** processes with
`com.apple.security.inherit` (see `build/entitlements.mac.inherit.plist`) folds
their TCC grants into the main app, so macOS shows a **single** "Nacho" entry in
Screen Recording / Camera / Accessibility — not one per helper. Copy the result
to `/Applications` to run it like any other app.

> The renderer is served over a custom `app://` scheme (not `file://`) because
> Vite emits `crossorigin` module scripts that can't load from the file:// null
> origin. This also gives IndexedDB (recordings + notes) a stable origin.

### Signing & notarization

`electron-builder.yml` enables hardened runtime + entitlements. For a
distributable build, provide Apple credentials via env before `run dist`:

```bash
export APPLE_ID=you@example.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
export APPLE_TEAM_ID=XXXXXXXXXX
export CSC_LINK=/path/to/DeveloperIDApplication.p12
export CSC_KEY_PASSWORD=...
```

## Permissions the app will prompt for

| Permission | When | Needed for |
| --- | --- | --- |
| Screen Recording | first `getDisplayMedia` | recording the screen |
| Camera / Microphone | first `getUserMedia` | camera bubble + narration |
| Accessibility | enabling click sound | global mouse-down detection (uiohook) |
