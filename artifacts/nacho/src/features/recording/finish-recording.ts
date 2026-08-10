// Turns a stopped RecorderController into a persisted LocalRecording:
// assemble the blob, derive duration + thumbnail, save to IndexedDB, drop the
// now-redundant capture chunks, and kick off the background cloud upload.

import { nanoid } from "nanoid";
import { captureThumbnail, getBlobDuration } from "@/lib/media";
import { saveRecording, deleteCaptureChunks } from "@/lib/db";
import { startBackgroundUpload } from "@/features/publishing";
import { cloudEnabled } from "@/lib/desktop-api";
import type {
  LocalRecording,
  RecordingSource,
  SelfieCorner,
  TranscriptSegment,
} from "@/lib/types";
import type { RecorderController } from "./recorder";

export async function persistFinishedRecording(args: {
  controller: RecorderController;
  source: RecordingSource;
  corner: SelfieCorner;
  captionLang: string | null;
  transcript: TranscriptSegment[];
}): Promise<string> {
  const { controller: c, source, corner, captionLang, transcript } = args;

  const blob = await c.stop();
  let duration = c.getElapsed();
  if (!(duration > 0)) {
    try {
      duration = await getBlobDuration(blob);
    } catch {
      duration = 0;
    }
  }
  let thumbnail: Blob | null = null;
  try {
    thumbnail = await captureThumbnail(blob, Math.min(0.2, duration / 2));
  } catch {
    thumbnail = null;
  }

  const id = nanoid(12);
  const recording: LocalRecording = {
    id,
    title: `Recording ${new Date().toLocaleString()}`,
    description: "",
    durationSec: duration,
    trimStart: 0,
    trimEnd: duration,
    hasAudio: c.hasAudio,
    source,
    selfieCorner: source === "screen-camera" ? corner : null,
    captionLang,
    chapters: [],
    displayChaptersOnVideo: false,
    notifyOnView: false,
    pinned: false,
    transcript,
    createdAt: Date.now(),
    blob,
    thumbnail,
    mimeType: c.mimeType,
    visibility: "private",
    shareId: null,
    videoPath: null,
    thumbnailPath: null,
    gifPath: null,
  };
  await saveRecording(recording);
  // The recording is safely persisted as one record — the incremental capture
  // chunks have served their purpose.
  void deleteCaptureChunks(c.captureId).catch(() => undefined);
  // Start uploading the video to storage in the background as a private
  // recording so sharing is instant later. Skipped only when cloud is
  // unavailable (desktop without a configured backend).
  if (cloudEnabled) startBackgroundUpload(recording);
  return id;
}
