// Latest macOS desktop release metadata. The single desktop_release row mirrors
// the tos_document pattern: a load (public + admin read) and an upsert (admin
// write). The .dmg binary itself lives in object storage at `objectPath`.

import { eq } from "drizzle-orm";
import { db, desktopReleaseTable } from "@workspace/db";

// Public-facing path the download page / desktop app hit to fetch the .dmg. The
// generated client base is /api, but raw <a href> downloads and cross-origin
// desktop fetches need the full prefix, so it is included here.
const DOWNLOAD_URL = "/api/desktop/download";

export type DesktopReleasePublic = {
  version: string | null;
  fileSize: number | null;
  notes: string;
  downloadUrl: string | null;
  updatedAt: string | null;
};

function toPublic(row: typeof desktopReleaseTable.$inferSelect | undefined): DesktopReleasePublic {
  if (!row || !row.version || !row.objectPath) {
    return {
      version: null,
      fileSize: null,
      notes: "",
      downloadUrl: null,
      updatedAt: null,
    };
  }
  return {
    version: row.version,
    fileSize: row.fileSize,
    notes: row.notes,
    downloadUrl: DOWNLOAD_URL,
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
  };
}

async function loadRow(): Promise<typeof desktopReleaseTable.$inferSelect | undefined> {
  const [row] = await db
    .select()
    .from(desktopReleaseTable)
    .orderBy(desktopReleaseTable.id)
    .limit(1);
  return row;
}

/** The latest published desktop release (nulls when none published yet). */
export async function loadDesktopRelease(): Promise<DesktopReleasePublic> {
  return toPublic(await loadRow());
}

/** The raw object-storage path of the current .dmg, or null when none. */
export async function getDesktopReleaseObjectPath(): Promise<{
  objectPath: string;
  version: string;
} | null> {
  const row = await loadRow();
  if (!row || !row.objectPath || !row.version) return null;
  return { objectPath: row.objectPath, version: row.version };
}

/** Upsert the single desktop_release row and return its public projection. */
export async function saveDesktopRelease(input: {
  version: string;
  objectPath: string;
  fileSize: number;
  notes?: string;
}): Promise<DesktopReleasePublic> {
  const values = {
    version: input.version,
    objectPath: input.objectPath,
    fileSize: input.fileSize,
    notes: input.notes ?? "",
    updatedAt: new Date(),
  };

  const existing = await loadRow();
  if (existing) {
    const [row] = await db
      .update(desktopReleaseTable)
      .set(values)
      .where(eq(desktopReleaseTable.id, existing.id))
      .returning();
    return toPublic(row);
  }

  const [row] = await db.insert(desktopReleaseTable).values(values).returning();
  return toPublic(row);
}
