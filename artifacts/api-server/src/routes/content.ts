import { Router, type IRouter } from "express";
import { db, tosDocumentTable } from "@workspace/db";

const router: IRouter = Router();

// Public, unauthenticated terms of service for the marketing site and the
// signup consent gate.
router.get("/tos", async (_req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(tosDocumentTable)
    .orderBy(tosDocumentTable.id)
    .limit(1);

  if (!row) {
    res.json({ content: "", updatedAt: new Date(0).toISOString() });
    return;
  }
  res.json({
    content: row.content,
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
  });
});

export default router;
