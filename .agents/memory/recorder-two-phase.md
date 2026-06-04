---
name: Nacho two-phase recording
description: Why Nacho acquires media streams before recording and keeps the selfie corner mutable
---

# Two-phase recording (prepare → start)

The Nacho recorder splits stream acquisition from MediaRecorder start:
`prepareRecording()` acquires screen/camera/mic and builds the live composite
preview; `prepared.start()` begins the MediaRecorder; `prepared.dispose()`
releases streams if the user backs out.

**Why:** `getDisplayMedia()`/`getUserMedia()` require a user gesture and (for
screen) show a picker — they cannot be called silently on mount. To show a live
preview *before* recording, acquisition has to happen on an explicit "Enable
Preview" click, separate from the actual record start. Doing both in one call
(the old `startRecording`) meant the preview was empty during setup.

**How to apply:** Any new capture option that changes the acquired streams
(source, mic, system audio) must force re-acquisition — that's why those are
locked once preview is enabled and "Reconfigure" disposes + returns to setup.
Options that only affect post-acquisition behavior (caption language, selfie
corner) can change live: the selfie corner is a mutable var read each canvas
draw frame, so updating it changes both preview and recorded composite without
re-acquiring.
