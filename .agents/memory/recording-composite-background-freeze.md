---
name: Recording composite freezes in background tab
description: Why canvas-composite screen recordings freeze video (audio keeps going) and how the redraw loop must be driven
---

# Composite recording freezes when the tab is backgrounded

Symptom: a published/recorded video plays for a few seconds, then the picture
freezes on a static frame while audio keeps playing. A truncated download would
stop BOTH tracks — audio-continues-video-frozen means the video *track itself*
went stale during capture, not a serving/Range problem.

Root cause: the screen+camera (and cursor-overlay) composite is drawn to a
canvas and captured via `canvas.captureStream(fps)`. If the redraw loop is
driven by `requestAnimationFrame` (or a main-thread `setInterval`), the browser
throttles/pauses it whenever the recording tab is hidden or occluded — which is
exactly what happens the moment a user switches to the app they're demoing. The
canvas stops updating, captureStream emits no new frames, so the recorded video
freezes; the mic/system audio graph is unaffected, so audio keeps going.

**Only the canvas path is affected** (`useCanvas` = screen-camera composite, or
cursor overlay on screen). Plain screen recordings use the raw getDisplayMedia
track and keep producing frames when backgrounded (OS-level capture).

Fix (in `artifacts/nacho/src/features/recording/`): drive the redraw from a Web
Worker timer (`tick-worker.ts`) — worker timers are NOT throttled in background
tabs, and the worker's `message` events are delivered to the main thread even
when hidden, so the actual `drawImage` still runs main-thread. See
`composite-ticker.ts` (`startCompositeTicker`), which falls back to rAF if a
Worker can't be constructed.

**Why:** rAF/main-thread setInterval are the intuitive choice but are the bug.
**How to apply:** any future change to the capture/composite loop must keep a
background-immune driver; never reintroduce a bare rAF loop for `captureStream`.
This only repairs NEW recordings — already-captured frozen videos can't be fixed.
