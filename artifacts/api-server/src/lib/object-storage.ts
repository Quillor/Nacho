import { Storage, File } from "@google-cloud/storage";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import {
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./object-acl";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * Thrown when a client sends a `Range` header that can't be satisfied for the
 * requested object (e.g. the start offset is past the end of the file). The
 * caller should respond with `416 Range Not Satisfiable` and a
 * `Content-Range: bytes *\/<totalSize>` header.
 */
export class RangeNotSatisfiableError extends Error {
  totalSize: number | null;
  constructor(totalSize: number | null) {
    super("Requested range not satisfiable");
    this.name = "RangeNotSatisfiableError";
    this.totalSize = totalSize;
    Object.setPrototypeOf(this, RangeNotSatisfiableError.prototype);
  }
}

/**
 * Result of {@link ObjectStorageService.downloadObject}: a readable web stream
 * of the object bytes plus the metadata an HTTP handler needs to build a
 * correct `200` or `206 Partial Content` response.
 */
export interface ObjectDownload {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  cacheControl: string;
  /** Total size of the object in bytes, or `null` when storage didn't report it. */
  totalSize: number | null;
  /** `true` when only a requested byte range is being streamed (HTTP 206). */
  partial: boolean;
  /** First byte offset being streamed (inclusive). */
  start: number;
  /** Last byte offset being streamed (inclusive). */
  end: number;
  /** Number of bytes being streamed, or `null` when the total size is unknown. */
  contentLength: number | null;
}

/**
 * Parse a single-range HTTP `Range` header value against a known total size.
 * Returns the resolved inclusive `{ start, end }` byte offsets, `null` when
 * there's no usable range (no header, size unknown, or a form we don't
 * support — caller should serve the full object), or the string
 * `"unsatisfiable"` when the range is well-formed but can't be satisfied.
 *
 * Only a single `bytes=start-end` range is supported (including open-ended
 * `bytes=start-` and suffix `bytes=-N`); multi-range requests are ignored and
 * fall back to a full response.
 */
export function parseByteRange(
  rangeHeader: string | null | undefined,
  totalSize: number | null,
): { start: number; end: number } | "unsatisfiable" | null {
  if (!rangeHeader || totalSize == null || totalSize <= 0) {
    return null;
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) {
    return null;
  }
  const [, startStr, endStr] = match;
  if (startStr === "" && endStr === "") {
    return null;
  }

  let start: number;
  let end: number;
  if (startStr === "") {
    // Suffix range: the final N bytes of the object.
    const suffix = Number(endStr);
    if (suffix === 0) {
      return "unsatisfiable";
    }
    start = Math.max(totalSize - suffix, 0);
    end = totalSize - 1;
  } else {
    start = Number(startStr);
    end = endStr === "" ? totalSize - 1 : Number(endStr);
    if (end >= totalSize) {
      end = totalSize - 1;
    }
  }

  if (start > end || start >= totalSize || start < 0) {
    return "unsatisfiable";
  }
  return { start, end };
}

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
      ttlSec: 900,
    });
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

/**
 * Build a cross-browser `Content-Disposition: attachment` header value.
 *
 * Includes both a sanitized ASCII `filename="..."` (for older clients and as a
 * fallback) and an RFC 5987 `filename*=UTF-8''...` (honored by Chrome, Safari
 * and Firefox). The ASCII fallback strips control chars plus the quote and
 * backslash that would otherwise break the quoted-string, so an unexpected
 * version string can never produce a malformed header.
 */
function buildAttachmentDisposition(filename: string): string {
  const asciiFallback = filename
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`
    );
  }

  const { signed_url: signedURL } = (await response.json()) as {
    signed_url: string;
  };
  return signedURL;
}
