import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import recordingsRouter from "./recordings";
import versionRouter from "./version";
import renderRouter from "./render";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(recordingsRouter);
router.use(versionRouter);
router.use(renderRouter);

export default router;
