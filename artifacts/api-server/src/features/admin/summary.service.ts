import { desc, sql } from "drizzle-orm";
import { db, publishedRecordingsTable } from "@workspace/db";
import { primaryEmail } from "../../lib/clerk";
import {
  fetchAllUsers,
  groupMemberCounts,
  recordingCounts,
  membershipsByUser,
  toAdminUser,
  toIso,
} from "./admin.shared";

/** Dashboard summary: totals plus recent signups and recordings. */
export async function getSummary() {
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

  return {
    totalUsers,
    totalRecordings,
    totalViews,
    recentSignups,
    recentRecordings,
  };
}
