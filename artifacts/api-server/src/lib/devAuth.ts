import type { Request } from "express";
import { getAuth } from "@clerk/express";

// Dev-only auth bypass. Honored only outside production AND when the explicit
// DEV_AUTH_BYPASS flag is set to "true". In a production build NODE_ENV is
// "production", so this is always false and the bypass code path is inert.
export const DEV_AUTH_BYPASS =
  process.env.NODE_ENV !== "production" &&
  process.env.DEV_AUTH_BYPASS === "true";

// Fixed identity attributed to all requests while the bypass is on. Recordings
// created during testing are owned by this id so owner-scoped reads/writes work.
export const DEV_USER_ID = "user_dev_bypass";

// Resolve the acting user id for a request. With the bypass on, returns the
// fixed dev user without consulting Clerk; otherwise reads the verified Clerk
// session. Returns null when there is no authenticated user.
export function authUserId(req: Request): string | null {
  if (DEV_AUTH_BYPASS) return DEV_USER_ID;
  return getAuth(req).userId ?? null;
}
