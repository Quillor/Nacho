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
} from "@workspace/api-zod";
import { authUserId } from "../../lib/dev-auth";
import {
  toApi,
  createRecording,
  getPublicRecording,
  updateRecording,
  deleteRecording,
  setRecordingVisibility,
  addRecordingView,
} from "./recordings.service";

const router: IRouter = Router();

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

  const row = await createRecording(userId, parsed.data);
  res.status(201).json(GetRecordingResponse.parse(toApi(row)));
});

router.get("/recordings/:shareId", async (req, res): Promise<void> => {
  const params = GetRecordingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const row = await getPublicRecording(params.data.shareId);
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
