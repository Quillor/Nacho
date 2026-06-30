import { apiPath, authHeaders } from "@/lib/desktop-api";
import { UploadFailedError } from "./errors";
import { uploadResumable } from "./resumable-upload";

interface UploadUrlResponse {
  uploadURL: string;
  objectPath: string;
}

interface ResumableUploadResponse {
  sessionUrl: string;
  objectPath: string;
}

/**
 * Above this size a video is uploaded via a resumable session (chunked, with
 * resume-on-failure) instead of a single PUT. Small media (thumbnails, GIFs,
 * short clips) keep the simpler single-PUT path where chunking adds no value.
 */
const RESUMABLE_THRESHOLD_BYTES = 16 * 1024 * 1024;

/** Max PUT attempts (1 initial + retries) before giving up on a transfer. */
const MAX_UPLOAD_ATTEMPTS = 4;

export interface BlobUploadOptions {
  signal?: AbortSignal;
  /** Fraction (0..1) of the PUT transfer completed. */
  onProgress?: (fraction: number) => void;
}

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
  throw lastErr instanceof Error ? lastErr : new UploadFailedError();
}

/**
 * Upload via a single presigned PUT (with bounded retries). The proven path for
 * small media; a whole-file retry is fine when the file is small.
 */
async function uploadBlobSimple(
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

/**
 * Upload a large blob via a resumable session: a chunked transfer that picks up
 * from the last committed byte if a chunk fails, instead of restarting the
 * whole file. If the session can't be created (e.g. an older server without the
 * endpoint), falls back to the single-PUT path so publishing still works.
 */
async function uploadBlobResumable(
  blob: Blob,
  name: string,
  options: BlobUploadOptions = {},
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(apiPath("/api/storage/uploads/resumable"), {
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
    // Network hiccup reaching the session endpoint — try the simple path before
    // giving up so a transient blip doesn't block publishing entirely.
    return uploadBlobSimple(blob, name, options);
  }
  if (!res.ok) {
    // Endpoint missing/unavailable: gracefully degrade to a single PUT.
    return uploadBlobSimple(blob, name, options);
  }
  const { sessionUrl, objectPath } =
    (await res.json()) as ResumableUploadResponse;

  await uploadResumable(sessionUrl, blob, {
    signal: options.signal,
    onProgress: options.onProgress,
  });
  return objectPath;
}

/**
 * Upload a blob to object storage and return its `/objects/...` path. Large
 * blobs go through a resumable session (so an interrupted transfer resumes
 * instead of restarting); small ones use a single presigned PUT.
 */
export async function uploadBlob(
  blob: Blob,
  name: string,
  options: BlobUploadOptions = {},
): Promise<string> {
  if (blob.size > RESUMABLE_THRESHOLD_BYTES) {
    return uploadBlobResumable(blob, name, options);
  }
  return uploadBlobSimple(blob, name, options);
}
