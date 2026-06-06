// Shared helpers + style tokens for the account-management cards (profile name,
// email, password). Kept in one module so the cards stay visually consistent and
// share the same Clerk error-shape parsing.

/**
 * Extract a human-readable message from a thrown error, preferring Clerk's
 * `{ errors: [{ message }] }` shape, then a plain `Error.message`, then the
 * provided fallback.
 */
export function errMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "errors" in err &&
    Array.isArray((err as { errors?: unknown[] }).errors)
  ) {
    const first = (err as { errors: Array<{ message?: string }> }).errors[0];
    if (first?.message) return first.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export const cardClass =
  "rounded-none border-2 border-foreground bg-card p-6 shadow-none";
export const headingClass = "font-display text-xl font-extrabold";
export const inputClass = "border border-foreground bg-background";
export const labelClass = "mb-1.5 block font-bold uppercase tracking-wide text-sm";

/**
 * Resolve the user's display name from Clerk `unsafeMetadata`: prefer an explicit
 * `displayName`, otherwise fall back to the required sign-up first/last name
 * fields. Returns "" when nothing usable is set.
 */
export function getDisplayName(unsafeMetadata: unknown): string {
  if (unsafeMetadata && typeof unsafeMetadata === "object") {
    const meta = unsafeMetadata as {
      displayName?: unknown;
      firstName?: unknown;
      lastName?: unknown;
    };
    if (typeof meta.displayName === "string" && meta.displayName.trim()) {
      return meta.displayName;
    }
    // Fall back to the required sign-up first/last name fields.
    const first = typeof meta.firstName === "string" ? meta.firstName.trim() : "";
    const last = typeof meta.lastName === "string" ? meta.lastName.trim() : "";
    const full = `${first} ${last}`.trim();
    if (full) return full;
  }
  return "";
}
