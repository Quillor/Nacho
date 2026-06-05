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

export type Chapter = { time: number; label: string };
export type TranscriptSegment = { start: number; end: number; text: string };
export type Visibility = "private" | "public";

export const publishedRecordingsTable = pgTable("published_recordings", {
  id: serial("id").primaryKey(),
  shareId: text("share_id").notNull().unique(),
  ownerUserId: text("owner_user_id"),
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
  videoPath: text("video_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  gifPath: text("gif_path"),
  chapters: jsonb("chapters").$type<Chapter[]>().notNull().default([]),
  displayChaptersOnVideo: boolean("display_chapters_on_video")
    .notNull()
    .default(false),
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
