// Public site content (currently the Terms of Service shown on the marketing
// site and the signup consent gate). Read-only here; the admin TOS editor owns
// writes (features/admin/tos).

import { db, tosDocumentTable } from "@workspace/db";

/** Fetch the public Terms of Service. Returns empty content when none exists. */
export async function getPublicTos(): Promise<{
  content: string;
  updatedAt: string;
}> {
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
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
  };
}
