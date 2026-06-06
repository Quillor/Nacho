import { Router, type IRouter } from "express";
import {
  CreateGroupBody,
  UpdateGroupParams,
  UpdateGroupBody,
  DeleteGroupParams,
} from "@workspace/api-zod";
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "./groups.service";

const router: IRouter = Router();

router.get("/admin/groups", async (_req, res): Promise<void> => {
  res.json(await listGroups());
});

router.post("/admin/groups", async (req, res): Promise<void> => {
  const body = CreateGroupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const result = await createGroup(body.data.name, body.data.description);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.status(201).json(result.data);
});

router.patch("/admin/groups/:groupId", async (req, res): Promise<void> => {
  const params = UpdateGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateGroupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const result = await updateGroup(Number(params.data.groupId), {
    name: body.data.name,
    description: body.data.description,
  });
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(result.data);
});

router.delete("/admin/groups/:groupId", async (req, res): Promise<void> => {
  const params = DeleteGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const deleted = await deleteGroup(Number(params.data.groupId));
  if (!deleted) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.status(204).end();
});

export default router;
