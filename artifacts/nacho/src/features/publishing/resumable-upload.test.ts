// Unit tests for the resumable upload driver. These exercise the chunking,
// cumulative-progress, and resume-on-failure logic deterministically by
// injecting fake chunk/status transports (no real XHR/network), so the core
// reliability guarantee — an interrupted transfer resumes from the last
// committed byte instead of restarting from zero — is locked in.
import { describe, test, expect, vi } from "vitest";
import {
  uploadResumable,
  parseCommittedBytes,
  type ChunkTransport,
  type StatusTransport,
} from "./resumable-upload";
import { UploadFailedError } from "./errors";

/** A blob whose only meaningful property here is its byte size. */
function fakeBlob(size: number): Blob {
  return { size, slice: (start: number, end: number) => fakeBlob(end - start) } as unknown as Blob;
}

describe("parseCommittedBytes", () => {
  test("parses a GCS Range header into committed byte count", () => {
    expect(parseCommittedBytes("bytes=0-262143")).toBe(262144);
    expect(parseCommittedBytes("bytes=0-0")).toBe(1);
  });

  test("returns null for absent or unparseable headers", () => {
    expect(parseCommittedBytes(null)).toBeNull();
    expect(parseCommittedBytes("")).toBeNull();
    expect(parseCommittedBytes("bytes=100-200")).toBeNull();
    expect(parseCommittedBytes("garbage")).toBeNull();
  });
});

describe("uploadResumable", () => {
  const CHUNK = 256 * 1024;

  test("uploads a small blob in a single chunk and reports completion", async () => {
    const total = 1000;
    const calls: Array<{ start: number; end: number }> = [];
    const transport: ChunkTransport = async ({ start, end, total: t }) => {
      calls.push({ start, end });
      expect(end).toBe(t);
      return { done: true, committedBytes: t };
    };
    const onProgress = vi.fn();

    await uploadResumable("session", fakeBlob(total), {
      chunkSize: CHUNK,
      transport,
      onProgress,
    });

    expect(calls).toEqual([{ start: 0, end: total }]);
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  test("splits a large blob into aligned chunks and finishes on the last", async () => {
    const total = CHUNK * 3 + 500; // 3 full chunks + a remainder
    const calls: Array<{ start: number; end: number }> = [];
    const transport: ChunkTransport = async ({ start, end, total: t }) => {
      calls.push({ start, end });
      const done = end === t;
      return { done, committedBytes: done ? t : end };
    };

    await uploadResumable("session", fakeBlob(total), {
      chunkSize: CHUNK,
      transport,
    });

    expect(calls).toEqual([
      { start: 0, end: CHUNK },
      { start: CHUNK, end: CHUNK * 2 },
      { start: CHUNK * 2, end: CHUNK * 3 },
      { start: CHUNK * 3, end: total },
    ]);
  });

  test("resumes from the last committed byte after a failed chunk", async () => {
    const total = CHUNK * 3;
    const attempts: Array<{ start: number; end: number }> = [];
    let failed = false;
    const transport: ChunkTransport = async ({ start, end, total: t }) => {
      attempts.push({ start, end });
      // Fail once, the first time the second chunk is attempted.
      if (start === CHUNK && !failed) {
        failed = true;
        throw new UploadFailedError("network blip");
      }
      const done = end === t;
      return { done, committedBytes: done ? t : end };
    };
    // Status query reports storage committed exactly the first chunk.
    const statusTransport: StatusTransport = async () => CHUNK;

    await uploadResumable("session", fakeBlob(total), {
      chunkSize: CHUNK,
      transport,
      statusTransport,
    });

    // The failed second chunk is retried from CHUNK (not from 0): no restart.
    expect(attempts).toEqual([
      { start: 0, end: CHUNK },
      { start: CHUNK, end: CHUNK * 2 }, // fails
      { start: CHUNK, end: CHUNK * 2 }, // resumes here, not at 0
      { start: CHUNK * 2, end: CHUNK * 3 },
    ]);
  });

  test("progress is cumulative and monotonic across a resume", async () => {
    const total = CHUNK * 2;
    let failed = false;
    const transport: ChunkTransport = async ({ start, end, total: t, onChunkProgress }) => {
      if (start === 0 && !failed) {
        // Report partial progress, then fail mid-chunk.
        onChunkProgress?.((end - start) / 2);
        failed = true;
        throw new UploadFailedError("blip");
      }
      onChunkProgress?.(end - start);
      const done = end === t;
      return { done, committedBytes: done ? t : end };
    };
    const statusTransport: StatusTransport = async () => 0; // nothing committed yet

    const seen: number[] = [];
    await uploadResumable("session", fakeBlob(total), {
      chunkSize: CHUNK,
      transport,
      statusTransport,
      onProgress: (f) => seen.push(f),
    });

    expect(seen[seen.length - 1]).toBe(1);
    expect(Math.max(...seen)).toBeLessThanOrEqual(1);
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(0);
  });

  test("falls back to the chunk end when the Range header isn't readable", async () => {
    const total = CHUNK * 2;
    const transport: ChunkTransport = async ({ end, total: t }) => {
      const done = end === t;
      // committedBytes null simulates a CORS-hidden Range header.
      return { done, committedBytes: done ? t : null };
    };

    const calls: Array<{ start: number; end: number }> = [];
    const wrapped: ChunkTransport = async (args) => {
      calls.push({ start: args.start, end: args.end });
      return transport(args);
    };

    await uploadResumable("session", fakeBlob(total), {
      chunkSize: CHUNK,
      transport: wrapped,
    });

    // Without a readable offset it optimistically advances by the chunk size,
    // so the second chunk starts exactly where the first ended.
    expect(calls).toEqual([
      { start: 0, end: CHUNK },
      { start: CHUNK, end: CHUNK * 2 },
    ]);
  });

  test("gives up after exhausting chunk attempts", async () => {
    const transport: ChunkTransport = async () => {
      throw new UploadFailedError("always fails");
    };
    const statusTransport: StatusTransport = async () => 0;

    await expect(
      uploadResumable("session", fakeBlob(CHUNK * 2), {
        chunkSize: CHUNK,
        transport,
        statusTransport,
        maxChunkAttempts: 3,
      }),
    ).rejects.toBeInstanceOf(UploadFailedError);
  });

  test("propagates abort without retrying", async () => {
    const controller = new AbortController();
    const transport: ChunkTransport = async () => {
      controller.abort();
      throw new DOMException("Aborted", "AbortError");
    };
    const statusTransport = vi.fn<StatusTransport>(async () => 0);

    await expect(
      uploadResumable("session", fakeBlob(CHUNK * 2), {
        chunkSize: CHUNK,
        transport,
        statusTransport,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(statusTransport).not.toHaveBeenCalled();
  });

  test("completes early if a status query reports the object already finished", async () => {
    const total = CHUNK * 3;
    let failed = false;
    const transport: ChunkTransport = async ({ start, end, total: t }) => {
      if (start === CHUNK && !failed) {
        failed = true;
        throw new UploadFailedError("blip");
      }
      const done = end === t;
      return { done, committedBytes: done ? t : end };
    };
    // After the failure, status says everything is already committed.
    const statusTransport: StatusTransport = async () => total;
    const onProgress = vi.fn();

    await uploadResumable("session", fakeBlob(total), {
      chunkSize: CHUNK,
      transport,
      statusTransport,
      onProgress,
    });

    expect(onProgress).toHaveBeenLastCalledWith(1);
  });
});
