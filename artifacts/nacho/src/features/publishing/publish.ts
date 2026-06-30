import DOMPurify from "dompurify";
import type { LocalRecording, PublishResult, Visibility } from "@/lib/types";
import { apiPath, authHeaders } from "@/lib/desktop-api";

interface UploadUrlResponse {
  uploadURL: string;
  objectPath: string;
}

/**
 * The video transfer to object storage failed (request-url or the PUT itself,
 * after retries). The recording is still safe locally — the publish can be
 * retried. Kept distinct from {@link SaveFailedError} so the UI can tell the
 * user *which* half broke instead of a catch-all "couldn't create link".
 */
export class UploadFailedError extends Error {
  constructor(message = "Upload failed") {
    super(message);
    this.name = "UploadFailedError";
  }
}

/**
 * The media uploaded but the server refused to (or couldn't) save the
 * recording row — e.g. it verified the stored object was incomplete (HTTP 422)
 * or the metadata POST failed. Also retryable.
 */
export class SaveFailedError extends Error {
  constructor(message = "Save failed") {
    super(message);
    this.name = "SaveFailedError";
  }
}

interface BlobUploadOptions {
  signal?: AbortSignal;
  /** Fraction (0..1) of the PUT transfer completed. */
  onProgress?: (fraction: number) => void;
}

/** Max PUT attempts (1 initial + retries) before giving up on a transfer. */
const MAX_UPLOAD_ATTEMPTS = 4;

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

const delay = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
  });

/**
 * PUT a blob to a presigned URL via XHR so we get upload progress events and
 * cancellation (fetch can't report upload progress and aborting it mid-PUT is
 * unreliable across browsers).
 */
function putBlob(
  url: string,
  blob: Blob,
  contentType: string,
  options: BlobUploadOptions = {},
): Promise<void> {
  const { signal, onProgress } = options;
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    const onAbort = () => xhr.abort();
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }
    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
      } else {
        reject(new UploadFailedError(`Upload failed (HTTP ${xhr.status})`));
      }
    };
    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new UploadFailedError("Upload network error"));
    };
    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
    xhr.send(blob);
  });
}

/**
 * PUT with bounded retries + exponential backoff. A single fixed-window PUT of
 * a large/slow file is fragile — a transient network blip drops the whole
 * transfer. Re-PUTting to the *same* presigned URL is idempotent in object
 * storage (it overwrites the object), and the long-lived upload URL stays valid
 * across the backoff, so each retry is a clean fresh attempt. Aborts are never
 * retried.
 */
async function putBlobWithRetry(
  url: string,
  blob: Blob,
  contentType: string,
  options: BlobUploadOptions = {},
): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
    try {
      await putBlob(url, blob, contentType, options);
      return;
    } catch (err) {
      if (isAbort(err)) throw err;
      lastErr = err;
      if (attempt < MAX_UPLOAD_ATTEMPTS) {
        // Reset visible progress so a fresh attempt doesn't look stuck at the
        // point the previous one died.
        options.onProgress?.(0);
        await delay(1000 * 2 ** (attempt - 1), options.signal);
      }
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new UploadFailedError();
}

async function uploadBlob(
  blob: Blob,
  name: string,
  options: BlobUploadOptions = {},
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(apiPath("/api/storage/uploads/request-url"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({
        name,
        size: blob.size,
        contentType: blob.type || "application/octet-stream",
      }),
      signal: options.signal,
    });
  } catch (err) {
    if (isAbort(err)) throw err;
    throw new UploadFailedError("Couldn't reach the upload service");
  }
  if (!res.ok) throw new UploadFailedError("Failed to request upload URL");
  const { uploadURL, objectPath } = (await res.json()) as UploadUrlResponse;

  await putBlobWithRetry(
    uploadURL,
    blob,
    blob.type || "application/octet-stream",
    options,
  );
  return objectPath;
}

export interface PublishOptions {
  gifBlob?: Blob | null;
  /** Human-readable step label for in-UI status text. */
  onProgress?: (label: string) => void;
  /** Fraction (0..1) of the heavy video transfer, for progress bars. */
  onUploadProgress?: (fraction: number) => void;
  /** Abort the in-flight upload (used by background uploads on delete). */
  signal?: AbortSignal;
}

/**
 * Upload a recording's media to object storage and create the server-side
 * record with the given visibility. Defaults to private (saved to the account
 * with no public link). Used as the building block for saving and publishing.
 */
async function uploadRecording(
  rec: LocalRecording,
  visibility: Visibility,
  options: PublishOptions = {},
): Promise<PublishResult> {
  const { gifBlob, onProgress, onUploadProgress, signal } = options;
  const ext = rec.mimeType.includes("mp4") ? "mp4" : "webm";

  onProgress?.("Uploading video…");
  const videoPath = await uploadBlob(rec.blob, `${rec.id}.${ext}`, {
    signal,
    onProgress: onUploadProgress,
  });

  let thumbnailPath: string | null = null;
  if (rec.thumbnail) {
    onProgress?.("Uploading thumbnail…");
    thumbnailPath = await uploadBlob(rec.thumbnail, `${rec.id}.jpg`, { signal });
  }

  let gifPath: string | null = null;
  if (gifBlob) {
    onProgress?.("Uploading preview…");
    gifPath = await uploadBlob(gifBlob, `${rec.id}.gif`, { signal });
  }

  onProgress?.("Saving…");
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
        videoPath,
        videoSize: rec.blob.size,
        thumbnailPath,
        gifPath,
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
    // 422 means the server verified the uploaded object was missing/truncated:
    // the media half is what's broken even though the PUT appeared to finish.
    if (res.status === 422) {
      throw new UploadFailedError("The video upload didn't finish");
    }
    throw new SaveFailedError("Failed to save recording");
  }
  const data = (await res.json()) as {
    shareId: string;
    visibility: Visibility;
  };

  return { shareId: data.shareId, visibility, videoPath, thumbnailPath, gifPath };
}

/**
 * Save a recording to the account as private (no public link). Other surfaces
 * call this to persist a video before — or instead of — generating a link.
 */
export function saveRecordingPrivate(
  rec: LocalRecording,
  options: PublishOptions = {},
): Promise<PublishResult> {
  return uploadRecording(rec, "private", options);
}

/**
 * Push edited metadata for an already-published recording to the server so the
 * public page and share link reflect the latest content — without needing to
 * unpublish/republish. If `gifBlob` is provided (e.g. the trim changed), the
 * preview is re-uploaded and the record points at the fresh GIF.
 */
export async function syncPublishedRecording(
  rec: LocalRecording,
  options: PublishOptions = {},
): Promise<PublishResult> {
  if (!rec.shareId || !rec.videoPath) {
    throw new Error("Recording has not been published yet");
  }
  const { gifBlob, onProgress } = options;

  let gifPath = rec.gifPath;
  if (gifBlob) {
    onProgress?.("Updating preview…");
    gifPath = await uploadBlob(gifBlob, `${rec.id}.gif`);
  }

  onProgress?.("Updating…");
  const res = await fetch(apiPath(`/api/recordings/${rec.shareId}`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({
      title: rec.title,
      description: DOMPurify.sanitize(rec.description),
      durationSec: rec.durationSec,
      trimStart: rec.trimStart,
      trimEnd: rec.trimEnd,
      hasAudio: rec.hasAudio,
      gifPath,
      selfieCorner: rec.selfieCorner,
      chapters: rec.chapters,
      displayChaptersOnVideo: rec.displayChaptersOnVideo,
      notifyOnView: rec.notifyOnView,
      transcript: rec.transcript,
    }),
  });
  if (!res.ok) throw new Error("Failed to update recording");

  return {
    shareId: rec.shareId,
    visibility: rec.visibility,
    videoPath: rec.videoPath,
    thumbnailPath: rec.thumbnailPath,
    gifPath,
  };
}

/** Flip an already-saved recording's visibility on the server. */
async function setVisibility(
  shareId: string,
  visibility: Visibility,
): Promise<void> {
  const res = await fetch(apiPath(`/api/recordings/${shareId}/visibility`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ visibility }),
  });
  if (!res.ok) throw new Error("Failed to update visibility");
}

/**
 * Generate (or re-enable) the public share link for a recording. If the video
 * has not been saved to the server yet, it is uploaded first as public.
 */
export async function getPublicLink(
  rec: LocalRecording,
  options: PublishOptions = {},
): Promise<PublishResult> {
  if (rec.shareId && rec.videoPath) {
    // Already on the server: push the latest edits and (re-)enable the link so
    // viewers see current content instead of whatever was first published.
    const synced = await syncPublishedRecording(rec, options);
    await setVisibility(rec.shareId, "public");
    return { ...synced, visibility: "public" };
  }
  return uploadRecording(rec, "public", options);
}

/** Return a recording to private state; its public link stops resolving. */
export async function unpublishRecording(shareId: string): Promise<void> {
  await setVisibility(shareId, "private");
}

/**
 * Delete a recording's server-side record (used when the local copy is deleted
 * so a background-uploaded private recording doesn't leave a dangling row). A
 * 404 is treated as success — there's simply nothing to clean up.
 */
export async function deleteServerRecording(shareId: string): Promise<void> {
  const res = await fetch(apiPath(`/api/recordings/${shareId}`), {
    method: "DELETE",
    credentials: "include",
    headers: { ...(await authHeaders()) },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error("Failed to delete recording");
  }
}

/**
 * Publish a recording and return its share link. Kept for the editor flow;
 * equivalent to uploading and immediately making it public.
 */
export function publishRecording(
  rec: LocalRecording,
  options: PublishOptions = {},
): Promise<PublishResult> {
  return uploadRecording(rec, "public", options);
}
