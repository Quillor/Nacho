import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userGroupsTable = pgTable("user_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userGroupMembersTable = pgTable(
  "user_group_members",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => userGroupsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.groupId, table.userId)],
);

export const insertUserGroupSchema = createInsertSchema(userGroupsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUserGroup = z.infer<typeof insertUserGroupSchema>;
export type UserGroupRow = typeof userGroupsTable.$inferSelect;
export type UserGroupMemberRow = typeof userGroupMembersTable.$inferSelect;
