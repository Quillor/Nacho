import { Router, type IRouter } from "express";
import { getPublicTos } from "./content.service";

const router: IRouter = Router();

// Public, unauthenticated terms of service for the marketing site and the
// signup consent gate.
router.get("/tos", async (_req, res): Promise<void> => {
  res.json(await getPublicTos());
});

export default router;
