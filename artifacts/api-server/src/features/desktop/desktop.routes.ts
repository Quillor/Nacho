import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { GetDesktopReleaseResponse } from "@workspace/api-zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "../../lib/object-storage";
import { loadDesktopRelease, getDesktopReleaseObjectPath } from "./desktop.service";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

// Public: latest desktop release metadata for the download page + the in-app
// update check. Returns nulls when no release has been published yet.
router.get("/desktop/release", async (_req, res): Promise<void> => {
  res.json(GetDesktopReleaseResponse.parse(await loadDesktopRelease()));
});

// Public: stream the current .dmg with a friendly filename so the browser saves
// it as "Nacho-<version>.dmg". 404s when no release has been published.
router.get("/desktop/download", async (req: Request, res: Response): Promise<void> => {
  try {
    const release = await getDesktopReleaseObjectPath();
    if (!release) {
      res.status(404).json({ error: "No desktop release available" });
      return;
    }

    const file = await objectStorageService.getObjectEntityFile(
      release.objectPath,
    );
    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("Content-Type", "application/x-apple-diskimage");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Nacho-${release.version}.dmg"`,
    );

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Desktop release object not found");
      res.status(404).json({ error: "Desktop release file not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving desktop release");
    res.status(500).json({ error: "Failed to serve desktop release" });
  }
});

export default router;
