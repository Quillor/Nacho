import { Storage } from "@google-cloud/storage";

export const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

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

/**
 * TTL (seconds) for presigned PUT upload URLs. Large/slow uploads — several
 * hundred MB over a weak connection — must not outrun the signing window, so
 * this defaults to 6 hours instead of the old 15 minutes. Overridable with
 * `UPLOAD_URL_TTL_SEC` for tuning without a redeploy.
 */
const DEFAULT_UPLOAD_URL_TTL_SEC = 6 * 60 * 60;

export function uploadUrlTtlSec(): number {
  const raw = Number(process.env.UPLOAD_URL_TTL_SEC);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_UPLOAD_URL_TTL_SEC;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

/**
 * Thrown when a stored upload can't be confirmed complete: the object is
 * missing, empty, or smaller than the size the client said it uploaded. The
 * publish flow uses this to refuse creating a recording that would resolve to
 * truncated/missing media, so a failed upload never yields a dead share link.
 */
export class UploadIncompleteError extends Error {
  constructor(
    public readonly expectedSize: number | null,
    public readonly actualSize: number | null,
  ) {
    super("Uploaded object is missing or incomplete");
    this.name = "UploadIncompleteError";
    Object.setPrototypeOf(this, UploadIncompleteError.prototype);
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

/**
 * Build a cross-browser `Content-Disposition: attachment` header value.
 *
 * Includes both a sanitized ASCII `filename="..."` (for older clients and as a
 * fallback) and an RFC 5987 `filename*=UTF-8''...` (honored by Chrome, Safari
 * and Firefox). The ASCII fallback strips control chars plus the quote and
 * backslash that would otherwise break the quoted-string, so an unexpected
 * version string can never produce a malformed header.
 */
export function buildAttachmentDisposition(filename: string): string {
  const asciiFallback = filename
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

export function parseObjectPath(path: string): {
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

export async function signObjectURL({
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
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, ` +
        `make sure you're running on Replit`,
    );
  }

  const { signed_url: signedURL } = (await response.json()) as {
    signed_url: string;
  };
  return signedURL;
}
