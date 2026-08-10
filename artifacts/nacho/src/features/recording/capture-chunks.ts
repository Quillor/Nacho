// Incremental persistence for in-flight captures. MediaRecorder chunks are
// streamed into IndexedDB as they arrive so a long take doesn't have to be
// held in renderer memory for the whole session (30 min at 5 Mbps ≈ 1.1 GB —
// enough to OOM low-end devices/Safari). Writes are chained so ordering is
// preserved; if persistence ever fails (quota, private mode) the remaining
// chunks fall back to memory in order, which is exactly the old behavior.

import {
  putCaptureChunk,
  getCaptureChunks,
  deleteCaptureChunks,
} from "@/lib/db";

export interface ChunkSink {
  /** Id of this capture's chunk group in IndexedDB. */
  captureId: string;
  /** Queue one recorder chunk for persistence (order-preserving). */
  append(data: Blob): void;
  /** Reassemble the full recording from persisted + in-memory chunks. */
  assemble(mimeType: string): Promise<Blob>;
  /** Drop the persisted chunks (abandoned capture). */
  discard(): void;
}

export function createChunkSink(): ChunkSink {
  const captureId = `cap-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  let persistBroken = false;
  let persistedCount = 0;
  let nextSeq = 0;
  const memoryTail: Blob[] = [];
  let pendingWrites: Promise<void> = Promise.resolve();

  return {
    captureId,
    append(data: Blob): void {
      if (data.size === 0) return;
      const seq = nextSeq++;
      pendingWrites = pendingWrites.then(async () => {
        if (persistBroken) {
          memoryTail.push(data);
          return;
        }
        try {
          await putCaptureChunk(captureId, seq, data);
          persistedCount++;
        } catch {
          persistBroken = true;
          memoryTail.push(data);
        }
      });
    },
    async assemble(mimeType: string): Promise<Blob> {
      await pendingWrites;
      let head: Blob[] = [];
      if (persistedCount > 0) {
        try {
          head = await getCaptureChunks(captureId);
        } catch {
          // Chunks were written but can't be read back — nothing to recover
          // from here; deliver whatever is in memory.
          head = [];
        }
      }
      return new Blob([...head, ...memoryTail], { type: mimeType });
    },
    discard(): void {
      void pendingWrites.then(() =>
        deleteCaptureChunks(captureId).catch(() => undefined),
      );
    },
  };
}
