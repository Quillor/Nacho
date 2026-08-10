// Maintenance-only queries for the cleanup sweeps (kept out of
// recordings.service so the request-path service stays focused).

import { and, eq, lt } from "drizzle-orm";
import {
  db,
  publishedRecordingsTable,
  type PublishedRecordingRow,
} from "@workspace/db";

/**
 * Pending rows older than `maxAgeHours` are dead uploads (the client gave up
 * or vanished). Delete them and return the rows so the caller can also remove
 * any stored objects they reference.
 */
export async function deleteStalePendingRecordings(
  maxAgeHours: number,
): Promise<PublishedRecordingRow[]> {
  const cutoff = new Date(Date.now() - maxAgeHours * 3600 * 1000);
  return db
    .delete(publishedRecordingsTable)
    .where(
      and(
        eq(publishedRecordingsTable.status, "pending"),
        lt(publishedRecordingsTable.createdAt, cutoff),
      ),
    )
    .returning();
}

/**
 * Every object path referenced by any recording (plus nothing else) — the
 * "keep" set for the orphaned-object sweeper.
 */
export async function listAllReferencedObjectPaths(): Promise<Set<string>> {
  const rows = await db
    .select({
      videoPath: publishedRecordingsTable.videoPath,
      thumbnailPath: publishedRecordingsTable.thumbnailPath,
      gifPath: publishedRecordingsTable.gifPath,
    })
    .from(publishedRecordingsTable);
  const referenced = new Set<string>();
  for (const row of rows) {
    if (row.videoPath) referenced.add(row.videoPath);
    if (row.thumbnailPath) referenced.add(row.thumbnailPath);
    if (row.gifPath) referenced.add(row.gifPath);
  }
  return referenced;
}
