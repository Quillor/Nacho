import { createClerkClient, type User } from "@clerk/backend";

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// This account is always treated as a super admin and can never be demoted.
export const PERMANENT_SUPER_ADMIN_EMAIL = "hello@timrosenberg.com";

export type AdminRole = "super_admin" | "user";

export function primaryEmail(user: User): string | null {
  const primary = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  );
  return (primary ?? user.emailAddresses[0])?.emailAddress ?? null;
}

export function isPermanentSuperAdmin(user: User): boolean {
  const email = primaryEmail(user)?.toLowerCase();
  return (
    !!email &&
    email === PERMANENT_SUPER_ADMIN_EMAIL.toLowerCase()
  );
}

export function roleOf(user: User): AdminRole {
  if (isPermanentSuperAdmin(user)) return "super_admin";
  const role = (user.publicMetadata as { role?: unknown } | null)?.role;
  return role === "super_admin" ? "super_admin" : "user";
}

export function displayNameOf(user: User): string | null {
  const meta = user.unsafeMetadata as {
    displayName?: unknown;
    firstName?: unknown;
    lastName?: unknown;
  } | null;
  if (typeof meta?.displayName === "string" && meta.displayName.trim()) {
    return meta.displayName.trim();
  }
  // Required sign-up profile fields live in unsafeMetadata (the built-in Clerk
  // first/last name attributes are disabled in this instance).
  const metaFirst = typeof meta?.firstName === "string" ? meta.firstName : "";
  const metaLast = typeof meta?.lastName === "string" ? meta.lastName : "";
  const metaFull = [metaFirst, metaLast].filter((s) => s.trim()).join(" ").trim();
  if (metaFull) return metaFull;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return null;
}
