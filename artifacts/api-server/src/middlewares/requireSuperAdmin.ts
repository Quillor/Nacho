import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { clerkClient, roleOf } from "../lib/clerk";
import { isDevAuthBypass } from "../lib/devAuth";

// Gate every /api/admin/* route on a verified super-admin. The frontend has its
// own gate, but that is UX only — authorization is enforced here on every call.
export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Dev-only bypass: treat the request as a super admin without consulting
  // Clerk. Short-circuits before any clerkClient.users.getUser lookup so it
  // works with no real session. Inert in production (see devAuth.ts).
  if (isDevAuthBypass(req)) {
    next();
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to access the admin console" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    if (roleOf(user) !== "super_admin") {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }
    next();
  } catch (err) {
    req.log.error({ err }, "Failed to verify super admin");
    res.status(403).json({ error: "Super admin access required" });
  }
}
