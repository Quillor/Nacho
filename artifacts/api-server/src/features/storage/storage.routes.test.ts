// Regression tests for the storage proxy's HTTP Range support, which is what
// keeps public/shared <video> playback working — without it, browsers (and
// especially Safari/iOS) can't start or seek a video. These exercise the real
// Express route → serveObject → ObjectStorageService.downloadObject →
// parseByteRange path, mocking only the lowest level (@google-cloud/storage)
// with an in-memory object so a refactor of the streaming path can't silently
// break range responses again.
import { describe, test, beforeAll, afterAll, expect, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

// Deterministic in-memory object the fake bucket serves. Defined via vi.hoisted
// so it's available inside the (hoisted) vi.mock factory below.
const FAKE = vi.hoisted(() => {
  const size = 4096;
  const buf = Buffer.alloc(size);
  for (let i = 0; i < size; i++) {
    buf[i] = i % 251; // non-trivial, repeating-but-offset byte pattern
  }
  return { buf, contentType: "video/webm" };
});

// Replace Google Cloud Storage with an in-memory implementation. Every
// bucket().file() resolves to the same fake object, so searchPublicObject finds
// it and downloadObject streams (a slice of) FAKE.buf.
vi.mock("@google-cloud/storage", async () => {
  const { Readable } = await import("node:stream");

  class File {
    name: string;
    bucket: { name: string };
    constructor(bucketName: string, name: string) {
      this.name = name;
      this.bucket = { name: bucketName };
    }
    async exists() {
      return [true];
    }
    async getMetadata() {
      return [
        {
          contentType: FAKE.contentType,
          size: String(FAKE.buf.length),
          metadata: {},
        },
      ];
    }
    createReadStream(opts?: { start?: number; end?: number }) {
      const start = opts?.start ?? 0;
      const end = opts?.end ?? FAKE.buf.length - 1;
      return Readable.from([FAKE.buf.subarray(start, end + 1)]);
    }
    async createResumableUpload(opts?: {
      origin?: string;
      metadata?: { contentType?: string };
    }) {
      // Echo the inputs into the fake session URL so the test can assert the
      // route forwarded origin/contentType through to the storage client.
      const params = new URLSearchParams({
        upload_id: "fake-upload-id",
        origin: opts?.origin ?? "",
        contentType: opts?.metadata?.contentType ?? "",
      });
      return [
        `https://storage.googleapis.com/${this.bucket.name}/${this.name}?${params}`,
      ];
    }
  }

  class Bucket {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    file(objectName: string) {
      return new File(this.name, objectName);
    }
  }

  class Storage {
    constructor(_opts?: unknown) {}
    bucket(name: string) {
      return new Bucket(name);
    }
  }

  return { Storage, File, Bucket };
});

// The service reads these env vars lazily (per request), so setting them before
// the server starts is enough.
process.env.PUBLIC_OBJECT_SEARCH_PATHS = "/test-bucket/public";
process.env.PRIVATE_OBJECT_DIR = "/test-bucket/private";

let baseUrl = "";
let server: Server;

beforeAll(async () => {
  const express = (await import("express")).default;
  const storageRouter = (await import("./storage.routes")).default;

  const app = express();
  // serveObject only touches req.log on unexpected stream/handler errors; a
  // no-op logger keeps those paths from throwing if they're ever hit.
  app.use((req, _res, next) => {
    (req as unknown as { log: unknown }).log = {
      error: () => {},
      warn: () => {},
      info: () => {},
    };
    next();
  });
  app.use(express.json());
  app.use(storageRouter);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const OBJECT_URL = () => `${baseUrl}/storage/public-objects/video.webm`;

describe("storage proxy Range support", () => {
  test("a no-Range request returns 200 with Accept-Ranges and full Content-Length", async () => {
    const res = await fetch(OBJECT_URL());

    expect(res.status).toBe(200);
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("content-length")).toBe(String(FAKE.buf.length));
    expect(res.headers.get("content-type")).toBe(FAKE.contentType);

    const body = Buffer.from(await res.arrayBuffer());
    expect(body.length).toBe(FAKE.buf.length);
    expect(body.equals(FAKE.buf)).toBe(true);
  });

  test("a Range request returns 206 with correct Content-Range, Content-Length and matching bytes", async () => {
    const res = await fetch(OBJECT_URL(), {
      headers: { Range: "bytes=0-1023" },
    });

    expect(res.status).toBe(206);
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("content-range")).toBe(
      `bytes 0-1023/${FAKE.buf.length}`,
    );
    expect(res.headers.get("content-length")).toBe("1024");

    const body = Buffer.from(await res.arrayBuffer());
    expect(body.length).toBe(1024);
    expect(body.equals(FAKE.buf.subarray(0, 1024))).toBe(true);
  });

  test("a mid-file Range returns exactly the requested slice", async () => {
    const res = await fetch(OBJECT_URL(), {
      headers: { Range: "bytes=1000-1099" },
    });

    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe(
      `bytes 1000-1099/${FAKE.buf.length}`,
    );
    expect(res.headers.get("content-length")).toBe("100");

    const body = Buffer.from(await res.arrayBuffer());
    expect(body.equals(FAKE.buf.subarray(1000, 1100))).toBe(true);
  });

  test("an out-of-range request returns 416 with Content-Range: bytes */<size>", async () => {
    const res = await fetch(OBJECT_URL(), {
      headers: { Range: "bytes=99999-100000" },
    });

    expect(res.status).toBe(416);
    expect(res.headers.get("content-range")).toBe(`bytes */${FAKE.buf.length}`);
    expect(res.headers.get("accept-ranges")).toBe("bytes");
  });
});

describe("resumable upload session endpoint", () => {
  const RESUMABLE_URL = () => `${baseUrl}/storage/uploads/resumable`;

  test("returns a session URL and a normalized /objects path", async () => {
    const res = await fetch(RESUMABLE_URL(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://app.test" },
      body: JSON.stringify({
        name: "big.webm",
        size: 500_000_000,
        contentType: "video/webm",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { sessionUrl: string; objectPath: string };

    // The session URL is what the client PUTs chunks to, and the origin +
    // content type must be forwarded into the storage session.
    const session = new URL(body.sessionUrl);
    expect(session.searchParams.get("upload_id")).toBe("fake-upload-id");
    expect(session.searchParams.get("origin")).toBe("https://app.test");
    expect(session.searchParams.get("contentType")).toBe("video/webm");

    // The object path is normalized to the /objects/uploads/<id> form the
    // recording row is keyed by — never a raw GCS URL.
    expect(body.objectPath).toMatch(/^\/objects\/uploads\//);
  });

  test("rejects a request missing required fields with 400", async () => {
    const res = await fetch(RESUMABLE_URL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "no-size.webm" }),
    });

    expect(res.status).toBe(400);
  });
});
