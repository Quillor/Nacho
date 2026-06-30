// Unit tests for verifyUploadedObject — the server-side gate that refuses to
// persist a recording whose video object didn't fully land in storage. It's the
// last line of defense against a truncated/aborted large upload minting a dead
// share link, and it has no other coverage, so these pin the missing/empty/
// size-mismatch/match cases. We mock only @google-cloud/storage (the lowest
// level) with an in-memory object whose existence + reported size each test
// controls.
import { describe, test, beforeEach, expect, vi } from "vitest";
import {
  ObjectNotFoundError,
  UploadIncompleteError,
} from "./object-storage-internals";

// Mutable state the fake bucket reflects. Declared via vi.hoisted so the
// (hoisted) vi.mock factory can close over it.
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

// getObjectEntityFile reads this lazily (per call), so setting it here is enough.
process.env.PRIVATE_OBJECT_DIR = "/test-bucket/private";

const OBJECT_PATH = "/objects/uploads/abc";

let service: import("./object-storage").ObjectStorageService;

beforeEach(async () => {
  const { ObjectStorageService } = await import("./object-storage");
  service = new ObjectStorageService();
  STATE.exists = true;
  STATE.size = 1000;
});

describe("verifyUploadedObject", () => {
  test("resolves when the stored size matches the declared size", async () => {
    STATE.size = 1000;
    await expect(
      service.verifyUploadedObject(OBJECT_PATH, 1000),
    ).resolves.toBeUndefined();
  });

  test("resolves when no size was declared and the object is non-empty", async () => {
    STATE.size = 4096;
    await expect(
      service.verifyUploadedObject(OBJECT_PATH),
    ).resolves.toBeUndefined();
  });

  test("throws ObjectNotFoundError when the object is missing", async () => {
    STATE.exists = false;
    await expect(
      service.verifyUploadedObject(OBJECT_PATH, 1000),
    ).rejects.toBeInstanceOf(ObjectNotFoundError);
  });

  test("throws UploadIncompleteError when the stored object is smaller than declared", async () => {
    STATE.size = 600;
    await expect(
      service.verifyUploadedObject(OBJECT_PATH, 1000),
    ).rejects.toBeInstanceOf(UploadIncompleteError);
  });

  test("throws UploadIncompleteError for a zero-byte object even without a declared size", async () => {
    STATE.size = 0;
    await expect(
      service.verifyUploadedObject(OBJECT_PATH),
    ).rejects.toBeInstanceOf(UploadIncompleteError);
  });

  test("throws UploadIncompleteError when storage reports no size", async () => {
    STATE.size = null;
    await expect(
      service.verifyUploadedObject(OBJECT_PATH, 1000),
    ).rejects.toBeInstanceOf(UploadIncompleteError);
  });
});
