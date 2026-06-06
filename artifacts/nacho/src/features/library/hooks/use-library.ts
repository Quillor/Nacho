import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@workspace/pico-ui/hooks/use-toast";
import { isDevAuthBypassEnabled } from "@workspace/shared";
import {
  listRecordings,
  deleteRecording,
  getRecording,
  updateRecording,
} from "@/lib/db";
import {
  getPublicLink,
  unpublishRecording,
  deleteServerRecording,
  waitForUpload,
  isUploadInFlight,
  cancelUpload,
} from "@/features/publishing";
import { shareUrl } from "@/lib/api";
import type { LocalRecordingMeta } from "@/lib/types";

/**
 * State and actions for the Library page: loading the local recording list,
 * pin/delete, and the publish lifecycle (get public link / unpublish). The
 * publish actions piggyback on the background upload manager so a "Get public
 * link" only syncs metadata when the video is already uploading/uploaded
 * instead of re-uploading the whole blob.
 */
export function useLibrary() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<LocalRecordingMeta[] | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const refresh = () => {
    // listRecordings already returns newest-first; keep that order within each
    // group and float pinned recordings to the top.
    listRecordings().then((recs) =>
      setRecordings(
        [...recs].sort(
          (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false),
        ),
      ),
    );
  };

  useEffect(() => {
    refresh();
  }, []);

  // Dev-only: seed sample recordings once when the bypass is on and the Library
  // is empty. The dynamic import keeps dev-seed out of production bundles.
  useEffect(() => {
    if (!isDevAuthBypassEnabled()) return;
    let cancelled = false;
    import("../dev-seed")
      .then(async ({ autoSeedIfEmpty }) => {
        const created = await autoSeedIfEmpty();
        if (created > 0 && !cancelled) refresh();
      })
      .catch(() => {
        /* seeding is best-effort in dev */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { seedSampleRecordings } = await import("../dev-seed");
      const created = await seedSampleRecordings();
      refresh();
      toast({
        title: "Sample recordings added",
        description: `Seeded ${created} recordings into your Library.`,
      });
    } catch {
      toast({
        title: "Couldn't seed recordings",
        description: "Sample generation failed. Check the console.",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleTogglePin = async (rec: LocalRecordingMeta) => {
    const next = !rec.pinned;
    await updateRecording(rec.id, { pinned: next });
    refresh();
    toast({
      title: next ? "Pinned to top" : "Unpinned",
      description: next
        ? "This recording now stays at the top of your Library."
        : "This recording returns to its usual spot.",
    });
  };

  const handleCopy = async (shareId: string) => {
    await navigator.clipboard.writeText(shareUrl(shareId));
    toast({ title: "Link copied", description: "Share it anywhere." });
  };

  const handleGetLink = async (rec: LocalRecordingMeta) => {
    setBusyId(rec.id);
    try {
      // Reuse the background upload: wait for the in-flight transfer to finish
      // so getPublicLink just syncs metadata + flips visibility instead of
      // re-uploading the whole video.
      if (isUploadInFlight(rec.id)) await waitForUpload(rec.id);
      const full = await getRecording(rec.id);
      if (!full) throw new Error("missing recording");
      const result = await getPublicLink(full);
      await updateRecording(rec.id, {
        visibility: "public",
        shareId: result.shareId,
        videoPath: result.videoPath,
        thumbnailPath: result.thumbnailPath,
        gifPath: result.gifPath,
      });
      await navigator.clipboard.writeText(shareUrl(result.shareId));
      refresh();
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
      setBusyId(null);
    }
  };

  const handleUnpublish = async (rec: LocalRecordingMeta) => {
    if (!rec.shareId) return;
    setBusyId(rec.id);
    try {
      await unpublishRecording(rec.shareId);
      await updateRecording(rec.id, { visibility: "private" });
      refresh();
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
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete;
    // Reload the full record so we have the freshest shareId — a background
    // upload may have persisted one after the list snapshot was taken.
    const full = await getRecording(id);
    // Stop any in-flight upload; if the server record already exists, the
    // upload task removes it on abort.
    cancelUpload(id);
    await deleteRecording(id);
    // Clean up the server-side record for an already-uploaded private recording
    // so it doesn't dangle. Best-effort — the local copy is already gone.
    if (full?.shareId) {
      void deleteServerRecording(full.shareId).catch(() => undefined);
    }
    setPendingDelete(null);
    refresh();
    toast({ title: "Recording deleted" });
  };

  return {
    recordings,
    pendingDelete,
    setPendingDelete,
    busyId,
    seeding,
    navigate,
    handleSeed,
    handleTogglePin,
    handleCopy,
    handleGetLink,
    handleUnpublish,
    handleDelete,
  };
}
