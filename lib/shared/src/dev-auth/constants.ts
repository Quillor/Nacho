// Shared dev-auth ("testing mode") constants.
//
// Browser-free on purpose: this module uses no DOM / import.meta APIs so the
// API server (Node/esbuild) can import the same values the browser apps use.
// Keeping these in one place stops the cookie name and dev user id from
// drifting between the Nacho app, the Admin app, and the server gate.

// localStorage key the in-app toggle persists the bypass flag under.
export const STORAGE_KEY = "nacho_dev_bypass";

// Same-origin cookie name the API server reads to honor the bypass. Must stay
// in lockstep across all three consumers — that's why it lives here.
export const COOKIE_NAME = "nacho_dev_bypass";

// Fixed identity attributed to all requests while the bypass is on, so
// owner-scoped reads/writes work during testing.
export const DEV_USER_ID = "user_dev_bypass";
