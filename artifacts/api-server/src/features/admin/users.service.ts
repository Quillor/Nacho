import { eq, inArray } from "drizzle-orm";
import type { User } from "@clerk/backend";
import { db, userGroupsTable, userGroupMembersTable } from "@workspace/db";
import {
  clerkClient,
  isPermanentSuperAdmin,
  type AdminRole,
} from "../../lib/clerk";
import {
  fetchAllUsers,
  groupMemberCounts,
  recordingCounts,
  membershipsByUser,
  toAdminUser,
  type AdminUser,
  type AdminFailure,
} from "./admin.shared";

/** All users, newest first, with group/recording counts attached. */
export async function listUsers(): Promise<AdminUser[]> {
  const [users, memberCounts, recCounts, memberships] = await Promise.all([
    fetchAllUsers(),
    groupMemberCounts(),
    recordingCounts(),
    membershipsByUser(),
  ]);

  return users
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .map((u) =>
      toAdminUser(
        u,
        memberships.get(u.id) ?? [],
        memberCounts,
        recCounts.get(u.id) ?? 0,
      ),
    );
}

/** Single user detail. Throws when Clerk has no such user (route → 404). */
export async function getUserDetail(userId: string): Promise<AdminUser> {
  const [user, memberCounts, recCounts, memberships] = await Promise.all([
    clerkClient.users.getUser(userId),
    groupMemberCounts(),
    recordingCounts(),
    membershipsByUser(),
  ]);
  return toAdminUser(
    user,
    memberships.get(user.id) ?? [],
    memberCounts,
    recCounts.get(user.id) ?? 0,
  );
}

export async function setUserRole(
  userId: string,
  role: AdminRole,
): Promise<{ ok: true; data: AdminUser } | AdminFailure> {
  let user: User;
  try {
    user = await clerkClient.users.getUser(userId);
  } catch {
    return { ok: false, status: 404, error: "User not found" };
  }

  // The permanent super admin can never be demoted.
  if (isPermanentSuperAdmin(user) && role !== "super_admin") {
    return {
      ok: false,
      status: 400,
      error: "This account is a permanent super admin",
    };
  }

  const updated = await clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: { ...user.publicMetadata, role },
  });

  const [memberCounts, recCounts, memberships] = await Promise.all([
    groupMemberCounts(),
    recordingCounts(),
    membershipsByUser(),
  ]);
  return {
    ok: true,
    data: toAdminUser(
      updated,
      memberships.get(updated.id) ?? [],
      memberCounts,
      recCounts.get(updated.id) ?? 0,
    ),
  };
}

export async function setUserGroups(
  userId: string,
  groupIds: number[],
): Promise<{ ok: true; data: AdminUser } | AdminFailure> {
  let user: User;
  try {
    user = await clerkClient.users.getUser(userId);
  } catch {
    return { ok: false, status: 404, error: "User not found" };
  }

  const desired = Array.from(new Set(groupIds));
  // Validate the requested groups exist.
  const validGroups = desired.length
    ? await db
        .select()
        .from(userGroupsTable)
        .where(inArray(userGroupsTable.id, desired))
    : [];
  const validIds = new Set(validGroups.map((g) => g.id));

  await db.transaction(async (tx) => {
    await tx
      .delete(userGroupMembersTable)
      .where(eq(userGroupMembersTable.userId, user.id));
    const toInsert = desired.filter((id) => validIds.has(id));
    if (toInsert.length) {
      await tx
        .insert(userGroupMembersTable)
        .values(toInsert.map((groupId) => ({ groupId, userId: user.id })));
    }
  });

  const [memberCounts, recCounts, memberships] = await Promise.all([
    groupMemberCounts(),
    recordingCounts(),
    membershipsByUser(),
  ]);
  return {
    ok: true,
    data: toAdminUser(
      user,
      memberships.get(user.id) ?? [],
      memberCounts,
      recCounts.get(user.id) ?? 0,
    ),
  };
}

export async function impersonateUser(
  targetUserId: string,
  adminId: string,
  log: { error: (obj: unknown, msg?: string) => void },
): Promise<{ ok: true; token: string; ticketUrl: string } | AdminFailure> {
  if (targetUserId === adminId) {
    return {
      ok: false,
      status: 400,
      error: "You are already signed in as yourself",
    };
  }

  try {
    await clerkClient.users.getUser(targetUserId);
  } catch {
    return { ok: false, status: 404, error: "User not found" };
  }

  try {
    const ticket = await clerkClient.actorTokens.create({
      userId: targetUserId,
      actor: { sub: adminId },
      expiresInSeconds: 600,
    });
    if (!ticket.token) {
      return {
        ok: false,
        status: 400,
        error: "Could not create impersonation token",
      };
    }
    const ticketUrl = `/sign-in?__clerk_ticket=${encodeURIComponent(ticket.token)}`;
    return { ok: true, token: ticket.token, ticketUrl };
  } catch (err) {
    log.error({ err }, "Failed to create actor token");
    return {
      ok: false,
      status: 400,
      error: "Could not create impersonation token",
    };
  }
}
