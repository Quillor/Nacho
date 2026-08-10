import { useState } from "react";
import { desktopBridge, hasSourcePicker } from "@/lib/desktop";
import type { RecordingSource } from "@/lib/types";

/**
 * Gate for the desktop's in-app (Zoom-style) share picker. On desktop,
 * screen-bearing sources open the picker first and capture starts only after
 * a source is locked in; web (and camera-only) go straight to capture — the
 * browser's own picker is mandatory there.
 */
export function useSourcePicker(
  source: RecordingSource,
  startPreview: () => Promise<void>,
) {
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);

  const enablePreview = async () => {
    if (hasSourcePicker && source !== "camera") {
      setSourcePickerOpen(true);
      return;
    }
    await startPreview();
  };

  const confirmSource = async (sourceId: string) => {
    setSourcePickerOpen(false);
    try {
      await desktopBridge?.capture?.selectSource(sourceId);
    } catch {
      /* fall through — main falls back to the primary screen */
    }
    await startPreview();
  };

  const cancelSourcePicker = () => setSourcePickerOpen(false);

  return { sourcePickerOpen, enablePreview, confirmSource, cancelSourcePicker };
}
