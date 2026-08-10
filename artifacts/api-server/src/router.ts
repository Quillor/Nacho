// Aggregates every feature router mounted under /api. Mount order and the
// require-super-admin gate on /admin are preserved exactly from the original
// routes/index.ts — health, storage, recordings, version, render, content,
// then the admin gate, then the admin sub-routers.

import { Router, type IRouter } from "express";
import healthRouter from "./features/health/health.routes";
import storageRouter from "./features/storage/storage.routes";
import recordingsRouter from "./features/recordings/recordings.routes";
import playbackRouter from "./features/recordings/playback.routes";
import commentsRouter from "./features/comments/comments.routes";
import desktopAuthRouter from "./features/desktop-auth/desktop-auth.routes";
import versionRouter from "./features/version/version.routes";
import renderRouter from "./features/render/render.routes";
import contentRouter from "./features/content/content.routes";
import desktopRouter from "./features/desktop/desktop.routes";
import adminRouter from "./features/admin/admin.routes";
import { requireSuperAdmin } from "./middlewares/require-super-admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(recordingsRouter);
router.use(playbackRouter);
router.use(commentsRouter);
router.use(desktopAuthRouter);
router.use(versionRouter);
router.use(renderRouter);
router.use(contentRouter);
router.use(desktopRouter);
router.use("/admin", requireSuperAdmin);
router.use(adminRouter);

export default router;
