import { Router, type IRouter } from "express";
import { fetchImageAsset, renderPage } from "./render.service";

const router: IRouter = Router();

router.get("/asset", async (req, res) => {
  const target = typeof req.query.url === "string" ? req.query.url : "";
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    res.status(400).json({ error: "Only http(s) URLs are allowed" });
    return;
  }
  try {
    const { mime, body } = await fetchImageAsset(url);
    res.setHeader("content-type", mime);
    res.setHeader("cache-control", "public, max-age=3600");
    res.send(body);
  } catch (e) {
    req.log.warn({ err: (e as Error).message }, "asset fetch failed");
    res.status(502).json({ error: (e as Error).message });
  }
});

router.get("/render", async (req, res) => {
  const target = typeof req.query.url === "string" ? req.query.url : "";
  let current: URL;
  try {
    current = new URL(target);
  } catch {
    res.status(400).json({ error: "Invalid url" });
    return;
  }
  if (current.protocol !== "http:" && current.protocol !== "https:") {
    res.status(400).json({ error: "Only http(s) URLs are allowed" });
    return;
  }

  const widthParam =
    typeof req.query.w === "string" ? parseInt(req.query.w, 10) : NaN;
  const viewportWidth =
    Number.isFinite(widthParam) && widthParam >= 320 && widthParam <= 3840
      ? widthParam
      : 1440;

  try {
    const result = await renderPage(current, viewportWidth, req.log);
    res.json(result);
  } catch (e) {
    req.log.warn({ err: (e as Error).message }, "page render failed");
    res.status(502).json({ error: (e as Error).message });
  }
});

export default router;
