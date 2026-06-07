import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import { isDesktop } from "./desktop";

// Deployed Nacho backend URL (serves /api and /s). Baked at build time for the
// desktop app via VITE_DESKTOP_API_URL; empty on the web (same-origin calls).
export const DESKTOP_API_URL = (
  import.meta.env.VITE_DESKTOP_API_URL || ""
).replace(/\/+$/, "");

// Cloud upload + public sharing: always on the web; on desktop only when a
// backend URL is configured (otherwise recordings stay local-only).
export const cloudEnabled = !isDesktop || Boolean(DESKTOP_API_URL);

// Origin that serves /api and /s — the remote backend on desktop, same-origin
// (empty prefix) on the web.
export const apiOrigin = isDesktop && DESKTOP_API_URL ? DESKTOP_API_URL : "";

// The desktop auth provider registers a getter that returns a valid (refreshed)
// access token from the browser-handoff sign-in. Null when not signed in / web.
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setDesktopTokenGetter(
  fn: (() => Promise<string | null>) | null,
): void {
  tokenGetter = fn;
}

function getToken(): Promise<string | null> {
  return tokenGetter ? tokenGetter() : Promise.resolve(null);
}

/**
 * Point the generated API client (React Query hooks) at the backend with bearer
 * auth. Cross-origin desktop requests can't rely on the session cookie, so the
 * desktop access token is attached as `Authorization: Bearer`. No-op on the web.
 */
export function configureDesktopApi(): void {
  if (!isDesktop || !DESKTOP_API_URL) return;
  setBaseUrl(DESKTOP_API_URL);
  setAuthTokenGetter(() => getToken());
}

/** Prefix a relative API path with the backend origin on desktop. */
export function apiPath(path: string): string {
  return apiOrigin && path.startsWith("/") ? apiOrigin + path : path;
}

/** Bearer auth headers for raw (non-generated) fetches on desktop. */
export async function authHeaders(): Promise<Record<string, string>> {
  if (!isDesktop || !DESKTOP_API_URL) return {};
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
