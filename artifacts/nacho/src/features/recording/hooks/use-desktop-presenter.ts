import { useEffect, useRef } from "react";
import {
  desktopBridge,
  type OverlayName,
  type RecorderCommand,
} from "@/lib/desktop";
import type { StudioPhase } from "./use-recorder-session";

interface PresenterOpts {
  phase: StudioPhase;
  /** Live recorder clock (seconds); reads the controller, not React state. */
  getElapsed: () => number;
  isPaused: () => boolean;
  /** Apply a transport command coming from the controls overlay. */
  runCommand: (cmd: RecorderCommand) => void;
  /** Which presenter overlays to show while recording. */
  overlays: OverlayName[];
}

/**
 * Bridges the recorder to the Electron presenter overlays. No-op on the web
 * (no `window.nacho`), so the Studio page can call it unconditionally.
 *
 * - Forwards transport commands from the controls overlay into the recorder.
 * - While recording: shows the content-protected overlay windows and pushes
 *   recorder status (elapsed/paused) to them at 4Hz; tears them down on stop.
 */
export function useDesktopPresenter(opts: PresenterOpts) {
  // Keep a live ref so the mount-once command listener always calls the latest
  // closures without re-subscribing on every render.
  const ref = useRef(opts);
  ref.current = opts;

  useEffect(() => {
    const bridge = desktopBridge;
    if (!bridge) return;
    return bridge.onCommand((cmd) => ref.current.runCommand(cmd));
  }, []);

  useEffect(() => {
    const bridge = desktopBridge;
    if (!bridge || opts.phase !== "recording") return;

    bridge.showOverlays(opts.overlays);
    const id = window.setInterval(() => {
      bridge.emitStatus({
        elapsed: ref.current.getElapsed(),
        paused: ref.current.isPaused(),
        phase: ref.current.phase,
      });
    }, 250);

    return () => {
      window.clearInterval(id);
      bridge.hideOverlays();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.phase]);
}
