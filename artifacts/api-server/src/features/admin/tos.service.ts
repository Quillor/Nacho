import { eq } from "drizzle-orm";
import { db, tosDocumentTable } from "@workspace/db";
import { toIso } from "./admin.shared";

type Tos = { content: string; updatedAt: string };

/** Load the current Terms of Service for the admin editor. */
export async function loadTos(): Promise<Tos> {
  const [row] = await db
    .select()
    .from(tosDocumentTable)
    .orderBy(tosDocumentTable.id)
    .limit(1);
  if (!row) {
    return { content: "", updatedAt: new Date(0).toISOString() };
  }
  return {
    content: row.content,
    updatedAt: toIso(row.updatedAt) ?? new Date(0).toISOString(),
  };
}

/** Upsert the single Terms of Service row and return the saved document. */
export async function saveTos(content: string): Promise<Tos> {
  const [existing] = await db
    .select()
    .from(tosDocumentTable)
    .orderBy(tosDocumentTable.id)
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(tosDocumentTable)
      .set({ content, updatedAt: new Date() })
      .where(eq(tosDocumentTable.id, existing.id))
      .returning();
    return {
      content: row.content,
      updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
    };
  }

  const [row] = await db
    .insert(tosDocumentTable)
    .values({ content })
    .returning();
  return {
    content: row.content,
    updatedAt: toIso(row.updatedAt) ?? new Date().toISOString(),
  };
}
