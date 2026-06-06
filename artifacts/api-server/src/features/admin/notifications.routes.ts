import { Router, type IRouter } from "express";
import { SendNotificationBody } from "@workspace/api-zod";
import { sendNotification, listEmailPreviews } from "./notifications.service";

const router: IRouter = Router();

router.post("/admin/notifications", async (req, res): Promise<void> => {
  const body = SendNotificationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const result = await sendNotification(body.data);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(result.data);
});

router.get("/admin/emails", async (_req, res): Promise<void> => {
  res.json(listEmailPreviews());
});

export default router;
