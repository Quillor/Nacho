import { UploadFailedError } from "./errors";

/**
 * GCS resumable uploads commit data in 256 KiB units, and every chunk except
 * the final one must be a multiple of this. Aligning our chunks to it means a
 * cleanly-acked chunk always commits in full, so our in-memory committed offset
 * never drifts from what storage actually has.
 */
const GCS_CHUNK_MULTIPLE = 256 * 1024;

/** Default chunk size: 8 MiB (a multiple of 256 KiB). */
export const DEFAULT_CHUNK_SIZE = 32 * GCS_CHUNK_MULTIPLE;

/** Max attempts for a single chunk (1 initial + retries) before giving up. */
const MAX_CHUNK_ATTEMPTS = 5;

/** Outcome of PUTting one chunk to the resumable session. */
export interface ChunkResult {
  /** `true` once storage signals the whole object is committed (HTTP 200/201). */
  done: boolean;
  /**
   * Total bytes storage has committed so far, or `null` when it couldn't be
   * read (e.g. the `Range` response header isn't exposed by CORS). The caller
   * falls back to its own optimistic offset in that case.
   */
  committedBytes: number | null;
}

/** Uploads a single chunk; pluggable so tests don't need a real XHR/network. */
export type ChunkTransport = (args: {
  sessionUrl: string;
  chunk: Blob;
  /** Inclusive first byte offset of this chunk within the whole object. */
  start: number;
  /** Exclusive end byte offset of this chunk within the whole object. */
  end: number;
  total: number;
  signal?: AbortSignal;
  /** Reports bytes transferred *within this chunk* (0..chunk length). */
  onChunkProgress?: (loadedInChunk: number) => void;
}) => Promise<ChunkResult>;

/**
 * Queries the session for how many bytes storage has committed, used to resync
 * after a failed chunk so a retry resumes from the true offset. Returns `null`
 * when the offset can't be determined (caller keeps its own).
 */
export type StatusTransport = (args: {
  sessionUrl: string;
  total: number;
  signal?: AbortSignal;
}) => Promise<number | null>;

export interface ResumableUploadOptions {
  signal?: AbortSignal;
  /** Fraction (0..1) of the whole transfer completed, cumulative across resumes. */
  onProgress?: (fraction: number) => void;
  chunkSize?: number;
  /** Injectable for tests; defaults to the real XHR transport. */
  transport?: ChunkTransport;
  /** Injectable for tests; defaults to the real XHR status query. */
  statusTransport?: StatusTransport;
  maxChunkAttempts?: number;
  /**
   * Bytes storage has already committed for this session (from a previous
   * attempt that was interrupted). The transfer picks up from here instead of
   * re-sending from zero.
   */
  startOffset?: number;
}

/**
 * Ask an existing resumable session how many bytes it has committed. Returns
 * the committed byte count (`total` when already complete), or throws when the
 * session is dead/expired — the caller should open a fresh session then.
 */
export function queryResumableStatus(
  sessionUrl: string,
  total: number,
  signal?: AbortSignal,
): Promise<number | null> {
  return xhrStatusTransport({ sessionUrl, total, signal });
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
 * Parse the `Range` response header GCS returns on a `308 Resume Incomplete`
 * (`bytes=0-<last>`) into the number of committed bytes (`<last> + 1`). Returns
 * `null` when the header is absent/unparseable so the caller can fall back.
 */
export function parseCommittedBytes(rangeHeader: string | null): number | null {
  if (!rangeHeader) return null;
  const match = /^bytes=0-(\d+)$/.exec(rangeHeader.trim());
  if (!match) return null;
  const last = Number(match[1]);
  if (!Number.isFinite(last) || last < 0) return null;
  return last + 1;
}

/**
 * Drive a resumable upload of `blob` to an already-created session URL, chunk by
 * chunk. The core reliability win: a chunk that fails (network blip, transient
 * 5xx) is retried — and before retrying we re-query the committed offset so the
 * transfer resumes from where storage actually stopped instead of restarting
 * the whole file. Progress is reported cumulatively across those resumes.
 *
 * The chunk/status transports are injected so the loop can be unit-tested
 * deterministically; production wiring uses XHR (for upload progress events and
 * reliable cancellation).
 */
export async function uploadResumable(
  sessionUrl: string,
  blob: Blob,
  options: ResumableUploadOptions = {},
): Promise<void> {
  const {
    signal,
    onProgress,
    chunkSize = DEFAULT_CHUNK_SIZE,
    transport = xhrChunkTransport,
    statusTransport = xhrStatusTransport,
    maxChunkAttempts = MAX_CHUNK_ATTEMPTS,
    startOffset = 0,
  } = options;

  const total = blob.size;
  if (total === 0) {
    onProgress?.(1);
    return;
  }

  let committed = Math.min(Math.max(startOffset, 0), total);
  if (committed >= total) {
    onProgress?.(1);
    return;
  }
  if (committed > 0) onProgress?.(committed / total);
  let attempts = 0;

  while (committed < total) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const end = Math.min(committed + chunkSize, total);
    const chunkStart = committed;
    const chunk = blob.slice(chunkStart, end);

    try {
      const result = await transport({
        sessionUrl,
        chunk,
        start: chunkStart,
        end,
        total,
        signal,
        onChunkProgress: (loadedInChunk) => {
          const fraction = (chunkStart + loadedInChunk) / total;
          onProgress?.(Math.min(fraction, 1));
        },
      });

      attempts = 0;
      if (result.done) {
        onProgress?.(1);
        return;
      }
      // Advance to the server-acked offset; fall back to the chunk end when the
      // Range header wasn't readable (chunks are 256 KiB-aligned, so a cleanly
      // acked chunk is fully committed).
      committed = result.committedBytes ?? end;
      onProgress?.(Math.min(committed / total, 1));
    } catch (err) {
      if (isAbort(err)) throw err;
      attempts++;
      if (attempts >= maxChunkAttempts) {
        throw err instanceof Error ? err : new UploadFailedError();
      }
      // Snap visible progress back to the committed point so a retry doesn't
      // look stuck at where the failed attempt died.
      onProgress?.(Math.min(committed / total, 1));
      await delay(1000 * 2 ** (attempts - 1), signal);

      // Resync against storage so we resume from the true committed offset
      // rather than blindly re-sending (or worse, restarting from zero).
      try {
        const serverCommitted = await statusTransport({
          sessionUrl,
          total,
          signal,
        });
        if (serverCommitted != null) {
          if (serverCommitted >= total) {
            onProgress?.(1);
            return;
          }
          committed = serverCommitted;
        }
      } catch (statusErr) {
        if (isAbort(statusErr)) throw statusErr;
        // Couldn't reach the status endpoint; keep our committed offset and let
        // the next loop iteration re-send the current chunk.
      }
    }
  }

  onProgress?.(1);
}

/**
 * Production chunk transport: PUT one chunk to the resumable session URL with a
 * `Content-Range` header, via XHR so we get upload-progress events and reliable
 * mid-flight cancellation. Resolves `done` on 200/201 (object complete) and
 * reads the committed offset from the `Range` header on 308 Resume Incomplete.
 */
function xhrChunkTransport(args: {
  sessionUrl: string;
  chunk: Blob;
  start: number;
  end: number;
  total: number;
  signal?: AbortSignal;
  onChunkProgress?: (loadedInChunk: number) => void;
}): Promise<ChunkResult> {
  const { sessionUrl, chunk, start, end, total, signal, onChunkProgress } = args;
  return new Promise<ChunkResult>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", sessionUrl);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${total}`);

    const onAbort = () => xhr.abort();
    if (onChunkProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onChunkProgress(e.loaded);
      };
    }
    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      const status = xhr.status;
      if (status === 200 || status === 201) {
        resolve({ done: true, committedBytes: total });
      } else if (status === 308) {
        resolve({
          done: false,
          committedBytes: parseCommittedBytes(xhr.getResponseHeader("Range")),
        });
      } else {
        reject(new UploadFailedError(`Upload failed (HTTP ${status})`));
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
    xhr.send(chunk);
  });
}

/**
 * Production status transport: ask the session how many bytes it has committed
 * by sending an empty PUT with `Content-Range: bytes *\/<total>`. 200/201 means
 * complete; 308 carries the committed offset in the `Range` header.
 */
function xhrStatusTransport(args: {
  sessionUrl: string;
  total: number;
  signal?: AbortSignal;
}): Promise<number | null> {
  const { sessionUrl, total, signal } = args;
  return new Promise<number | null>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", sessionUrl);
    xhr.setRequestHeader("Content-Range", `bytes */${total}`);

    const onAbort = () => xhr.abort();
    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      const status = xhr.status;
      if (status === 200 || status === 201) {
        resolve(total);
      } else if (status === 308) {
        resolve(parseCommittedBytes(xhr.getResponseHeader("Range")));
      } else {
        reject(new UploadFailedError(`Status query failed (HTTP ${status})`));
      }
    };
    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new UploadFailedError("Status query network error"));
    };
    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort);
    xhr.send();
  });
}
