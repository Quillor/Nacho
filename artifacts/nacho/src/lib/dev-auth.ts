// Dev-only auth bypass for the Nacho user app. Honored only in a development
// build (import.meta.env.DEV) AND when VITE_DEV_AUTH_BYPASS === "true". Vite
// statically replaces import.meta.env.DEV with false in production builds, so
// this constant folds to false and every bypass branch is dead-code eliminated.
export const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

// Display-only stand-in shown while the bypass is on and there is no real Clerk
// session. Account-editing surfaces stay guarded on the real user, so this is
// never used to make Clerk API calls.
export const DEV_USER = {
  displayName: "Dev User",
  email: "dev-user@nacho.test",
};
