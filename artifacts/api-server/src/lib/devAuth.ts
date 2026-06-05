import type { Request } from "express";
import { getAuth } from "@clerk/express";

// Dev-only auth bypass ("testing mode"). Honored only OUTSIDE production. The
// production gate below makes every code path here inert when NODE_ENV is
// "production", regardless of any cookie or env var.
//
// Per-request resolution (dev only):
//   1. a dev-only cookie set same-origin by the frontend toggle, if present
//      ("1" → on, "0" → off; an explicit "0" overrides an env default of ON)
//   2. otherwise the legacy DEV_AUTH_BYPASS env var
const COOKIE_NAME = "nacho_dev_bypass";

// Legacy/default env var. Read once at module load.
const ENV_DEFAULT = process.env.DEV_AUTH_BYPASS === "true";

// Fixed identity attributed to all requests while the bypass is on. Recordings
// created during testing are owned by this id so owner-scoped reads/writes work.
export const DEV_USER_ID = "user_dev_bypass";

// Tri-state read of the dev cookie: true ("1"), false ("0"), or null (absent).
function readBypassCookie(req: Request): boolean | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== COOKIE_NAME) continue;
    const value = part.slice(eq + 1).trim();
    if (value === "1") return true;
    if (value === "0") return false;
    return null;
  }
  return null;
}

/**
 * Whether this request should bypass authentication. Always false in
 * production; in development, honors the dev cookie, falling back to the env
 * var default.
 */
export function isDevAuthBypass(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const cookie = readBypassCookie(req);
  if (cookie !== null) return cookie;
  return ENV_DEFAULT;
}

// Resolve the acting user id for a request. With the bypass on, returns the
// fixed dev user without consulting Clerk; otherwise reads the verified Clerk
// session. Returns null when there is no authenticated user.
export function authUserId(req: Request): string | null {
  if (isDevAuthBypass(req)) return DEV_USER_ID;
  return getAuth(req).userId ?? null;
}
