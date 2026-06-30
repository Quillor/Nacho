// Regression tests for the large/slow-upload survival path. The publish flow
// (1) retries the direct-to-storage PUT with backoff so a transient blip on a
// big upload doesn't kill the whole transfer, and (2) maps the server's
// size-verification 422 to UploadFailedError (the media half) vs other save
// failures to SaveFailedError. These exercise the real `putBlobWithRetry` and
// `uploadRecording` through the public `publishRecording` entry point, mocking
// only the network seams (XMLHttpRequest for the PUT, fetch for request-url +
// the metadata POST), so a refactor can't quietly drop the retry/backoff or the
// error mapping that prevents dead share links.
import {
  describe,
  test,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

// apiPath/authHeaders pull in the generated API client + desktop detection,
// which we don't need here — stub them to the web (same-origin, no bearer).
vi.mock("@/lib/desktop-api", () => ({
  apiPath: (p: string) => p,
  authHeaders: async () => ({}),
}));

import {
  publishRecording,
  UploadFailedError,
  SaveFailedError,
} from "./publish";
import type { LocalRecording } from "@/lib/types";

// Mirror of MAX_UPLOAD_ATTEMPTS in publish.ts (module-private). If that constant
// changes, this test should be updated in lockstep.
const MAX_UPLOAD_ATTEMPTS = 4;

// --- Fake XMLHttpRequest --------------------------------------------------
// putBlob() drives the PUT via XHR (for upload progress + cancellation). This
// fake lets each test queue the outcome of successive sends and count how many
// PUTs were actually attempted (i.e. how many retries happened).

type SendBehavior =
  | { type: "success" }
  | { type: "http"; status: number }
  | { type: "network" }
  | { type: "abort" };

class FakeXHR {
  static queue: SendBehavior[] = [];
  static sendCount = 0;

  upload: { onprogress?: (e: unknown) => void } = {};
  status = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  private aborted = false;

  open(): void {}
  setRequestHeader(): void {}

  abort(): void {
    this.aborted = true;
    this.onabort?.();
  }

  send(): void {
    const behavior = FakeXHR.queue.shift() ?? { type: "success" };
    FakeXHR.sendCount++;
    setTimeout(() => {
      if (this.aborted) return;
      switch (behavior.type) {
        case "success":
          this.status = 200;
          this.onload?.();
          break;
        case "http":
          this.status = behavior.status;
          this.onload?.();
          break;
        case "network":
          this.onerror?.();
          break;
        case "abort":
          this.onabort?.();
          break;
      }
    }, 0);
  }
}

// --- fetch mock -----------------------------------------------------------
// Two endpoints are hit: POST /api/storage/uploads/request-url (always OK here)
// and POST /api/recordings (the metadata save, whose status each test controls).

let recordingsResponse: { ok: boolean; status: number };
let recordingsCalls: number;

function fakeFetch(input: string): Promise<Response> {
  const url = String(input);
  if (url.includes("/api/storage/uploads/request-url")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        uploadURL: "https://storage.example/put-here",
        objectPath: "/objects/uploads/abc",
      }),
    } as unknown as Response);
  }
  if (url.includes("/api/recordings")) {
    recordingsCalls++;
    return Promise.resolve({
      ok: recordingsResponse.ok,
      status: recordingsResponse.status,
      json: async () => ({ shareId: "share123", visibility: "public" }),
    } as unknown as Response);
  }
  throw new Error(`Unexpected fetch to ${url}`);
}

function makeRecording(): LocalRecording {
  return {
    id: "rec1",
    title: "Big slow upload",
    description: "",
    durationSec: 12,
    trimStart: 0,
    trimEnd: 12,
    hasAudio: true,
    source: "screen",
    selfieCorner: null,
    captionLang: null,
    chapters: [],
    displayChaptersOnVideo: false,
    notifyOnView: false,
    pinned: false,
    transcript: [],
    createdAt: Date.now(),
    blob: new Blob(["x".repeat(1024)], { type: "video/webm" }),
    thumbnail: null,
    mimeType: "video/webm",
    visibility: "private",
    shareId: null,
    videoPath: null,
    thumbnailPath: null,
    gifPath: null,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  FakeXHR.queue = [];
  FakeXHR.sendCount = 0;
  recordingsResponse = { ok: true, status: 201 };
  recordingsCalls = 0;
  vi.stubGlobal("XMLHttpRequest", FakeXHR as unknown as typeof XMLHttpRequest);
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Run a publish to settlement, draining backoff timers + microtasks. */
async function settle(
  rec: LocalRecording,
): Promise<{ ok: true; value: unknown } | { ok: false; error: unknown }> {
  const p = publishRecording(rec).then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error }),
  );
  await vi.runAllTimersAsync();
  return p;
}

describe("putBlobWithRetry (via publishRecording)", () => {
  test("retries after a transient network error, then succeeds", async () => {
    FakeXHR.queue = [{ type: "network" }, { type: "success" }];

    const outcome = await settle(makeRecording());

    expect(outcome.ok).toBe(true);
    expect(FakeXHR.sendCount).toBe(2);
    expect(recordingsCalls).toBe(1);
  });

  test("retries after a 5xx PUT response, then succeeds", async () => {
    FakeXHR.queue = [{ type: "http", status: 503 }, { type: "success" }];

    const outcome = await settle(makeRecording());

    expect(outcome.ok).toBe(true);
    expect(FakeXHR.sendCount).toBe(2);
  });

  test("gives up after MAX_UPLOAD_ATTEMPTS and never saves the row", async () => {
    FakeXHR.queue = Array.from(
      { length: MAX_UPLOAD_ATTEMPTS },
      () => ({ type: "network" }) as SendBehavior,
    );

    const outcome = await settle(makeRecording());

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toBeInstanceOf(UploadFailedError);
    }
    expect(FakeXHR.sendCount).toBe(MAX_UPLOAD_ATTEMPTS);
    // The PUT never succeeded, so the metadata POST must not have fired.
    expect(recordingsCalls).toBe(0);
  });

  test("does not retry when the upload is aborted", async () => {
    FakeXHR.queue = [{ type: "abort" }];

    const outcome = await settle(makeRecording());

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toBeInstanceOf(DOMException);
      expect((outcome.error as DOMException).name).toBe("AbortError");
    }
    // One send, no retries.
    expect(FakeXHR.sendCount).toBe(1);
  });
});

describe("uploadRecording error mapping (via publishRecording)", () => {
  test("maps a server 422 (incomplete object) to UploadFailedError", async () => {
    FakeXHR.queue = [{ type: "success" }];
    recordingsResponse = { ok: false, status: 422 };

    const outcome = await settle(makeRecording());

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toBeInstanceOf(UploadFailedError);
    }
  });

  test("maps a non-422 save failure to SaveFailedError", async () => {
    FakeXHR.queue = [{ type: "success" }];
    recordingsResponse = { ok: false, status: 500 };

    const outcome = await settle(makeRecording());

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toBeInstanceOf(SaveFailedError);
    }
  });
});
