import { Router, type IRouter } from "express";
import {
  PublishRecordingBody,
  GetRecordingParams,
  GetRecordingResponse,
  UpdateRecordingParams,
  UpdateRecordingBody,
  DeleteRecordingParams,
  SetRecordingVisibilityParams,
  SetRecordingVisibilityBody,
  AddRecordingViewParams,
  AddRecordingViewResponse,
  ListMyRecordingsResponse,
  StartRecordingUploadBody,
  CompleteRecordingUploadParams,
  CompleteRecordingUploadBody,
  SetRecordingTranscriptParams,
  SetRecordingTranscriptBody,
  GetRecordingPlaybackUrlParams,
  GetRecordingPlaybackUrlResponse,
} from "@workspace/api-zod";
import { authUserId } from "../../lib/dev-auth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
  UploadIncompleteError,
} from "../../lib/object-storage";
import {
  toApi,
  toApiSummary,
  createRecording,
  startRecording,
  completeRecording,
  setRecordingTranscript,
  listRecordingsByOwner,
  getRecordingForViewer,
  updateRecording,
  deleteRecording,
  setRecordingVisibility,
  addRecordingView,
} from "./recordings.service";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/** TTL for signed direct-playback URLs (long enough to watch, short enough to
 * keep leaked URLs low-value). */
const PLAYBACK_URL_TTL_SEC = 3600;

router.get("/recordings", async (req, res): Promise<void> => {
  const userId = authUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to list recordings" });
    return;
  }

  const rows = await listRecordingsByOwner(userId);
  res.json(ListMyRecordingsResponse.parse(rows.map(toApiSummary)));
});

router.post("/recordings/start", async (req, res): Promise<void> => {
  const userId = authUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to save a recording" });
    return;
  }

  const parsed = StartRecordingUploadBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid recording start");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const row = await startRecording(userId, parsed.data);
  res.status(201).json(GetRecordingResponse.parse(toApi(row)));
});

router.post(
  "/recordings/:shareId/complete",
  async (req, res): Promise<void> => {
    const params = CompleteRecordingUploadParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = CompleteRecordingUploadBody.safeParse(req.body);
    if (!body.success) {
      req.log.warn({ errors: body.error.message }, "Invalid recording complete");
      res.status(400).json({ error: body.error.message });
      return;
    }

    const userId = authUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in to save a recording" });
      return;
    }

    // Same gate as the legacy publish path: never mark a recording ready when
    // the stored video object is missing or truncated.
    try {
      await objectStorageService.verifyUploadedObject(
        body.data.videoPath,
        body.data.videoSize,
      );
    } catch (err) {
      if (
        err instanceof ObjectNotFoundError ||
        err instanceof UploadIncompleteError
      ) {
        req.log.warn(
          { err, videoPath: body.data.videoPath },
          "Refusing to complete recording: video upload incomplete",
        );
        res.status(422).json({
          error: "The video upload didn't finish. Please try again.",
        });
        return;
      }
      throw err;
    }

    const row = await completeRecording(
      params.data.shareId,
      userId,
      body.data,
    );
    if (!row) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    res.json(GetRecordingResponse.parse(toApi(row)));
  },
);

router.patch(
  "/recordings/:shareId/transcript",
  async (req, res): Promise<void> => {
    const params = SetRecordingTranscriptParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SetRecordingTranscriptBody.safeParse(req.body);
    if (!body.success) {
      req.log.warn({ errors: body.error.message }, "Invalid transcript");
      res.status(400).json({ error: body.error.message });
      return;
    }

    const userId = authUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in to update a recording" });
      return;
    }

    const row = await setRecordingTranscript(
      params.data.shareId,
      userId,
      body.data.transcript,
    );
    if (!row) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }

    res.status(204).end();
  },
);

router.get("/recordings/:shareId/play", async (req, res): Promise<void> => {
  const params = GetRecordingPlaybackUrlParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const row = await getRecordingForViewer(
    params.data.shareId,
    authUserId(req),
  );
  if (!row || !row.videoPath) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  try {
    const file = await objectStorageService.getObjectEntityFile(row.videoPath);
    const url = await objectStorageService.getObjectEntityDownloadURL(file, {
      ttlSec: PLAYBACK_URL_TTL_SEC,
    });
    res.json(
      GetRecordingPlaybackUrlResponse.parse({
        url,
        expiresInSec: PLAYBACK_URL_TTL_SEC,
      }),
    );
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Recording not found" });
      return;
    }
    throw err;
  }
});

router.post("/recordings", async (req, res): Promise<void> => {
  const userId = authUserId(req);
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

  // Gate: never persist a recording whose video object didn't fully upload.
  // A missing/truncated object here means the direct-to-storage PUT failed or
  // was interrupted, so we refuse (retryable) rather than mint a dead link.
  try {
    await objectStorageService.verifyUploadedObject(
      parsed.data.videoPath,
      parsed.data.videoSize,
    );
  } catch (err) {
    if (err instanceof ObjectNotFoundError || err instanceof UploadIncompleteError) {
      req.log.warn(
        { err, videoPath: parsed.data.videoPath },
        "Refusing to save recording: video upload incomplete",
      );
      res.status(422).json({
        error: "The video upload didn't finish. Please try again.",
      });
      return;
    }
    throw err;
  }

  const row = await createRecording(userId, parsed.data);
  res.status(201).json(GetRecordingResponse.parse(toApi(row)));
});

router.get("/recordings/:shareId", async (req, res): Promise<void> => {
  const params = GetRecordingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Public+ready recordings resolve for anyone; private (or still-uploading)
  // ones only for the signed-in owner — which is what lets the owner watch
  // their own recordings from any device.
  const row = await getRecordingForViewer(params.data.shareId, authUserId(req));
  if (!row) {
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

  const userId = authUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to update a recording" });
    return;
  }

  const row = await updateRecording(params.data.shareId, userId, body.data);
  if (!row) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  res.json(GetRecordingResponse.parse(toApi(row)));
});

router.delete("/recordings/:shareId", async (req, res): Promise<void> => {
  const params = DeleteRecordingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const userId = authUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to delete a recording" });
    return;
  }

  const row = await deleteRecording(params.data.shareId, userId);
  if (!row) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  // Remove the stored media too so deleted recordings don't leak storage.
  // Best-effort: a transient storage error must not fail the delete, and any
  // stragglers are reaped by the orphaned-object sweeper.
  const objectPaths = [row.videoPath, row.thumbnailPath, row.gifPath].filter(
    (p): p is string => Boolean(p),
  );
  for (const objectPath of objectPaths) {
    try {
      const file = await objectStorageService.getObjectEntityFile(objectPath);
      await file.delete();
    } catch (err) {
      if (!(err instanceof ObjectNotFoundError)) {
        req.log.warn(
          { err, objectPath },
          "Failed to delete stored object for deleted recording",
        );
      }
    }
  }

  res.status(204).end();
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

    const userId = authUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in to change visibility" });
      return;
    }

    const row = await setRecordingVisibility(
      params.data.shareId,
      userId,
      body.data.visibility,
    );
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

  const row = await addRecordingView(params.data.shareId, req.log);
  if (!row) {
    res.status(404).json({ error: "Recording not found" });
    return;
  }

  res.json(AddRecordingViewResponse.parse({ views: row.views }));
});

export default router;
