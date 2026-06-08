import { Router, type IRouter } from "express";
import { UpdateDesktopReleaseBody } from "@workspace/api-zod";
import {
  loadDesktopRelease,
  saveDesktopRelease,
} from "../desktop/desktop.service";

const router: IRouter = Router();

// Read the current release in the admin console (same projection as the public
// endpoint) so the editor can pre-fill version/notes.
router.get("/admin/desktop/release", async (_req, res): Promise<void> => {
  res.json(await loadDesktopRelease());
});

// Set/replace the latest desktop release. The .dmg is uploaded separately via
// the presigned-upload flow; this stores its object path + metadata.
router.put("/admin/desktop/release", async (req, res): Promise<void> => {
  const body = UpdateDesktopReleaseBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  res.json(await saveDesktopRelease(body.data));
});

export default router;
