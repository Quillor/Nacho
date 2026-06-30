// Regression tests for the POST /recordings size-verification gate. A large or
// slow upload that lands truncated/missing must NOT mint a recording row (that's
// the original "published video won't play" bug). These drive the real Express
// route → verifyUploadedObject path, mocking only @google-cloud/storage (the
// stored object's existence + size) and the service layer (so no real DB is
// touched), and assert the gate returns 422 without persisting, vs 201 + a
// created row when the sizes match.
import {
  describe,
  test,
  beforeEach,
  beforeAll,
  afterAll,
  expect,
  vi,
} from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

// Mutable storage state the fake bucket reflects (per request).
const STATE = vi.hoisted(() => ({
  exists: true,
  size: 1000 as number | null,
}));

vi.mock("@google-cloud/storage", () => {
  class File {
    name: string;
    bucket: { name: string };
    constructor(bucketName: string, name: string) {
      this.name = name;
      this.bucket = { name: bucketName };
    }
    async exists() {
      return [STATE.exists];
    }
    async getMetadata() {
      return [
        {
          size: STATE.size == null ? undefined : String(STATE.size),
          metadata: {},
        },
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

// Always authenticate as a fixed user, so the gate (not auth) is what's tested.
vi.mock("../../lib/dev-auth", () => ({
  authUserId: () => "user_test",
}));

// Stub the service layer so the route never imports @workspace/db (which throws
// without DATABASE_URL) and so we can assert whether a row was created.
const createRecording = vi.hoisted(() => vi.fn());
vi.mock("./recordings.service", () => ({
  createRecording,
  // The route does GetRecordingResponse.parse(toApi(row)); have createRecording
  // return an already-API-shaped object and keep toApi an identity passthrough.
  toApi: (row: unknown) => row,
}));

process.env.PRIVATE_OBJECT_DIR = "/test-bucket/private";

const VALID_API_ROW = {
  shareId: "share123",
  title: "Big upload",
  description: "",
  visibility: "private" as const,
  durationSec: 12,
  trimStart: 0,
  trimEnd: 12,
  hasAudio: true,
  videoPath: "/objects/uploads/abc",
  thumbnailPath: null,
  gifPath: null,
  selfieCorner: null,
  chapters: [],
  displayChaptersOnVideo: false,
  notifyOnView: false,
  transcript: [],
  views: 0,
  createdAt: new Date().toISOString(),
};

const VALID_BODY = {
  title: "Big upload",
  durationSec: 12,
  trimStart: 0,
  trimEnd: 12,
  videoPath: "/objects/uploads/abc",
  videoSize: 1000,
};

let baseUrl = "";
let server: Server;

beforeAll(async () => {
  const express = (await import("express")).default;
  const recordingsRouter = (await import("./recordings.routes")).default;

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as unknown as { log: unknown }).log = {
      error: () => {},
      warn: () => {},
      info: () => {},
    };
    next();
  });
  app.use(recordingsRouter);

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

beforeEach(() => {
  STATE.exists = true;
  STATE.size = 1000;
  createRecording.mockReset();
  createRecording.mockResolvedValue(VALID_API_ROW);
});

function postRecording(body: unknown): Promise<Response> {
  return fetch(`${baseUrl}/recordings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /recordings size-verification gate", () => {
  test("returns 201 and creates a row when the stored size matches", async () => {
    STATE.size = 1000;

    const res = await postRecording(VALID_BODY);

    expect(res.status).toBe(201);
    const json = (await res.json()) as { shareId: string };
    expect(json.shareId).toBe("share123");
    expect(createRecording).toHaveBeenCalledTimes(1);
  });

  test("returns 422 and creates no row when the stored object is missing", async () => {
    STATE.exists = false;

    const res = await postRecording(VALID_BODY);

    expect(res.status).toBe(422);
    expect(createRecording).not.toHaveBeenCalled();
  });

  test("returns 422 and creates no row when the stored object is smaller than declared", async () => {
    STATE.size = 600;

    const res = await postRecording(VALID_BODY);

    expect(res.status).toBe(422);
    expect(createRecording).not.toHaveBeenCalled();
  });
});
