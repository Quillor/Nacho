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
  const meta = (user.unsafeMetadata as { displayName?: unknown } | null)
    ?.displayName;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return null;
}
