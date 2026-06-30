import { File } from "@google-cloud/storage";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./object-acl";
import {
  objectStorageClient,
  uploadUrlTtlSec,
  ObjectNotFoundError,
  UploadIncompleteError,
  RangeNotSatisfiableError,
  parseByteRange,
  buildAttachmentDisposition,
  parseObjectPath,
  signObjectURL,
  type ObjectDownload,
} from "./object-storage-internals";

// Re-export the storage primitives so existing importers of this module keep
// working after the lower-level helpers moved to ./object-storage-internals.
export {
  objectStorageClient,
  ObjectNotFoundError,
  UploadIncompleteError,
  RangeNotSatisfiableError,
  parseByteRange,
};
export type { ObjectDownload };

export class ObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  /**
   * Stream a stored object, optionally honoring an HTTP `Range` header so HTML5
   * `<video>` playback can start and seek (Safari/iOS require byte-range
   * support). When `rangeHeader` resolves to a valid range, only those bytes are
   * streamed and `partial` is `true` (caller responds `206`); otherwise the full
   * object is streamed (caller responds `200`). Throws
   * {@link RangeNotSatisfiableError} when the range is well-formed but can't be
   * satisfied (caller responds `416`).
   */
  async downloadObject(
    file: File,
    opts: { cacheTtlSec?: number; rangeHeader?: string | null } = {},
  ): Promise<ObjectDownload> {
    const { cacheTtlSec = 3600, rangeHeader } = opts;
    const [metadata] = await file.getMetadata();
    const aclPolicy = await getObjectAclPolicy(file);
    const isPublic = aclPolicy?.visibility === "public";

    const contentType =
      (metadata.contentType as string) || "application/octet-stream";
    const cacheControl = `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`;
    const totalSize =
      metadata.size != null ? Number(metadata.size) : null;

    const range = parseByteRange(rangeHeader, totalSize);
    if (range === "unsatisfiable") {
      throw new RangeNotSatisfiableError(totalSize);
    }

    if (range) {
      const nodeStream = file.createReadStream({
        start: range.start,
        end: range.end,
      });
      const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
      return {
        body: webStream,
        contentType,
        cacheControl,
        totalSize,
        partial: true,
        start: range.start,
        end: range.end,
        contentLength: range.end - range.start + 1,
      };
    }

    const nodeStream = file.createReadStream();
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    return {
      body: webStream,
      contentType,
      cacheControl,
      totalSize,
      partial: false,
      start: 0,
      end: totalSize != null ? Math.max(totalSize - 1, 0) : 0,
      contentLength: totalSize,
    };
  }

  /**
   * Sign a short-lived GET URL for a stored object so the client can download
   * it directly from object storage (instead of proxying the bytes through the
   * app server).
   *
   * When `downloadFilename` is provided, the object's content-disposition
   * metadata is (re)set so the browser saves it under a friendly name. The
   * Replit object-storage signer does NOT support a per-request
   * `response-content-disposition` override (appending one to the signed URL
   * breaks the GCS V4 signature), so the save name has to be baked into the
   * stored metadata. We re-sync it on every download — and key it off the
   * caller-supplied filename (derived from the published version) — so the
   * saved name can never drift from the current release.
   *
   * Syncing is best-effort: a transient metadata read/write hiccup must not
   * break the user's download, so we log and fall through to whatever
   * disposition is currently stored on the object.
   */
  async getObjectEntityDownloadURL(
    file: File,
    opts: {
      ttlSec?: number;
      downloadFilename?: string;
      logger?: { warn: (obj: unknown, msg: string) => void };
    } = {},
  ): Promise<string> {
    const { ttlSec = 900, downloadFilename, logger } = opts;

    if (downloadFilename) {
      const contentDisposition = buildAttachmentDisposition(downloadFilename);
      try {
        const [metadata] = await file.getMetadata();
        if (metadata.contentDisposition !== contentDisposition) {
          await file.setMetadata({ contentDisposition });
        }
      } catch (err) {
        logger?.warn(
          { err, downloadFilename },
          "Failed to sync download content-disposition metadata; " +
            "serving with the disposition currently stored on the object",
        );
      }
    }

    return signObjectURL({
      bucketName: file.bucket.name,
      objectName: file.name,
      method: "GET",
      ttlSec,
    });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);

    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: uploadUrlTtlSec(),
    });
  }

  /**
   * Start a GCS resumable upload session for a large object and return the
   * session URL the client uploads to (PUT chunks with a `Content-Range`
   * header) plus the normalized `/objects/...` path the recording will be keyed
   * by. Unlike a single presigned PUT, a resumable session lets an interrupted
   * transfer pick up from the last committed byte instead of restarting from
   * zero — what makes very large recordings reliable on flaky connections.
   *
   * `origin` is the browser origin requesting the upload; GCS records it on the
   * session so the cross-origin chunk PUTs from the page are allowed. The
   * session URL is self-authenticating (it carries an upload id), so the client
   * never needs further credentials to push chunks.
   */
  async createResumableUploadSession(opts: {
    contentType?: string;
    origin?: string;
  } = {}): Promise<{ sessionUrl: string; objectPath: string }> {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [sessionUrl] = await file.createResumableUpload({
      origin: opts.origin,
      metadata: opts.contentType ? { contentType: opts.contentType } : undefined,
    });

    const objectPath = this.normalizeObjectEntityPath(
      `https://storage.googleapis.com/${bucketName}/${objectName}`,
    );

    return { sessionUrl, objectPath };
  }

  /**
   * Confirm a just-uploaded object is fully present in storage before we let it
   * back a published recording. Throws {@link ObjectNotFoundError} when the
   * object is missing and {@link UploadIncompleteError} when it's empty or
   * smaller than `expectedSize` (a truncated/aborted PUT). When `expectedSize`
   * is omitted we still reject a zero-byte object. This is the gate that keeps a
   * failed upload from producing a share link to incomplete media.
   */
  async verifyUploadedObject(
    objectPath: string,
    expectedSize?: number | null,
  ): Promise<void> {
    const file = await this.getObjectEntityFile(objectPath);
    const [metadata] = await file.getMetadata();
    const actualSize = metadata.size != null ? Number(metadata.size) : null;

    if (actualSize == null || actualSize <= 0) {
      throw new UploadIncompleteError(expectedSize ?? null, actualSize);
    }
    if (
      expectedSize != null &&
      expectedSize > 0 &&
      actualSize !== expectedSize
    ) {
      throw new UploadIncompleteError(expectedSize, actualSize);
    }
  }

  async getObjectEntityFile(objectPath: string): Promise<File> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }

    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) {
      entityDir = `${entityDir}/`;
    }
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const bucket = objectStorageClient.bucket(bucketName);
    const objectFile = bucket.file(objectName);
    const [exists] = await objectFile.exists();
    if (!exists) {
      throw new ObjectNotFoundError();
    }
    return objectFile;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) {
      return normalizedPath;
    }

    const objectFile = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: File;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}
