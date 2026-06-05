// Dev-only auth bypass for the Nacho Admin console. Honored only in a
// development build (import.meta.env.DEV) AND when VITE_DEV_AUTH_BYPASS ===
// "true". Vite statically replaces import.meta.env.DEV with false in production
// builds, so this folds to false and every bypass branch is dead-code
// eliminated. The server enforces its own gate (requireSuperAdmin) — this flag
// only affects the client UI.
export const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

// Display-only stand-in shown in the sidebar while the bypass is on and there
// is no real Clerk session.
export const DEV_USER = {
  displayName: "Dev Super Admin",
  email: "dev-admin@nacho.test",
};
