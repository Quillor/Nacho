import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { getRecording, updateRecording } from "@/lib/db";
import {
  getPublicLink,
  unpublishRecording,
  syncPublishedRecording,
  useUploadState,
  startBackgroundUpload,
  waitForUpload,
  isUploadInFlight,
  retryUpload,
  createGifFromBlob,
} from "@/features/publishing";
import { extractFilmstrip } from "@/lib/media";
import { shareUrl } from "@/lib/api";
import type { VideoPlayerHandle } from "@/features/sharing";
import type { LocalRecording, Chapter, Visibility } from "@/lib/types";

// The GIF preview only covers the first few seconds of the trimmed clip.
const GIF_PREVIEW_MAX_SECONDS = 6;

/**
 * Owns all editor state and persistence for a single recording: loading it from
 * IndexedDB, the editable fields (title/description/trim/chapters/settings),
 * playback position, the background-upload status, and the publish/unpublish/save
 * flows. The Editor page and its panels are a thin view over this.
 *
 * Why a hook: publishing is multi-step (await the background upload, build the
 * GIF preview, push metadata) and shared between "Get link" and re-sync on save,
 * so the orchestration lives here rather than being duplicated in markup.
 */
export function useRecordingEditor() {
  const [, params] = useRoute("/editor/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const id = params?.id;

  const [rec, setRec] = useState<LocalRecording | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [displayChaptersOnVideo, setDisplayChaptersOnVideo] = useState(false);
  const [notifyOnView, setNotifyOnView] = useState(false);

  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [filmstrip, setFilmstrip] = useState<string[]>([]);

  const [visibility, setVisibility] = useState<Visibility>("private");
  const [shareId, setShareId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishStep, setPublishStep] = useState("");
  const [copied, setCopied] = useState(false);

  const playerRef = useRef<VideoPlayerHandle>(null);

  const upload = useUploadState(id);

  // Ensure the recording is uploading in the background. The manager is
  // idempotent (no-op if already uploaded or in flight) and survives route
  // changes, so this also resumes the upload after a full page reload.
  useEffect(() => {
    if (rec) startBackgroundUpload(rec);
  }, [rec]);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    getRecording(id).then((r) => {
      if (!r) {
        setNotFound(true);
        return;
      }
      setRec(r);
      setTitle(r.title);
      setDescription(r.description);
      setTrimStart(r.trimStart);
      setTrimEnd(r.trimEnd || r.durationSec);
      setChapters(r.chapters);
      setDisplayChaptersOnVideo(r.displayChaptersOnVideo);
      setNotifyOnView(r.notifyOnView);
      setVisibility(r.visibility);
      setShareId(r.shareId);
      url = URL.createObjectURL(r.blob);
      setObjectUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  useEffect(() => {
    if (!rec?.blob) return;
    let cancelled = false;
    setFilmstrip([]);
    extractFilmstrip(rec.blob, 12)
      .then((frames) => {
        if (!cancelled) setFilmstrip(frames);
      })
      .catch(() => {
        if (!cancelled) setFilmstrip([]);
      });
    return () => {
      cancelled = true;
    };
  }, [rec?.blob]);

  const seek = (t: number) => playerRef.current?.seek(t);

  const addChapter = () => {
    const time = Math.round(current * 10) / 10;
    if (chapters.some((c) => Math.abs(c.time - time) < 0.5)) return;
    const next = [...chapters, { time, label: "New chapter" }].sort(
      (a, b) => a.time - b.time,
    );
    setChapters(next);
  };

  const updateChapter = (index: number, label: string) => {
    setChapters((prev) =>
      prev.map((c, i) => (i === index ? { ...c, label } : c)),
    );
  };

  const removeChapter = (index: number) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  // The "Notify me when viewed" toggle persists to IndexedDB immediately so the
  // choice survives leaving the editor without hitting "Save changes". Syncing
  // to the published server copy still happens on save like other edits.
  const handleNotifyOnViewChange = (next: boolean) => {
    setNotifyOnView(next);
    if (id)
      void updateRecording(id, { notifyOnView: next }).then((updated) => {
        if (updated) setRec(updated);
      });
  };

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
    } catch {
      toast({
        title: "Couldn't create link",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
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

  const trimmedDuration = useMemo(
    () => Math.max(0, trimEnd - trimStart),
    [trimStart, trimEnd],
  );

  // Has the user changed any "Save changes"-backed field since it was last
  // loaded/saved? notifyOnView is excluded because it persists to IndexedDB
  // immediately (it can't be lost by navigating away).
  const dirty = useMemo(() => {
    if (!rec) return false;
    return (
      title !== rec.title ||
      description !== rec.description ||
      trimStart !== rec.trimStart ||
      trimEnd !== (rec.trimEnd || rec.durationSec) ||
      displayChaptersOnVideo !== rec.displayChaptersOnVideo ||
      JSON.stringify(chapters) !== JSON.stringify(rec.chapters)
    );
  }, [
    rec,
    title,
    description,
    trimStart,
    trimEnd,
    displayChaptersOnVideo,
    chapters,
  ]);

  // Warn before a full page unload / tab close while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
      ev.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const isPublic = visibility === "public" && !!shareId;

  return {
    rec,
    notFound,
    objectUrl,
    title,
    setTitle,
    description,
    setDescription,
    trimStart,
    setTrimStart,
    trimEnd,
    setTrimEnd,
    chapters,
    addChapter,
    updateChapter,
    removeChapter,
    displayChaptersOnVideo,
    setDisplayChaptersOnVideo,
    notifyOnView,
    handleNotifyOnViewChange,
    current,
    setCurrent,
    duration,
    setDuration,
    filmstrip,
    shareId,
    busy,
    publishStep,
    copied,
    upload,
    playerRef,
    navigate,
    seek,
    handleSave,
    handleGetLink,
    handleUnpublish,
    copyLink,
    retry,
    trimmedDuration,
    isPublic,
    dirty,
  };
}
