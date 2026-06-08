import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

// Single-row record (mirrors tos_document) holding the latest macOS desktop
// build that the public download page serves and the desktop app's update
// check compares against. The .dmg binary itself lives in object storage at
// `objectPath`; this row only stores its metadata.
export const desktopReleaseTable = pgTable("desktop_release", {
  id: serial("id").primaryKey(),
  version: text("version").notNull().default(""),
  objectPath: text("object_path").notNull().default(""),
  fileSize: integer("file_size").notNull().default(0),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DesktopReleaseRow = typeof desktopReleaseTable.$inferSelect;
