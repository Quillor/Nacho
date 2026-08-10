import {
  pgTable,
  serial,
  text,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Timestamped comments on a public recording's timeline. Keyed by the
 * recording's shareId (not its serial id) so the comment API mirrors every
 * other per-recording route. `authorName` is a display-name snapshot taken
 * from Clerk at post time so listing never fans out to the auth service.
 */
export const recordingCommentsTable = pgTable("recording_comments", {
  id: serial("id").primaryKey(),
  shareId: text("share_id").notNull(),
  authorUserId: text("author_user_id").notNull(),
  authorName: text("author_name").notNull().default(""),
  /** Position on the video timeline this comment is anchored to. */
  timeSec: real("time_sec").notNull(),
  body: text("body").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertRecordingCommentSchema = createInsertSchema(
  recordingCommentsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRecordingComment = z.infer<
  typeof insertRecordingCommentSchema
>;
export type RecordingCommentRow = typeof recordingCommentsTable.$inferSelect;
