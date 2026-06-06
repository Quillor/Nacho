import { Router, type IRouter } from "express";
import { getSummary } from "./summary.service";

const router: IRouter = Router();

router.get("/admin/summary", async (_req, res): Promise<void> => {
  res.json(await getSummary());
});

export default router;
