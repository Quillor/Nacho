// Launch-time upload recovery. Upload state used to live only in module
// memory, so a reload/app restart silently stranded any recording that hadn't
// finished uploading. On boot we scan the local library for recordings with no
// server-side video and restart their background uploads — which resume
// mid-file via the persisted resumable session when one is still alive.

import { listRecordings, getRecording } from "@/lib/db";
import { cloudEnabled } from "@/lib/desktop-api";
import { startBackgroundUpload } from "./upload-manager";

let started = false;

/**
 * Restart background uploads for every local recording that never made it to
 * the server. Idempotent per app session; failures surface through the normal
 * per-recording upload state (retry chip in the library).
 */
export async function resumePendingUploads(): Promise<void> {
  if (started || !cloudEnabled) return;
  started = true;

  let metas;
  try {
    metas = await listRecordings();
  } catch {
    return; // IndexedDB unavailable; nothing to resume.
  }

  for (const meta of metas) {
    // Already fully uploaded — nothing to do.
    if (meta.videoPath) continue;
    const rec = await getRecording(meta.id).catch(() => undefined);
    if (!rec || !rec.blob || rec.blob.size === 0) continue;
    // `force` restarts recordings that were left in a failed state too.
    startBackgroundUpload(rec, { force: true });
  }
}
