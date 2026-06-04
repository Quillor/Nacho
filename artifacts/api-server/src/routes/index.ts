import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import recordingsRouter from "./recordings";
import versionRouter from "./version";
import renderRouter from "./render";
import adminRouter from "./admin";
import contentRouter from "./content";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(recordingsRouter);
router.use(versionRouter);
router.use(renderRouter);
router.use(contentRouter);
router.use("/admin", requireSuperAdmin);
router.use(adminRouter);

export default router;
