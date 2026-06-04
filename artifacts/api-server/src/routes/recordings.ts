import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  db,
  publishedRecordingsTable,
  type PublishedRecordingRow,
} from "@workspace/db";
import {
  PublishRecordingBody,
  GetRecordingParams,
  GetRecordingResponse,
  UpdateRecordingParams,
  UpdateRecordingBody,
  SetRecordingVisibilityParams,
  SetRecordingVisibilityBody,
  AddRecordingViewParams,
  AddRecordingViewResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApi(row: PublishedRecordingRow) {
  return {
    shareId: row.shareId,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    durationSec: row.durationSec,
    trimStart: row.trimStart,
    trimEnd: row.trimEnd,
    hasAudio: row.hasAudio,
    videoPath: row.videoPath,
    thumbnailPath: row.thumbnailPath,
    gifPath: row.gifPath,
    chapters: row.chapters,
    transcript: row.transcript,
    views: row.views,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

router.post("/recordings", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to save a recording" });
    return;
  }

  const parsed = PublishRecordingBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid recording input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const shareId = nanoid(10);

  const [row] = await db
    .insert(publishedRecordingsTable)
    .values({
      shareId,
      ownerUserId: userId,
      title: data.title,
      description: data.description ?? "",
      visibility: data.visibility ?? "private",
      durationSec: data.durationSec,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      hasAudio: data.hasAudio ?? true,
      videoPath: data.videoPath,
      thumbnailPath: data.thumbnailPath ?? null,
      gifPath: data.gifPath ?? null,
      chapters: data.chapters ?? [],
      transcript: data.transcript ?? [],
    })
    .returning();

  res.status(201).json(GetRecordingResponse.parse(toApi(row)));
});

router.get("/recordings/:shareId", async (req, res): Promise<void> => {
  const params = GetRecordingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(publishedRecordingsTable)
    .where(eq(publishedRecordingsTable.shareId, params.data.shareId));

  // Private recordings are never resolvable through the public path.
  if (!row || row.visibility !== "public") {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  res.json(GetRecordingResponse.parse(toApi(row)));
});

router.patch("/recordings/:shareId", async (req, res): Promise<void> => {
  const params = UpdateRecordingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateRecordingBody.safeParse(req.body);
  if (!body.success) {
    req.log.warn({ errors: body.error.message }, "Invalid recording update");
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to update a recording" });
    return;
  }

  const data = body.data;

  // Only the owner may edit. Scope the update by owner so a leaked shareId
  // can't be edited by anyone else; a non-match yields 404 (same as not found).
  const [row] = await db
    .update(publishedRecordingsTable)
    .set({
      title: data.title,
      description: data.description ?? "",
      durationSec: data.durationSec,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      hasAudio: data.hasAudio ?? true,
      gifPath: data.gifPath ?? null,
      chapters: data.chapters ?? [],
      transcript: data.transcript ?? [],
    })
    .where(
      and(
        eq(publishedRecordingsTable.shareId, params.data.shareId),
        eq(publishedRecordingsTable.ownerUserId, userId),
      ),
    )
    .returning();

  if (!row) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  res.json(GetRecordingResponse.parse(toApi(row)));
});

router.patch(
  "/recordings/:shareId/visibility",
  async (req, res): Promise<void> => {
    const params = SetRecordingVisibilityParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SetRecordingVisibilityBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in to change visibility" });
      return;
    }

    // Only the owner may change visibility. Scope the update by owner so a
    // leaked shareId can't be toggled by anyone else; a non-match yields 404
    // (same as not found) to avoid revealing the recording's existence.
    const [row] = await db
      .update(publishedRecordingsTable)
      .set({ visibility: body.data.visibility })
      .where(
        and(
          eq(publishedRecordingsTable.shareId, params.data.shareId),
          eq(publishedRecordingsTable.ownerUserId, userId),
        ),
      )
      .returning();

    if (!row) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    res.json(GetRecordingResponse.parse(toApi(row)));
  },
);

router.post("/recordings/:shareId/views", async (req, res): Promise<void> => {
  const params = AddRecordingViewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .update(publishedRecordingsTable)
    .set({ views: sql`${publishedRecordingsTable.views} + 1` })
    .where(
      and(
        eq(publishedRecordingsTable.shareId, params.data.shareId),
        eq(publishedRecordingsTable.visibility, "public"),
      ),
    )
    .returning();

  if (!row) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  res.json(AddRecordingViewResponse.parse({ views: row.views }));
});

export default router;
