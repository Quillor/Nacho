// Storage/DB reconciliation. Two jobs, both idempotent and best-effort:
//
// 1. Stale pending recordings — rows created at upload start whose upload
//    never completed. After MAX_PENDING_AGE_HOURS they're dead; delete the row
//    and any objects it references.
// 2. Orphaned objects — uploads that landed in storage but are referenced by
//    no recording (e.g. the metadata commit failed, or a client vanished
//    between upload and complete). Deleted once older than the same window,
//    so an in-flight upload is never swept out from under a live client.
//
// The desktop-release installer also lives under object storage, so its
// object path is always included in the keep set.

import { db, desktopReleaseTable } from "@workspace/db";
import { logger } from "../../lib/logger";
import { ObjectStorageService } from "../../lib/object-storage";
import {
  objectStorageClient,
  parseObjectPath,
} from "../../lib/object-storage-internals";
import {
  deleteStalePendingRecordings,
  listAllReferencedObjectPaths,
} from "../recordings/recordings.maintenance";

/** How long an upload may sit unfinished before it's considered dead. */
const MAX_PENDING_AGE_HOURS = 48;

/** How often the sweep runs while an instance stays up. */
const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Delay after boot before the first sweep (don't compete with cold-start). */
const BOOT_DELAY_MS = 5 * 60 * 1000;

const objectStorage = new ObjectStorageService();

async function deleteObjectByPath(objectPath: string): Promise<void> {
  const file = await objectStorage.getObjectEntityFile(objectPath);
  await file.delete();
}

/** Remove dead pending rows and the objects they reference. */
async function sweepStalePendingRecordings(): Promise<void> {
  const rows = await deleteStalePendingRecordings(MAX_PENDING_AGE_HOURS);
  for (const row of rows) {
    const paths = [row.videoPath, row.thumbnailPath, row.gifPath].filter(
      (p): p is string => Boolean(p),
    );
    for (const objectPath of paths) {
      try {
        await deleteObjectByPath(objectPath);
      } catch {
        // Missing object or transient storage error — the orphan sweep will
        // catch anything real on a later pass.
      }
    }
  }
  if (rows.length > 0) {
    logger.info(
      { count: rows.length },
      "Reaped stale pending recordings",
    );
  }
}

/** Delete stored upload objects no recording (or desktop release) references. */
async function sweepOrphanedObjects(): Promise<void> {
  const referenced = await listAllReferencedObjectPaths();

  // Keep the published desktop installer.
  const [release] = await db.select().from(desktopReleaseTable);
  if (release?.objectPath) referenced.add(release.objectPath);

  let privateDir = objectStorage.getPrivateObjectDir();
  if (!privateDir.endsWith("/")) privateDir = `${privateDir}/`;
  const uploadsPrefix = `${privateDir}uploads/`;
  const { bucketName, objectName: prefix } = parseObjectPath(uploadsPrefix);

  const [files] = await objectStorageClient
    .bucket(bucketName)
    .getFiles({ prefix });

  const cutoff = Date.now() - MAX_PENDING_AGE_HOURS * 3600 * 1000;
  let deleted = 0;
  for (const file of files) {
    const created = file.metadata.timeCreated
      ? Date.parse(String(file.metadata.timeCreated))
      : Number.NaN;
    // Only sweep objects verifiably older than the pending window; anything
    // newer (or with unreadable metadata) might be an in-flight upload.
    if (!Number.isFinite(created) || created > cutoff) continue;

    const objectPath = objectStorage.normalizeObjectEntityPath(
      `https://storage.googleapis.com/${bucketName}/${file.name}`,
    );
    if (referenced.has(objectPath)) continue;

    try {
      await file.delete();
      deleted++;
    } catch (err) {
      logger.warn({ err, objectPath }, "Failed to delete orphaned object");
    }
  }
  if (deleted > 0) {
    logger.info({ deleted }, "Reaped orphaned storage objects");
  }
}

export async function runCleanupSweep(): Promise<void> {
  try {
    await sweepStalePendingRecordings();
  } catch (err) {
    logger.warn({ err }, "Stale-pending sweep failed");
  }
  try {
    await sweepOrphanedObjects();
  } catch (err) {
    logger.warn({ err }, "Orphaned-object sweep failed");
  }
}

/**
 * Schedule periodic sweeps for the lifetime of this instance. On autoscale
 * an instance may not live long — that's fine; the sweep is cheap, idempotent
 * and age-gated, so whichever instance happens to be up runs it.
 */
export function startCleanupSchedule(): void {
  const boot = setTimeout(() => void runCleanupSweep(), BOOT_DELAY_MS);
  boot.unref?.();
  const interval = setInterval(() => void runCleanupSweep(), SWEEP_INTERVAL_MS);
  interval.unref?.();
}
