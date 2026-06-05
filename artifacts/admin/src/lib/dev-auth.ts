// Dev-only auth bypass ("testing mode") for the Nacho Admin console.
//
// The bypass is hard-gated behind a development build (import.meta.env.DEV).
// Vite statically replaces import.meta.env.DEV with false in production builds,
// so every branch below folds to the inert path and is dead-code eliminated —
// there is no way to switch testing mode on in production. The server enforces
// its own gate (requireSuperAdmin); this flag only affects the client UI.
//
// State is read at runtime so an in-app toggle (on the sign-in page) can flip it
// without env vars or restarts. Resolution order:
//   1. a persisted localStorage flag (set by the toggle), if present
//   2. otherwise the build-time VITE_DEV_AUTH_BYPASS env var (legacy default)
// Flipping the toggle also writes a same-origin cookie the API server reads so
// the frontend gate and the server gate stay in lockstep.

const STORAGE_KEY = "nacho_dev_bypass";
// Must match COOKIE_NAME in api-server/src/lib/devAuth.ts.
const COOKIE_NAME = "nacho_dev_bypass";

// Legacy/default: the original build-time env var. Only meaningful in a dev build.
const ENV_DEFAULT =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

// Display-only stand-in shown in the sidebar while the bypass is on and there
// is no real Clerk session.
export const DEV_USER = {
  displayName: "Dev Super Admin",
  email: "dev-admin@nacho.test",
};

function readPersisted(): boolean | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {
    /* localStorage may be unavailable; fall back to the env default */
  }
  return null;
}

// Tri-state cookie ("1" on, "0" off, absent → env default) mirrors the server's
// resolution so an explicit OFF overrides an env var that defaults ON.
function writeCookie(enabled: boolean | null): void {
  if (enabled === null) {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${COOKIE_NAME}=${enabled ? "1" : "0"}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Whether testing mode (auth bypass) is currently active. Always false in a
 * production build.
 */
export function isDevAuthBypassEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  const persisted = readPersisted();
  return persisted ?? ENV_DEFAULT;
}

/**
 * Persist the testing-mode flag and mirror it into the server-read cookie. No-op
 * in production. Callers should refresh the app (navigate/reload) afterward so
 * route gates and the banner re-evaluate.
 */
export function setDevAuthBypass(enabled: boolean): void {
  if (!import.meta.env.DEV) return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore persistence failures in dev */
  }
  writeCookie(enabled);
}

// Keep the server-read cookie in sync with the resolved state on every load, so
// the API server honors the bypass even on a fresh session (e.g. env default on,
// or a persisted flag with no cookie yet).
if (import.meta.env.DEV) {
  writeCookie(isDevAuthBypassEnabled());
}
