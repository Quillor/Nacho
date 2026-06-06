import { useSyncExternalStore } from "react";
import { getRecording, updateRecording } from "@/lib/db";
import { saveRecordingPrivate, deleteServerRecording } from "./publish";
import type { LocalRecording, PublishResult } from "@/lib/types";

/**
 * Lifecycle of a recording's background upload to object storage.
 * - `uploading` — the video is being transferred to storage.
 * - `uploaded`  — the private server record exists; sharing is now instant.
 * - `failed`    — the transfer failed; the user can retry.
 * `idle` is the implicit default for anything we haven't started.
 */
export type UploadPhase = "idle" | "uploading" | "uploaded" | "failed";

export interface UploadState {
  phase: UploadPhase;
  /** Fraction (0..1) of the heavy video transfer. */
  progress: number;
}

const IDLE_STATE: UploadState = { phase: "idle", progress: 0 };

// Module-level singleton so uploads survive route changes (e.g. studio →
// editor). State lives outside React; components subscribe via useUploadState.
const states = new Map<string, UploadState>();
const tasks = new Map<string, Promise<PublishResult>>();
const controllers = new Map<string, AbortController>();
const cancelled = new Set<string>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function setState(id: string, next: UploadState): void {
  states.set(id, next);
  emit();
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getUploadState(id: string | null | undefined): UploadState {
  if (!id) return IDLE_STATE;
  return states.get(id) ?? IDLE_STATE;
}

/** Subscribe a component to one recording's upload state. */
export function useUploadState(id: string | null | undefined): UploadState {
  return useSyncExternalStore(
    subscribe,
    () => getUploadState(id),
    () => getUploadState(id),
  );
}

export interface StartUploadOptions {
  /** Restart even if the recording previously failed (manual retry). */
  force?: boolean;
}

/**
 * Begin (or reuse) a background upload of a recording's video + thumbnail to
 * object storage, creating a private server record. Idempotent: if an upload is
 * already in flight it returns the same promise; if the recording is already on
 * the server it no-ops. The resulting shareId/paths are persisted back onto the
 * local recording so later "Get public link" is instant.
 */
export function startBackgroundUpload(
  rec: LocalRecording,
  options: StartUploadOptions = {},
): Promise<PublishResult> | null {
  const { id } = rec;

  // Already saved to the server — nothing to upload.
  if (rec.shareId && rec.videoPath) {
    if (getUploadState(id).phase !== "uploaded") {
      setState(id, { phase: "uploaded", progress: 1 });
    }
    return null;
  }

  // Already running — reuse the in-flight transfer.
  const existing = tasks.get(id);
  if (existing) return existing;

  // Don't auto-restart a failed upload; that takes an explicit retry.
  if (!options.force && getUploadState(id).phase === "failed") return null;

  const controller = new AbortController();
  controllers.set(id, controller);
  cancelled.delete(id);
  setState(id, { phase: "uploading", progress: 0 });

  const task = (async (): Promise<PublishResult> => {
    try {
      const result = await saveRecordingPrivate(rec, {
        signal: controller.signal,
        onUploadProgress: (fraction) =>
          setState(id, { phase: "uploading", progress: fraction }),
      });

      // The recording was deleted while uploading: clean up the server record
      // we just created so it doesn't dangle, and don't touch local storage.
      if (cancelled.has(id)) {
        void deleteServerRecording(result.shareId).catch(() => undefined);
        throw new DOMException("Aborted", "AbortError");
      }

      await updateRecording(id, {
        shareId: result.shareId,
        videoPath: result.videoPath,
        thumbnailPath: result.thumbnailPath,
        gifPath: result.gifPath,
      });
      setState(id, { phase: "uploaded", progress: 1 });
      return result;
    } catch (err) {
      if (isAbortError(err) || cancelled.has(id)) {
        states.delete(id);
        emit();
        throw err;
      }
      setState(id, { phase: "failed", progress: 0 });
      throw err;
    } finally {
      tasks.delete(id);
      controllers.delete(id);
    }
  })();

  tasks.set(id, task);
  // Swallow rejections here so an unawaited background upload never surfaces an
  // unhandled promise rejection; callers that await get the real error.
  task.catch(() => undefined);
  return task;
}

/**
 * Wait for an in-flight background upload to finish (if any). Resolves quietly
 * whether the upload succeeded or failed so callers can then re-read the local
 * recording and decide how to proceed.
 */
export async function waitForUpload(id: string): Promise<void> {
  const task = tasks.get(id);
  if (!task) return;
  try {
    await task;
  } catch {
    /* failures are reflected in the upload state; caller falls back */
  }
}

/** Whether a background upload is currently transferring this recording. */
export function isUploadInFlight(id: string): boolean {
  return tasks.has(id);
}

/**
 * Cancel an in-flight background upload (e.g. the recording is being deleted).
 * Aborts the transfer; if the server record was already created, the upload
 * task itself removes it. Clears any tracked state for the recording.
 */
export function cancelUpload(id: string): void {
  cancelled.add(id);
  controllers.get(id)?.abort();
  if (states.has(id)) {
    states.delete(id);
    emit();
  }
}

/** Retry a previously failed upload by reloading the recording and restarting. */
export async function retryUpload(id: string): Promise<void> {
  const rec = await getRecording(id);
  if (!rec) return;
  const task = startBackgroundUpload(rec, { force: true });
  if (task) await task.catch(() => undefined);
}
