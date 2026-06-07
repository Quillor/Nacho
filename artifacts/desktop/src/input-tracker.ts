// Global input tracking for the cursor-overlay feature.
//
// Two independent signals, both fed to the renderer over IPC:
//   1. Cursor position — polled from Electron's `screen.getCursorScreenPoint()`
//      at ~60Hz. Permission-free. Used to draw the enlarged synthetic cursor.
//   2. Mouse-down events — captured globally via the native `uiohook-napi`
//      addon. Requires macOS Accessibility permission. Used to trigger the
//      click sound (and optional click ripple).
//
// Both are inert until `start()` is called (when a recording with cursor
// controls begins) and torn down on `stop()`, so there is zero overhead when
// the feature is off.
import { screen, systemPreferences } from "electron";

type Point = { x: number; y: number };

export interface InputTracker {
  start(opts: { withClicks: boolean }): void;
  stop(): void;
  isRunning(): boolean;
}

/**
 * macOS Accessibility (TCC) is required for global mouse-event monitoring.
 * Passing `prompt: true` surfaces the system dialog the first time. Returns the
 * current trust state. Always true on non-macOS.
 */
export function ensureAccessibility(prompt: boolean): boolean {
  if (process.platform !== "darwin") return true;
  return systemPreferences.isTrustedAccessibilityClient(prompt);
}

export function createInputTracker(
  onMove: (p: Point) => void,
  onClick: () => void,
): InputTracker {
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let uiohook: typeof import("uiohook-napi").uIOhook | null = null;
  let hookStarted = false;
  let lastX = -1;
  let lastY = -1;

  const poll = () => {
    const p = screen.getCursorScreenPoint();
    // Only emit on actual movement to avoid pointless IPC traffic.
    if (p.x !== lastX || p.y !== lastY) {
      lastX = p.x;
      lastY = p.y;
      onMove(p);
    }
  };

  const startClicks = () => {
    if (hookStarted) return;
    if (!ensureAccessibility(true)) {
      // Not trusted yet; renderer surfaces the "grant Accessibility" prompt and
      // can retry start() after the user grants it.
      return;
    }
    try {
      // Lazy require: native addon, only loaded when click sound is enabled.
      const mod = require("uiohook-napi") as typeof import("uiohook-napi");
      uiohook = mod.uIOhook;
      uiohook.on("mousedown", () => onClick());
      uiohook.start();
      hookStarted = true;
    } catch (err) {
      console.error("[input-tracker] failed to start uiohook:", err);
    }
  };

  return {
    start({ withClicks }) {
      if (!pollTimer) pollTimer = setInterval(poll, 16); // ~60Hz
      if (withClicks) startClicks();
    },
    stop() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (uiohook && hookStarted) {
        try {
          uiohook.stop();
        } catch (err) {
          console.error("[input-tracker] failed to stop uiohook:", err);
        }
      }
      uiohook = null;
      hookStarted = false;
      lastX = lastY = -1;
    },
    isRunning() {
      return pollTimer !== null;
    },
  };
}
