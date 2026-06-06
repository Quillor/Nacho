// Helpers for the required sign-up profile (first name, last name, job title).
//
// These fields are collected in a mandatory onboarding step after account
// creation and stored on the Clerk user's `unsafeMetadata`, consistent with how
// `displayName` is already persisted (this Clerk instance keeps the built-in
// first/last name attributes disabled).

export interface UserProfile {
  firstName: string;
  lastName: string;
  jobTitle: string;
}

function readString(meta: unknown, key: string): string {
  if (meta && typeof meta === "object" && key in meta) {
    const value = (meta as Record<string, unknown>)[key];
    if (typeof value === "string") return value.trim();
  }
  return "";
}

/** Read the saved profile fields off a Clerk user's unsafeMetadata. */
export function getProfile(unsafeMetadata: unknown): UserProfile {
  return {
    firstName: readString(unsafeMetadata, "firstName"),
    lastName: readString(unsafeMetadata, "lastName"),
    jobTitle: readString(unsafeMetadata, "jobTitle"),
  };
}

/** A profile is complete only when all three required fields are filled in. */
export function isProfileComplete(unsafeMetadata: unknown): boolean {
  const p = getProfile(unsafeMetadata);
  return !!p.firstName && !!p.lastName && !!p.jobTitle;
}
