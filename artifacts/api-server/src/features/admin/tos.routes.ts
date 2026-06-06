import { Router, type IRouter } from "express";
import { UpdateTosBody } from "@workspace/api-zod";
import { loadTos, saveTos } from "./tos.service";

const router: IRouter = Router();

router.get("/admin/content/tos", async (_req, res): Promise<void> => {
  res.json(await loadTos());
});

router.put("/admin/content/tos", async (req, res): Promise<void> => {
  const body = UpdateTosBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  res.json(await saveTos(body.data.content));
});

export default router;
