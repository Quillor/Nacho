import { useEffect } from "react";
import { resumePendingUploads } from "@/features/publishing";
import { clearAllCaptureChunks } from "@/lib/db";

/**
 * One-shot boot maintenance: clear capture chunks stranded by a crashed
 * session, then restart any background uploads that never finished (they
 * resume mid-file when the persisted resumable session is still alive).
 */
export function BootMaintenance() {
  useEffect(() => {
    // Desktop presenter overlays are separate windows running this same app —
    // they must never clear the chunks of the recording in progress in the
    // main window, nor start duplicate uploads.
    if (window.location.pathname.includes("/overlay/")) return;
    void clearAllCaptureChunks().catch(() => undefined);
    void resumePendingUploads();
  }, []);
  return null;
}
