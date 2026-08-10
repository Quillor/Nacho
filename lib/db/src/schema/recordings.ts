import {
  pgTable,
  serial,
  text,
  real,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Shared recording domain primitives live in @workspace/shared (single source of
// truth, also consumed by the Nacho app). Imported for the column $type<>
// bindings below and re-exported so existing `@workspace/db` consumers keep
// importing them from here.
import type {
  Chapter,
  TranscriptSegment,
  Visibility,
  SelfieCorner,
} from "@workspace/shared/types";
export type { Chapter, TranscriptSegment, Visibility, SelfieCorner };

/**
 * Server-side upload lifecycle. `pending` rows are created when an upload
 * starts (so the recording is visible/resumable across devices and stale
 * uploads can be reaped); `ready` means the video object was verified in
 * storage. Only `ready` recordings are ever publicly resolvable.
 */
export type RecordingStatus = "pending" | "ready";

export const publishedRecordingsTable = pgTable("published_recordings", {
  id: serial("id").primaryKey(),
  shareId: text("share_id").notNull().unique(),
  ownerUserId: text("owner_user_id"),
  status: text("status").$type<RecordingStatus>().notNull().default("ready"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  visibility: text("visibility")
    .$type<Visibility>()
    .notNull()
    .default("private"),
  durationSec: real("duration_sec").notNull(),
  trimStart: real("trim_start").notNull().default(0),
  trimEnd: real("trim_end").notNull(),
  hasAudio: boolean("has_audio").notNull().default(true),
  // Empty string until the upload completes ("pending" rows created at
  // upload start don't have a stored object yet).
  videoPath: text("video_path").notNull().default(""),
  thumbnailPath: text("thumbnail_path"),
  gifPath: text("gif_path"),
  selfieCorner: text("selfie_corner").$type<SelfieCorner>(),
  chapters: jsonb("chapters").$type<Chapter[]>().notNull().default([]),
  displayChaptersOnVideo: boolean("display_chapters_on_video")
    .notNull()
    .default(false),
  notifyOnView: boolean("notify_on_view").notNull().default(false),
  transcript: jsonb("transcript").$type<TranscriptSegment[]>().notNull().default([]),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPublishedRecordingSchema = createInsertSchema(
  publishedRecordingsTable,
).omit({ id: true, ownerUserId: true, views: true, createdAt: true });
export type InsertPublishedRecording = z.infer<
  typeof insertPublishedRecordingSchema
>;
export type PublishedRecordingRow = typeof publishedRecordingsTable.$inferSelect;
