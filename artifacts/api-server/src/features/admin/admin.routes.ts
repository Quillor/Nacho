// Aggregates the super-admin console sub-routers. The require-super-admin gate
// is applied separately (in router.ts via `router.use("/admin", ...)`) before
// these mount, so every route here is already authorized. Sub-router order
// matches the original single-file admin router.

import { Router, type IRouter } from "express";
import summaryRoutes from "./summary.routes";
import usersRoutes from "./users.routes";
import groupsRoutes from "./groups.routes";
import notificationsRoutes from "./notifications.routes";
import tosRoutes from "./tos.routes";
import desktopReleaseRoutes from "./desktop-release.routes";

const router: IRouter = Router();

router.use(summaryRoutes);
router.use(usersRoutes);
router.use(groupsRoutes);
router.use(notificationsRoutes);
router.use(tosRoutes);
router.use(desktopReleaseRoutes);

export default router;
