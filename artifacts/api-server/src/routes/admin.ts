import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { User } from "@clerk/backend";
import {
  db,
  publishedRecordingsTable,
  userGroupsTable,
  userGroupMembersTable,
  tosDocumentTable,
  type UserGroupRow,
} from "@workspace/db";
import {
  SetUserRoleParams,
  SetUserRoleBody,
  SetUserGroupsParams,
  SetUserGroupsBody,
  ImpersonateUserParams,
  GetAdminUserParams,
  CreateGroupBody,
  UpdateGroupParams,
  UpdateGroupBody,
  DeleteGroupParams,
  SendNotificationBody,
  UpdateTosBody,
} from "@workspace/api-zod";
import {
  clerkClient,
  roleOf,
  displayNameOf,
  primaryEmail,
  isPermanentSuperAdmin,
  type AdminRole,
} from "../lib/clerk";
import { sendEmail } from "../lib/email";
import { renderBrandedEmail } from "../lib/emailLayout";
import { authUserId } from "../lib/devAuth";

const router: IRouter = Router();

function toIso(value: Date | string | number | null): string | null {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

function groupToApi(row: UserGroupRow, memberCount: number) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    memberCount,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
  };
}

// Member counts for every group, keyed by group id.
async function groupMemberCounts(): Promise<Map<number, number>> {
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
async function recordingCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      ownerUserId: publishedRecordingsTable.ownerUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(publishedRecordingsTable)
    .groupBy(publishedRecordingsTable.ownerUserId);
  const map = new Map<string, number>();
  for (const r of rows) if (r.ownerUserId) map.set(r.ownerUserId, Number(r.count));
  return map;
}

// Map of userId -> the groups they belong to.
async function membershipsByUser(): Promise<Map<string, UserGroupRow[]>> {
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

function toAdminUser(
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

// Clerk caps getUserList at 500 per page, so page through until exhausted to
// keep "all users" semantics accurate for counts, listings, and notifications.
async function fetchAllUsers(): Promise<User[]> {
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

router.get("/admin/summary", async (_req, res): Promise<void> => {
  const [users, memberCounts, recCounts, memberships, recordingTotals] =
    await Promise.all([
      fetchAllUsers(),
      groupMemberCounts(),
      recordingCounts(),
      membershipsByUser(),
      db
        .select({
          total: sql<number>`count(*)::int`,
          views: sql<number>`coalesce(sum(${publishedRecordingsTable.views}),0)::int`,
        })
        .from(publishedRecordingsTable),
    ]);

  const totalUsers = users.length;
  const totalRecordings = Number(recordingTotals[0]?.total ?? 0);
  const totalViews = Number(recordingTotals[0]?.views ?? 0);

  const recentSignups = [...users]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5)
    .map((u) =>
      toAdminUser(
        u,
        memberships.get(u.id) ?? [],
        memberCounts,
        recCounts.get(u.id) ?? 0,
      ),
    );

  const recentRows = await db
    .select()
    .from(publishedRecordingsTable)
    .orderBy(desc(publishedRecordingsTable.createdAt))
    .limit(8);

  const emailByUser = new Map<string, string | null>();
  for (const u of users) emailByUser.set(u.id, primaryEmail(u));

  const recentRecordings = recentRows.map((r) => ({
    shareId: r.shareId,
    title: r.title,
    views: r.views,
    visibility: r.visibility,
    createdAt: toIso(r.createdAt) ?? new Date(0).toISOString(),
    ownerEmail: r.ownerUserId ? (emailByUser.get(r.ownerUserId) ?? null) : null,
  }));

  res.json({
    totalUsers,
    totalRecordings,
    totalViews,
    recentSignups,
    recentRecordings,
  });
});

router.get("/admin/users", async (_req, res): Promise<void> => {
  const [users, memberCounts, recCounts, memberships] = await Promise.all([
    fetchAllUsers(),
    groupMemberCounts(),
    recordingCounts(),
    membershipsByUser(),
  ]);

  const result = users
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .map((u) =>
      toAdminUser(
        u,
        memberships.get(u.id) ?? [],
        memberCounts,
        recCounts.get(u.id) ?? 0,
      ),
    );
  res.json(result);
});

router.get("/admin/users/:userId", async (req, res): Promise<void> => {
  const params = GetAdminUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  try {
    const [user, memberCounts, recCounts, memberships] = await Promise.all([
      clerkClient.users.getUser(params.data.userId),
      groupMemberCounts(),
      recordingCounts(),
      membershipsByUser(),
    ]);
    res.json(
      toAdminUser(
        user,
        memberships.get(user.id) ?? [],
        memberCounts,
        recCounts.get(user.id) ?? 0,
      ),
    );
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

router.patch("/admin/users/:userId/role", async (req, res): Promise<void> => {
  const params = SetUserRoleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SetUserRoleBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  let user: User;
  try {
    user = await clerkClient.users.getUser(params.data.userId);
  } catch {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // The permanent super admin can never be demoted.
  if (isPermanentSuperAdmin(user) && body.data.role !== "super_admin") {
    res
      .status(400)
      .json({ error: "This account is a permanent super admin" });
    return;
  }

  const role: AdminRole = body.data.role;
  const updated = await clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: { ...user.publicMetadata, role },
  });

  const [memberCounts, recCounts, memberships] = await Promise.all([
    groupMemberCounts(),
    recordingCounts(),
    membershipsByUser(),
  ]);
  res.json(
    toAdminUser(
      updated,
      memberships.get(updated.id) ?? [],
      memberCounts,
      recCounts.get(updated.id) ?? 0,
    ),
  );
});

router.put("/admin/users/:userId/groups", async (req, res): Promise<void> => {
  const params = SetUserGroupsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SetUserGroupsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  let user: User;
  try {
    user = await clerkClient.users.getUser(params.data.userId);
  } catch {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const desired = Array.from(new Set(body.data.groupIds));
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
  res.json(
    toAdminUser(
      user,
      memberships.get(user.id) ?? [],
      memberCounts,
      recCounts.get(user.id) ?? 0,
    ),
  );
});

router.post(
  "/admin/users/:userId/impersonate",
  async (req, res): Promise<void> => {
    const params = ImpersonateUserParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const adminId = authUserId(req);
    if (!adminId) {
      res.status(401).json({ error: "Sign in to impersonate" });
      return;
    }
    if (params.data.userId === adminId) {
      res.status(400).json({ error: "You are already signed in as yourself" });
      return;
    }

    try {
      await clerkClient.users.getUser(params.data.userId);
    } catch {
      res.status(404).json({ error: "User not found" });
      return;
    }

    try {
      const ticket = await clerkClient.actorTokens.create({
        userId: params.data.userId,
        actor: { sub: adminId },
        expiresInSeconds: 600,
      });
      if (!ticket.token) {
        res.status(400).json({ error: "Could not create impersonation token" });
        return;
      }
      const ticketUrl = `/sign-in?__clerk_ticket=${encodeURIComponent(ticket.token)}`;
      res.json({ token: ticket.token, ticketUrl });
    } catch (err) {
      req.log.error({ err }, "Failed to create actor token");
      res.status(400).json({ error: "Could not create impersonation token" });
    }
  },
);

router.get("/admin/groups", async (_req, res): Promise<void> => {
  const [groups, counts] = await Promise.all([
    db.select().from(userGroupsTable).orderBy(desc(userGroupsTable.createdAt)),
    groupMemberCounts(),
  ]);
  res.json(groups.map((g) => groupToApi(g, counts.get(g.id) ?? 0)));
});

router.post("/admin/groups", async (req, res): Promise<void> => {
  const body = CreateGroupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(userGroupsTable)
      .values({
        name: body.data.name.trim(),
        description: body.data.description?.trim() || null,
      })
      .returning();
    res.status(201).json(groupToApi(row, 0));
  } catch {
    res.status(400).json({ error: "A group with that name already exists" });
  }
});

router.patch("/admin/groups/:groupId", async (req, res): Promise<void> => {
  const params = UpdateGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateGroupBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const update: Partial<{ name: string; description: string | null }> = {};
  if (body.data.name !== undefined) update.name = body.data.name.trim();
  if (body.data.description !== undefined)
    update.description = body.data.description?.trim() || null;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const groupId = Number(params.data.groupId);
  try {
    const [row] = await db
      .update(userGroupsTable)
      .set(update)
      .where(eq(userGroupsTable.id, groupId))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Group not found" });
      return;
    }
    const counts = await groupMemberCounts();
    res.json(groupToApi(row, counts.get(row.id) ?? 0));
  } catch {
    res.status(400).json({ error: "A group with that name already exists" });
  }
});

router.delete("/admin/groups/:groupId", async (req, res): Promise<void> => {
  const params = DeleteGroupParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const groupId = Number(params.data.groupId);
  const [row] = await db
    .delete(userGroupsTable)
    .where(eq(userGroupsTable.id, groupId))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.status(204).end();
});

router.post("/admin/notifications", async (req, res): Promise<void> => {
  const body = SendNotificationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { subject, body: message, audience, groupId } = body.data;

  const users = await fetchAllUsers();
  let recipients: string[];

  if (audience === "group") {
    if (!groupId) {
      res.status(400).json({ error: "Select a group to notify" });
      return;
    }
    const members = await db
      .select({ userId: userGroupMembersTable.userId })
      .from(userGroupMembersTable)
      .where(eq(userGroupMembersTable.groupId, groupId));
    const memberIds = new Set(members.map((m) => m.userId));
    recipients = users
      .filter((u) => memberIds.has(u.id))
      .map((u) => primaryEmail(u))
      .filter((e): e is string => !!e);
  } else {
    recipients = users
      .map((u) => primaryEmail(u))
      .filter((e): e is string => !!e);
  }

  if (recipients.length === 0) {
    res.json({
      sent: 0,
      failed: 0,
      total: 0,
      message: "No recipients matched this audience",
    });
    return;
  }

  const messageHtml = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br/>");
  const html = renderBrandedEmail({
    heading: subject,
    previewText: subject,
    bodyHtml: `<p style="margin:0;">${messageHtml}</p>`,
  });

  let sent = 0;
  let failed = 0;
  for (const to of recipients) {
    const result = await sendEmail(to, subject, html);
    if (result.ok) sent++;
    else failed++;
  }

  res.json({
    sent,
    failed,
    total: recipients.length,
    message:
      failed > 0
        ? `${sent} sent, ${failed} failed`
        : `Sent to ${sent} recipient${sent === 1 ? "" : "s"}`,
  });
});

async function loadTos(): Promise<{ content: string; updatedAt: string }> {
  const [row] = await db
    .select()
    .from(tosDocumentTable)
    .orderBy(tosDocumentTable.id)
    .limit(1);
  if (!row) {
    return { content: "", updatedAt: new Date(0).toISOString() };
  }
  return {
    content: row.content,
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
  };
}

router.get("/admin/content/tos", async (_req, res): Promise<void> => {
  res.json(await loadTos());
});

router.put("/admin/content/tos", async (req, res): Promise<void> => {
  const body = UpdateTosBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(tosDocumentTable)
    .orderBy(tosDocumentTable.id)
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(tosDocumentTable)
      .set({ content: body.data.content, updatedAt: new Date() })
      .where(eq(tosDocumentTable.id, existing.id))
      .returning();
    res.json({
      content: row.content,
      updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    });
    return;
  }

  const [row] = await db
    .insert(tosDocumentTable)
    .values({ content: body.data.content })
    .returning();
  res.json({
    content: row.content,
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  });
});

export default router;
