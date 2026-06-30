import { useState } from "react";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { getRecording, updateRecording } from "@/lib/db";
import {
  getPublicLink,
  unpublishRecording,
  syncPublishedRecording,
  waitForUpload,
  isUploadInFlight,
  retryUpload,
  createGifFromBlob,
  UploadFailedError,
  SaveFailedError,
} from "@/features/publishing";
import { shareUrl } from "@/lib/api";
import type { LocalRecording, Chapter, Visibility } from "@/lib/types";

// The GIF preview only covers the first few seconds of the trimmed clip.
const GIF_PREVIEW_MAX_SECONDS = 6;

// Turn a publish failure into an accurate, actionable toast. The two halves of
// publishing fail for different reasons and need different guidance: an upload
// failure (after retries) is usually network/size — ask them to retry on a
// stable connection; a save failure means the metadata didn't land. Anything
// else stays a generic message. The link button itself is the retry affordance.
function describePublishError(err: unknown): {
  title: string;
  description: string;
} {
  if (err instanceof UploadFailedError) {
    return {
      title: "Video upload didn't finish",
      description:
        "The video couldn't be uploaded — this often happens on slow or unstable connections. Check your connection and tap “Get public link” to try again.",
    };
  }
  if (err instanceof SaveFailedError) {
    return {
      title: "Couldn't save recording",
      description:
        "The video uploaded but we couldn't save it. Please tap “Get public link” to try again.",
    };
  }
  return {
    title: "Couldn't create link",
    description: "Something went wrong. Please try again.",
  };
}

// The editable fields the publish flows snapshot onto the recording. These are
// owned by useRecordingEditor and passed in so the orchestration can build a
// "draft" without re-reading React state.
type EditorFields = {
  title: string;
  description: string;
  trimStart: number;
  trimEnd: number;
  chapters: Chapter[];
  displayChaptersOnVideo: boolean;
  notifyOnView: boolean;
};

type PublishActionsArgs = EditorFields & {
  id: string | undefined;
  rec: LocalRecording | null;
  setRec: (rec: LocalRecording) => void;
};

/**
 * Owns the publish/unpublish/save orchestration for a single recording, split
 * out of useRecordingEditor to keep each file within the size budget.
 *
 * Why these live together: publishing is multi-step (await the background
 * upload, build the GIF preview, push metadata) and shared between "Get link"
 * and re-sync on save, so the flows and their transient state (busy, the
 * step label, the public visibility/shareId, the "copied" pulse) belong in one
 * unit rather than scattered across the editor hook.
 */
export function usePublishActions({
  id,
  rec,
  setRec,
  title,
  description,
  trimStart,
  trimEnd,
  chapters,
  displayChaptersOnVideo,
  notifyOnView,
}: PublishActionsArgs) {
  const { toast } = useToast();

  const [visibility, setVisibility] = useState<Visibility>("private");
  const [shareId, setShareId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishStep, setPublishStep] = useState("");
  const [copied, setCopied] = useState(false);

  const persist = async (): Promise<LocalRecording | undefined> => {
    if (!id) return undefined;
    return updateRecording(id, {
      title,
      description,
      trimStart,
      trimEnd,
      chapters,
      displayChaptersOnVideo,
      notifyOnView,
    });
  };

  const handleSave = async () => {
    if (!rec) return;
    const trimChanged =
      trimStart !== rec.trimStart || trimEnd !== (rec.trimEnd || rec.durationSec);
    const updated = await persist();
    const saved = updated ?? rec;
    // Reflect the just-persisted values so the editor reads as "clean" again.
    if (updated) setRec(updated);

    // Local-only recording: persist locally and we're done.
    if (saved.visibility !== "public" || !saved.shareId || !saved.videoPath) {
      toast({
        title: "Saved",
        description: "Your changes are stored locally.",
      });
      return;
    }

    // Already published: re-sync edits so the shared link stays current.
    setBusy(true);
    try {
      let gifBlob: Blob | null = null;
      if (trimChanged) {
        setPublishStep("Building preview…");
        try {
          gifBlob = await createGifFromBlob(saved.blob, {
            start: trimStart,
            end: Math.min(trimEnd, trimStart + GIF_PREVIEW_MAX_SECONDS),
          });
        } catch {
          gifBlob = null;
        }
      }
      const result = await syncPublishedRecording(saved, {
        gifBlob,
        onProgress: setPublishStep,
      });
      const synced = await updateRecording(saved.id, {
        gifPath: result.gifPath,
      });
      if (synced) setRec(synced);
      toast({
        title: "Saved & synced",
        description: "Your public link now shows the latest version.",
      });
    } catch {
      toast({
        title: "Saved locally",
        description: "Couldn't sync the public link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      setPublishStep("");
    }
  };

  const handleGetLink = async () => {
    if (!rec) return;
    setBusy(true);
    try {
      const updated = await persist();
      let saved = updated ?? rec;

      // Reuse the background upload: if the video is still transferring, wait
      // for it to finish (rather than starting over), then pick up the shareId
      // and paths it persisted onto the recording.
      if (isUploadInFlight(saved.id)) {
        setPublishStep("Finishing upload…");
        await waitForUpload(saved.id);
        const reloaded = await getRecording(saved.id);
        if (reloaded) saved = reloaded;
      }

      const trimChanged =
        trimStart !== rec.trimStart ||
        trimEnd !== (rec.trimEnd || rec.durationSec);
      const draft: LocalRecording = {
        ...saved,
        title,
        description,
        trimStart,
        trimEnd,
        chapters,
        displayChaptersOnVideo,
        notifyOnView,
      };

      // Build the GIF preview the first time we publish (none uploaded yet) or
      // whenever the trim changed. The big video upload already happened in the
      // background, so this is the only heavy step left.
      let gifBlob: Blob | null = null;
      if (!draft.gifPath || trimChanged) {
        setPublishStep("Building preview…");
        try {
          gifBlob = await createGifFromBlob(draft.blob, {
            start: trimStart,
            end: Math.min(trimEnd, trimStart + GIF_PREVIEW_MAX_SECONDS),
          });
        } catch {
          gifBlob = null;
        }
      }

      const result = await getPublicLink(draft, {
        gifBlob,
        onProgress: setPublishStep,
      });
      const finalRec = await updateRecording(draft.id, {
        visibility: result.visibility,
        shareId: result.shareId,
        videoPath: result.videoPath,
        thumbnailPath: result.thumbnailPath,
        gifPath: result.gifPath,
      });
      // Reflect the persisted edits so the editor reads as "clean" again.
      if (finalRec) setRec(finalRec);
      setVisibility(result.visibility);
      setShareId(result.shareId);
      await navigator.clipboard.writeText(shareUrl(result.shareId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Public link ready",
        description: "Link copied — anyone with it can watch.",
      });
    } catch (err) {
      const { title, description } = describePublishError(err);
      toast({ title, description, variant: "destructive" });
    } finally {
      setBusy(false);
      setPublishStep("");
    }
  };

  const handleUnpublish = async () => {
    if (!shareId) return;
    setBusy(true);
    try {
      await unpublishRecording(shareId);
      await updateRecording(rec!.id, { visibility: "private" });
      setVisibility("private");
      toast({
        title: "Made private",
        description: "The public link no longer works.",
      });
    } catch {
      toast({
        title: "Couldn't unpublish",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!shareId) return;
    await navigator.clipboard.writeText(shareUrl(shareId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const retry = () => {
    if (id) retryUpload(id);
  };

  const isPublic = visibility === "public" && !!shareId;

  return {
    visibility,
    setVisibility,
    shareId,
    setShareId,
    busy,
    publishStep,
    copied,
    isPublic,
    handleSave,
    handleGetLink,
    handleUnpublish,
    copyLink,
    retry,
  };
}
