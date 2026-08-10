// Signed direct-playback URLs. Split from recordings.routes so the request
// handlers stay under the file-size budget; mounted alongside them in router.ts.

import { Router, type IRouter } from "express";
import {
  GetRecordingPlaybackUrlParams,
  GetRecordingPlaybackUrlResponse,
} from "@workspace/api-zod";
import { authUserId } from "../../lib/dev-auth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "../../lib/object-storage";
import { getRecordingForViewer } from "./recordings.service";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/** TTL for signed direct-playback URLs (long enough to watch, short enough to
 * keep leaked URLs low-value). */
const PLAYBACK_URL_TTL_SEC = 3600;

router.get("/recordings/:shareId/play", async (req, res): Promise<void> => {
  const params = GetRecordingPlaybackUrlParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const row = await getRecordingForViewer(
    params.data.shareId,
    authUserId(req),
  );
  if (!row || !row.videoPath) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  try {
    const file = await objectStorageService.getObjectEntityFile(row.videoPath);
    // ?download=1 turns the signed URL into an attachment with a friendly
    // filename (extension derived from the stored content type), for the
    // "Download footage" flow.
    let downloadFilename: string | undefined;
    if (req.query.download === "1") {
      const [meta] = await file.getMetadata();
      const contentType = String(meta.contentType ?? "");
      const ext = contentType.includes("mp4") ? "mp4" : "webm";
      const safeTitle =
        row.title.replace(/[\\/:*?"<>|]/g, "").trim() || "recording";
      downloadFilename = `${safeTitle}.${ext}`;
    }
    const url = await objectStorageService.getObjectEntityDownloadURL(file, {
      ttlSec: PLAYBACK_URL_TTL_SEC,
      downloadFilename,
      logger: req.log,
    });
    res.json(
      GetRecordingPlaybackUrlResponse.parse({
        url,
        expiresInSec: PLAYBACK_URL_TTL_SEC,
      }),
    );
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }
    throw err;
  }
});

export default router;
