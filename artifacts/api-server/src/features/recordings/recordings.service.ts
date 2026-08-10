// Business logic for published recordings: all DB access plus the best-effort
// "your recording was viewed" email. Route handlers stay thin and delegate
// here. Ownership is enforced at the query level — owner-scoped mutations make
// a leaked shareId unusable by anyone but the owner (a non-match reads as 404).

import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  db,
  publishedRecordingsTable,
  type PublishedRecordingRow,
} from "@workspace/db";
import type {
  RecordingInput,
  RecordingUpdateInput,
  RecordingStartInput,
  RecordingCompleteInput,
  TranscriptSegment,
} from "@workspace/api-zod";
import { clerkClient, primaryEmail } from "../../lib/clerk";
import { sendEmail } from "../../lib/email";
import { viewNotificationEmail } from "../../lib/email-templates";

/** Minimal logger shape the view-notification path needs (a pino child logger). */
export type ViewLogger = { warn: (obj: unknown, msg: string) => void };

/** Map a DB row to the public API recording shape. */
export function toApi(row: PublishedRecordingRow) {
  return {
    shareId: row.shareId,
    status: row.status,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    durationSec: row.durationSec,
    trimStart: row.trimStart,
    trimEnd: row.trimEnd,
    hasAudio: row.hasAudio,
    videoPath: row.videoPath,
    thumbnailPath: row.thumbnailPath,
    gifPath: row.gifPath,
    selfieCorner: row.selfieCorner,
    chapters: row.chapters,
    displayChaptersOnVideo: row.displayChaptersOnVideo,
    notifyOnView: row.notifyOnView,
    transcript: row.transcript,
    views: row.views,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

/** Persist a freshly-published recording's metadata (media already uploaded). */
export async function createRecording(
  ownerUserId: string,
  data: RecordingInput,
): Promise<PublishedRecordingRow> {
  const shareId = nanoid(10);
  const [row] = await db
    .insert(publishedRecordingsTable)
    .values({
      shareId,
      ownerUserId,
      title: data.title,
      description: data.description ?? "",
      visibility: data.visibility ?? "private",
      durationSec: data.durationSec,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      hasAudio: data.hasAudio ?? true,
      videoPath: data.videoPath,
      thumbnailPath: data.thumbnailPath ?? null,
      gifPath: data.gifPath ?? null,
      selfieCorner: data.selfieCorner ?? null,
      chapters: data.chapters ?? [],
      displayChaptersOnVideo: data.displayChaptersOnVideo ?? false,
      notifyOnView: data.notifyOnView ?? false,
      transcript: data.transcript ?? [],
    })
    .returning();
  return row;
}

/** Map a DB row to the lightweight library-listing shape (no transcript). */
export function toApiSummary(row: PublishedRecordingRow) {
  return {
    shareId: row.shareId,
    status: row.status,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    durationSec: row.durationSec,
    trimStart: row.trimStart,
    trimEnd: row.trimEnd,
    hasAudio: row.hasAudio,
    thumbnailPath: row.thumbnailPath,
    gifPath: row.gifPath,
    selfieCorner: row.selfieCorner,
    views: row.views,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

/**
 * Create a pending recording row at upload start. The row makes the upload
 * visible/resumable across devices; it flips to `ready` only after the stored
 * video object is verified in {@link completeRecording}.
 */
export async function startRecording(
  ownerUserId: string,
  data: RecordingStartInput,
): Promise<PublishedRecordingRow> {
  const shareId = nanoid(10);
  const [row] = await db
    .insert(publishedRecordingsTable)
    .values({
      shareId,
      ownerUserId,
      status: "pending",
      title: data.title,
      description: data.description ?? "",
      visibility: data.visibility ?? "private",
      durationSec: data.durationSec,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      hasAudio: data.hasAudio ?? true,
      videoPath: "",
      selfieCorner: data.selfieCorner ?? null,
      chapters: data.chapters ?? [],
      displayChaptersOnVideo: data.displayChaptersOnVideo ?? false,
      notifyOnView: data.notifyOnView ?? false,
    })
    .returning();
  return row;
}

/**
 * Attach the verified media paths to a pending recording and mark it ready.
 * Idempotent for retried completes. Returns null when not owned/found.
 */
export async function completeRecording(
  shareId: string,
  ownerUserId: string,
  data: RecordingCompleteInput,
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .update(publishedRecordingsTable)
    .set({
      status: "ready",
      videoPath: data.videoPath,
      thumbnailPath: data.thumbnailPath ?? null,
      gifPath: data.gifPath ?? null,
    })
    .where(
      and(
        eq(publishedRecordingsTable.shareId, shareId),
        eq(publishedRecordingsTable.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  return row ?? null;
}

/** Replace a recording's transcript. Returns null when not owned/found. */
export async function setRecordingTranscript(
  shareId: string,
  ownerUserId: string,
  transcript: TranscriptSegment[],
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .update(publishedRecordingsTable)
    .set({ transcript })
    .where(
      and(
        eq(publishedRecordingsTable.shareId, shareId),
        eq(publishedRecordingsTable.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  return row ?? null;
}

/** List every recording owned by a user, newest first (server-side library). */
export async function listRecordingsByOwner(
  ownerUserId: string,
): Promise<PublishedRecordingRow[]> {
  return db
    .select()
    .from(publishedRecordingsTable)
    .where(eq(publishedRecordingsTable.ownerUserId, ownerUserId))
    .orderBy(desc(publishedRecordingsTable.createdAt));
}

/** Fetch a recording by share id, but only if it is public and ready. */
export async function getPublicRecording(
  shareId: string,
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .select()
    .from(publishedRecordingsTable)
    .where(eq(publishedRecordingsTable.shareId, shareId));
  // Private or still-uploading recordings never resolve through the public path.
  if (!row || row.visibility !== "public" || row.status !== "ready") return null;
  return row;
}

/**
 * Fetch a recording for a viewer: public+ready recordings resolve for anyone;
 * everything else only for the owner. This is what lets the owner's other
 * devices (and the library) open recordings that only exist server-side.
 */
export async function getRecordingForViewer(
  shareId: string,
  viewerUserId: string | null,
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .select()
    .from(publishedRecordingsTable)
    .where(eq(publishedRecordingsTable.shareId, shareId));
  if (!row) return null;
  if (row.visibility === "public" && row.status === "ready") return row;
  if (viewerUserId && row.ownerUserId === viewerUserId) return row;
  return null;
}


/** Update an owner's recording metadata. Returns null when not owned/found. */
export async function updateRecording(
  shareId: string,
  ownerUserId: string,
  data: RecordingUpdateInput,
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .update(publishedRecordingsTable)
    .set({
      title: data.title,
      description: data.description ?? "",
      durationSec: data.durationSec,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      hasAudio: data.hasAudio ?? true,
      gifPath: data.gifPath ?? null,
      selfieCorner: data.selfieCorner ?? null,
      chapters: data.chapters ?? [],
      displayChaptersOnVideo: data.displayChaptersOnVideo ?? false,
      notifyOnView: data.notifyOnView ?? false,
      transcript: data.transcript ?? [],
    })
    .where(
      and(
        eq(publishedRecordingsTable.shareId, shareId),
        eq(publishedRecordingsTable.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  return row ?? null;
}

/** Delete an owner's recording. Returns null when not owned/found. */
export async function deleteRecording(
  shareId: string,
  ownerUserId: string,
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .delete(publishedRecordingsTable)
    .where(
      and(
        eq(publishedRecordingsTable.shareId, shareId),
        eq(publishedRecordingsTable.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  return row ?? null;
}

/** Change an owner's recording visibility. Returns null when not owned/found. */
export async function setRecordingVisibility(
  shareId: string,
  ownerUserId: string,
  visibility: "public" | "private",
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .update(publishedRecordingsTable)
    .set({ visibility })
    .where(
      and(
        eq(publishedRecordingsTable.shareId, shareId),
        eq(publishedRecordingsTable.ownerUserId, ownerUserId),
      ),
    )
    .returning();
  return row ?? null;
}

/**
 * Increment a public recording's view count. Fires the owner's view-notice
 * email (best-effort) when enabled. Returns null when the recording isn't a
 * resolvable public recording.
 */
export async function addRecordingView(
  shareId: string,
  log: ViewLogger,
): Promise<PublishedRecordingRow | null> {
  const [row] = await db
    .update(publishedRecordingsTable)
    .set({ views: sql`${publishedRecordingsTable.views} + 1` })
    .where(
      and(
        eq(publishedRecordingsTable.shareId, shareId),
        eq(publishedRecordingsTable.visibility, "public"),
      ),
    )
    .returning();

  if (!row) return null;

  // Notify the owner that their recording was just watched. Fire-and-forget so
  // email delivery never blocks or fails the view-count response.
  if (row.notifyOnView && row.ownerUserId) {
    void notifyOwnerOfView(row, log);
  }

  return row;
}

/**
 * Email the recording owner that their clip was just watched. Best-effort:
 * any failure is logged and swallowed so it can't affect the view request.
 */
async function notifyOwnerOfView(
  row: PublishedRecordingRow,
  log: ViewLogger,
): Promise<void> {
  try {
    if (!row.ownerUserId) return;
    const user = await clerkClient.users.getUser(row.ownerUserId);
    const to = primaryEmail(user);
    if (!to) {
      log.warn({ shareId: row.shareId }, "Owner has no email for view notice");
      return;
    }

    const viewedAt = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const { subject, html } = viewNotificationEmail({
      title: row.title,
      viewedAt,
    });

    const result = await sendEmail(to, subject, html);
    if (!result.ok) {
      log.warn(
        { shareId: row.shareId, error: result.error },
        "View notification email failed",
      );
    }
  } catch (err) {
    log.warn({ shareId: row.shareId, err }, "View notification threw");
  }
}
