import { Router, type IRouter } from "express";
import {
  SetUserRoleParams,
  SetUserRoleBody,
  SetUserGroupsParams,
  SetUserGroupsBody,
  ImpersonateUserParams,
  GetAdminUserParams,
} from "@workspace/api-zod";
import { authUserId } from "../../lib/dev-auth";
import {
  listUsers,
  getUserDetail,
  setUserRole,
  setUserGroups,
  impersonateUser,
} from "./users.service";

const router: IRouter = Router();

router.get("/admin/users", async (_req, res): Promise<void> => {
  res.json(await listUsers());
});

router.get("/admin/users/:userId", async (req, res): Promise<void> => {
  const params = GetAdminUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    res.json(await getUserDetail(params.data.userId));
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

router.patch("/admin/users/:userId/role", async (req, res): Promise<void> => {
  const params = SetUserRoleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SetUserRoleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const result = await setUserRole(params.data.userId, body.data.role);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(result.data);
});

router.put("/admin/users/:userId/groups", async (req, res): Promise<void> => {
  const params = SetUserGroupsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SetUserGroupsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const result = await setUserGroups(params.data.userId, body.data.groupIds);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return;
  }
  res.json(result.data);
});

router.post(
  "/admin/users/:userId/impersonate",
  async (req, res): Promise<void> => {
    const params = ImpersonateUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const adminId = authUserId(req);
    if (!adminId) {
      res.status(401).json({ error: "Sign in to impersonate" });
      return;
    }

    const result = await impersonateUser(
      params.data.userId,
      adminId,
      req.log,
    );
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ token: result.token, ticketUrl: result.ticketUrl });
  },
);

export default router;
