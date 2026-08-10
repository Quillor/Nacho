// Timeline comments on recordings. Permission model:
// - anyone who can view the recording can read its comments
// - posting requires a signed-in account
// - the author may edit/resolve/delete their own comment
// - the recording owner may resolve/delete any comment on their recording

import { and, asc, eq } from "drizzle-orm";
import {
  db,
  recordingCommentsTable,
  type RecordingCommentRow,
} from "@workspace/db";
import { clerkClient, displayNameOf, primaryEmail } from "../../lib/clerk";

/** Map a row to the API shape, computing `mine` for the current viewer. */
export function toApiComment(
  row: RecordingCommentRow,
  viewerUserId: string | null,
) {
  return {
    id: row.id,
    timeSec: row.timeSec,
    body: row.body,
    resolved: row.resolved,
    authorName: row.authorName || "Someone",
    mine: viewerUserId != null && row.authorUserId === viewerUserId,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

/** All comments for a recording, oldest first (timeline order by anchor). */
export async function listComments(
  shareId: string,
): Promise<RecordingCommentRow[]> {
  return db
    .select()
    .from(recordingCommentsTable)
    .where(eq(recordingCommentsTable.shareId, shareId))
    .orderBy(asc(recordingCommentsTable.timeSec), asc(recordingCommentsTable.id));
}

/**
 * Resolve a display-name snapshot for the comment author. Best-effort — a
 * Clerk hiccup falls back to an anonymous label rather than failing the post.
 */
export async function authorNameFor(userId: string): Promise<string> {
  try {
    const user = await clerkClient.users.getUser(userId);
    return (
      displayNameOf(user) ?? primaryEmail(user)?.split("@")[0] ?? "Someone"
    );
  } catch {
    return "Someone";
  }
}

export async function createComment(input: {
  shareId: string;
  authorUserId: string;
  authorName: string;
  timeSec: number;
  body: string;
}): Promise<RecordingCommentRow> {
  const [row] = await db
    .insert(recordingCommentsTable)
    .values(input)
    .returning();
  return row;
}

export async function getComment(
  shareId: string,
  commentId: number,
): Promise<RecordingCommentRow | null> {
  const [row] = await db
    .select()
    .from(recordingCommentsTable)
    .where(
      and(
        eq(recordingCommentsTable.id, commentId),
        eq(recordingCommentsTable.shareId, shareId),
      ),
    );
  return row ?? null;
}

export async function updateComment(
  commentId: number,
  patch: Partial<Pick<RecordingCommentRow, "body" | "timeSec" | "resolved">>,
): Promise<RecordingCommentRow | null> {
  const [row] = await db
    .update(recordingCommentsTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(recordingCommentsTable.id, commentId))
    .returning();
  return row ?? null;
}

export async function deleteComment(commentId: number): Promise<void> {
  await db
    .delete(recordingCommentsTable)
    .where(eq(recordingCommentsTable.id, commentId));
}
