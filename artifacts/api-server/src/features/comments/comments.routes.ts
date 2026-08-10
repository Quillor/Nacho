import { Router, type IRouter } from "express";
import {
  ListRecordingCommentsParams,
  ListRecordingCommentsResponse,
  AddRecordingCommentParams,
  AddRecordingCommentBody,
  UpdateRecordingCommentParams,
  UpdateRecordingCommentBody,
  UpdateRecordingCommentResponse,
  DeleteRecordingCommentParams,
} from "@workspace/api-zod";
import { authUserId } from "../../lib/dev-auth";
import { getRecordingForViewer } from "../recordings/recordings.service";
import {
  toApiComment,
  listComments,
  authorNameFor,
  createComment,
  getComment,
  updateComment,
  deleteComment,
} from "./comments.service";

const router: IRouter = Router();

router.get(
  "/recordings/:shareId/comments",
  async (req, res): Promise<void> => {
    const params = ListRecordingCommentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const viewerId = authUserId(req);
    const recording = await getRecordingForViewer(
      params.data.shareId,
      viewerId,
    );
    if (!recording) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    const rows = await listComments(params.data.shareId);
    res.json(
      ListRecordingCommentsResponse.parse({
        comments: rows.map((row) => toApiComment(row, viewerId)),
        canModerate:
          viewerId != null && recording.ownerUserId === viewerId,
      }),
    );
  },
);

router.post(
  "/recordings/:shareId/comments",
  async (req, res): Promise<void> => {
    const params = AddRecordingCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = AddRecordingCommentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const viewerId = authUserId(req);
    if (!viewerId) {
      res.status(401).json({ error: "Sign in to comment" });
      return;
    }

    const recording = await getRecordingForViewer(
      params.data.shareId,
      viewerId,
    );
    if (!recording) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    const row = await createComment({
      shareId: params.data.shareId,
      authorUserId: viewerId,
      authorName: await authorNameFor(viewerId),
      timeSec: body.data.timeSec,
      body: body.data.body,
    });
    // Same RecordingComment schema as the update response (orval only emits
    // response schemas for 200s).
    res
      .status(201)
      .json(UpdateRecordingCommentResponse.parse(toApiComment(row, viewerId)));
  },
);

router.patch(
  "/recordings/:shareId/comments/:commentId",
  async (req, res): Promise<void> => {
    const params = UpdateRecordingCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = UpdateRecordingCommentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const viewerId = authUserId(req);
    if (!viewerId) {
      res.status(401).json({ error: "Sign in to edit comments" });
      return;
    }

    const recording = await getRecordingForViewer(
      params.data.shareId,
      viewerId,
    );
    const row = recording
      ? await getComment(params.data.shareId, params.data.commentId)
      : null;
    if (!recording || !row) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const isAuthor = row.authorUserId === viewerId;
    const isOwner = recording.ownerUserId === viewerId;
    // Text/anchor edits are the author's alone; resolving is open to the
    // recording owner too (it's their review workflow).
    const editsContent = body.data.body != null || body.data.timeSec != null;
    if (editsContent && !isAuthor) {
      res.status(403).json({ error: "Only the author can edit a comment" });
      return;
    }
    if (body.data.resolved != null && !isAuthor && !isOwner) {
      res.status(403).json({ error: "Not allowed to resolve this comment" });
      return;
    }

    const updated = await updateComment(row.id, {
      ...(body.data.body != null ? { body: body.data.body } : {}),
      ...(body.data.timeSec != null ? { timeSec: body.data.timeSec } : {}),
      ...(body.data.resolved != null ? { resolved: body.data.resolved } : {}),
    });
    if (!updated) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }
    res.json(
      UpdateRecordingCommentResponse.parse(toApiComment(updated, viewerId)),
    );
  },
);

router.delete(
  "/recordings/:shareId/comments/:commentId",
  async (req, res): Promise<void> => {
    const params = DeleteRecordingCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const viewerId = authUserId(req);
    if (!viewerId) {
      res.status(401).json({ error: "Sign in to delete comments" });
      return;
    }

    const recording = await getRecordingForViewer(
      params.data.shareId,
      viewerId,
    );
    const row = recording
      ? await getComment(params.data.shareId, params.data.commentId)
      : null;
    if (!recording || !row) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const isAuthor = row.authorUserId === viewerId;
    const isOwner = recording.ownerUserId === viewerId;
    if (!isAuthor && !isOwner) {
      res.status(403).json({ error: "Not allowed to delete this comment" });
      return;
    }

    await deleteComment(row.id);
    res.status(204).end();
  },
);

export default router;
