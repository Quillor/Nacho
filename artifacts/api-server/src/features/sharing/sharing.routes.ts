import { Router, type IRouter } from "express";
import { buildSharePage } from "./sharing.service";

const router: IRouter = Router();

/**
 * GET /s/:shareId
 *
 * Server-rendered share page that emits Open Graph meta tags so links unfurl
 * in chat apps, then redirects humans to the rich SPA public view. Crawlers do
 * not run JS, so they read the OG tags; browsers follow the redirect.
 */
router.get("/s/:shareId", async (req, res): Promise<void> => {
  const raw = req.params.shareId;
  const shareId = Array.isArray(raw) ? raw[0] : raw;

  const origin = `${req.protocol}://${req.get("host")}`;
  const html = await buildSharePage(shareId, origin);

  if (html === null) {
    res.status(404).send("Recording not found");
    return;
  }

  res.set("Content-Type", "text/html; charset=utf-8").send(html);
});

export default router;
