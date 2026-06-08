import { Router, type IRouter, type Request, type Response } from "express";
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

    // Redirect to a short-lived signed GET URL so the .dmg is downloaded
    // directly from object storage. Proxying the whole binary through Express
    // (with `stream.pipe(res)`) crashed the deployment instance whenever the
    // transfer broke mid-flight; redirecting offloads the bytes entirely.
    const downloadUrl = await objectStorageService.getObjectEntityDownloadURL(
      file,
      { ttlSec: 900, downloadFilename: `Nacho-${release.version}.dmg` },
    );

    res.redirect(302, downloadUrl);
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
