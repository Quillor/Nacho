// Raw fetch helpers for the publish flow's server calls: registering the
// pending row at upload start, the legacy single-shot metadata commit (for
// older servers without the start/complete flow), and the separate transcript
// sync that keeps the main commit payload small.

import DOMPurify from "dompurify";
import type { LocalRecording, Visibility } from "@/lib/types";
import { apiPath, authHeaders } from "@/lib/desktop-api";
import { UploadFailedError, SaveFailedError } from "./errors";

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/**
 * Register the recording server-side before any bytes move. The pending row
 * makes the upload visible across devices and reap-able if it never finishes.
 * Returns the minted shareId, or null when the server predates the endpoint
 * (legacy fallback: commit metadata after upload instead).
 */
export async function startServerRecording(
  rec: LocalRecording,
  visibility: Visibility,
  signal?: AbortSignal,
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(apiPath("/api/recordings/start"), {
      method: "POST",
      credentials: "include",
      signal,
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        title: rec.title,
        description: DOMPurify.sanitize(rec.description),
        visibility,
        durationSec: rec.durationSec,
        trimStart: rec.trimStart,
        trimEnd: rec.trimEnd,
        hasAudio: rec.hasAudio,
        selfieCorner: rec.selfieCorner,
        chapters: rec.chapters,
        displayChaptersOnVideo: rec.displayChaptersOnVideo,
        notifyOnView: rec.notifyOnView,
      }),
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw new SaveFailedError("Couldn't reach the server to save");
  }
  if (res.status === 404) return null; // older server without /start
  if (!res.ok) throw new SaveFailedError("Failed to save recording");
  const data = (await res.json()) as { shareId: string };
  return data.shareId;
}

/** Legacy single-shot metadata commit (server without the start/complete flow). */
export async function publishLegacy(
  rec: LocalRecording,
  visibility: Visibility,
  media: {
    videoPath: string;
    thumbnailPath: string | null;
    gifPath: string | null;
  },
  signal?: AbortSignal,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(apiPath("/api/recordings"), {
      method: "POST",
      credentials: "include",
      signal,
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        title: rec.title,
        description: DOMPurify.sanitize(rec.description),
        visibility,
        durationSec: rec.durationSec,
        trimStart: rec.trimStart,
        trimEnd: rec.trimEnd,
        hasAudio: rec.hasAudio,
        videoPath: media.videoPath,
        videoSize: rec.blob.size,
        thumbnailPath: media.thumbnailPath,
        gifPath: media.gifPath,
        selfieCorner: rec.selfieCorner,
        chapters: rec.chapters,
        displayChaptersOnVideo: rec.displayChaptersOnVideo,
        notifyOnView: rec.notifyOnView,
        transcript: rec.transcript,
      }),
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw new SaveFailedError("Couldn't reach the server to save");
  }
  if (!res.ok) {
    if (res.status === 422) {
      throw new UploadFailedError("The video upload didn't finish");
    }
    throw new SaveFailedError("Failed to save recording");
  }
  const data = (await res.json()) as { shareId: string };
  return data.shareId;
}

/**
 * Push the transcript separately from the main metadata commit so the commit
 * request stays small (long captioned recordings used to blow past the JSON
 * body limit and lose the whole save). Best-effort: a transcript hiccup must
 * not fail a publish whose video is already safely stored — the transcript
 * re-syncs with the next metadata update.
 */
export async function syncTranscript(
  shareId: string,
  rec: LocalRecording,
  signal?: AbortSignal,
): Promise<void> {
  if (rec.transcript.length === 0) return;
  try {
    await fetch(apiPath(`/api/recordings/${shareId}/transcript`), {
      method: "PATCH",
      credentials: "include",
      signal,
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ transcript: rec.transcript }),
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    // Non-fatal; the recording itself is saved.
  }
}

