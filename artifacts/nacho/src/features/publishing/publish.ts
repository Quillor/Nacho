import DOMPurify from "dompurify";
import type { LocalRecording, PublishResult, Visibility } from "@/lib/types";

interface UploadUrlResponse {
  uploadURL: string;
  objectPath: string;
}

interface BlobUploadOptions {
  signal?: AbortSignal;
  /** Fraction (0..1) of the PUT transfer completed. */
  onProgress?: (fraction: number) => void;
}

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
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Upload failed"));
    };
    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
    xhr.send(blob);
  });
}

async function uploadBlob(
  blob: Blob,
  name: string,
  options: BlobUploadOptions = {},
): Promise<string> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      size: blob.size,
      contentType: blob.type || "application/octet-stream",
    }),
    signal: options.signal,
  });
  if (!res.ok) throw new Error("Failed to request upload URL");
  const { uploadURL, objectPath } = (await res.json()) as UploadUrlResponse;

  await putBlob(
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
  const res = await fetch("/api/recordings", {
    method: "POST",
    credentials: "include",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: rec.title,
      description: DOMPurify.sanitize(rec.description),
      visibility,
      durationSec: rec.durationSec,
      trimStart: rec.trimStart,
      trimEnd: rec.trimEnd,
      hasAudio: rec.hasAudio,
      videoPath,
      thumbnailPath,
      gifPath,
      selfieCorner: rec.selfieCorner,
      chapters: rec.chapters,
      displayChaptersOnVideo: rec.displayChaptersOnVideo,
      notifyOnView: rec.notifyOnView,
      transcript: rec.transcript,
    }),
  });
  if (!res.ok) throw new Error("Failed to save recording");
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
  const res = await fetch(`/api/recordings/${rec.shareId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`/api/recordings/${shareId}/visibility`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`/api/recordings/${shareId}`, {
    method: "DELETE",
    credentials: "include",
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
