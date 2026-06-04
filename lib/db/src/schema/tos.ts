import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const tosDocumentTable = pgTable("tos_document", {
  id: serial("id").primaryKey(),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TosDocumentRow = typeof tosDocumentTable.$inferSelect;
