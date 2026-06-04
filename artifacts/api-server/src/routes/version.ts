import { Router, type IRouter } from "express";
import { GetVersionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

export const APP_VERSION = "1.0.0";
export const APP_RELEASE_DATE = "2026-06-04";

router.get("/version", (_req, res): void => {
  res.json(
    GetVersionResponse.parse({
      version: APP_VERSION,
      releaseDate: APP_RELEASE_DATE,
    }),
  );
});

export default router;
