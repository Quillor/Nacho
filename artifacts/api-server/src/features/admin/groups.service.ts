import { desc, eq } from "drizzle-orm";
import { db, userGroupsTable } from "@workspace/db";
import {
  groupToApi,
  groupMemberCounts,
  type AdminFailure,
} from "./admin.shared";

type Group = ReturnType<typeof groupToApi>;

/** All groups, newest first, with member counts. */
export async function listGroups(): Promise<Group[]> {
  const [groups, counts] = await Promise.all([
    db.select().from(userGroupsTable).orderBy(desc(userGroupsTable.createdAt)),
    groupMemberCounts(),
  ]);
  return groups.map((g) => groupToApi(g, counts.get(g.id) ?? 0));
}

export async function createGroup(
  name: string,
  description: string | undefined,
): Promise<{ ok: true; data: Group } | AdminFailure> {
  try {
    const [row] = await db
      .insert(userGroupsTable)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .returning();
    return { ok: true, data: groupToApi(row, 0) };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "A group with that name already exists",
    };
  }
}

export async function updateGroup(
  groupId: number,
  data: { name?: string; description?: string | null },
): Promise<{ ok: true; data: Group } | AdminFailure> {
  const update: Partial<{ name: string; description: string | null }> = {};
  if (data.name !== undefined) update.name = data.name.trim();
  if (data.description !== undefined)
    update.description = data.description?.trim() || null;

  if (Object.keys(update).length === 0) {
    return { ok: false, status: 400, error: "Nothing to update" };
  }

  try {
    const [row] = await db
      .update(userGroupsTable)
      .set(update)
      .where(eq(userGroupsTable.id, groupId))
      .returning();
    if (!row) {
      return { ok: false, status: 404, error: "Group not found" };
    }
    const counts = await groupMemberCounts();
    return { ok: true, data: groupToApi(row, counts.get(row.id) ?? 0) };
  } catch {
    return {
      ok: false,
      status: 400,
      error: "A group with that name already exists",
    };
  }
}

/** Delete a group. Returns false when no such group existed. */
export async function deleteGroup(groupId: number): Promise<boolean> {
  const [row] = await db
    .delete(userGroupsTable)
    .where(eq(userGroupsTable.id, groupId))
    .returning();
  return !!row;
}
