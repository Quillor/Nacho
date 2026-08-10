import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { File } from "@google-cloud/storage";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
  RequestResumableUploadBody,
  RequestResumableUploadResponse,
} from "@workspace/api-zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
  RangeNotSatisfiableError,
} from "../../lib/object-storage";
import { authUserId } from "../../lib/dev-auth";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * Safely pipe an object-storage web body to the Express response. Attaches an
 * `'error'` handler to the read stream and tears it down when the client
 * disconnects (`close`) so a broken transfer can never leave an unhandled
 * stream error that crashes the Node process / deployment instance.
 */
function pipeObjectBody(
  body: ReadableStream<Uint8Array> | null,
  req: Request,
  res: Response,
): void {
  if (!body) {
    res.end();
    return;
  }

  const nodeStream = Readable.fromWeb(body);

  res.on("close", () => {
    nodeStream.destroy();
  });

  nodeStream.on("error", (err) => {
    req.log.error({ err }, "Error streaming object to client");
    if (!res.headersSent) {
      res.status(500).end();
    } else {
      res.destroy();
    }
  });

  nodeStream.pipe(res);
}

/**
 * Stream a stored object to the client, honoring an HTTP `Range` request so
 * HTML5 `<video>` playback can start and seek. Responds `206 Partial Content`
 * with `Content-Range`/`Content-Length` for a valid range, `200` with the full
 * body otherwise, and `416` for an unsatisfiable range. Always advertises
 * `Accept-Ranges: bytes`.
 */
async function serveObject(file: File, req: Request, res: Response): Promise<void> {
  const rangeHeader = req.headers.range ?? null;

  let download;
  try {
    download = await objectStorageService.downloadObject(file, { rangeHeader });
  } catch (err) {
    if (err instanceof RangeNotSatisfiableError) {
      res.setHeader("Accept-Ranges", "bytes");
      if (err.totalSize != null) {
        res.setHeader("Content-Range", `bytes */${err.totalSize}`);
      }
      res.status(416).end();
      return;
    }
    throw err;
  }

  res.setHeader("Content-Type", download.contentType);
  res.setHeader("Cache-Control", download.cacheControl);
  res.setHeader("Accept-Ranges", "bytes");

  if (download.partial) {
    res.setHeader(
      "Content-Range",
      `bytes ${download.start}-${download.end}/${download.totalSize}`,
    );
    res.setHeader("Content-Length", String(download.contentLength));
    res.status(206);
  } else {
    if (download.contentLength != null) {
      res.setHeader("Content-Length", String(download.contentLength));
    }
    res.status(200);
  }

  pipeObjectBody(download.body, req, res);
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  // Only signed-in users may mint upload URLs into the bucket.
  if (!authUserId(req)) {
    res.status(401).json({ error: "Sign in to upload" });
    return;
  }

  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * POST /storage/uploads/resumable
 *
 * Start a resumable upload session for a large file. The client sends JSON
 * metadata (name, size, contentType) — NOT the file — and receives a session
 * URL it PUTs chunks to (with `Content-Range`). An interrupted transfer resumes
 * from the last committed byte instead of restarting from zero.
 */
router.post("/storage/uploads/resumable", async (req: Request, res: Response) => {
  // Only signed-in users may mint upload sessions into the bucket.
  if (!authUserId(req)) {
    res.status(401).json({ error: "Sign in to upload" });
    return;
  }

  const parsed = RequestResumableUploadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { contentType } = parsed.data;

    const { sessionUrl, objectPath } =
      await objectStorageService.createResumableUploadSession({
        contentType,
        origin: req.headers.origin,
      });

    res.json(RequestResumableUploadResponse.parse({ sessionUrl, objectPath }));
  } catch (error) {
    req.log.error({ err: error }, "Error starting resumable upload session");
    res
      .status(500)
      .json({ error: "Failed to start resumable upload session" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    await serveObject(file, req, res);
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

    await serveObject(objectFile, req, res);
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
