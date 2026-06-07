import { useEffect, useMemo, useRef, useState } from "react";
import { desktopBridge, hasCursorBridge } from "@/lib/desktop";
import type { CursorInput, Point, Rect } from "../cursor-overlay";

/**
 * Owns the desktop cursor-controls state and the bridge to the global input
 * tracker (cursor position + clicks from the Electron main process). No-op on
 * the web — `available` is false and nothing starts.
 *
 * The recorder reads the live cursor via the returned `cursorInput`; clicks are
 * forwarded to the handler passed to `startTracking` (the prepared recorder's
 * `triggerClick`, which plays the click sound and spawns a ripple).
 */
export function useCursorControls() {
  const [cursorOverlay, setCursorOverlay] = useState(false);
  const [cursorSize, setCursorSize] = useState(2);
  const [clickSound, setClickSound] = useState(false);

  const pointRef = useRef<Point | null>(null);
  const boundsRef = useRef<Rect | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const cursorInput: CursorInput = useMemo(
    () => ({
      getPoint: () => pointRef.current,
      getDisplayBounds: () => boundsRef.current,
    }),
    [],
  );

  const stopTracking = () => {
    desktopBridge?.cursor.stop();
    cleanupRef.current?.();
    cleanupRef.current = null;
    pointRef.current = null;
  };

  const startTracking = async (onClick: () => void) => {
    const bridge = desktopBridge;
    if (!bridge || (!cursorOverlay && !clickSound)) return;
    const captured = await bridge.cursor.getCapturedDisplayBounds();
    boundsRef.current = captured?.bounds ?? null;
    if (clickSound) {
      // Global click detection needs macOS Accessibility; prompt if needed.
      try {
        await bridge.cursor.requestAccessibility();
      } catch {
        /* user can grant later and re-enable */
      }
    }
    bridge.cursor.start({ withClicks: clickSound });
    const offMove = bridge.cursor.onMove((p) => {
      pointRef.current = p;
    });
    const offClick = bridge.cursor.onClick(() => onClick());
    cleanupRef.current = () => {
      offMove();
      offClick();
    };
  };

  useEffect(() => () => stopTracking(), []);

  return {
    available: hasCursorBridge,
    cursorOverlay,
    setCursorOverlay,
    cursorSize,
    setCursorSize,
    clickSound,
    setClickSound,
    cursorInput,
    startTracking,
    stopTracking,
  };
}
