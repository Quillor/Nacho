// Shared helpers for the super-admin console: row/user → API mappers and the
// batched count/membership lookups several admin endpoints need. Kept in one
// place so summary, users, and groups all serialize identically.

import { eq, sql } from "drizzle-orm";
import type { User } from "@clerk/backend";
import {
  db,
  publishedRecordingsTable,
  userGroupsTable,
  userGroupMembersTable,
  type UserGroupRow,
} from "@workspace/db";
import {
  clerkClient,
  roleOf,
  displayNameOf,
  primaryEmail,
} from "../../lib/clerk";

export function toIso(value: Date | string | number | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export function groupToApi(row: UserGroupRow, memberCount: number) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    memberCount,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
  };
}

// Member counts for every group, keyed by group id.
export async function groupMemberCounts(): Promise<Map<number, number>> {
  const rows = await db
    .select({
      groupId: userGroupMembersTable.groupId,
      count: sql<number>`count(*)::int`,
    })
    .from(userGroupMembersTable)
    .groupBy(userGroupMembersTable.groupId);
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.groupId, Number(r.count));
  return map;
}

// Recording counts per owner user id.
export async function recordingCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      ownerUserId: publishedRecordingsTable.ownerUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(publishedRecordingsTable)
    .groupBy(publishedRecordingsTable.ownerUserId);
  const map = new Map<string, number>();
  for (const r of rows)
    if (r.ownerUserId) map.set(r.ownerUserId, Number(r.count));
  return map;
}

// Map of userId -> the groups they belong to.
export async function membershipsByUser(): Promise<Map<string, UserGroupRow[]>> {
  const rows = await db
    .select({
      userId: userGroupMembersTable.userId,
      group: userGroupsTable,
    })
    .from(userGroupMembersTable)
    .innerJoin(
      userGroupsTable,
      eq(userGroupMembersTable.groupId, userGroupsTable.id),
    );
  const map = new Map<string, UserGroupRow[]>();
  for (const r of rows) {
    const list = map.get(r.userId) ?? [];
    list.push(r.group);
    map.set(r.userId, list);
  }
  return map;
}

export function toAdminUser(
  user: User,
  groups: UserGroupRow[],
  counts: Map<number, number>,
  recordingCount: number,
) {
  return {
    id: user.id,
    email: primaryEmail(user) ?? "",
    displayName: displayNameOf(user),
    imageUrl: user.imageUrl ?? null,
    role: roleOf(user),
    groups: groups.map((g) => groupToApi(g, counts.get(g.id) ?? 0)),
    recordingCount,
    createdAt: toIso(user.createdAt) ?? new Date(0).toISOString(),
    lastSignInAt: toIso(user.lastSignInAt),
  };
}

export type AdminUser = ReturnType<typeof toAdminUser>;

// Clerk caps getUserList at 500 per page, so page through until exhausted to
// keep "all users" semantics accurate for counts, listings, and notifications.
export async function fetchAllUsers(): Promise<User[]> {
  const pageSize = 500;
  const all: User[] = [];
  let offset = 0;
  for (;;) {
    const res = await clerkClient.users.getUserList({
      limit: pageSize,
      offset,
    });
    all.push(...res.data);
    if (res.data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/** Common error shape returned by admin services for business failures. */
export type AdminFailure = { ok: false; status: number; error: string };
