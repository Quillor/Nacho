import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  db,
  publishedRecordingsTable,
  type PublishedRecordingRow,
} from "@workspace/db";
import { clerkClient, primaryEmail } from "../lib/clerk";
import { sendEmail } from "../lib/email";
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
    displayChaptersOnVideo: row.displayChaptersOnVideo,
    notifyOnView: row.notifyOnView,
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
      displayChaptersOnVideo: data.displayChaptersOnVideo ?? false,
      notifyOnView: data.notifyOnView ?? false,
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
      displayChaptersOnVideo: data.displayChaptersOnVideo ?? false,
      notifyOnView: data.notifyOnView ?? false,
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

  // Notify the owner that their recording was just watched. Fire-and-forget so
  // email delivery never blocks or fails the view-count response.
  if (row.notifyOnView && row.ownerUserId) {
    void notifyOwnerOfView(row, req.log);
  }

  res.json(AddRecordingViewResponse.parse({ views: row.views }));
});

/**
 * Email the recording owner that their clip was just watched. Best-effort:
 * any failure is logged and swallowed so it can't affect the view request.
 */
async function notifyOwnerOfView(
  row: PublishedRecordingRow,
  log: { warn: (obj: unknown, msg: string) => void },
): Promise<void> {
  try {
    if (!row.ownerUserId) return;
    const user = await clerkClient.users.getUser(row.ownerUserId);
    const to = primaryEmail(user);
    if (!to) {
      log.warn({ shareId: row.shareId }, "Owner has no email for view notice");
      return;
    }

    const viewedAt = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const safeTitle = escapeHtml(row.title);
    const subject = `Someone just watched "${row.title}"`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.5; color: #2b2118;">
        <h2 style="margin: 0 0 12px;">Your recording was just watched</h2>
        <p style="margin: 0 0 8px;">
          <strong>${safeTitle}</strong> was viewed on ${escapeHtml(viewedAt)}.
        </p>
        <p style="margin: 16px 0 0; color: #6b5d4f;">— Nacho</p>
      </div>
    `;

    const result = await sendEmail(to, subject, html);
    if (!result.ok) {
      log.warn(
        { shareId: row.shareId, error: result.error },
        "View notification email failed",
      );
    }
  } catch (err) {
    log.warn({ shareId: row.shareId, err }, "View notification threw");
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default router;
