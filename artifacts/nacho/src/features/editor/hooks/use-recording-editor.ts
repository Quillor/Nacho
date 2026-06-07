import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { getRecording, updateRecording } from "@/lib/db";
import { useUploadState, startBackgroundUpload } from "@/features/publishing";
import { cloudEnabled } from "@/lib/desktop-api";
import { extractFilmstrip } from "@/lib/media";
import type { VideoPlayerHandle } from "@/features/sharing";
import type { LocalRecording, Chapter } from "@/lib/types";
import { usePublishActions } from "./use-publish-actions";

/**
 * Owns all editor state and persistence for a single recording: loading it from
 * IndexedDB, the editable fields (title/description/trim/chapters/settings),
 * playback position, the background-upload status, and the publish/unpublish/save
 * flows. The Editor page and its panels are a thin view over this.
 *
 * Why a hook: publishing is multi-step (await the background upload, build the
 * GIF preview, push metadata) and shared between "Get link" and re-sync on save,
 * so the orchestration lives here rather than being duplicated in markup. The
 * publish/save flows themselves live in {@link usePublishActions} to keep each
 * file within the size budget.
 */
export function useRecordingEditor() {
  const [, params] = useRoute("/editor/:id");
  const [, navigate] = useLocation();
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

  const playerRef = useRef<VideoPlayerHandle>(null);

  const upload = useUploadState(id);

  const {
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
  } = usePublishActions({
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
  });

  // Ensure the recording is uploading in the background. The manager is
  // idempotent (no-op if already uploaded or in flight) and survives route
  // changes, so this also resumes the upload after a full page reload.
  useEffect(() => {
    // Resume/ensure the background upload, unless cloud is unavailable
    // (desktop without a configured backend).
    if (rec && cloudEnabled) startBackgroundUpload(rec);
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
